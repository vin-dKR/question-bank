import "server-only";
import { getWorkOS } from "@workos-inc/authkit-nextjs";
import prisma from "@/lib/prisma";

/**
 * Organization provisioning.
 *
 * The product rule (docs/WORKOS_MIGRATION_APPROACH.md §1): EVERY user gets an
 * organization, including a teacher who signs up alone. That teacher never sees
 * the word "organization" — it is created silently so that no resource in the
 * system is ever org-less and no query ever needs a "resource with no org"
 * branch. When they later add colleagues, the org is already there and gets a
 * real name; nothing has to be migrated.
 *
 * Everything here is idempotent on both sides:
 *   - locally, via `Organization.ownerUserId` for personal orgs
 *   - in WorkOS, via `externalId`, which is durable (unlike an Idempotency-Key,
 *     which WorkOS only honours for 24h)
 */

/** Stable per-user key so a re-run can never mint a second personal org. */
function personalOrgExternalId(localUserId: string): string {
    return `personal-org-${localUserId}`;
}

/**
 * A readable org name for someone who never told us their institution.
 * "Suraj Kumar" -> "Suraj Kumar's workspace"; falls back to the email local part.
 */
function personalOrgName(name: string | null, email: string): string {
    const base = name?.trim() || email.split("@")[0];
    return `${base}'s workspace`;
}

type ProvisionedOrg = { id: string; workosOrgId: string };

/**
 * Creates the WorkOS organization, tolerating the case where `externalId`
 * already points at one (a partially-completed earlier run).
 */
async function createOrGetWorkosOrg(name: string, externalId: string) {
    const workos = getWorkOS();
    try {
        return await workos.organizations.createOrganization({ name, externalId });
    } catch (err) {
        // Conflict on externalId means a previous attempt got as far as WorkOS
        // but not as far as our DB. Adopt the existing org rather than failing.
        try {
            return await workos.organizations.getOrganizationByExternalId(externalId);
        } catch {
            throw err;
        }
    }
}

/**
 * Adds the user to the org in WorkOS.
 *
 * `roleSlug` is attempted but not required: a WorkOS environment that hasn't had
 * an "admin" role configured will reject it, and failing org creation over a
 * role slug would be a bad trade. On rejection we retry without one and let
 * WorkOS assign the environment default.
 */
async function createWorkosMembership(
    workosOrgId: string,
    workosUserId: string,
    roleSlug: string
): Promise<{ id: string; role: string }> {
    const workos = getWorkOS();
    try {
        const m = await workos.userManagement.createOrganizationMembership({
            organizationId: workosOrgId,
            userId: workosUserId,
            roleSlug,
        });
        return { id: m.id, role: m.role?.slug ?? roleSlug };
    } catch (err) {
        console.warn(
            `[provisionOrg] membership with roleSlug="${roleSlug}" was rejected; retrying with the environment default.`,
            err
        );
        const m = await workos.userManagement.createOrganizationMembership({
            organizationId: workosOrgId,
            userId: workosUserId,
        });
        return { id: m.id, role: m.role?.slug ?? "member" };
    }
}

/**
 * The silent path, called from `getAuthContext()` on first authenticated
 * request. Guarantees the user has an org without asking them anything.
 *
 * Returns null rather than throwing if WorkOS is unreachable — a transient
 * provisioning failure should degrade to "no org yet" (which `requireOrgContext`
 * turns into a clear error) rather than 500 every page in the app.
 */
export async function ensurePersonalOrg(user: {
    userId: string;
    workosUserId: string;
    email: string;
    name: string | null;
}): Promise<ProvisionedOrg | null> {
    // Local guard first — the common case is that it already exists and this
    // costs one indexed read and no network call.
    const existing = await prisma.organization.findFirst({
        where: { ownerUserId: user.userId },
        select: { id: true, workosOrgId: true },
    });
    if (existing) {
        await ensureLocalMembership(user.userId, existing.id, user.workosUserId, existing.workosOrgId, "admin");
        return existing;
    }

    try {
        const externalId = personalOrgExternalId(user.userId);
        const wosOrg = await createOrGetWorkosOrg(
            personalOrgName(user.name, user.email),
            externalId
        );

        const org = await prisma.organization.upsert({
            where: { workosOrgId: wosOrg.id },
            update: {},
            create: {
                workosOrgId: wosOrg.id,
                name: wosOrg.name,
                type: "personal",
                ownerUserId: user.userId,
                contactEmail: user.email,
            },
            select: { id: true, workosOrgId: true },
        });

        await ensureLocalMembership(user.userId, org.id, user.workosUserId, org.workosOrgId, "admin");
        return org;
    } catch (err) {
        console.error("[provisionOrg] failed to create personal org", err);
        return null;
    }
}

