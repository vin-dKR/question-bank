import "server-only";
import { cache } from "react";
import { withAuth } from "@workos-inc/authkit-nextjs";
import prisma from "@/lib/prisma";
import { ensurePersonalOrg } from "./provisionOrg";

/**
 * The single server-side entry point for "who is asking, and on behalf of which
 * organization". Everything under actions/ and app/api/ should read auth from
 * here — never from the auth provider directly.
 *
 * See docs/WORKOS_MIGRATION_APPROACH.md. Two rules this file exists to enforce:
 *
 *   1. §1 — `organizationId` is the AUTHORIZATION key. `userId` on a resource
 *      means "who authored it". No server action may filter on userId alone.
 *   2. §7 — provisioning is LAZY, on first authenticated request, via upsert.
 *      Webhooks are reconciliation, not the primary path. This is what kills
 *      the Clerk-era race where a user could land on the app before the
 *      webhook fired and `completeOnboarding` threw "User not found".
 */

export type AuthContext = {
    /** Local `User.id` (Mongo ObjectId). This is what resource rows reference. */
    userId: string;
    /** WorkOS user id (`user_…`). The join key to the identity provider. */
    workosUserId: string;
    email: string;
    name: string | null;
    /** Role within the ACTIVE organization, not a global property of the person. */
    role: string;
    isAdmin: boolean;
    /** Local `Organization.id`. Null only if org provisioning failed. */
    organizationId: string | null;
    /** WorkOS organization id (`org_…`). */
    workosOrgId: string | null;
    permissions: string[];
    /** Set when a WorkOS admin is impersonating this user — block writes. */
    impersonatorEmail: string | null;
    /**
     * Replaces Clerk's `sessionClaims.metadata.onboardingComplete` (doc §6).
     * The WorkOS session carries no arbitrary app metadata, and gating on a
     * JWT claim was always the wrong place for this — it is DB state. A user
     * is onboarded once they have picked a role and filled in the setup form,
     * which is exactly when `User.role` stops being empty.
     */
    onboardingComplete: boolean;
};

/**
 * Bootstrap admin allowlist. `User.role` is free-form and no row holds "admin"
 * yet, so this env var names the first admin. Comma-separated emails.
 * Once role="admin" is set on the real accounts this can be emptied.
 */
