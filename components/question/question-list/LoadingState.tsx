'use client';

import { memo } from 'react';

const LoadingState = memo(() => (
    <div className="text-center py-6">
        <p className="text-slate-600">Loading questions...</p>
    </div>
));

LoadingState.displayName = 'LoadingState';

export default LoadingState;
