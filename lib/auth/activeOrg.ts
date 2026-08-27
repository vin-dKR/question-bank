import "server-only";
import { cookies } from "next/headers";

/**
 * The remembered active organization.
 *
 * Once a teacher can belong to two institutions, "which one am I looking at?"
 * needs a durable answer. Before this, `getAuthContext()` fell back to
 * `membership.findFirst({ orderBy: { createdAt: 'asc' } })` — the OLDEST
 * membership — which for anyone invited after signing up is their own personal
 * workspace, permanently, with no mechanism to ever produce a different answer.
 * The invitation looked like it had done nothing.
 *
 * This cookie holds the WorkOS org id, never the local one: it is compared
 * against the session's `organizationId`, which is also a WorkOS id, and keeping
 * both sides in one namespace avoids a translation nobody would remember to do.
 *
 * IT IS A HINT, NOT A GRANT. Nothing trusts it: `resolveActiveOrganization()`
 * validates it against live memberships on every request, so a tampered or
 * stale value can only ever select between orgs the caller already belongs to,
 * and falls back silently when it names one they don't.
 */

const COOKIE_NAME = "eduents_last_org";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Reads the remembered WorkOS org id. Null when unset or unreadable. */
export async function readLastOrg(): Promise<string | null> {
    try {
        const store = await cookies();
        return store.get(COOKIE_NAME)?.value ?? null;
    } catch {
        return null;
    }
}

/**
 * Remembers an organization as the active one.
 *
 * WRITES ONLY WORK IN A SERVER ACTION OR ROUTE HANDLER. Next.js throws on a
 * cookie write from a server component, and `getAuthContext()` is called from
 * layouts — so this swallows the failure rather than 500ing a page render. The
 * cost of a missed write is that the fallback chain picks the org next time,
 * which is exactly what it is there for.
 */
export async function rememberLastOrg(workosOrgId: string): Promise<void> {
    try {
        const store = await cookies();
        store.set(COOKIE_NAME, workosOrgId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: ONE_YEAR_SECONDS,
        });
    } catch {
        // Server-component render, or headers already sent. Non-fatal.
    }
}

/** Forgets the remembered org — used when the user leaves it. */
export async function forgetLastOrg(): Promise<void> {
    try {
        const store = await cookies();
        store.delete(COOKIE_NAME);
    } catch {
        // Non-fatal, same reason as above.
    }
}
