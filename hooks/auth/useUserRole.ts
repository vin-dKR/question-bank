'use client';

import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { getUserRole } from '@/actions/onBoarding/getUserRole';

export const useUserRole = () => {
    const { user, isLoaded } = useUser();
    const [roleState, setRoleState] = useState<UserRoleState>({
        role: null,
        isLoading: false,
        error: null
    });

    useEffect(() => {
        const fetchRole = async () => {
            if (!user?.id || !isLoaded) {
                setRoleState({ role: null, isLoading: false, error: null })
                return
            }

            try {
                setRoleState((prev) => ({ ...prev, isLoading: true, error: null }))
                const userRole = await getUserRole(user.id)
                setRoleState((prev) => ({ ...prev, isLoading: false, role: userRole, error: null }))
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user role';
                console.error('Error fetching user role:', error);
                toast.error(errorMessage);
                setRoleState({ role: null, isLoading: false, error: errorMessage });
            }
        };

        fetchRole();
    }, [user?.id, isLoaded]);

    const roleFlag = useMemo(
        () => ({
            isTeacher: roleState.role === 'teacher',
            isStudent: roleState.role === 'student',
            isCoaching: roleState.role === 'coaching',
        }),
        [roleState.role]
    )
    return {
        role: roleState.role,
        isLoading: roleState.isLoading,
        error: roleState.error,
        ...roleFlag
    };
}; 
