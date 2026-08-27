"use server";

import { getWorkOS, switchToOrganization } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireAuth, requireOrgContext } from "@/lib/auth/session";
import { forgetLastOrg, rememberLastOrg } from "@/lib/auth/activeOrg";
import { provisionOrganizationForOnboarding } from "@/lib/auth/provisionOrg";
import type { OrgKind } from "./types";

/**
 * Moving between organizations: switch, create, leave.
 *
 * Separate from settings.ts, which manages the org you are already inside.
 * These three change WHICH org that is.
 */

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) {
        return { success: false as const, error: error.message };
    }
    console.error(fallback, error);
    const message = error instanceof Error ? error.message : fallback;
    return { success: false as const, error: message };
}

/**
 * Makes `organizationId` the caller's active organization.
 *
 * Returns rather than redirecting, and that is deliberate.
 * `switchToOrganization` redirects by DEFAULT — it calls Next's `redirect()`,
 * which throws — so anything after it (the cookie write, the response) would
 * never run. `revalidationStrategy: 'none'` turns that off and hands control
 * back, which we need for two reasons:
 *
 *   1. the remembered-org cookie has to be written after the session is minted
 *   2. the CLIENT has to clear its caches before navigating. TanStack Query and
 *      the question-selection localStorage keys are keyed on nothing at all
 *      today, so a soft navigation would carry the previous institution's data
 *      into the new one — the exact failure this feature exists to prevent.
 *
 * The caller is expected to do a full page load to `redirectTo`.
 */
export async function switchOrganization(organizationId: string) {
    try {
        const ctx = await requireAuth();

        // Membership is proved from the SERVER's list, not the caller's claim.
        // This is a public endpoint; without this check the org id in the
        // request body would be enough to enter any organization in the system.
        const target = ctx.memberships.find((m) => m.organizationId === organizationId);
        if (!target) {
            throw new AuthError("You're not a member of that institution.", 403);
        }

        if (target.workosOrgId === ctx.workosOrgId) {
            return { success: true as const, redirectTo: "/dashboard", changed: false };
        }

        await switchToOrganization(target.workosOrgId, { revalidationStrategy: "none" });
        await rememberLastOrg(target.workosOrgId);

        revalidatePath("/", "layout");

        // Always the dashboard, never the current path. Ids in the URL
        // (/classes/[classId], /examination/tests/[testId]) belong to the org
        // being left and resolve to nothing in the one being entered — a 404
        // immediately after switching reads as the switch having failed.
        return { success: true as const, redirectTo: "/dashboard", changed: true };
    } catch (error) {
        return fail(error, "Failed to switch institution");
    }
}

/**
 * Creates a new institution with the caller as its admin, and switches into it.
 *
 * The path for a teacher who starts their own centre while still teaching at
 * another. Without it, the only way to have a second institution is a second
 * email address.
 */
export async function createOrganization(name: string, kind: OrgKind) {
    try {
        const ctx = await requireAuth();

        const trimmed = name.trim();
        if (!trimmed) {
            return { success: false as const, error: "Give the institution a name." };
        }
        if (trimmed.length > 120) {
            return { success: false as const, error: "Name is too long (120 characters max)." };
        }
        if (kind !== "school" && kind !== "coaching") {
            return { success: false as const, error: "Pick school or coaching centre." };
        }

        const org = await provisionOrganizationForOnboarding({
            userId: ctx.userId,
            workosUserId: ctx.workosUserId,
            email: ctx.email,
            userName: ctx.name,
            orgName: trimmed,
            type: kind,
            profile: { contactEmail: ctx.email },
            // Without this, provisioning ADOPTS an org the caller already has —
            // it is built for onboarding, where reusing the personal org is the
            // whole point. Here that would silently rename the caller's personal
            // workspace into the new institution instead of creating one.
            forceNew: true,
        });

        if (!org) {
            return {
                success: false as const,
                error: "Couldn't create the institution. Please try again.",
            };
        }

        await switchToOrganization(org.workosOrgId, { revalidationStrategy: "none" });
        await rememberLastOrg(org.workosOrgId);
        revalidatePath("/", "layout");

        // Straight to settings: the next thing anyone wants after creating an
        // institution is to invite the people in it.
        return { success: true as const, redirectTo: "/settings" };
    } catch (error) {
        return fail(error, "Failed to create the institution");
    }
}

/**
 * Leaves an organization.
 *
 * Content stays. `userId` on a resource means "who authored it", never "who may
 * see it" (doc §1) — so papers and questions a leaver made remain with the
 * institution, and the confirm dialog says so before they commit.
 *
 * Mirrors `removeMember`'s last-admin guard: an org nobody can administer is
 * unrecoverable without support.
 */
export async function leaveOrganization(organizationId: string) {
    try {
        const ctx = await requireOrgContext();

        const membership = await prisma.membership.findUnique({
            where: {
                userId_organizationId: { userId: ctx.userId, organizationId },
            },
            select: {
                id: true,
                role: true,
                workosMembershipId: true,
                organization: { select: { name: true, ownerUserId: true, workosOrgId: true } },
            },
        });

        if (!membership) {
            throw new AuthError("You're not a member of that institution.", 403);
        }

        // Leaving your own personal workspace would strand every resource
        // stamped with it — there would be no org left that can read them.
        if (membership.organization.ownerUserId === ctx.userId) {
            return {
                success: false as const,
                error: "This is your own workspace. You can't leave it.",
            };
        }

        const remaining = await prisma.membership.count({
            where: { userId: ctx.userId, status: "active" },
        });
        if (remaining <= 1) {
            return {
                success: false as const,
                error: "This is your only institution. You'd have nowhere to work.",
            };
        }

        if (membership.role === "admin") {
            const admins = await prisma.membership.count({
                where: { organizationId, role: "admin", status: "active" },
            });
            if (admins <= 1) {
                return {
                    success: false as const,
                    error: `You're the only admin of ${membership.organization.name}. Promote someone else first.`,
                };
            }
        }

        // WorkOS first, local second — same ordering as every other membership
        // write, so a failure can't leave the two disagreeing.
        await getWorkOS().userManagement.deleteOrganizationMembership(
            membership.workosMembershipId
        );
        await prisma.membership.delete({ where: { id: membership.id } });

        // The remembered org would otherwise name one they can no longer enter.
        // Resolution validates it and would fall through anyway, but leaving a
        // dead pointer behind is how stale-state bugs start.
        if (ctx.workosOrgId === membership.organization.workosOrgId) {
            await forgetLastOrg();
        }

        revalidatePath("/", "layout");
        return { success: true as const, redirectTo: "/dashboard" };
    } catch (error) {
        return fail(error, "Failed to leave the institution");
    }
}
