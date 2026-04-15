import sharp from "sharp";
import { detectDiagrams } from "./detect";
import { extractQuestions } from "./extract";
import { cropDetections } from "./crop";
import { rasterizePdf } from "./pdf";
import type { PageResult, ProcessEvent, Provider } from "./types";

type PageImage = {
    pageNumber: number;
    buffer: Buffer;
    width: number;
    height: number;
};

async function pageImagesFromInput(
    fileBuffer: Buffer,
    mime: string,
): Promise<PageImage[]> {
    if (mime === "application/pdf") {
        const pages = await rasterizePdf(fileBuffer);
        return pages.map((p, i) => ({
            pageNumber: i + 1,
            buffer: p.buffer,
            width: p.width,
            height: p.height,
        }));
    }

    // Image upload — apply EXIF orientation so all downstream consumers (the
    // vision model, sharp.extract, and the browser-side verifier) agree on the
    // pixel layout. Without .rotate(), a phone-taken JPEG with an orientation
    // tag ends up raw-pixel in sharp but auto-rotated in the model, so bbox
    // coordinates get misaligned and crops point at the wrong region.
    const pngBuffer = await sharp(fileBuffer).rotate().png().toBuffer();
    const meta = await sharp(pngBuffer).metadata();
    return [{
        pageNumber: 1,
        buffer: pngBuffer,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
    }];
}

function bufferToDataUrl(buf: Buffer): string {
    return `data:image/png;base64,${buf.toString("base64")}`;
}

/**
 * Run the full pipeline and yield ProcessEvents in order.
 * Pages are processed sequentially so the UI timeline reads naturally and so
 * we don't hit OpenAI rate limits on long PDFs. If needed, bump concurrency later.
 */
export async function* runPipeline(
    fileBuffer: Buffer,
    mime: string,
    provider: Provider = "openai",
): AsyncGenerator<ProcessEvent> {
    let pages: PageImage[];
    try {
        pages = await pageImagesFromInput(fileBuffer, mime);
    } catch (e) {
        yield { type: "error", message: `Failed to read input: ${(e as Error).message}` };
        return;
    }

    yield { type: "page-count", total: pages.length };

    for (const page of pages) {
        yield { type: "page-start", page: page.pageNumber };

        try {
            const detections = await detectDiagrams(page.buffer, page.width, page.height, provider);
            yield {
                type: "page-detected",
                page: page.pageNumber,
                detectionCount: detections.filter((d) => d.has_image).length,
            };

            const questions = await extractQuestions(page.buffer, page.pageNumber);
            yield {
                type: "page-extracted",
                page: page.pageNumber,
                questionCount: questions.length,
            };

            const crops = await cropDetections(
                page.buffer,
                page.width,
                page.height,
                detections,
                page.pageNumber,
            );

            const result: PageResult = {
                pageNumber: page.pageNumber,
                sourceDataUrl: bufferToDataUrl(page.buffer),
                sourceWidth: page.width,
                sourceHeight: page.height,
                questions,
                crops,
            };
            yield { type: "page-done", page: page.pageNumber, result };
        } catch (e) {
            const err = e as Error;
            console.error(`[school-test] page ${page.pageNumber} failed:`, err);
            yield {
                type: "error",
                page: page.pageNumber,
                message: `Page ${page.pageNumber}: ${err.message || String(err)}`,
            };
        }
    }

    yield { type: "complete" };
}
