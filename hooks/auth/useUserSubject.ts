'use client';

import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/auth/useCurrentUser';
import { getUserSubject } from '@/actions/onBoarding/getUserSubject';

export const useUserSubject = () => {
    const { user, isLoaded, organizationId } = useCurrentUser();
    const enabled = isLoaded && Boolean(user?.id);
    const query = useQuery<string | null>({
        queryKey: ['currentUserSubject', user?.id ?? null, organizationId ?? null],
        queryFn: getUserSubject,
        enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    return {
        subject: query.data ?? undefined,
        // Keep downstream question/filter queries disabled until both AuthKit
        // and this server-derived teacher restriction have settled.
        isLoading: !isLoaded || (enabled && query.isPending),
    }
}
