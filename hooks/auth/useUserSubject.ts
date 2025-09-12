'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserSubject } from '@/actions/onBoarding/getUserSubject';

export const useUserSubject = () => {
    const { user, isLoaded } = useUser();
    const [subject, setSubject] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubject = async () => {
            if (!user?.id || !isLoaded) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const userSubject = await getUserSubject(user.id);
                setSubject(userSubject);
            } catch (error) {
                console.error('Error fetching user subject:', error);
                setSubject(undefined);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubject();
    }, [user?.id, isLoaded]);

    return {
        subject,
        isLoading,
    };
}; 
