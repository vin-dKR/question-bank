'use client';

import { useQuery } from '@tanstack/react-query';
import { getTestAnalyticsSummary } from '@/actions/examination/analytics/getTestAnalyticsSummary';

/**
 * Overview metrics for a test — counts, averages, top-N students.
 *
 * Cheap + cacheable. Default TanStack Query defaults (30 s stale) are fine.
 */
export const useTestAnalyticsSummary = (testId: string | undefined) => {
    return useQuery({
        queryKey: ['testAnalytics', testId, 'summary'],
        queryFn: () => {
            if (!testId) {
                throw new Error('testId is required');
            }
            return getTestAnalyticsSummary(testId);
        },
        enabled: Boolean(testId),
    });
};
