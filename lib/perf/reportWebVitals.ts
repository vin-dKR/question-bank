/**
 * Web Vitals reporter.
 *
 * Phase 0 of the perf refactor (see `docs/perf-baseline.md`). This module
 * subscribes to the Core Web Vitals (CLS, INP, LCP, FCP, TTFB) and forwards
 * each metric to one of two sinks depending on `NODE_ENV`:
 *
 *  - dev: `console.log` so engineers see numbers in their browser devtools.
 *  - prod: `navigator.sendBeacon(...)` to the endpoint named by
 *    `NEXT_PUBLIC_WEB_VITALS_ENDPOINT`. UNSET BY DEFAULT, and nothing is sent
 *    while it is unset. See the note on the constant below.
 *
 * Wired from `components/perf/WebVitalsReporter.tsx`, mounted once in
 * `app/layout.tsx`. Never import this file directly from a server component.
 */

import type { Metric } from 'web-vitals';

/**
 * Where to send metrics. Empty means DON'T.
 *
 * This used to be a hardcoded `/api/perf/web-vitals`, on the reasoning that
 * beaconing into the void was harmless until the route existed. It was not
 * harmless: `sendBeacon` fires on every metric, so real users' consoles filled
 * with `404 (Not Found)` on every page load, and someone reported it as a bug.
 * A silent failure in one layer is noise in another.
 *
 * TODO(perf-phase-0): build the ingest route, then set this env var to switch
 * reporting on. It is a public unauthenticated POST by nature, so it needs a
 * payload cap and rate limiting before it goes live — see docs/API_SECURITY.md.
 */
const VITALS_ENDPOINT = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT?.trim() ?? '';

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

    // No sink configured: drop it. Sending to a route that does not exist buys
    // nothing and costs every user a console error per metric, five per load.
    if (!VITALS_ENDPOINT) return;

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
