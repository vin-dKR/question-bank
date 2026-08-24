import { handleAuth } from "@workos-inc/authkit-nextjs";

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
 */
export const GET = handleAuth({ returnPathname: "/dashboard" });
