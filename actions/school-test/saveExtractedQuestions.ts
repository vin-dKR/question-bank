"use server";

import { getAuthContext } from '@/lib/auth/session';
import prisma from "@/lib/prisma";
import { supabaseServer, SUPABASE_IMAGE_BUCKET } from "@/lib/supabase";

export type SaveExtractedPage = {
    pageNumber: number;
    /** data:image/png;base64,… preview PNG for the entire source page */
    baseImageDataUrl: string | null;
    sourceWidth: number;
    sourceHeight: number;
    sourceFileName: string | null;
    questions: SaveExtractedQuestion[];
};

export type SaveExtractedQuestion = {
    question_number: number;
    question_text: string;
    options: string[];
    diagram_data_url: string | null;
    /** [x, y, w, h] in the base-image pixel coord system (preview resolution) */
    crop_bbox: [number, number, number, number] | null;
};

export type SavedExtractedQuestion = {
    id: string;
    question_number: number;
    question_text: string;
    options: string[];
    question_image: string | null;
    answer: string;
    marks: number;
    base_image: string | null;
    crop_bbox: [number, number, number, number] | null;
    source_width: number | null;
    source_height: number | null;
};

export type SaveExtractedResult =
    | { success: true; questions: SavedExtractedQuestion[] }
    | { success: false; error: string };

type SaveStats = {
    baseImageOk: number;
    baseImageFail: number;
    diagramOk: number;
    diagramFail: number;
};

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

function cleanErrorMessage(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error || "");
    if (/Inactivity Timeout/i.test(raw) || /Too much time has passed/i.test(raw)) {
        return "Saving took too long. Please try again with fewer pages, or retry after a moment.";
    }
    if (/<html[\s>]/i.test(raw) || /<body[\s>]/i.test(raw)) {
        return "The save request timed out before the server responded. Please try again.";
    }
    return raw || "Failed to save questions.";
}

async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let next = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const index = next;
            next += 1;
            results[index] = await mapper(items[index], index);
        }
    });

    await Promise.all(workers);
    return results;
}

async function uploadImage(dataUrl: string, path: string): Promise<string | null> {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
        console.warn(`[school-test][upload] SKIP ${path} — malformed data URL`);
        return null;
    }
    const supabase = supabaseServer();
    const { error } = await supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .upload(path, parsed.buffer, {
            contentType: parsed.mime,
            cacheControl: "3600",
            upsert: true,
        });
    if (error) {
        console.error(`[school-test][upload] FAILED ${path}:`, error);
        return null;
    }
    return supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function normalizeBbox(
    bbox: [number, number, number, number] | null,
): number[] {
    // Prisma `Int[]` on MongoDB requires integers; round defensively. An absent
    // bbox is stored as [] so the Verifier can tell "no crop" apart from a
    // zero-sized crop.
    if (!bbox) return [];
    return bbox.map((n) => Math.max(0, Math.round(Number(n) || 0)));
}

/**
 * Persist verifier-edited pages to the SchoolTestQuestion collection. Each
 * page's baseImage is uploaded once and the URL fanned out across every
 * question that came from it, so the create-test editor can re-crop later
 * without re-uploading the source PDF.
 */
export async function saveExtractedQuestions(
    input: SaveExtractedPage[],
): Promise<SaveExtractedResult> {
    const ctx = await getAuthContext();
    if (!ctx) return { success: false, error: "Not signed in." };

    const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true },
    });
    if (!user) return { success: false, error: "User not found." };

    if (!Array.isArray(input) || input.length === 0) {
        return { success: false, error: "Nothing to save." };
    }
    const totalQuestions = input.reduce((n, p) => n + p.questions.length, 0);
    if (totalQuestions === 0) {
        return { success: false, error: "No questions on any page." };
    }

    try {
        const batchId = Date.now();
        const stats: SaveStats = {
            baseImageOk: 0,
            baseImageFail: 0,
            diagramOk: 0,
            diagramFail: 0,
        };

        console.log(
            `[school-test] saving ${totalQuestions} question(s) across ${input.length} page(s)`,
        );

        const savedByPage = await mapWithConcurrency(input, 2, async (page) => {
            // Upload the base image once per page; every question on this page
            // reuses the same URL.
            let baseImageUrl: string | null = null;
            if (page.baseImageDataUrl) {
                const baseRand = Math.random().toString(36).slice(2, 8);
                const basePath = `school-test/${batchId}-p${page.pageNumber}-base-${baseRand}.png`;
                baseImageUrl = await uploadImage(page.baseImageDataUrl, basePath);
                if (baseImageUrl) stats.baseImageOk++;
                else stats.baseImageFail++;
            }

            const diagramUrls = await mapWithConcurrency(page.questions, 4, async (q, i) => {
                if (q.diagram_data_url) {
                    const rand = Math.random().toString(36).slice(2, 8);
                    const path = `school-test/${batchId}-p${page.pageNumber}-q${q.question_number}-${i}-${rand}.png`;
                    const diagramUrl = await uploadImage(q.diagram_data_url, path);
                    if (diagramUrl) stats.diagramOk++;
                    else stats.diagramFail++;
                    return diagramUrl;
                }
                return null;
            });

            return mapWithConcurrency(page.questions, 6, async (q, i) => {
                const diagramUrl = diagramUrls[i];
                const created = await prisma.schoolTestQuestion.create({
                    data: {
                        question_number: q.question_number,
                        question_text: q.question_text,
                        options: q.options,
                        option_images: [],
                        isQuestionImage: Boolean(diagramUrl),
                        question_image: diagramUrl,
                        isOptionImage: false,
                        answer: null,
                        flagged: false,
                        baseImage: baseImageUrl,
                        cropBbox: normalizeBbox(q.crop_bbox),
                        sourceWidth: page.sourceWidth || null,
                        sourceHeight: page.sourceHeight || null,
                        sourceFileName: page.sourceFileName,
                        createdBy: user.id,
                    },
                });

                return {
                    id: created.id,
                    question_number: created.question_number,
                    question_text: created.question_text,
                    options: created.options,
                    question_image: created.question_image ?? null,
                    answer: created.answer ?? "",
                    marks: 1,
                    base_image: created.baseImage ?? null,
                    crop_bbox:
                        created.cropBbox.length === 4
                            ? (created.cropBbox as [number, number, number, number])
                            : null,
                    source_width: created.sourceWidth ?? null,
                    source_height: created.sourceHeight ?? null,
                };
            });
        });

        const saved = savedByPage.flat();

        console.log(
            `[school-test] done — saved ${saved.length} SchoolTestQuestion row(s); ` +
            `base-image uploads ok=${stats.baseImageOk} fail=${stats.baseImageFail}; ` +
            `diagram uploads ok=${stats.diagramOk} fail=${stats.diagramFail}`,
        );
        return { success: true, questions: saved };
    } catch (e) {
        console.error("[school-test] saveExtractedQuestions failed:", e);
        return {
            success: false,
            error: cleanErrorMessage(e),
        };
    }
}
