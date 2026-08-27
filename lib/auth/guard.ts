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

type ServiceKey = { label: string; secret: string };

/**
 * The set of accepted service keys. Two sources, in priority order:
 *
 *   SERVICE_API_KEYS  — JSON map of label -> secret, e.g.
 *       {"omr-checker":"…","question-editor":"…"}
 *     Named keys are the recommended model (docs/API_SECURITY.md, Layer 5):
 *     each tool gets its OWN key, so one can be ROTATED or REVOKED without
 *     touching the others, and the matched label lets audit logs / rate limits
 *     ATTRIBUTE traffic to a specific tool.
 *
 *   QUESTION_API_KEY  — the legacy single shared key. Kept working so nothing
 *     breaks mid-migration; retire it once every satellite carries a named key.
 *
 * The durable end-state (per-key scopes, expiry, DB-backed revocation) is the
 * `ApiKey` model documented in the security doc; this env-map is the interim.
 */
function serviceKeys(): ServiceKey[] {
    const keys: ServiceKey[] = [];

    const raw = process.env.SERVICE_API_KEYS;
    if (raw) {
        try {
            const map = JSON.parse(raw) as Record<string, unknown>;
            for (const [label, secret] of Object.entries(map)) {
                if (typeof secret === "string" && secret) keys.push({ label, secret });
            }
        } catch {
            console.error("[auth] SERVICE_API_KEYS is not valid JSON — ignoring it.");
        }
    }

    if (process.env.QUESTION_API_KEY) {
        keys.push({ label: "legacy", secret: process.env.QUESTION_API_KEY });
    }

    return keys;
}

/**
 * API-route variant. Accepts EITHER a signed-in session OR a bearer token
 * matching one of the configured service keys (see serviceKeys()).
 *
 * The bearer path exists for the satellite tools (question-editor, multi-crop,
 * omr-checker) which call cross-origin. They previously relied on an ambient
 * session cookie, which is fragile cross-site and more so under AuthKit's sealed
 * cookie — a per-tool key is the durable answer.
 *
 * The returned `keyLabel` on the service branch is what audit logging and rate
 * limiting use to tell one tool from another.
 */
export async function requireApiActor(
    request: Request
): Promise<{ kind: "user"; user: AuthedUser } | { kind: "service"; keyLabel: string }> {
    const header = request.headers.get("authorization");

    if (header?.startsWith("Bearer ")) {
        const presented = header.slice("Bearer ".length).trim();
        for (const key of serviceKeys()) {
            // Length check first so the compare can't be used as an oracle for
            // any key's length.
            if (presented.length === key.secret.length && timingSafeEqual(presented, key.secret)) {
                return { kind: "service", keyLabel: key.label };
            }
        }
        throw new AuthError("Invalid API key.", 401);
    }

    const user = await getAuthContext();
    if (!user) throw new AuthError("You must be signed in.", 401);
    return { kind: "user", user };
}

/**
 * The organization a request acts on behalf of.
 *
 * For a signed-in user this is simply their active org. For the SERVICE key it
 * is a genuine problem: `requireApiActor` returns `{ kind: "service" }` with no
 * organization at all, and a create path that stamps nothing writes a question
 * with NO organizationId — which means the global shared bank. A satellite tool
 * uploading one school's private paper would have published it to every
 * customer, silently, and the row would also have been absent-not-null and so
 * invisible to the shared-bank filter (doc §11a).
 *
 * So the service caller must NAME its organization. `x-organization-id` accepts
 * either the local `Organization.id` or the WorkOS `org_…` id, whichever the
 * calling tool has to hand. `QUESTION_API_ORG_ID` is the fallback for a
 * single-tenant deployment of a satellite that has no per-request org.
 *
 * `allowGlobal` exists for READS: an unscoped service read of the shared bank is
 * fine (it's shared), whereas an unscoped service WRITE is the leak above.
 */
export async function resolveApiActorOrg(
    actor: { kind: "user"; user: AuthedUser } | { kind: "service" },
    request: Request,
    opts: { allowGlobal?: boolean } = {}
): Promise<string | null> {
    if (actor.kind === "user") return actor.user.organizationId;

    const named =
        request.headers.get("x-organization-id")?.trim() ||
        process.env.QUESTION_API_ORG_ID?.trim() ||
        "";

    if (!named) {
        if (opts.allowGlobal) return null;
        throw new AuthError(
            "This request must name an organization. Send x-organization-id, or set QUESTION_API_ORG_ID.",
            403
        );
    }

    // Accept either id form, and PROVE it exists — an unknown value must fail
    // loudly rather than fall through to null, which would mean "global bank".
    const org = named.startsWith("org_")
        ? await prisma.organization.findUnique({
              where: { workosOrgId: named },
              select: { id: true },
          })
        : await prisma.organization.findUnique({
              where: { id: named },
              select: { id: true },
          });

    if (!org) throw new AuthError("Unknown organization.", 403);
    return org.id;
}

/** Constant-time string compare, so a wrong key leaks no timing information. */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
