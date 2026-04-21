'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { Button } from '@/components/ui/button';

export default function EmptyState() {
    const { setFilters } = useQuestionBankContext();

    return (
        <div className="p-8 text-center rounded-xl shadow-xs border border-black/5 bg-white">
            <p className="text-sm sm:text-base text-zinc-600 font-medium">
                No questions found matching your criteria.
            </p>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilters({})}
                className="mt-4"
            >
                Clear all filters
            </Button>
        </div>
    );
}
