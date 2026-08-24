'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useMemo } from 'react';

/**
 * Client-side adapter over AuthKit's `useAuth`.
 *
 * Exists so components don't each have to know that WorkOS names things
 * differently from Clerk (`profilePictureUrl` not `imageUrl`, a flat `email`
 * not `primaryEmailAddress.emailAddress`, `loading` not `isLoaded`). Components
 * keep reading `isLoaded` / `user.fullName` / `user.imageUrl` as before.
 *
 * IMPORTANT: `user.id` here is the WORKOS user id, not the local `User.id` that
 * resource rows reference. Never send it to a server action as an identity
 * claim — server actions are public endpoints, so they must read the session
 * themselves. It is fine for display, and for the collab WebSocket handshake.
 */
export type CurrentUser = {
    /** WorkOS user id (`user_…`). Display/presence only — never an authz claim. */
    id: string;
    email: string;
    /** Always a non-empty string; falls back to the email local part. */
    fullName: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | undefined;
    /** ISO 8601, from WorkOS. */
    createdAt: string;
};

export function useCurrentUser() {
    const { user, loading, organizationId, role, signOut } = useAuth();

    const mapped = useMemo<CurrentUser | null>(() => {
        if (!user) return null;
        const joined = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        return {
            id: user.id,
            email: user.email,
            fullName: user.name?.trim() || joined || user.email.split('@')[0],
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.profilePictureUrl ?? undefined,
            createdAt: user.createdAt,
        };
    }, [user]);

    return {
        user: mapped,
        /** Inverse of AuthKit's `loading`, to match the shape components already use. */
        isLoaded: !loading,
        isSignedIn: Boolean(user),
        organizationId,
        role,
        signOut,
    };
}
