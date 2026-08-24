"use client";

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function SignOut() {
    const { signOut } = useAuth();

    return (
        <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => signOut({ returnTo: '/' })}
        >
            Sign Out
        </button>
    );
}
