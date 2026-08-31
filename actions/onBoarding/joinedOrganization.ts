"use server";

import { getAuthContext } from "@/lib/auth/session";
import { findJoinedOrg } from "@/lib/auth/provisionOrg";

/**
 * "Did this person arrive by invitation, and to whose institution?"
 *
 * Onboarding asks two questions an invitee has no business answering: which
 * account type they are, and what their institution is called. They were invited
 * into an institution that already exists — one they may not administer and
 * certainly may not rename. Answering those questions used to mint them a second
 * organization (see the guard in `provisionOrganizationForOnboarding`).
 *
 * The server-side guard is what makes that impossible. THIS exists so the UI
 * doesn't ask in the first place, which is the difference between "harmless" and
 * "not confusing".
 */
export async function getJoinedOrganization(): Promise<{
    name: string;
    type: string;
    role: string;
} | null> {
    const ctx = await getAuthContext();
    if (!ctx) return null;

    const joined = await findJoinedOrg(ctx.userId);
    if (!joined) return null;

    return { name: joined.name, type: joined.type, role: joined.role };
}
