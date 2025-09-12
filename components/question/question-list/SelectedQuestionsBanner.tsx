'use client';

import { memo } from 'react';

interface SelectedQuestionsBannerProps {
    displayedCount: number;
    totalCount: number;
}

const SelectedQuestionsBanner = memo(({ displayedCount, totalCount }: SelectedQuestionsBannerProps) => (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 text-sm">
            Showing {displayedCount} of {totalCount} selected questions
        </p>
    </div>
));

SelectedQuestionsBanner.displayName = 'SelectedQuestionsBanner';

export default SelectedQuestionsBanner;
