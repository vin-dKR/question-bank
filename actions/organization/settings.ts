"use server";

import { getWorkOS } from "@workos-inc/authkit-nextjs";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import {
    ASSIGNABLE_ROLES,
    INVITATION_EXPIRY_DAYS,
    INVITATION_HISTORY_DAYS,
    type AssignableRole,
    type InvitationState,
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

/**
 * Shapes one WorkOS invitation for the UI.
 *
 * `acceptUrl` is only carried for PENDING invitations. It is a bearer
 * credential — whoever holds it joins the org as the invited address — so an
 * accepted or revoked invite must not keep handing it out.
 */
function toOrgInvitation(i: {
    id: string;
    email: string;
    state: string;
    roleSlug?: string | null;
    createdAt: string;
    expiresAt: string;
    acceptedAt?: string | null;
    acceptInvitationUrl?: string | null;
}): OrgInvitation {
    const state = i.state as InvitationState;
    return {
        id: i.id,
        email: i.email,
        state,
        role: i.roleSlug ?? null,
        createdAt: i.createdAt,
        expiresAt: i.expiresAt,
        acceptedAt: i.acceptedAt ?? null,
        acceptUrl: state === "pending" ? i.acceptInvitationUrl ?? null : null,
    };
}

/**
 * Pending first, then most recent. Terminal invitations older than
 * INVITATION_HISTORY_DAYS drop off — they have answered the only question they
 * were kept around for.
 */
function presentableInvitations(all: OrgInvitation[]): OrgInvitation[] {
    const cutoff = Date.now() - INVITATION_HISTORY_DAYS * 24 * 60 * 60 * 1000;

    return all
        .filter((i) => {
            if (i.state === "pending") return true;
            const at = Date.parse(i.acceptedAt ?? i.createdAt);
            return Number.isNaN(at) ? false : at >= cutoff;
        })
        .sort((a, b) => {
            if (a.state === "pending" && b.state !== "pending") return -1;
            if (b.state === "pending" && a.state !== "pending") return 1;
            return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        });
}

/**
 * Loads an invitation and proves it belongs to the caller's org.
 *
 * The id arrives from the browser. Without this, an admin of any org could
 * resend or revoke any other org's invitation — and resending is the more
 * dangerous of the two, because it re-delivers a live accept link.
 */
async function requireOwnInvitation(invitationId: string, workosOrgId: string) {
    const workos = getWorkOS();
    const invitation = await workos.userManagement.getInvitation(invitationId);
    if (!invitation || invitation.organizationId !== workosOrgId) {
        throw new AuthError("That invitation isn't yours to manage.", 403);
    }
    return invitation;
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

        // Invitations live only in WorkOS — we deliberately don't mirror them, so
        // there is nothing to keep in sync and no stale row to leak an address
        // after it's revoked.
        //
        // Terminal states are NOT filtered out. They used to be, and it meant an
        // accepted invite, an expired one and one that was never sent all looked
        // identical from the settings page: a row that quietly vanished.
        let invitations: OrgInvitation[] = [];
        try {
            const list = await getWorkOS().userManagement.listInvitations({
                organizationId: org.workosOrgId,
                // WorkOS list endpoints default to a page of TEN. That was
                // already quietly dropping pending invites for a busy org; now
                // that terminal states count against the same page, a handful of
                // old accepted invitations could push every pending one off it —
                // and a pending invite that isn't listed can't be resent.
                // 100 is the maximum WorkOS allows, and `desc` puts the newest
                // first so the cut, if it ever comes, falls on the oldest.
                limit: 100,
                order: "desc",
            });
            invitations = presentableInvitations(list.data.map(toOrgInvitation));
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

        const workos = getWorkOS();

        // Checking memberships alone was not enough: an address with an invite
        // already in flight isn't a member yet, so a second "Invite" quietly
        // minted a SECOND invitation and sent a second email with a second live
        // link. Surface it instead, with a code the UI turns into "Resend".
        const existing = await workos.userManagement.listInvitations({
            organizationId: org.workosOrgId,
            email: normalized,
        });
        const pending = existing.data.find((i) => i.state === "pending");
        if (pending) {
            return {
                success: false as const,
                error: `${normalized} already has an invitation pending.`,
                code: "already_invited" as const,
                invitationId: pending.id,
            };
        }

        await workos.userManagement.sendInvitation({
            email: normalized,
            organizationId: org.workosOrgId,
            inviterUserId: ctx.workosUserId,
            roleSlug: role,
            // WorkOS defaults to 7 days. See INVITATION_EXPIRY_DAYS.
            expiresInDays: INVITATION_EXPIRY_DAYS,
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

        const org = await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
            select: { workosOrgId: true },
        });
        if (!org) throw new AuthError("Organization not found.", 403);

        await requireOwnInvitation(invitationId, org.workosOrgId);

        await getWorkOS().userManagement.revokeInvitation(invitationId);
        revalidatePath("/settings");
        return { success: true as const };
    } catch (error) {
        return fail(error, "Failed to revoke the invitation");
    }
}

/**
 * Sends the invitation email again, same invitation and same link.
 *
 * This is a first-class WorkOS operation, NOT revoke-then-invite. That matters:
 * revoking kills the link the invitee may already have open in another tab, and
 * re-inviting resets the clock and the role. Resend touches neither.
 *
 * The realistic trigger is a spam filter, so this is the button an admin reaches
 * for most often after the first invite fails to land.
 */
export async function resendInvitation(invitationId: string) {
    try {
        const ctx = await requireOrgContext();
        if (!(ctx.role === "admin" || ctx.isAdmin)) {
            throw new AuthError("Only an admin can resend invitations.", 403);
        }

        const org = await prisma.organization.findUnique({
            where: { id: ctx.organizationId },
            select: { workosOrgId: true },
        });
        if (!org) throw new AuthError("Organization not found.", 403);

        // Ownership check first: resending re-delivers a live accept link, so
        // this is the more dangerous of the two id-from-the-browser paths.
        const invitation = await requireOwnInvitation(invitationId, org.workosOrgId);

        if (invitation.state !== "pending") {
            return {
                success: false as const,
                error:
                    invitation.state === "accepted"
                        ? "They've already accepted — no need to resend."
                        : "That invitation is no longer active. Send a new one instead.",
            };
        }

        await getWorkOS().userManagement.resendInvitation(invitationId);
        revalidatePath("/settings");
        return { success: true as const, email: invitation.email };
    } catch (error) {
        return fail(error, "Failed to resend the invitation");
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
