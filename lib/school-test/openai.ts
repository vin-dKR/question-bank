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
const DEFAULT_MODEL = "gpt-5.4";

/**
 * Send a single-image vision request and return the raw text response.
 * Matches the Python call signature byte-for-byte: temperature 0.1,
 * image detail "high", max_completion_tokens 4096.
 */
export async function callVision(
    imagePngBuffer: Buffer,
    prompt: string,
    model: string = DEFAULT_MODEL,
    jsonMode = false,
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
        // JSON mode forces a valid JSON object and handles backslash escaping.
        // Only available on chat-completions models (gpt-4o does; detection's
        // gpt-5.4 and the array output of the detector can't use it).
        ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });
    return res.choices[0]?.message?.content ?? "";
}

/**
 * Models often emit LaTeX with single backslashes inside JSON strings — e.g.
 * `"\( \sqrt{3} \)"` — which is invalid JSON because `\(`, `\ `, `\,` etc.
 * are not valid JSON escape sequences. Double every invalid backslash so the
 * parser treats them as literal backslash-char pairs.
 *
 * Valid JSON escapes after `\`: " \ / b f n r t u
 * Everything else gets promoted to `\\X`.
 */
function fixInvalidBackslashEscapes(text: string): string {
    return text.replace(/\\([^"\\/bfnrtu\n])/g, "\\\\$1");
}

/**
 * Parse JSON that may be wrapped in ```json fences, contain prose, or include
 * raw LaTeX backslashes that aren't valid JSON escapes. Tries each strategy
 * in order and falls through on failure.
 */
export function parseJsonLoose<T>(text: string): T {
    const trimmed = text.trim();

    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidates: string[] = [];
    if (fenced) candidates.push(fenced[1].trim());
    candidates.push(trimmed);

    // Also try slicing from the first { or [ to the last matching bracket.
    const firstArr = trimmed.indexOf("[");
    const firstObj = trimmed.indexOf("{");
    const start =
        firstArr === -1 ? firstObj :
            firstObj === -1 ? firstArr :
                Math.min(firstArr, firstObj);
    if (start !== -1) {
        const open = trimmed[start];
        const close = open === "[" ? "]" : "}";
        const end = trimmed.lastIndexOf(close);
        if (end > start) candidates.push(trimmed.slice(start, end + 1));
    }

    let lastError: unknown = null;
    for (const cand of candidates) {
        try {
            return JSON.parse(cand) as T;
        } catch (e) {
            lastError = e;
            try {
                return JSON.parse(fixInvalidBackslashEscapes(cand)) as T;
            } catch (e2) {
                lastError = e2;
            }
        }
    }

    throw new Error(
        `No valid JSON in model response: ${(lastError as Error)?.message ?? "unknown"}`,
    );
}
