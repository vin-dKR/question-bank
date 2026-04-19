/**
 * Web Vitals reporter.
 *
 * Phase 0 of the perf refactor (see `docs/perf-baseline.md`). This module
 * subscribes to the Core Web Vitals (CLS, INP, LCP, FCP, TTFB) and forwards
 * each metric to one of two sinks depending on `NODE_ENV`:
 *
 *  - dev: `console.log` so engineers see numbers in their browser devtools.
 *  - prod: a stub `navigator.sendBeacon(...)` placeholder that POSTs to
 *    `/api/perf/web-vitals`. That route does NOT exist yet — Phase 0 only
 *    wires the client side. See the `// TODO` below.
 *
 * Wired from `components/perf/WebVitalsReporter.tsx`, mounted once in
 * `app/layout.tsx`. Never import this file directly from a server component.
 */

import type { Metric } from 'web-vitals';

// TODO(perf-phase-0): create `app/api/perf/web-vitals/route.ts` that ingests
// these payloads (validate, attach userId/route, persist to a perf store /
// forward to an analytics provider). Until then `sendBeacon` will simply
// POST into the void and silently fail — that is intentional for the
// baseline phase; we do not want to block shipping the reporter on having
// the backend ready.
const VITALS_ENDPOINT = '/api/perf/web-vitals';

type ReportableMetric = Pick<
    Metric,
    'name' | 'value' | 'rating' | 'delta' | 'id' | 'navigationType'
>;

function toPayload(metric: Metric): ReportableMetric & { path: string } {
    return {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
    };
}

function reportMetric(metric: Metric): void {
    if (process.env.NODE_ENV !== 'production') {
        // Keep this readable in the browser console; one line per metric.
        // eslint-disable-next-line no-console
        console.log(
            `[web-vitals] ${metric.name} = ${metric.value.toFixed(2)} (${metric.rating})`,
            metric,
        );
        return;
    }

    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
        return;
    }

    try {
        const body = JSON.stringify(toPayload(metric));
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(VITALS_ENDPOINT, blob);
    } catch {
        // Swallow — perf reporting must never break the page.
    }
}

/**
 * Subscribe to all Core Web Vitals. Safe to call multiple times; web-vitals'
 * `onCLS / onINP / ...` register a single listener internally per metric.
 *
 * Dynamically imports `web-vitals` so it is excluded from the initial JS
 * payload of every route — only runs once the reporter component mounts on
 * the client.
 */
export async function subscribeWebVitals(): Promise<void> {
    if (typeof window === 'undefined') return;

    const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');

    onCLS(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onFCP(reportMetric);
    onTTFB(reportMetric);
}
