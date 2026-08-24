import { getSignUpUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/**
 * Sign-up is the same hosted AuthKit page with `screenHint=sign-up`, so it opens
 * on the register tab. New users land on /auth/callback, get provisioned lazily
 * (User + Organization + Membership) on their first authenticated request, then
 * hit the onboarding gate in app/(dashboard)/layout.tsx.
 *
 * Route handler, not a page — see the note in ../signin/route.ts.
 */
export const GET = async (request: NextRequest) => {
    const returnTo = request.nextUrl.searchParams.get("returnTo") ?? "/dashboard";
    return redirect(await getSignUpUrl({ returnTo }));
};
