import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { getTestAnalytics } from '@/actions/examination/analytics/getTestAnalytics';

export const useTestAnalytics = (testId: string) => {
    const [analytics, setAnalytics] = useState<TestAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        try {
            const data = await getTestAnalytics(testId);
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [testId]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    return { analytics, loading, refetch: fetchAnalytics };
};
