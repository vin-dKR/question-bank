"use client";

import { useEffect, useRef } from "react";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { useOnboardingStore } from "@/store/userInitialSelectedState";

/**
 * Seeds the onboarding form with what the session already knows, so a user
 * isn't asked to retype the name and email they just authenticated with.
 *
 * Two deliberate constraints:
 *
 *   1. EMPTY FIELDS ONLY. It never overwrites something the user has typed —
 *      otherwise a late-arriving session (`useAuth` resolves asynchronously)
 *      would wipe out whatever they were part-way through entering.
 *   2. ONCE PER MOUNT, via a ref. Without that, every re-render would try to
 *      re-seed and would fight the user clearing a field on purpose.
 *
 * The name is only filled when WorkOS actually has one. `CurrentUser.fullName`
 * falls back to the email local part for display purposes, and "sk9261712674"
 * is a bad default to put in a "Full Name" box — an email+password signup gives
 * WorkOS no name at all, so that fallback is the common case, not a rare one.
 */
export function usePrefillFromSession({
    nameField,
    emailField,
}: {
    /** Store key to receive the user's name, if we have a real one. */
    nameField?: string;
    /** Store key to receive the user's email. */
    emailField?: string;
}) {
    const { user, isLoaded } = useCurrentUser();
    const onboarding = useOnboardingStore((state) => state.onboarding);
    const setData = useOnboardingStore((state) => state.setData);
    const seeded = useRef(false);

    useEffect(() => {
        if (seeded.current || !isLoaded || !user || !onboarding) return;

        // The onboarding data is a union of three role-specific shapes with no
        // index signature, so it needs the two-step cast to be read by key.
        const data = onboarding.data as unknown as Record<string, unknown>;
        const isBlank = (key: string) => !String(data[key] ?? "").trim();
        const patch: Record<string, string> = {};

        // Only a name WorkOS actually holds — not the email-derived fallback.
        const realName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        if (nameField && realName && isBlank(nameField)) {
            patch[nameField] = realName;
        }
        if (emailField && isBlank(emailField)) {
            patch[emailField] = user.email;
        }

        seeded.current = true;
        if (Object.keys(patch).length > 0) {
            setData(patch as never);
        }
    }, [isLoaded, user, onboarding, setData, nameField, emailField]);
}
