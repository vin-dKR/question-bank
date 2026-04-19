'use client';

import { useEffect } from 'react';
import type { DependencyList } from 'react';

/**
 * useAbortableEffect
 *
 * A thin wrapper around `useEffect` that manages an `AbortController` for you.
 *
 * Behaviour:
 *   - Creates a fresh `AbortController` on every effect invocation.
 *   - Invokes the user-supplied effect with the controller's `signal`.
 *   - Aborts the controller on cleanup (unmount or deps change) so any in-flight
 *     async work listening to the signal can bail out.
 *   - Swallows `AbortError` rejections so callers don't have to try/catch it.
 *
 * Important caveat for server actions:
 *   Next.js server actions *cannot* be aborted server-side from a client
 *   `AbortController`. The action will run to completion on the server
 *   regardless. The abort here only stops the *client* from reacting to a stale
 *   response (no `setState` after unmount / dep change). That alone is enough
 *   to fix the user-visible "blocked nav" symptom where the old page's fetch
 *   finishes and stomps state on the new page.
 *
 * For fetches that DO honour signals (fetch(), axios with AbortController,
 * MongoDB drivers, etc.) the signal is forwarded and cancellation is real.
 *
 * Phase 2 — see REFACTOR_PLAN §4 Phase 2 (B1–B7).
 */
export function useAbortableEffect(
    effect: (signal: AbortSignal) => Promise<void> | void,
    deps: DependencyList
): void {
    // The deps array is owned by the caller; we forward it to useEffect as-is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const controller = new AbortController();

        // Kick off the effect. If it returns a promise, silently swallow
        // AbortError so callers don't have to wrap every effect body in a
        // try/catch just to ignore the cancellation case.
        const maybePromise = effect(controller.signal);
        if (maybePromise && typeof (maybePromise as Promise<void>).catch === 'function') {
            (maybePromise as Promise<void>).catch((err: unknown) => {
                if (isAbortError(err)) return;
                // Re-throw non-abort errors as an unhandled rejection so they
                // surface in the console / error boundaries. We intentionally
                // do not re-throw synchronously — this keeps parity with how
                // `useEffect` ignores returned promise rejections today.
                queueMicrotask(() => {
                    throw err;
                });
            });
        }

        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

function isAbortError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const name = (err as { name?: unknown }).name;
    if (name === 'AbortError') return true;
    // DOMException-like objects from fetch()
    const code = (err as { code?: unknown }).code;
    if (code === 20 /* DOMException.ABORT_ERR */) return true;
    return false;
}

export default useAbortableEffect;
