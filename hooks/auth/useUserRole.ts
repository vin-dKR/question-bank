'use client';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { useEffect, useMemo } from 'react';
import { getUserRole } from '@/actions/onBoarding/getUserRole';

export const useUserRole = () => {
    const { user, isLoaded, organizationId } = useCurrentUser();
    const enabled = isLoaded && Boolean(user?.id);
    const query = useQuery<UserRole>({
        queryKey: ['currentUserRole', user?.id ?? null, organizationId ?? null],
        queryFn: getUserRole,
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    useEffect(() => {
        if (!query.error) return;

        const errorMessage = query.error instanceof Error
            ? query.error.message
            : 'Failed to fetch user role';
        console.error('Error fetching user role:', query.error);
        toast.error(errorMessage);
    }, [query.error]);

    const role = query.data ?? null;
    const error = query.error instanceof Error
        ? query.error.message
        : query.error
            ? 'Failed to fetch user role'
            : null;

    const roleFlag = useMemo(
        () => ({
            isTeacher: role === 'teacher',
            isStudent: role === 'student',
            isCoaching: role === 'coaching',
        }),
        [role]
    )

    return {
        role,
        // AuthKit must resolve before this query can start. Treat that period
        // as loading too so consumers never fall back to a provisional role.
        isLoading: !isLoaded || (enabled && query.isPending),
        error,
        ...roleFlag
    };
}; 
