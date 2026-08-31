import { handleAuth } from "@workos-inc/authkit-nextjs";
import { rememberLastOrg } from "@/lib/auth/activeOrg";

/**
 * AuthKit redirects here after the user authenticates on the hosted sign-in
 * page. `handleAuth` exchanges the code for tokens and writes the sealed
 * session cookie.
 *
 * This URL must match NEXT_PUBLIC_WORKOS_REDIRECT_URI and be registered as a
 * redirect URI in the WorkOS dashboard (Redirects), for every environment.
 *
 * Note there is no user-provisioning hook here on purpose. Provisioning is lazy
 * and happens in `getAuthContext()` on the first authenticated request (doc §7),
 * so a user who arrives by any route — hosted sign-in, invitation acceptance,
 * impersonation — is provisioned identically and exactly once.
 *
 * The `onSuccess` hook below is NOT provisioning. It records which organization
 * this sign-in was scoped to, which is the one place we can: a route handler is
 * allowed to write cookies, and a server component is not — so `getAuthContext()`
 * can only ever READ the remembered org.
 *
 * This is what makes accepting an invitation stick. WorkOS scopes that
 * particular sign-in to the inviting organization, so the id arrives here; every
 * later plain sign-in carries no org at all, and without this the fallback chain
 * would have to guess again each time.
 */
export const GET = handleAuth({
    returnPathname: "/dashboard",
    onSuccess: async ({ organizationId }) => {
        // Absent on an ordinary sign-in. Keep whatever was remembered before
        // rather than clearing it — "no org named" is not "no org wanted".
        if (organizationId) {
            await rememberLastOrg(organizationId);
        }
    },
});