function adminEmails(): string[] {
    return (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

/** Best-effort display name from whatever WorkOS gives us. */
function displayName(u: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}): string | null {
    if (u.name?.trim()) return u.name.trim();
    const joined = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
    return joined || null;
}

/**
 * Resolves the caller. Returns null when not signed in — never throws for that,
 * so callers can decide between redirecting and returning a 401.
 *
 * Side effects, both idempotent and both deliberate:
 *   - upserts the local `User` row (lazy provisioning, §7)
 *   - creates a personal `Organization` + `Membership` if the user has none
 *     (§1 "give solo users a personal org"), so that no code path ever has to
 *     handle a resource with no org
 */
async function loadAuthContext(): Promise<AuthContext | null> {
    const session = await withAuth();
    if (!session.user) return null;

    const { user: wosUser, organizationId: sessionOrgId, role, permissions, impersonator } = session;

    const email = wosUser.email.toLowerCase();
    const name = displayName(wosUser);

    // Lazy provisioning. Keyed on email because that is the one identifier that
    // survives the Clerk -> WorkOS cutover: imported users keep their address,
    // so an existing row is matched and STAMPED with workosUserId rather than
    // duplicated. `workosUserId` is deliberately not @unique (see the schema
    // comment), so it can't be the upsert key.
    //
    // The read below is a FAST PATH ONLY — it keeps the common case (user
    // already exists) free of writes. It is NOT the concurrency guard. Two
    // requests for the same brand-new user race here constantly in practice: a
    // navigation to /dashboard and its RSC prefetch both render the layout, both
    // see no row, and both try to insert. The `upsert` below is what makes that
    // safe; a plain `create` here fails the second one with P2002 on
    // User_email_key. (This is exactly the double-create the migration doc §7
    // says lazy provisioning removes — it only does so if the write is atomic.)
    let user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, workosUserId: true },
    });

    if (!user) {
        user = await prisma.user.upsert({
            where: { email },
            // Reached when a concurrent request won the insert. Stamp the WorkOS
            // id and take whatever it wrote rather than failing the request.
            update: { workosUserId: wosUser.id },
            create: {
                email,
                name,
                workosUserId: wosUser.id,
                profileImage: wosUser.profilePictureUrl ?? null,
                // Legacy required field. Kept satisfied with the WorkOS id so the
                // column stays unique until phase 5 drops it.
                clerkUserId: `workos:${wosUser.id}`,
                role: "",
            },
            select: { id: true, email: true, name: true, role: true, workosUserId: true },
        });
    } else if (user.workosUserId !== wosUser.id) {
        // First sight of this person post-cutover: link the existing row.
        user = await prisma.user.update({
            where: { id: user.id },
            data: { workosUserId: wosUser.id, name: user.name ?? name },
            select: { id: true, email: true, name: true, role: true, workosUserId: true },
        });
    }

    // Resolve the active organization. Prefer what the session says, because
    // that is what the access token's permissions were minted against. Fall
    // back to the user's own membership, then to creating one.
    let org: { id: string; workosOrgId: string } | null = null;
    let membershipRole: string | null = null;

    if (sessionOrgId) {
        org = await prisma.organization.findUnique({
            where: { workosOrgId: sessionOrgId },
            select: { id: true, workosOrgId: true },
        });
    }

    if (!org) {
        const membership = await prisma.membership.findFirst({
            where: { userId: user.id, status: "active" },
            orderBy: { createdAt: "asc" },
            select: { role: true, organization: { select: { id: true, workosOrgId: true } } },
        });
        if (membership) {
            org = membership.organization;
            membershipRole = membership.role;
        }
    }

    if (!org) {
        // The TLDR: every person who arrives gets an organization, silently.
        org = await ensurePersonalOrg({
            userId: user.id,
            workosUserId: wosUser.id,
            email,
            name,
        });
        membershipRole = "admin";
    }

    return {
        userId: user.id,
        workosUserId: wosUser.id,
        email,
        name: user.name ?? name,
        role: role ?? membershipRole ?? "member",
        isAdmin: user.role === "admin" || adminEmails().includes(email),
        organizationId: org?.id ?? null,
        workosOrgId: org?.workosOrgId ?? null,
        permissions: permissions ?? [],
        impersonatorEmail: impersonator?.email ?? null,
        onboardingComplete: Boolean(user.role && user.role.trim() !== ""),
    };
}

/**
 * Request-scoped memo. A layout and every page under it call this, and server
 * actions call it again; without `cache()` that is a fresh WorkOS session read
 * plus several DB round trips each time. React clears it between requests, so
 * this is a per-request cache, not a shared one.
 */
export const getAuthContext = cache(loadAuthContext);

/**
 * Drop-in for the old `const { userId } = await auth()` pattern, but returns the
 * LOCAL user id — which is what every resource row actually references. Saves
 * each call site the `prisma.user.findUnique({ where: { clerkUserId } })` hop
 * it used to do by hand.
 */
export async function getCurrentUser(): Promise<AuthContext | null> {
    return getAuthContext();
}

export class AuthError extends Error {
    /** HTTP status the route should answer with. 401/403 for auth, 429 for the
     *  RateLimitError subclass in lib/ratelimit.ts. */
    readonly status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = "AuthError";
        this.status = status;
    }
}

/** Signed-in users only. Throws AuthError(401) otherwise. */
export async function requireAuth(): Promise<AuthContext> {
    const ctx = await getAuthContext();
    if (!ctx) throw new AuthError("You must be signed in.", 401);
    return ctx;
}

/**
 * The §1 enforcement helper. Guarantees a non-null `organizationId`, so callers
 * can use it directly in a `where` clause without a null check.
 */
export async function requireOrgContext(): Promise<
    AuthContext & { organizationId: string }
> {
    const ctx = await requireAuth();
    if (!ctx.organizationId) {
        throw new AuthError(
            "Your account isn't linked to an organization yet. Please reload, or contact support if this persists.",
            403
        );
    }
    return ctx as AuthContext & { organizationId: string };
}

/** Admins only. Throws AuthError(401/403). */
export async function requireAdmin(): Promise<AuthContext> {
    const ctx = await requireAuth();
    if (!ctx.isAdmin) throw new AuthError("Admin access required.", 403);
    return ctx;
}
