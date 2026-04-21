'use client';

import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingState = memo(() => (
    <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-black/5 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
            </div>
        ))}
    </div>
));

LoadingState.displayName = 'LoadingState';

export default LoadingState;
