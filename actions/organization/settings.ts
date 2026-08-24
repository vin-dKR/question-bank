"use server";

import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import {
    ASSIGNABLE_ROLES,
    type AssignableRole,
    type OrgInvitation,
    type OrgSettings,
} from "./types";

/**
 * Organization settings, members and invitations.
 *
 * The org is the single source of truth for "which institution is this?".
 * Before this existed the name was typed into four disconnected places —
 * onboarding (TeacherData.school), the settings box (a useState that went
 * nowhere), every PDF template (TemplateForm.institution) and each generated
 * paper (PaperHistory.institution) — and none of them agreed. Read it from
 * here instead.
 *
 * WorkOS owns membership and roles (doc §4); the local Membership table is a
 * mirror kept fresh by the webhook. These actions therefore write to WorkOS
 * FIRST and let the local copy follow, so the two can't disagree on a failure.
 */

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) {
        return { success: false as const, error: error.message };
    }
    console.error(fallback, error);
    const message = error instanceof Error ? error.message : fallback;
    return { success: false as const, error: message };
}

/** Everything the settings page needs, in one round trip. */
export async function getOrganizationSettings(): Promise<
    { success: true; data: OrgSettings } | { success: false; error: string }
> {
    try {
        const ctx = await requireOrgContext();

        const org = await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
            select: {
                id: true,
                name: true,
                type: true,
                contactEmail: true,
                phone: true,
                location: true,
                workosOrgId: true,
                memberships: {
                    select: {
                        id: true,
                        role: true,
                        status: true,
                        userId: true,
                        user: { select: { name: true, email: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!org) throw new AuthError("Organization not found.", 403);

        // Pending invitations live only in WorkOS — we deliberately don't mirror
        // them, so there is nothing to keep in sync and no stale row to leak an
        // address after it's revoked.
        let invitations: OrgInvitation[] = [];
        try {
            const list = await getWorkOS().userManagement.listInvitations({
                organizationId: org.workosOrgId,
            });
            invitations = list.data
                .filter((i) => i.state === "pending")
                .map((i) => ({
                    id: i.id,
                    email: i.email,
                    state: i.state,
                    expiresAt: i.expiresAt,
                }));
        } catch (err) {
            // A WorkOS blip shouldn't blank the whole settings page.
            console.error("[org settings] could not list invitations", err);
        }

        return {
            success: true,
            data: {
                id: org.id,
                name: org.name,
                type: org.type,
                contactEmail: org.contactEmail,
                phone: org.phone,
                location: org.location,
                canManage: ctx.role === "admin" || ctx.isAdmin,
                members: org.memberships.map((m) => ({
                    membershipId: m.id,
                    userId: m.userId,
                    name: m.user?.name ?? null,
                    email: m.user?.email ?? "",
                    role: m.role,
                    status: m.status,
                    isYou: m.userId === ctx.userId,
                })),
                invitations,
            },
        };
    } catch (error) {
        return fail(error, "Failed to load organization settings");
    }
}

/**
 * Renames the institution. Writes to WorkOS first so that if that call fails we
 * haven't already diverged the local copy.
 */
export async function updateOrganizationName(name: string) {
    try {
        const ctx = await requireOrgContext();
        if (!(ctx.role === "admin" || ctx.isAdmin)) {
            throw new AuthError("Only an admin can rename the institution.", 403);
        }

        const trimmed = name.trim();
        if (!trimmed) return { success: false as const, error: "Name can't be empty." };
        if (trimmed.length > 120) {
            return { success: false as const, error: "Name is too long (120 characters max)." };
        }

        const org = await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
            select: { workosOrgId: true },
        });
        if (!org) throw new AuthError("Organization not found.", 403);

        await getWorkOS().organizations.updateOrganization({
            organization: org.workosOrgId,
            name: trimmed,
        });

        await prisma.organization.update({
            where: { id: ctx.organizationId },
            data: { name: trimmed },
        });

        revalidatePath("/settings");
        return { success: true as const, name: trimmed };
    } catch (error) {
        return fail(error, "Failed to rename the institution");
    }
}

/**
 * Invites someone into this organization.
 *
 * Note the consumer-domain rule (doc §11): WorkOS requires a Gmail/Outlook
 * invitee to sign up with the EXACT invited address, whereas a corporate domain
 * accepts any address on that domain. Most Indian teachers are on Gmail, so
 * that is the common path — the UI says so next to the field.
 */
export async function inviteMember(email: string, role: AssignableRole = "member") {
    try {
        const ctx = await requireOrgContext();
        if (!(ctx.role === "admin" || ctx.isAdmin)) {
            throw new AuthError("Only an admin can invite people.", 403);
        }

        const normalized = email.trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(normalized)) {
            return { success: false as const, error: "That doesn't look like a valid email address." };
        }
        if (!ASSIGNABLE_ROLES.includes(role)) {
            return { success: false as const, error: "Unknown role." };
        }
        if (normalized === ctx.email) {
            return { success: false as const, error: "You're already a member." };
        }

        const org = await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
            select: { workosOrgId: true, memberships: { select: { user: { select: { email: true } } } } },
        });
        if (!org) throw new AuthError("Organization not found.", 403);

        if (org.memberships.some((m) => m.user?.email?.toLowerCase() === normalized)) {
            return { success: false as const, error: "That person is already a member." };
        }

        await getWorkOS().userManagement.sendInvitation({
            email: normalized,
            organizationId: org.workosOrgId,
            inviterUserId: ctx.workosUserId,
            roleSlug: role,
        });

        revalidatePath("/settings");
        return { success: true as const };
    } catch (error) {
        return fail(error, "Failed to send the invitation");
    }
}

