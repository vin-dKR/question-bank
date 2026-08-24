import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

/**
 * Password reset is part of the hosted AuthKit sign-in page ("Forgot password?"),
 * so this route just forwards there. Kept rather than deleted because the link
 * is in old password-reset emails and on the marketing site.
 *
 * Route handler, not a page — see the note in ../signin/route.ts.
 */
export const GET = async () => {
    return redirect(await getSignInUrl({ returnTo: "/dashboard" }));
};
