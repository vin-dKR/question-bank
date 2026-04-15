import { createCanvas, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";

export type RasterizedPage = {
    buffer: Buffer;
    width: number;
    height: number;
};

/**
 * Rasterize every page of a PDF to PNG buffers using pdfjs-dist + @napi-rs/canvas.
 * DPI defaults to 200 — plenty for GPT-4o vision without blowing up memory for long PDFs.
 *
 * We dynamic-import the legacy build so Next.js does not try to bundle pdfjs into edge
 * runtimes. The route that calls this must pin `runtime = "nodejs"`.
 */
export async function rasterizePdf(pdfBuffer: Buffer, dpi = 200): Promise<RasterizedPage[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // pdfjs v5 supports Node natively; no worker needed when using the legacy build.

    const data = new Uint8Array(pdfBuffer);
    const doc = await pdfjs.getDocument({
        data,
        useSystemFonts: true,
        disableFontFace: true,
        isEvalSupported: false,
    }).promise;

    const scale = dpi / 72;
    const pages: RasterizedPage[] = [];

    try {
        for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const viewport = page.getViewport({ scale });
            const width = Math.ceil(viewport.width);
            const height = Math.ceil(viewport.height);

            const canvas: Canvas = createCanvas(width, height);
            const context: SKRSContext2D = canvas.getContext("2d");

            // pdfjs v5 accepts `canvas` alongside `canvasContext`; v4 ignores it.
            await page.render({
                canvasContext: context,
                viewport,
                canvas,
            }).promise;

            pages.push({
                buffer: canvas.toBuffer("image/png"),
                width,
                height,
            });

            page.cleanup();
        }
    } finally {
        await doc.destroy();
    }

    return pages;
}