export async function revokeInvitation(invitationId: string) {
    try {
        const ctx = await requireOrgContext();
        if (!(ctx.role === "admin" || ctx.isAdmin)) {
            throw new AuthError("Only an admin can revoke invitations.", 403);
        }

        // Confirm the invitation belongs to THIS org before touching it —
        // the id comes from the browser, and without this check any admin of
        // any org could revoke any other org's invitation.
        const org = await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
            select: { workosOrgId: true },
        });
        if (!org) throw new AuthError("Organization not found.", 403);

        const workos = getWorkOS();
        const list = await workos.userManagement.listInvitations({
            organizationId: org.workosOrgId,
        });
        if (!list.data.some((i) => i.id === invitationId)) {
            throw new AuthError("That invitation isn't yours to revoke.", 403);
        }

        await workos.userManagement.revokeInvitation(invitationId);
        revalidatePath("/settings");
        return { success: true as const };
    } catch (error) {
        return fail(error, "Failed to revoke the invitation");
    }
}

/**
 * Removes someone from the organization.
 *
 * Two guards from doc §11: you can't remove yourself by accident, and you can't
 * remove the last admin — that would leave an org nobody can administer.
 * Content they authored is deliberately left alone; `userId` on a resource means
 * "who wrote it", not "who may see it" (§1).
 */
export async function removeMember(membershipId: string) {
    try {
        const ctx = await requireOrgContext();
        if (!(ctx.role === "admin" || ctx.isAdmin)) {
            throw new AuthError("Only an admin can remove people.", 403);
        }

        const membership = await prisma.membership.findUnique({
            where: { id: membershipId },
            select: { id: true, userId: true, role: true, organizationId: true, workosMembershipId: true },
        });

        if (!membership || membership.organizationId !== ctx.organizationId) {
            throw new AuthError("That member isn't in your organization.", 403);
        }
        if (membership.userId === ctx.userId) {
            return { success: false as const, error: "You can't remove yourself. Ask another admin." };
        }
        if (membership.role === "admin") {
            const admins = await prisma.membership.count({
                where: { organizationId: ctx.organizationId, role: "admin", status: "active" },
            });
            if (admins <= 1) {
                return {
                    success: false as const,
                    error: "That's the only admin. Promote someone else first.",
                };
            }
        }

        await getWorkOS().userManagement.deleteOrganizationMembership(
            membership.workosMembershipId
        );
        await prisma.membership.delete({ where: { id: membership.id } });

        revalidatePath("/settings");
        return { success: true as const };
    } catch (error) {
        return fail(error, "Failed to remove the member");
    }
}
