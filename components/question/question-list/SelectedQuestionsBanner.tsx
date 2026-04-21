'use client';

import { memo } from 'react';
import { CheckCheck } from 'lucide-react';

interface SelectedQuestionsBannerProps {
    displayedCount: number;
    totalCount: number;
}

const SelectedQuestionsBanner = memo(({ displayedCount, totalCount }: SelectedQuestionsBannerProps) => (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
        <CheckCheck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
        <p className="text-xs text-indigo-900">
            Showing <span className="font-semibold">{displayedCount}</span> of {totalCount} selected questions
        </p>
    </div>
));

SelectedQuestionsBanner.displayName = 'SelectedQuestionsBanner';

export default SelectedQuestionsBanner;
