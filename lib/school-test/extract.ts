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
    const text = await callVision(pagePng, extractionPrompt());
    let parsed: RawExtraction;
    try {
        parsed = parseJsonLoose<RawExtraction>(text);
    } catch {
        return [];
    }

    const items = Array.isArray(parsed?.questions) ? parsed.questions : [];
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
