"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { supabaseServer, SUPABASE_IMAGE_BUCKET } from "@/lib/supabase";

export type SaveExtractedInput = {
    question_number: number;
    question_text: string;
    options: string[];
    diagram_data_url: string | null;
};

export type SavedExtractedQuestion = {
    id: string;
    question_number: number;
    question_text: string;
    options: string[];
    question_image: string | null;
    answer: string;
    marks: number;
};

export type SaveExtractedResult =
    | { success: true; questions: SavedExtractedQuestion[] }
    | { success: false; error: string };

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const buffer = Buffer.from(match[2], "base64");
    return { mime, buffer };
}

async function uploadDiagram(
    dataUrl: string,
    fileName: string,
): Promise<string | null> {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
        console.warn(`[school-test][upload] SKIP ${fileName} — data URL did not match data:<mime>;base64,<data>`);
        return null;
    }

    const sizeKb = (parsed.buffer.byteLength / 1024).toFixed(1);
    console.log(
        `[school-test][upload] → bucket="${SUPABASE_IMAGE_BUCKET}" path="${fileName}" ` +
        `mime=${parsed.mime} size=${sizeKb}KB`,
    );

    const supabase = supabaseServer();
    const { data: uploadData, error } = await supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .upload(fileName, parsed.buffer, {
            contentType: parsed.mime,
            cacheControl: "3600",
            upsert: true,
        });
    if (error) {
        console.error(
            `[school-test][upload] FAILED path="${fileName}":`,
            error,
        );
        return null;
    }

    const { data } = supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(fileName);
    console.log(
        `[school-test][upload] OK path="${uploadData?.path ?? fileName}" url=${data.publicUrl}`,
    );
    return data.publicUrl;
}

/**
 * Persist a batch of verifier-edited questions to MongoDB via Prisma.
 * Diagrams (base64 data URLs from the verifier) are uploaded to the Supabase
 * `images` bucket and their public URLs are stored on Question.question_image.
 * Upload failures don't block the question — it's saved without an image.
 */
export async function saveExtractedQuestions(
    input: SaveExtractedInput[],
): Promise<SaveExtractedResult> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "Not signed in." };
    }
    if (!Array.isArray(input) || input.length === 0) {
        return { success: false, error: "Nothing to save." };
    }

    try {
        const batchId = Date.now();
        const saved: SavedExtractedQuestion[] = [];
        const withDiagrams = input.filter((q) => q.diagram_data_url).length;
        console.log(
            `[school-test] saving ${input.length} question${input.length === 1 ? "" : "s"} ` +
            `(${withDiagrams} with attached diagram${withDiagrams === 1 ? "" : "s"}) ` +
            `— bucket="${SUPABASE_IMAGE_BUCKET}"`,
        );

        let uploadOk = 0;
        let uploadFail = 0;
        let uploadSkipped = 0;

        for (let i = 0; i < input.length; i++) {
            const q = input[i];
            let imageUrl: string | null = null;

            if (q.diagram_data_url) {
                const rand = Math.random().toString(36).slice(2, 8);
                const fileName = `school-test/${batchId}-q${q.question_number}-${i}-${rand}.png`;
                imageUrl = await uploadDiagram(q.diagram_data_url, fileName);
                if (imageUrl) uploadOk++;
                else uploadFail++;
            } else {
                uploadSkipped++;
                console.log(
                    `[school-test][upload] — question #${q.question_number} has no diagram, skipping upload`,
                );
            }

            const created = await prisma.question.create({
                data: {
                    question_number: q.question_number,
                    question_text: q.question_text,
                    options: q.options,
                    option_images: [],
                    isQuestionImage: Boolean(imageUrl),
                    question_image: imageUrl,
                    isOptionImage: false,
                    answer: null,
                    flagged: false,
                },
            });

            saved.push({
                id: created.id,
                question_number: created.question_number,
                question_text: created.question_text,
                options: created.options,
                question_image: created.question_image ?? null,
                answer: created.answer ?? "",
                marks: 1,
            });
        }

        console.log(
            `[school-test] done — saved ${saved.length} Question row${saved.length === 1 ? "" : "s"}, ` +
            `uploads: ok=${uploadOk} fail=${uploadFail} skipped=${uploadSkipped}`,
        );
        return { success: true, questions: saved };
    } catch (e) {
        console.error("[school-test] saveExtractedQuestions failed:", e);
        return { success: false, error: (e as Error).message || "Failed to save questions." };
    }
}
