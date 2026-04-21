'use client';

import { memo } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
    showOnlySelected: boolean;
}

const EmptyState = memo(({ showOnlySelected }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-xl border border-black/5 bg-white shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 mb-4">
            <SearchX className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-zinc-900">
            {showOnlySelected ? 'No selected questions' : 'No questions found'}
        </p>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs text-center">
            {showOnlySelected
                ? 'Select some questions from the list first.'
                : 'Try adjusting your filters or search terms.'}
        </p>
    </div>
));

EmptyState.displayName = 'EmptyState';

export default EmptyState;
