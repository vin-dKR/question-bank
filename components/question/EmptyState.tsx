'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';

export default function EmptyState() {
    const { setFilters } = useQuestionBankContext();

    return (
        <div className="p-6 sm:p-8 text-center bg-white rounded-xl shadow-md border border-slate-200">
            <p className="text-red-500 text-base sm:text-lg font-medium">
                No questions found matching your criteria.
            </p>
            <button
                onClick={() => setFilters({})}
                className="mt-3 px-4 py-2 font-semibold text-indigo-600 bg-indigo-50 hover:text-indigo-800 font-medium rounded-lg transition text-sm sm:text-base border cursor-pointer"
            >
                Clear all filters
            </button>
        </div>
    );
}
