import { callVision, parseJsonLoose } from "./openai";
import { extractionPrompt } from "./prompts";
import type { QuestionDraft } from "./types";

type RawExtraction = {
    questions?: Array<{
        question_number?: number | string;
        question_text?: string;
        options?: unknown;
    }>;
};

function coerceOptions(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((v) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : ""))
        .filter((s) => s.trim().length > 0);
}

export async function extractQuestions(pagePng: Buffer, pageNumber: number): Promise<QuestionDraft[]> {
    // jsonMode=true → OpenAI JSON mode. Forces a valid JSON object back and
    // escapes backslashes correctly, which is critical because the model loves
    // to emit raw LaTeX like `\(`, `\,` inside strings.
    const text = await callVision(pagePng, extractionPrompt(), undefined, true);
    let parsed: RawExtraction;
    try {
        parsed = parseJsonLoose<RawExtraction>(text);
    } catch (e) {
        console.warn(
            `[school-test] page ${pageNumber}: JSON parse failed (${(e as Error).message}). Raw model response:\n` +
            text.slice(0, 800),
        );
        return [];
    }

    const items = Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (items.length === 0) {
        console.warn(
            `[school-test] page ${pageNumber}: model returned 0 questions. Raw response:\n` +
            text.slice(0, 800),
        );
    }

    const out: QuestionDraft[] = [];
    for (let i = 0; i < items.length; i++) {
        const q = items[i];
        const number = typeof q.question_number === "number"
            ? q.question_number
            : Number(q.question_number ?? i + 1) || i + 1;
        const questionText = typeof q.question_text === "string" ? q.question_text : "";
        out.push({
            id: `p${pageNumber}-q${number}-${i}`,
            question_number: number,
            question_text: questionText,
            options: coerceOptions(q.options),
        });
    }
    return out;
}