/** Creates the WorkOS + local membership if it isn't already there. */
async function ensureLocalMembership(
    localUserId: string,
    localOrgId: string,
    workosUserId: string,
    workosOrgId: string,
    roleSlug: string
): Promise<void> {
    const existing = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: localUserId, organizationId: localOrgId } },
        select: { id: true },
    });
    if (existing) return;

    const wosMembership = await createWorkosMembership(workosOrgId, workosUserId, roleSlug);

    await prisma.membership.upsert({
        where: { userId_organizationId: { userId: localUserId, organizationId: localOrgId } },
        update: { workosMembershipId: wosMembership.id, role: wosMembership.role, status: "active" },
        create: {
            workosMembershipId: wosMembership.id,
            userId: localUserId,
            organizationId: localOrgId,
            role: wosMembership.role,
            status: "active",
        },
    });
}

/**
 * The onboarding path. Called once the user has actually told us who they are,
 * so we can give the org a real name instead of "…'s workspace".
 *
 * Deliberately REUSES the personal org created by `ensurePersonalOrg` rather
 * than creating a second one — the user signed in first and onboarded second,
 * so by the time this runs an org almost always exists. It renames it and
 * upgrades its `type`, which keeps `Organization.id` stable and means nothing
 * already stamped with it has to be re-pointed.
 */
export async function provisionOrganizationForOnboarding(params: {
    userId: string;
    workosUserId: string;
    email: string;
    userName: string | null;
    /** The institution name the user typed. Falls back to a personal-org name. */
    orgName: string | null;
    /** 'coaching' for a centre/institute, 'personal' for a solo teacher. */
    type: "personal" | "school" | "coaching";
    profile?: {
        contactPerson?: string | null;
        contactEmail?: string | null;
        phone?: string | null;
        location?: string | null;
        targetExams?: string[];
    };
}): Promise<ProvisionedOrg | null> {
    const name = params.orgName?.trim() || personalOrgName(params.userName, params.email);

    const existing = await prisma.organization.findFirst({
        where: { ownerUserId: params.userId },
        select: { id: true, workosOrgId: true },
    });

    if (existing) {
        try {
            await getWorkOS().organizations.updateOrganization({
                organization: existing.workosOrgId,
                name,
            });
        } catch (err) {
            // A stale display name in WorkOS is cosmetic; don't fail onboarding.
            console.warn("[provisionOrg] could not rename WorkOS org", err);
        }

        await prisma.organization.update({
            where: { id: existing.id },
            data: {
                name,
                type: params.type,
                contactPerson: params.profile?.contactPerson ?? undefined,
                contactEmail: params.profile?.contactEmail ?? params.email,
                phone: params.profile?.phone ?? undefined,
                location: params.profile?.location ?? undefined,
                targetExams: params.profile?.targetExams ?? undefined,
            },
        });

        await ensureLocalMembership(
            params.userId,
            existing.id,
            params.workosUserId,
            existing.workosOrgId,
            "admin"
        );
        return existing;
    }

    // No personal org yet (WorkOS was down at first sign-in, say). Create now.
    try {
        const wosOrg = await createOrGetWorkosOrg(name, personalOrgExternalId(params.userId));

        const org = await prisma.organization.upsert({
            where: { workosOrgId: wosOrg.id },
            update: { name, type: params.type },
            create: {
                workosOrgId: wosOrg.id,
                name,
                type: params.type,
                ownerUserId: params.userId,
                contactPerson: params.profile?.contactPerson ?? null,
                contactEmail: params.profile?.contactEmail ?? params.email,
                phone: params.profile?.phone ?? null,
                location: params.profile?.location ?? null,
                targetExams: params.profile?.targetExams ?? [],
            },
            select: { id: true, workosOrgId: true },
        });

        await ensureLocalMembership(
            params.userId,
            org.id,
            params.workosUserId,
            org.workosOrgId,
            "admin"
        );
        return org;
    } catch (err) {
        console.error("[provisionOrg] failed to create org during onboarding", err);
        return null;
    }
}
