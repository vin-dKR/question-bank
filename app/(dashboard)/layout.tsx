import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { MainContent } from "@/components/dashboard/content/MainContent";
import { JoinWelcome } from "@/components/dashboard/JoinWelcome";
import { getJoinWelcome } from "@/actions/organization/joinWelcome";
import { ActiveOrgProvider } from "@/provider/ActiveOrgProvider";
import type { SwitcherOrg } from "@/components/organization/OrgSwitcher";

/**
 * The onboarding gate lives here, not in middleware (doc §6).
 *
 * Middleware only answers "signed in or not" — it has no database connection,
 * and the Clerk-era version gated on `sessionClaims.metadata.onboardingComplete`,
 * a JWT claim that AuthKit has no equivalent for. This is a server component
 * with a DB connection, so it can read the real answer.
 *
 * Calling getAuthContext() here is also what provisions a brand-new user: their
 * User row, Organization and Membership are all created on this first
 * authenticated request, before any page renders.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const ctx = await getAuthContext();

    if (!ctx) {
        redirect("/auth/signin");
    }

    if (!ctx.onboardingComplete) {
        redirect("/onboarding/user-type");
    }

    // Resolved here rather than in a client fetch so the banner is part of the
    // first paint — an acknowledgement that arrives a second late reads as a
    // glitch rather than as confirmation.
    const welcome = await getJoinWelcome();

    // Mapped down to what the UI needs. `ctx.memberships` carries `workosOrgId`,
    // which is a join key to the identity provider and has no business crossing
    // into a client component.
    const orgs: SwitcherOrg[] = ctx.memberships.map((m) => ({
        organizationId: m.organizationId,
        name: m.name,
        type: m.type,
        role: m.role,
        isActive: m.isActive,
    }));

    const activeOrg = orgs.find((o) => o.isActive) ?? null;

    return (
        <ActiveOrgProvider
            value={{ id: activeOrg?.organizationId ?? null, name: activeOrg?.name ?? null }}
        >
            <DashboardLayoutClient orgs={orgs}>
                <MainContent>
                    <JoinWelcome welcome={welcome} />
                    {children}
                </MainContent>
            </DashboardLayoutClient>
        </ActiveOrgProvider>
    );
}
