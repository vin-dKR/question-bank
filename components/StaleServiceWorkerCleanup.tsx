"use client";

import { useEffect } from "react";

/**
 * Unregisters service workers left over from previous versions of the site.
 *
 * WHY THIS EXISTS. A service worker registered at scope "/" can satisfy a
 * navigation entirely from its own cache — the request never reaches the
 * server. A stale one (`media-cache-sw.js`, which no longer exists in this
 * codebase and is referenced nowhere) was serving the OLD Clerk sign-in and
 * sign-up pages after the WorkOS cutover.
 *
 * That is worse than a cosmetic bug: those pages post to Clerk endpoints that
 * are gone, so a returning user sees a login form that simply cannot work, with
 * nothing to indicate why. The server is behaving perfectly and returning a
 * redirect to AuthKit; the browser just never asks.
 *
 * This app registers no service workers at all, so unregistering everything is
 * safe and unconditional. If one is ever added deliberately, narrow this to
 * match only the stale script name.
 *
 * Removable once returning users have had time to pick it up — the visitors who
 * still hold the old worker are exactly the ones who need it.
 */
export default function StaleServiceWorkerCleanup() {
    useEffect(() => {
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

        let cancelled = false;

        (async () => {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (cancelled || registrations.length === 0) return;

                await Promise.all(registrations.map((r) => r.unregister()));

                // Unregistering stops it intercepting future requests, but its
                // Cache Storage entries survive and would still be served by
                // anything that reads them. Clear those too.
                if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }

                // The page currently on screen may itself have come from that
                // cache, so reload once to get the real thing. The flag keeps
                // this to a single reload per tab.
                if (!sessionStorage.getItem("sw-cleanup-reloaded")) {
                    sessionStorage.setItem("sw-cleanup-reloaded", "1");
                    window.location.reload();
                }
            } catch {
                // Storage or SW access can throw in private windows and some
                // embedded contexts. Never let cleanup break the page.
            }
        })();

        return () => { cancelled = true; };
    }, []);

    return null;
}
