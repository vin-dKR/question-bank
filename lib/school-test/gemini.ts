import {
    GoogleGenAI,
    createPartFromBase64,
    createPartFromText,
    createUserContent,
} from "@google/genai";

let cached: GoogleGenAI | null = null;

function client(): GoogleGenAI {
    if (cached) return cached;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set in the environment");
    }
    cached = new GoogleGenAI({ apiKey });
    return cached;
}

const MODEL = "gemini-2.0-flash";

/**
 * Send a single-image vision request to Gemini 2.0 Flash and return the raw
 * text response. Matches the Python image-auto-cropper detector setup.
 */
export async function callGeminiVision(imagePngBuffer: Buffer, prompt: string): Promise<string> {
    const base64 = imagePngBuffer.toString("base64");
    const response = await client().models.generateContent({
        model: MODEL,
        contents: createUserContent([
            createPartFromText(prompt),
            createPartFromBase64(base64, "image/png"),
        ]),
    });
    return response.text ?? "";
}
