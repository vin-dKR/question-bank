// Puppeteer browser singleton (Phase 9 of REFACTOR_PLAN.md).
//
// On long-running Node servers (e.g. `next start` on a container), this
// singleton reuses a single Chromium across every PDF generation, dropping
// second-and-later runs from ~4 s to ~600 ms.
//
// On serverless platforms (Vercel / Netlify functions), each cold invocation
// gets its own process, so the singleton only helps within a single warm
// lambda's lifetime — across cold starts the savings are zero. That is the
// known trade-off; a dedicated PDF worker (Phase 11 option) would close the
// gap. Do NOT call `browser.close()` from PDF callers — close the page only.
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import type { Browser } from "puppeteer-core";

let browserPromise: Promise<Browser> | null = null;
let signalsRegistered = false;

const launchBrowser = async (): Promise<Browser> => {
    const executablePath = await chromium.executablePath();
    // Options must match the original per-call launch in
    // actions/htmlToPdf/htmlToPdf.ts so PDF output is byte-identical.
    // (@sparticuz/chromium does not expose `headless` / `defaultViewport`
    // on its public surface; original code passed only args + executablePath.)
    const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
    });

    // If Chromium dies (crash, OOM, manual kill), drop the cached promise so
    // the next caller re-launches instead of getting a stale handle.
    browser.on("disconnected", () => {
        browserPromise = null;
    });

    return browser;
};

export const getBrowser = (): Promise<Browser> => {
    if (!browserPromise) {
        browserPromise = launchBrowser().catch((err) => {
            // Reset on launch failure so the next call retries cleanly.
            browserPromise = null;
            throw err;
        });
    }
    return browserPromise;
};

export const closeBrowser = async (): Promise<void> => {
    const current = browserPromise;
    browserPromise = null;
    if (!current) return;
    try {
        const browser = await current;
        await browser.close();
    } catch (err) {
        console.warn("[browserSingleton] error closing browser:", err);
    }
};

// Register process-level cleanup once. Guarded so HMR / re-imports in dev
// don't stack handlers on the same signal.
const registerShutdownHandlers = () => {
    if (signalsRegistered) return;
    if (typeof process === "undefined" || typeof process.on !== "function") return;
    signalsRegistered = true;

    const shutdown = (signal: NodeJS.Signals) => {
        closeBrowser().finally(() => {
            // Re-raise the default behaviour so the host process can exit.
            process.kill(process.pid, signal);
        });
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
};

registerShutdownHandlers();
