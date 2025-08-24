'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingOverlay } from '@/components/Loader';
import Link from 'next/link';

export default function Home() {
    const { user } = useUser();
    const router = useRouter()


    useEffect(() => {
        if (!user) {
            router.push('/auth/signup')
        }
    }, [user, router]);

    if (!user) return <LoadingOverlay text="Authenticating..." />


    return (
        <div className="container bg-gray-50 mx-auto">
            <Link href="/dashboard">Go to Main</Link>
        </div>
    )
}
