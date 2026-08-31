"use client";

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function SignOut() {
    const { signOut } = useAuth();

    return (
        <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() =>
                // Absolute URL, not '/'. WorkOS's logout endpoint expects a full
                // URL for return_to; given a relative path it falls back to the
                // app's configured homepage URL, and errors with
                // `app-homepage-url-not-found` if that isn't set.
                signOut({ returnTo: `${window.location.origin}/` })
            }
        >
            Sign Out
        </button>
    );
}
