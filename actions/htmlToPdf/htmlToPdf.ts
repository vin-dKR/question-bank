"use server"
import puppeteer from "puppeteer"

interface HtmlTopdfBlobReturn {
    data: Uint8Array | null,
    error: boolean
    errorMessage?: string
}

export const htmlTopdfBlob = async (html: string): Promise<HtmlTopdfBlobReturn> => {

    console.log("1. before try")
    try {
        console.log("2. after try")
        if (!html) return {
            data: null,
            error: true,
            errorMessage: "invalid html"
        }
        console.log("3. html try");

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

        console.log("4. browser okay");
        const page = await browser.newPage()

        console.log("5. page okay");
        await page.setContent(html, {
            waitUntil: "networkidle0",
        })

        console.log("6. network idel okay");
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

        console.log("7. pdfBuffer okay");
        await browser.close()

        console.log("8. close okay");
        if (pdfBuffer) {
            console.log("9. ending okay");
            return {
                data: pdfBuffer,
                error: false,
            };
        } else {
            console.log("10. ending okay");
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
