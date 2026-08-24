"use server"

import prisma from "@/lib/prisma"
import { getAuthContext } from '@/lib/auth/session';
import { Folder, Question } from "@/generated/prisma"
import { checkFolderAccess } from "@/actions/drafts/folderAccess"

interface FolderWithRelations extends Folder {
    questionRelations: { question: Question }[];
}

/**
 * A folder plus the caller's relationship to it.
 *
 * `userRole` is always 'owner' now: folders are single-owner since the
 * collaboration feature was removed. It is kept because the UI branches on it
 * to decide what is editable, and because org-level sharing (which will
 * reintroduce a role) is on the roadmap.
 */
export interface FolderWithMeta extends FolderWithRelations {
    userRole: 'owner';
    createdAt: Date;
}

/** Result shape for folder reads that can fail on permissions. */
export interface FolderResult {
    success: boolean;
    data?: FolderWithMeta;
    error?: string;
}

export const createFolder = async (name: string, questions: { id: string }[]): Promise<FolderWithRelations> => {
    try {
        // console.log("Available Prisma models:", Object.keys(prisma)); // Debug log
        if (!prisma.folderQuestion) {
            throw new Error("prisma.folderQuestion is undefined");
        }

        const ctx = await getAuthContext();
        if (!ctx) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true },
        });

        if (!user) throw new Error("User not found in database");

        if (!name.trim()) throw new Error("Folder name cannot be empty");

        // Verify question IDs exist
        if (questions.length > 0) {
            const existingQuestions = await prisma.question.findMany({
                where: { id: { in: questions.map((q) => q.id) } },
                select: { id: true },
            });
            if (existingQuestions.length !== questions.length) {
                throw new Error("One or more questions not found");
            }
        }

        // Create the folder
        const folder = await prisma.folder.create({
            data: {
                name: name.trim(),
                user: {
                    connect: { id: user.id },
                },
            },
        });

        // Create FolderQuestion entries for each question
        if (questions.length > 0) {
            await prisma.folderQuestion.createMany({
                data: questions.map((q) => ({
                    folderId: folder.id,
                    questionId: q.id,
                })),
            });
        }

        // Return the folder with its questions
        const result = await prisma.folder.findUnique({
            where: { id: folder.id },
            include: {
                questionRelations: {
                    include: { question: true },
                    orderBy: { position: 'asc' },
                },
                user: true,
            },
        });

        if (!result) throw new Error("Failed to retrieve created folder");

        return result;
    } catch (error) {
        // console.error("Error creating folder:", error);
        throw error instanceof Error ? error : new Error("Failed to create folder");
    }
};



export const getFolders = async (): Promise<FolderWithMeta[] | null> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            throw new Error("Unauthorized");
        }

        // Folders are single-owner. This used to run a second query for folders
        // shared with you and merge the two lists; that went away with the
        // collaboration feature.
        const folders = await prisma.folder.findMany({
            where: { userId: ctx.userId },
            include: {
                questionRelations: {
                    include: { question: true },
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return folders.map((folder) => ({ ...folder, userRole: 'owner' as const }));
    } catch (error) {
        throw error instanceof Error ? error : new Error("Failed to fetch folders");
    }
};

// Get a specific folder by ID with permission checking
export const getFolderById = async (folderId: string): Promise<FolderResult> => {
    try {
        if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
            return { success: false, error: 'Invalid folder ID provided' };
        }

        const accessCheck = await checkFolderAccess(folderId);
        if (!accessCheck.success) {
            return { success: false, error: accessCheck.error };
        }

        const ctx = await getAuthContext();
        if (!ctx) {
            return { success: false, error: 'Unauthorized' };
        }

        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: {
                questionRelations: {
                    include: { question: true },
                    orderBy: { position: 'asc' },
                },
            },
        });

        if (!folder) {
            return { success: false, error: 'Folder not found' };
        }

        return { success: true, data: { ...folder, userRole: 'owner' as const } };
    } catch (error) {
        console.error('Error fetching folder by ID:', error);
        return { success: false, error: 'Failed to fetch folder. Please try again later.' };
    }
};

// Delete a folder and its relations
export const deleteFolder = async (id: string): Promise<void> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        const folder = await prisma.folder.findFirst({
            where: { id, userId: user.id },
        });

        if (!folder) {
            throw new Error("Folder not found or unauthorized");
        }

        await prisma.$transaction([
            // Delete all FolderQuestion relations
            prisma.folderQuestion.deleteMany({
                where: { folderId: id },
            }),
            // Delete the folder
            prisma.folder.delete({
                where: { id },
            }),
        ]);

        // console.log(`Folder ${id} deleted successfully.`);
    } catch (error) {
        // console.error("Error deleting folder:", error);
        throw error instanceof Error ? error : new Error("Failed to delete folder");
    }
};

// Rename a folder
export const renameFolder = async (id: string, name: string): Promise<Folder> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        const folder = await prisma.folder.findFirst({
            where: { id, userId: user.id },
        });

        if (!folder) {
            throw new Error("Folder not found or unauthorized");
        }

        if (!name.trim()) {
            throw new Error("Folder name cannot be empty");
        }

        const updatedFolder = await prisma.folder.update({
            where: { id },
            data: { name: name.trim() },
            include: {
                questionRelations: {
                    include: { question: true },
                    orderBy: { position: 'asc' },
                },
            },
        });

        return updatedFolder;
    } catch (error) {
        // console.error("Error renaming folder:", error);
        throw error instanceof Error ? error : new Error("Failed to rename folder");
    }
};

// Update questions in a folder
export const updateFolderQuestions = async (
    folderId: string,
    questionIds: string[]
): Promise<FolderWithRelations | null> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId: user.id },
        });

        if (!folder) {
            throw new Error("Folder not found or unauthorized");
        }

        // Verify all question IDs exist
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            select: { id: true },
        });

        if (questions.length !== questionIds.length) {
            throw new Error("One or more questions not found");
        }

        await prisma.$transaction(async (tx) => {
            // Delete existing relations
            await tx.folderQuestion.deleteMany({
                where: { folderId },
            });

            // Create new relations with deterministic order positions
            const data = questionIds.map((questionId, index) => ({
                folderId,
                questionId,
                position: index * 1000,
            }));

            await tx.folderQuestion.createMany({
                data,
            });
        });

        // Return updated folder
        const updatedFolder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: {
                questionRelations: {
                    include: { question: true },
                    orderBy: { position: 'asc' },
                },
            },
        });

        return updatedFolder;
    } catch (error) {
        // console.error("Error updating folder questions:", error);
        throw error instanceof Error ? error : new Error("Failed to update folder questions");
    }
};
