'use client';

import { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
    error: string;
}

const ErrorState = memo(({ error }: ErrorStateProps) => (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-100 bg-rose-50/50">
        <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-rose-700">{error}</p>
    </div>
));

ErrorState.displayName = 'ErrorState';

export default ErrorState;
