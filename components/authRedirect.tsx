'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function AuthRedirect({ to = '/' }: { to?: string }) {
    const { isLoaded, session } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && session) {
            router.push(to);
        }
    }, [isLoaded, session, router, to]);

    return null;
}
