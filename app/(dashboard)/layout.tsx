import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { MainContent } from "@/components/dashboard/content/MainContent";

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

    return (
        <DashboardLayoutClient>
            <MainContent>{children}</MainContent>
        </DashboardLayoutClient>
    );
}
