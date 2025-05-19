"use server"

import prisma from "@/lib/prisma"
import { auth } from '@clerk/nextjs/server'
import { Folder, Question } from "@/generated/prisma"

interface FolderWithRelations extends Folder {
    questionRelations: { question: Question }[];
}

export const createFolder = async (name: string, questions: { id: string }[]): Promise<FolderWithRelations> => {
    try {
        // console.log("Available Prisma models:", Object.keys(prisma)); // Debug log
        if (!prisma.folderQuestion) {
            throw new Error("prisma.folderQuestion is undefined");
        }

        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) throw new Error("Unauthorized");

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
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



export const getFolders = async (): Promise<FolderWithRelations[] | null> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found in database");
        }

        const folders = await prisma.folder.findMany({
            where: { userId: user.id },
            include: {
                questionRelations: {
                    include: {
                        question: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return folders;
    } catch (error) {
        // console.error("Error fetching folders:", error);
        throw error instanceof Error ? error : new Error("Failed to fetch folders");
    }
};

// Delete a folder and its relations
export const deleteFolder = async (id: string): Promise<void> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
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
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
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
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
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

        await prisma.$transaction([
            // Delete existing relations
            prisma.folderQuestion.deleteMany({
                where: { folderId },
            }),
            // Create new relations
            prisma.folderQuestion.createMany({
                data: questionIds.map((questionId) => ({
                    folderId,
                    questionId,
                })),
            }),
        ]);

        // Return updated folder
        const updatedFolder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: {
                questionRelations: {
                    include: { question: true },
                },
            },
        });

        return updatedFolder;
    } catch (error) {
        // console.error("Error updating folder questions:", error);
        throw error instanceof Error ? error : new Error("Failed to update folder questions");
    }
};
