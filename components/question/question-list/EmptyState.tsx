'use client';

import { memo } from 'react';

interface EmptyStateProps {
    showOnlySelected: boolean;
}

const EmptyState = memo(({ showOnlySelected }: EmptyStateProps) => (
    <div className="text-center py-6">
        <p className="text-slate-600">
            {showOnlySelected ? 'No selected questions found. Select some questions first.' : 'No questions found matching your criteria.'}
        </p>
    </div>
));

EmptyState.displayName = 'EmptyState';

export default EmptyState;
