"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth/session";

/**
 * Folder authorization and question ordering.
 *
 * These two functions used to live in `actions/collaboration/folder.ts`, which
 * was a misnomer: neither has anything to do with collaboration.
 * `checkFolderAccess` is THE authorization check for every folder operation, and
 * `updateFolderQuestionsWithOrder` is question reordering. When the
 * collaboration feature was removed they were kept and moved here, since
 * deleting them would have stripped authorization from folder access.
 *
 * Folders are single-owner now. The role hierarchy that used to distinguish
 * owner/editor/viewer collapsed to a single question — is this your folder? —
 * so the `requiredRole` argument is accepted and ignored, keeping existing call
 * sites compiling.
 */

export interface FolderAccessResponse {
    success: boolean;
    data?: { role: 'owner' };
    error?: string;
}

/**
 * Confirms the caller owns this folder.
 *
 * @param _requiredRole IGNORED. Folders have exactly one role now — owner.
 *   Retained so existing callers keep compiling; drop the argument when
 *   convenient.
 */
export async function checkFolderAccess(
    folderId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _requiredRole: 'owner' | 'editor' | 'viewer' = 'viewer'
): Promise<FolderAccessResponse> {
    try {
        if (!folderId || typeof folderId !== 'string') {
            return { success: false, error: 'Invalid folder ID provided' };
        }

        const ctx = await getAuthContext();
        if (!ctx) {
            return { success: false, error: 'Unauthorized' };
        }

        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId: ctx.userId },
            select: { id: true },
        });

        if (folder) {
            return { success: true, data: { role: 'owner' } };
        }

        // Distinguish "doesn't exist" from "not yours" for a useful message, but
        // never leak the existence of another org's folder beyond that.
        const exists = await prisma.folder.findUnique({
            where: { id: folderId },
            select: { id: true },
        });

        return exists
            ? { success: false, error: 'Access denied' }
            : { success: false, error: 'Folder not found' };
    } catch (error) {
        console.error('Error checking folder access:', error);
        return { success: false, error: 'Failed to check access' };
    }
}

/**
 * Replaces a folder's question list, in the given order.
 *
 * Positions are written at 1000-unit intervals so a later single-item move can
 * pick a float between two neighbours instead of renumbering the whole list —
 * `FolderQuestion.position` is a fractional index (see CLAUDE.md).
 */
export async function updateFolderQuestionsWithOrder(
    folderId: string,
    questionIds: string[]
): Promise<FolderAccessResponse> {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return { success: false, error: 'Unauthorized' };
        }

        const accessCheck = await checkFolderAccess(folderId);
        if (!accessCheck.success) {
            return accessCheck;
        }

        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            select: { id: true },
        });

        if (questions.length !== questionIds.length) {
            return { success: false, error: 'One or more questions not found' };
        }

        await prisma.$transaction(async (tx) => {
            await tx.folderQuestion.deleteMany({ where: { folderId } });

            await tx.folderQuestion.createMany({
                data: questionIds.map((questionId, index) => ({
                    folderId,
                    questionId,
                    position: index * 1000,
                })),
            });
        });

        revalidatePath('/drafts');
        return { success: true };
    } catch (error) {
        console.error('Error updating folder questions:', error);
        return { success: false, error: 'Failed to update folder questions' };
    }
}
