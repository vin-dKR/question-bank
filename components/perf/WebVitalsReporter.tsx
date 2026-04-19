'use client';

import { useEffect } from 'react';

import { subscribeWebVitals } from '@/lib/perf/reportWebVitals';

/**
 * Mounts the web-vitals subscriber once on the client. Renders nothing.
 *
 * Kept as a tiny client island so the rest of the root layout can stay on
 * the server tree (see Phase 1 of the refactor plan — no layouts go
 * `"use client"`).
 */
export default function WebVitalsReporter(): null {
    useEffect(() => {
        void subscribeWebVitals();
    }, []);

    return null;
}
