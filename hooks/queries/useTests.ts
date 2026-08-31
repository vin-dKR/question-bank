'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getTests } from '@/actions/examination/test/crudTest';
import { useOrgKey } from "@/provider/ActiveOrgProvider";

export interface UseTestsArgs {
    skip?: number;
    take?: number;
}

/**
 * Fetch a page of tests owned by the current user.
 *
 * Uses `keepPreviousData` so "load more" does not flash a loading state — the
 * existing list stays on screen while the next page is fetched.
 */
export const useTests = ({ skip = 0, take = 20 }: UseTestsArgs = {}) => {
    const orgKey = useOrgKey();
    return useQuery({
        // Org segment LAST so prefix-based invalidation keeps matching.
        queryKey: ['tests', { skip, take }, orgKey],
        queryFn: () => getTests({ skip, take }),
        placeholderData: keepPreviousData,
    });
};
