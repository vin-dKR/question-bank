"use server"
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

interface HtmlTopdfBlobReturn {
    data: Uint8Array | null;
    error: boolean;
    errorMessage?: string;
}

export const htmlTopdfBlob = async (html: string): Promise<HtmlTopdfBlobReturn> => {
    try {
        if (!html) {
            return {
                data: null,
                error: true,
                errorMessage: "Invalid HTML"
            };
        }

        const executablePath = await chromium.executablePath();

        const browser = await puppeteer.launch({
            args: chromium.args,
            executablePath,
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" }
        });

        await browser.close();

        return {
            data: pdfBuffer,
            error: false
        };
    } catch (e: any) {
        console.error("Puppeteer error:", e.message || e);
        return {
            data: null,
            error: true,
            errorMessage: e.message || "Failed to generate PDF"
        };
    }
};

