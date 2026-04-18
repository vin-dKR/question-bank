import sharp from "sharp";
import { detectDiagrams } from "./detect";
import { extractQuestions } from "./extract";
import { cropDetections } from "./crop";
import { rasterizePdf } from "./pdf";
import type { Detection, PageResult, ProcessEvent, Provider } from "./types";

type PageImage = {
    pageNumber: number;
    buffer: Buffer;
    width: number;
    height: number;
};

// Downscaled preview of the full-res page. Used for three things:
//   1. The diagram-detection vision call — OpenAI's `detail: "high"` mode tiles
//      images into 512 px squares; a 300 DPI page (~2500 × 3500) spans many
//      tiles and the model loses global spatial context, returning bboxes that
//      swallow question text. A ~1600 px input fits near a single high-detail
//      pass and dramatically tightens the bboxes.
//   2. The question-extraction vision call — 1600 px is ample for OCR and
//      saves tokens.
//   3. The `sourceDataUrl` shipped to the client. The full-res PNG can be 1-3
//      MB per page; streaming 4+ of them exceeds Netlify's 6 MB response cap
//      and truncates the stream mid-way (the "sometimes only 1 page" bug).
//      The preview drops each page to ~300-500 KB, keeping the whole multi-
//      page response well under the limit.
// Server-side auto-cropping still uses the full-res buffer, so crop quality
// is unchanged.
const PREVIEW_MAX_DIM = 1600;

export type PipelineInput = { buffer: Buffer; mime: string };

async function pagesFromSingle(input: PipelineInput): Promise<Omit<PageImage, "pageNumber">[]> {
    if (input.mime === "application/pdf") {
        const pages = await rasterizePdf(input.buffer);
        return pages.map((p) => ({ buffer: p.buffer, width: p.width, height: p.height }));
    }

    // Image upload — apply EXIF orientation so all downstream consumers (the
    // vision model, sharp.extract, and the browser-side verifier) agree on the
    // pixel layout. Without .rotate(), a phone-taken JPEG with an orientation
    // tag ends up raw-pixel in sharp but auto-rotated in the model, so bbox
    // coordinates get misaligned and crops point at the wrong region.
    const pngBuffer = await sharp(input.buffer).rotate().png().toBuffer();
    const meta = await sharp(pngBuffer).metadata();
    return [{
        buffer: pngBuffer,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
    }];
}

async function pageImagesFromInputs(inputs: PipelineInput[]): Promise<PageImage[]> {
    const out: PageImage[] = [];
    let pageNumber = 1;
    for (const input of inputs) {
        const pages = await pagesFromSingle(input);
        for (const p of pages) {
            out.push({ pageNumber: pageNumber++, ...p });
        }
    }
    return out;
}

async function previewImage(
    pagePng: Buffer,
    width: number,
    height: number,
): Promise<{ buffer: Buffer; width: number; height: number; dataUrl: string }> {
    const longest = Math.max(width, height);
    if (longest <= PREVIEW_MAX_DIM) {
        return {
            buffer: pagePng,
            width,
            height,
            dataUrl: `data:image/png;base64,${pagePng.toString("base64")}`,
        };
    }
    const scale = PREVIEW_MAX_DIM / longest;
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const buffer = await sharp(pagePng).resize(w, h, { fit: "fill" }).png().toBuffer();
    return {
        buffer,
        width: w,
        height: h,
        dataUrl: `data:image/png;base64,${buffer.toString("base64")}`,
    };
}

function rescaleDetections(
    detections: Detection[],
    fromW: number,
    fromH: number,
    toW: number,
    toH: number,
): Detection[] {
    if (fromW === toW && fromH === toH) return detections;
    const sx = toW / fromW;
    const sy = toH / fromH;
    return detections.map((d) => {
        if (!d.has_image || !d.bbox) return d;
        const [x, y, w, h] = d.bbox;
        const nx = Math.max(0, Math.min(toW - 1, Math.round(x * sx)));
        const ny = Math.max(0, Math.min(toH - 1, Math.round(y * sy)));
        const nw = Math.max(10, Math.min(toW - nx, Math.round(w * sx)));
        const nh = Math.max(10, Math.min(toH - ny, Math.round(h * sy)));
        return { ...d, bbox: [nx, ny, nw, nh] };
    });
}

function rescaleBbox(
    bbox: [number, number, number, number],
    fromW: number,
    fromH: number,
    toW: number,
    toH: number,
): [number, number, number, number] {
    if (fromW === toW && fromH === toH) return bbox;
    const sx = toW / fromW;
    const sy = toH / fromH;
    const [x, y, w, h] = bbox;
    return [
        Math.max(0, Math.min(toW, Math.round(x * sx))),
        Math.max(0, Math.min(toH, Math.round(y * sy))),
        Math.max(1, Math.min(toW, Math.round(w * sx))),
        Math.max(1, Math.min(toH, Math.round(h * sy))),
    ];
}

/**
 * Run the full pipeline and yield ProcessEvents in order.
 * Pages are processed sequentially so the UI timeline reads naturally and so
 * we don't hit OpenAI rate limits on long PDFs. If needed, bump concurrency later.
 */
export async function* runPipeline(
    inputs: PipelineInput[],
    provider: Provider = "openai",
): AsyncGenerator<ProcessEvent> {
    let pages: PageImage[];
    try {
        pages = await pageImagesFromInputs(inputs);
    } catch (e) {
        yield { type: "error", message: `Failed to read input: ${(e as Error).message}` };
        return;
    }

    yield { type: "page-count", total: pages.length };

    for (const page of pages) {
        yield { type: "page-start", page: page.pageNumber };

        try {
            const preview = await previewImage(page.buffer, page.width, page.height);

            const detectionsPreview = await detectDiagrams(
                preview.buffer,
                preview.width,
                preview.height,
                provider,
            );
            // Scale bboxes up to full-res so server-side cropping operates on
            // the high-DPI buffer and auto-crops stay sharp.
            const detectionsFull = rescaleDetections(
                detectionsPreview,
                preview.width,
                preview.height,
                page.width,
                page.height,
            );
            yield {
                type: "page-detected",
                page: page.pageNumber,
                detectionCount: detectionsFull.filter((d) => d.has_image).length,
            };

            const questions = await extractQuestions(preview.buffer, page.pageNumber);
            yield {
                type: "page-extracted",
                page: page.pageNumber,
                questionCount: questions.length,
            };

            const cropsFull = await cropDetections(
                page.buffer,
                page.width,
                page.height,
                detectionsFull,
                page.pageNumber,
            );
            // Crop image data stays full-res, but the bbox in the response is
            // in preview coords — the Verifier renders overlays as percentages
            // of sourceWidth/Height, which now describe the preview.
            const crops = cropsFull.map((c) => ({
                ...c,
                bbox: rescaleBbox(c.bbox, page.width, page.height, preview.width, preview.height),
            }));

            const result: PageResult = {
                pageNumber: page.pageNumber,
                sourceDataUrl: preview.dataUrl,
                sourceWidth: preview.width,
                sourceHeight: preview.height,
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
