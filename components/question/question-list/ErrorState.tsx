'use client';

import { memo } from 'react';

interface ErrorStateProps {
    error: string;
}

const ErrorState = memo(({ error }: ErrorStateProps) => (
    <div className="text-center py-6">
        <p className="text-red-600">{error}</p>
    </div>
));

ErrorState.displayName = 'ErrorState';

export default ErrorState;
