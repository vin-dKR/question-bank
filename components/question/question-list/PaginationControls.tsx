'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
    pagination: Pagination
    currentPage: number;
    limit: number;
    totalCount: number;
    hasMore: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onLoadMore: () => void;
    showOnlySelected: boolean;
}

const PaginationControls = memo(
    ({ currentPage, limit, pagination, totalCount, hasMore, onPrevious, onNext, onLoadMore }: PaginationControlsProps) => (
        <div className="flex justify-between items-center mt-4">
            <Button
                onClick={onPrevious}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Previous
            </Button>
            <span className="text-sm text-slate-600">
                Page {currentPage} of {Math.ceil(totalCount / limit)}
            </span>
            <div className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} questions
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={onNext}
                    disabled={currentPage * limit >= totalCount}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </Button>
                {hasMore && (
                    <Button
                        onClick={onLoadMore}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Load More
                    </Button>
                )}
            </div>
        </div>
    )
);

PaginationControls.displayName = 'PaginationControls';

export default PaginationControls;
