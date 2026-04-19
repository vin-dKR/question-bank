'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getTestAnalyticsDetail } from '@/actions/examination/analytics/getTestAnalyticsDetail';

export interface UseTestAnalyticsDetailArgs {
    take?: number;
}

/**
 * Paginated per-student response detail for a test.
 *
 * Uses cursor pagination — `nextCursor` returned from each page feeds the
 * next `pageParam`. Flatten `data.pages.flatMap(p => p.items)` at the call
 * site to render.
 */
export const useTestAnalyticsDetail = (
    testId: string | undefined,
    { take = 25 }: UseTestAnalyticsDetailArgs = {},
) => {
    return useInfiniteQuery({
        queryKey: ['testAnalytics', testId, 'detail', { take }],
        queryFn: ({ pageParam }) => {
            if (!testId) {
                throw new Error('testId is required');
            }
            return getTestAnalyticsDetail(testId, {
                cursor: pageParam ?? undefined,
                take,
            });
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: Boolean(testId),
    });
};
