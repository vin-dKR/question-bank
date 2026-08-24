/**
 * Shared types and constants for organization settings.
 *
 * These live OUTSIDE settings.ts on purpose: a `"use server"` module may only
 * export async functions. Types are erased at compile time so they'd survive,
 * but a plain `export const` (ASSIGNABLE_ROLES) makes the whole file invalid
 * and breaks `next build` with an opaque "Failed to collect page data" error.
 */

/** Roles that can be handed out. Students don't get accounts (doc §3). */
export const ASSIGNABLE_ROLES = ["admin", "member"] as const;
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

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
    state: string;
    expiresAt: string;
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
