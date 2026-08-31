/**
 * Shared types and constants for organization settings.
 *
 * These live OUTSIDE settings.ts on purpose: a `"use server"` module may only
 * export async functions. Types are erased at compile time so they'd survive,
 * but a plain `export const` (ASSIGNABLE_ROLES) makes the whole file invalid
 * and breaks `next build` with an opaque "Failed to collect page data" error.
 */

/**
 * What kind of institution someone is creating. `personal` is absent
 * deliberately — the personal workspace is created implicitly at signup, one per
 * user, and is not something anyone asks for by name.
 */
export const ORG_KINDS = ["school", "coaching"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

/** Roles that can be handed out. Students don't get accounts (doc §3). */
export const ASSIGNABLE_ROLES = ["admin", "member"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/**
 * How long an invitation is good for. WorkOS defaults to 7 days, which is short
 * for a teacher who checks email weekly — and the recovery path (ask an admin to
 * resend) costs two people a round trip.
 */
export const INVITATION_EXPIRY_DAYS = 14;

/**
 * How long a finished invitation stays on the settings page. Long enough to
 * answer "did they ever accept?", short enough that the list doesn't become an
 * append-only log.
 */
export const INVITATION_HISTORY_DAYS = 30;

/**
 * WorkOS invitation states. `pending` is the only actionable one — the rest are
 * terminal and exist so an admin can tell "they accepted" from "it expired" from
 * "I never actually sent it". Before this, everything but `pending` was filtered
 * out and all three looked identical: a row that silently disappeared.
 */
export type InvitationState = "pending" | "accepted" | "expired" | "revoked";

export type OrgMember = {
    membershipId: string;
    userId: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
    isYou: boolean;
};

export type OrgInvitation = {
    id: string;
    email: string;
    state: InvitationState;
    /** Role the invitee gets on acceptance. Null when WorkOS has no role for it. */
    role: string | null;
    /** ISO 8601. When the invite was sent. */
    createdAt: string;
    /** ISO 8601. */
    expiresAt: string;
    /** ISO 8601, or null while still pending. */
    acceptedAt: string | null;
    /**
     * WorkOS-hosted accept URL. Surfaced so an admin can paste the link into
     * WhatsApp when the email is eaten by a spam filter — which, on school and
     * consumer mail domains, is the common failure, not the rare one.
     *
     * Treat it as a credential: anyone holding it can join the org as the
     * invited address. Only ever shown to admins, and only for pending invites.
     */
    acceptUrl: string | null;
};

export type OrgSettings = {
    id: string;
    name: string;
    type: string;
    contactEmail: string | null;
    phone: string | null;
    location: string | null;
    members: OrgMember[];
    invitations: OrgInvitation[];
    /** Whether the caller may rename the org, invite, or remove people. */
    canManage: boolean;
};
