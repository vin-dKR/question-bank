'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';

export default function PaginationControls() {
    const { count, pagination, setPagination } = useQuestionBankContext();

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-6 rounded-lg shadow-md border border-slate-200">
            <div className="text-sm text-slate-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, count)} of {count} questions
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className={`px-4 py-2 border border-slate-200 rounded-md text-slate-700 text-sm sm:text-base ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
                        } transition`}
                >
                    Previous
                </button>
                <button
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page * pagination.limit >= count}
                    className={`px-4 py-2 border border-slate-200 rounded-md text-slate-700 text-sm sm:text-base ${pagination.page * pagination.limit >= count ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
                        } transition`}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
