import { callGeminiVision } from "./gemini";
import { callVision, parseJsonLoose } from "./openai";
import { detectorPrompt } from "./prompts";
import type { Detection, Provider } from "./types";

type RawDetection = {
    q_no: number;
    has_image: boolean;
    bbox: [number, number, number, number] | number[] | null;
};

/**
 * Run the diagram-detection vision call on a page image and return validated
 * detections with bboxes clamped to the image bounds.
 *
 * The detector prompt is byte-identical across the two upstream Python
 * projects, so swapping providers is purely a backend call difference.
 */
export async function detectDiagrams(
    pagePng: Buffer,
    width: number,
    height: number,
    provider: Provider = "openai",
): Promise<Detection[]> {
    const prompt = detectorPrompt(width, height, provider);
    const text =
        provider === "gemini"
            ? await callGeminiVision(pagePng, prompt)
            : await callVision(pagePng, prompt, "gpt-5.4");
    let raw: RawDetection[];
    try {
        raw = parseJsonLoose<RawDetection[]>(text);
    } catch {
        return [];
    }
    if (!Array.isArray(raw)) return [];

    const out: Detection[] = [];
    for (const item of raw) {
        if (typeof item?.q_no !== "number") continue;

        if (!item.has_image || !item.bbox || !Array.isArray(item.bbox) || item.bbox.length !== 4) {
            out.push({ q_no: item.q_no, has_image: false, bbox: null });
            continue;
        }

        const [rawX, rawY, rawW, rawH] = item.bbox.map((n) => Math.round(Number(n)));
        const x = Math.max(0, Math.min(width - 1, rawX));
        const y = Math.max(0, Math.min(height - 1, rawY));
        const w = Math.max(10, Math.min(width - x, rawW));
        const h = Math.max(10, Math.min(height - y, rawH));

        out.push({ q_no: item.q_no, has_image: true, bbox: [x, y, w, h] });
    }
    return out;
}
