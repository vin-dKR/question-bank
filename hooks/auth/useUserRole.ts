'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserRole } from '@/actions/onBoarding/getUserRole';

export const useUserRole = () => {
    const { user, isLoaded } = useUser();
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!user?.id || !isLoaded) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const userRole = await getUserRole(user.id);
                setRole(userRole);
            } catch (error) {
                console.error('Error fetching user role:', error);
                setRole(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, [user?.id, isLoaded]);

    return {
        role,
        isLoading,
        isTeacher: role === 'teacher',
        isStudent: role === 'student',
        isCoaching: role === 'coaching',
    };
}; 