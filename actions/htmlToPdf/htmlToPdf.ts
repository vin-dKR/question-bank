"use server"
import puppeteer from "puppeteer"

interface HtmlTopdfBlobReturn {
    data: Uint8Array | null,
    error: boolean
    errorMessage?: string
}

export const htmlTopdfBlob = async (html: string): Promise<HtmlTopdfBlobReturn> => {

    try {
        if (!html) return {
            data: null,
            error: true,
            errorMessage: "invalid html"
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process",
                "--disable-gpu",
            ],
        })

        const page = await browser.newPage()

        await page.setContent(html, {
            waitUntil: "networkidle0",
        })

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: false,
            printBackground: true,
            margin: {
                top: "20px",
                right: "20px",
                bottom: "20px",
                left: "20px",
            },
        })

        await browser.close()

        if (pdfBuffer) {
            return {
                data: pdfBuffer,
                error: false,
            };
        } else {
            return {
                data: null,
                error: true,
                errorMessage: "something broke up-------------------"
            };
        }

    } catch (e) {
        console.log("this is a message from catch and it says you have skill issues")
        return {
            data: null,
            error: true,
            errorMessage: "its got cathch"
        }


    }
}
