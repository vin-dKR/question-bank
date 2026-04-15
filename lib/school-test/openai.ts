import OpenAI from "openai";

let cached: OpenAI | null = null;

function client(): OpenAI {
    if (cached) return cached;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set in the environment");
    }
    cached = new OpenAI({ apiKey });
    return cached;
}

/**
 * Default model — used by the extractor path, which matches
 * question-extractor-tool/backend/app/services/openai_service.py (gpt-4o).
 * The detector path overrides this with "gpt-5.4" to match
 * image-auto-cropper/backend/services/openai_detector.py.
 */
const DEFAULT_MODEL = "gpt-4o";

/**
 * Send a single-image vision request and return the raw text response.
 * Matches the Python call signature byte-for-byte: temperature 0.1,
 * image detail "high", max_completion_tokens 4096.
 */
export async function callVision(
    imagePngBuffer: Buffer,
    prompt: string,
    model: string = DEFAULT_MODEL,
): Promise<string> {
    const dataUrl = `data:image/png;base64,${imagePngBuffer.toString("base64")}`;
    const res = await client().chat.completions.create({
        model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
                ],
            },
        ],
        max_completion_tokens: 4096,
        temperature: 0.1,
    });
    return res.choices[0]?.message?.content ?? "";
}

/**
 * Parse JSON that may be wrapped in ```json fences or contain prose.
 * Both upstream Python parsers tolerate markdown, so we do the same.
 */
export function parseJsonLoose<T>(text: string): T {
    const trimmed = text.trim();

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
        return JSON.parse(fenced[1].trim()) as T;
    }

    try {
        return JSON.parse(trimmed) as T;
    } catch {
        // Fall back to the first balanced JSON array or object in the string.
        const firstArr = trimmed.indexOf("[");
        const firstObj = trimmed.indexOf("{");
        const start =
            firstArr === -1 ? firstObj :
                firstObj === -1 ? firstArr :
                    Math.min(firstArr, firstObj);
        if (start === -1) throw new Error("No JSON found in model response");
        const open = trimmed[start];
        const close = open === "[" ? "]" : "}";
        const end = trimmed.lastIndexOf(close);
        if (end === -1 || end <= start) throw new Error("Unbalanced JSON in model response");
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
}
