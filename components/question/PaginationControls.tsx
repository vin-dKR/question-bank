'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';

export default function PaginationControls() {
    const { totalCount, pagination, setPagination, hasMore } = useQuestionBankContext();
    console.log("tis pagin", pagination)

    const handlePrevious = () => {
        if (pagination.page > 1) {
            setPagination({ ...pagination, page: pagination.page - 1 });
        }
    };

    const handleNext = () => {
        if (pagination.page * pagination.limit < totalCount) {
            setPagination({ ...pagination, page: pagination.page + 1 });
        }
    };

    const loadMore = () => {
        setPagination({ ...pagination, limit: pagination.limit + 100 });
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-xl shadow-md border border-slate-200">
            <div className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} questions
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={handlePrevious}
                    disabled={pagination.page === 1}
                    className={`px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm sm:text-base ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
                        } transition`}
                >
                    Previous
                </button>
                <button
                    onClick={handleNext}
                    disabled={pagination.page * pagination.limit >= totalCount}
                    className={`px-4 py-2 border border-slate-200 rounded-lg text-slate-700 text-sm sm:text-base ${pagination.page * pagination.limit >= totalCount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
                        } transition`}
                >
                    Next
                </button>
                {hasMore && (
                    <button
                        onClick={loadMore}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm sm:text-base hover:bg-indigo-700 transition cursor-pointer"
                    >
                        Load More
                    </button>
                )}
            </div>
        </div>
    );
}
