"use server"
import type { Browser, Page } from "puppeteer-core";
import { closeBrowser, getBrowser } from "@/lib/pdf/browserSingleton";

interface HtmlTopdfBlobReturn {
    data: Uint8Array | null;
    error: boolean;
    errorMessage?: string;
}

const isDisconnectError = (err: unknown): boolean => {
    if (!err) return false;
    const msg = err instanceof Error ? err.message : String(err);
    return /disconnected|Target closed|Connection closed|Protocol error/i.test(msg);
};

/**
 * SSRF guard. This browser renders caller-supplied HTML, so an attacker could
 * embed <img src="http://169.254.169.254/…"> or an internal URL to reach cloud
 * metadata / internal services and exfiltrate the response into the PDF.
 *
 * We block requests to loopback, link-local/metadata, and RFC-1918 private
 * ranges (plus non-web schemes like file:), while still allowing PUBLIC hosts
 * so legitimate remote images/fonts/CSS keep rendering. Combined with the auth
 * requirement on the route, this closes the anonymous-SSRF hole.
 */
const isBlockedPdfHost = (host: string): boolean => {
    const h = host.toLowerCase().replace(/^\[|\]$/g, ''); // strip IPv6 brackets
    if (h === 'localhost' || h === '0.0.0.0' || h === '::1' || h === '::') return true;
    if (h === '169.254.169.254' || h.endsWith('.internal') || h.endsWith('.local')) return true;
    if (/^127\./.test(h)) return true;                       // loopback
    if (/^10\./.test(h)) return true;                        // private A
    if (/^192\.168\./.test(h)) return true;                  // private C
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;   // private B
    if (/^169\.254\./.test(h)) return true;                  // link-local
    if (/^(fc|fd)[0-9a-f]{2}:/.test(h)) return true;         // IPv6 ULA
    if (/^fe80:/.test(h)) return true;                       // IPv6 link-local
    return false;
};

const guardPageAgainstSsrf = async (page: Page): Promise<void> => {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        try {
            const url = req.url();
            // Inlined content is always safe — this is how setContent injects.
            if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) {
                return req.continue();
            }
            let parsed: URL;
            try {
                parsed = new URL(url);
            } catch {
                return req.abort();
            }
            // Only http/https may leave the page; block file:, ftp:, etc.
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return req.abort();
            }
            if (isBlockedPdfHost(parsed.hostname)) {
                return req.abort();
            }
            return req.continue();
        } catch {
            // If anything about the request is unparseable, fail closed.
            try { return req.abort(); } catch { /* already handled */ }
        }
    });
};

const acquireBrowser = async (): Promise<Browser> => {
    try {
        return await getBrowser();
    } catch (err) {
        if (!isDisconnectError(err)) throw err;
        await closeBrowser();
        return await getBrowser();
    }
};

export const htmlTopdfBlob = async (html: string): Promise<HtmlTopdfBlobReturn> => {
    try {
        if (!html) {
            return {
                data: null,
                error: true,
                errorMessage: "Invalid HTML"
            };
        }

        let browser = await acquireBrowser();
        let page: Page;
        try {
            page = await browser.newPage();
        } catch (err) {
            if (!isDisconnectError(err)) throw err;
            // Stale singleton — drop it and retry exactly once.
            await closeBrowser();
            browser = await getBrowser();
            page = await browser.newPage();
        }

        try {
            await guardPageAgainstSsrf(page);
            await page.setContent(html, { waitUntil: "networkidle0" });

            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
            });

            return {
                data: pdfBuffer,
                error: false
            };
        } finally {
            // CRITICAL: only close the page, not the browser. Closing the
            // browser would defeat the singleton in lib/pdf/browserSingleton.ts.
            try {
                await page.close();
            } catch (closeErr) {
                console.warn("Failed to close puppeteer page:", closeErr);
            }
        }
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
        console.error('Error generating PDF:', errorMessage);
        throw new Error(`Failed to generate PDF: ${errorMessage}`);
    }
};
