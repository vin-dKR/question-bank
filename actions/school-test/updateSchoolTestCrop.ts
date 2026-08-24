"use server";

import { getAuthContext } from '@/lib/auth/session';
import prisma from "@/lib/prisma";
import { supabaseServer, SUPABASE_IMAGE_BUCKET } from "@/lib/supabase";

export type UpdateSchoolTestCropInput = {
    schoolTestQuestionId: string;
    /** data:image/png;base64,… — the new cropped region */
    dataUrl: string;
    /** [x, y, w, h] in baseImage pixel coords */
    bbox: [number, number, number, number];
};

export type UpdateSchoolTestCropResult =
    | {
          success: true;
          question_image: string;
          crop_bbox: [number, number, number, number];
      }
    | { success: false; error: string };

function parseDataUrl(dataUrl: string): { mime: string; buffer: Buffer } | null {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
}

/**
 * Re-crop one SchoolTestQuestion from the create-test editor. Uploads the new
 * cropped PNG to Supabase and updates the row's question_image + cropBbox.
 * The old image URL is left behind (no cascade delete) — Supabase object TTL
 * can clean those up later if needed.
 */
export async function updateSchoolTestCrop(
    input: UpdateSchoolTestCropInput,
): Promise<UpdateSchoolTestCropResult> {
    const ctx = await getAuthContext();
    if (!ctx) return { success: false, error: "Not signed in." };

    const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true },
    });
    if (!user) return { success: false, error: "User not found." };

    const existing = await prisma.schoolTestQuestion.findUnique({
        where: { id: input.schoolTestQuestionId },
        select: { id: true, createdBy: true, question_number: true },
    });
    if (!existing) return { success: false, error: "Question not found." };
    if (existing.createdBy !== user.id) {
        return { success: false, error: "Not allowed." };
    }

    const parsed = parseDataUrl(input.dataUrl);
    if (!parsed) return { success: false, error: "Malformed image data." };

    const rand = Math.random().toString(36).slice(2, 8);
    const path = `school-test/recrop-${Date.now()}-q${existing.question_number}-${rand}.png`;
    const supabase = supabaseServer();
    const { error: upErr } = await supabase.storage
        .from(SUPABASE_IMAGE_BUCKET)
        .upload(path, parsed.buffer, {
            contentType: parsed.mime,
            cacheControl: "3600",
            upsert: true,
        });
    if (upErr) {
        console.error("[school-test/recrop] upload failed:", upErr);
        return { success: false, error: `Upload failed: ${upErr.message}` };
    }
    const { data: pub } = supabase.storage.from(SUPABASE_IMAGE_BUCKET).getPublicUrl(path);

    const cropBbox = input.bbox.map((n) => Math.max(0, Math.round(Number(n) || 0)));

    const updated = await prisma.schoolTestQuestion.update({
        where: { id: input.schoolTestQuestionId },
        data: {
            question_image: pub.publicUrl,
            isQuestionImage: true,
            cropBbox,
        },
        select: { question_image: true, cropBbox: true },
    });

    return {
        success: true,
        question_image: updated.question_image!,
        crop_bbox: updated.cropBbox as [number, number, number, number],
    };
}
