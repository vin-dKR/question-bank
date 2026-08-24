import prisma from "@/lib/prisma";
import { AuthError, getAuthContext, requireAuth, requireAdmin, type AuthContext } from "./session";

/**
 * Authorization guards for question mutations.
 *
 * Context (docs/WORKOS_MIGRATION_APPROACH.md §13-14): the question bank is a
 * GLOBAL SHARED bank, and the rule is "you can edit only what you uploaded":
 *
 *   Question.organizationId = null  -> uploaded by admin. Every org can READ it,
 *                                      no org may write it.
 *   Question.organizationId = <org> -> uploaded by that org. Only that org may
 *                                      read and write it.
 *
 * This file used to read Clerk directly and hard-code `organizationId: null`.
 * It now delegates to lib/auth/session.ts, so the org half of the rule above is
 * live: a real `organizationId` arrives from the WorkOS session and org-owned
 * questions became editable by their owner with no change to the rule itself.
 */

export { AuthError };

/**
 * Retained for the existing call sites. `AuthContext` is the richer type — new
 * code should import that from lib/auth/session.
 */
export type AuthedUser = AuthContext;

/** Returns the signed-in user, or null. Never throws for "not signed in". */
export async function getAuthedUser(): Promise<AuthedUser | null> {
    return getAuthContext();
}

/** Signed-in users only. Throws AuthError(401) otherwise. */
export async function requireUser(): Promise<AuthedUser> {
    return requireAuth();
}

export { requireAdmin };

/**
 * The ownership check from §13. Throws unless `user` may write `questionId`.
 *
 *   - organizationId null  -> admin-owned, admin-only write
 *   - organizationId set   -> that org may write it
 */
export async function assertCanMutateQuestion(
    questionId: string,
    user: AuthedUser
): Promise<void> {
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { organizationId: true },
    });

    if (!question) throw new AuthError("Question not found.", 403);

    if (user.isAdmin) return;

    if (question.organizationId === null) {
        throw new AuthError(
            "This question is part of the shared bank and can't be edited. Flag it instead and we'll review it.",
            403
        );
    }

    if (user.organizationId === null || question.organizationId !== user.organizationId) {
        throw new AuthError("You can only edit questions your organization uploaded.", 403);
    }
}

/**
 * API-route variant. Accepts EITHER a signed-in session OR a bearer token
 * matching QUESTION_API_KEY.
 *
 * The bearer path exists for the satellite tools (question-editor, multi-crop,
 * omr-checker) which call this route cross-origin. They previously relied on an
 * ambient session cookie, which is fragile cross-site and more so under
 * AuthKit's sealed cookie — see doc §8. Setting QUESTION_API_KEY in both apps
 * is the migration path.
 */
export async function requireApiActor(
    request: Request
): Promise<{ kind: "user"; user: AuthedUser } | { kind: "service" }> {
    const apiKey = process.env.QUESTION_API_KEY;
    const header = request.headers.get("authorization");

    if (apiKey && header?.startsWith("Bearer ")) {
        const presented = header.slice("Bearer ".length).trim();
        // Length check first so the comparison below can't be used as an
        // oracle for the key length.
        if (presented.length === apiKey.length && timingSafeEqual(presented, apiKey)) {
            return { kind: "service" };
        }
        throw new AuthError("Invalid API key.", 401);
    }

    const user = await getAuthContext();
    if (!user) throw new AuthError("You must be signed in.", 401);
    return { kind: "user", user };
}

/** Constant-time string compare, so a wrong key leaks no timing information. */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
