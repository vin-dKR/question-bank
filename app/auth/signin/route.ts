import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * Sign-in is hosted by AuthKit. This route exists to keep the /auth/signin URL
 * working (it is linked from the marketing site, the middleware redirect, and
 * any bookmark) and to forward `returnTo` through the round trip.
 *
 * THIS MUST BE A ROUTE HANDLER, NOT A PAGE. `getSignInUrl()` calls
 * `setPKCECookie()` internally, and Next.js only permits cookie writes in a
 * Server Action or Route Handler — a Server Component page throws
 * "Cookies can only be modified in a Server Action or Route Handler" and the
 * redirect silently never happens. The PKCE cookie is not optional: handleAuth()
 * reads it back at /auth/callback to verify the code verifier.
 *
 * Also set this URL as the "Sign-in URL" (initiate_login_uri) in the WorkOS
 * dashboard under Redirects — WorkOS-initiated flows such as impersonation
 * start there and fail the PKCE check without it.
 */
export const GET = async (request: NextRequest) => {
    const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard";
    return redirect(await getSignInUrl({ returnTo }));
};
