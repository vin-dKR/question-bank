"use server";

import prisma from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";
import { findJoinedOrg } from "@/lib/auth/provisionOrg";

/**
 * "Has this person just joined an institution, and do they know it?"
 *
 * Accepting an invitation currently drops you on an unchanged dashboard with no
 * acknowledgement of any kind — you can't tell it worked, which institution
 * you're in, or whether your own workspace survived.
 *
 * WHY THIS IS INFERRED RATHER THAN PASSED: the accept link belongs to WorkOS and
 * `handleAuth({ returnPathname: "/dashboard" })` is a constant, so there is no
 * point in the round trip where we could attach `?joined=<org>`. What we do have
 * is `Membership.createdAt`, which is the moment they accepted. That is enough.
 */

/**
 * How long after joining the welcome can still appear. Generous on purpose: a
 * teacher may accept the invitation on their phone at 11pm and not open the
 * dashboard until the next morning, and a five-minute window would mean the one
 * screen explaining what just happened is the one screen they never see.
 */
const WELCOME_WINDOW_MS = 24 * 60 * 60 * 1000;

export type JoinWelcome = {
    /** Stable dismissal key — the org they joined. */
    organizationId: string;
    organizationName: string;
    role: string;
    /** Their own workspace, if they have one. Null for someone who only ever joined. */
    personalWorkspaceName: string | null;
};

export async function getJoinWelcome(): Promise<JoinWelcome | null> {
    try {
        const ctx = await getAuthContext();
        if (!ctx?.organizationId) return null;

        const joined = await findJoinedOrg(ctx.userId);

        // Must be an org they JOINED, not one they created — otherwise a
        // coaching-centre founder gets congratulated on joining their own centre
        // — and it must be the org they are actually looking at right now.
        if (!joined || joined.id !== ctx.organizationId) return null;

        if (Date.now() - joined.joinedAt.getTime() > WELCOME_WINDOW_MS) return null;

        const personal = await prisma.organization.findFirst({
            where: { ownerUserId: ctx.userId },
            select: { name: true },
        });

        return {
            organizationId: joined.id,
            organizationName: joined.name,
            role: joined.role,
            personalWorkspaceName: personal?.name ?? null,
        };
    } catch (err) {
        // A welcome banner is never worth failing a dashboard render over.
        console.error("[joinWelcome] could not resolve", err);
        return null;
    }
}
