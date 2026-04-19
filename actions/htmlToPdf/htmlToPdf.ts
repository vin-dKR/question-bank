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
