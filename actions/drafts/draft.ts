"use server"

import prisma from "@/lib/prisma"
import { auth } from '@clerk/nextjs/server'
import { Folder, Question } from "@/generated/prisma"
import { checkFolderAccess, CollaborationResponse } from "@/actions/collaboration/folder"
import { CollaborationError, CollaborationErrorType, createCollaborationError, logCollaborationError } from '@/types/collaboration-errors'

interface FolderWithRelations extends Folder {
    questionRelations: { question: Question }[];
}

export interface FolderWithCollaboration extends FolderWithRelations {
    userRole: 'owner' | 'editor' | 'viewer';
    isCollaborated: boolean;
    collaboratorCount: number;
    createdAt: Date;
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



export const getFolders = async (): Promise<FolderWithCollaboration[] | null> => {
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

        // Query both owned folders and collaborated folders in parallel
        const [ownedFolders, collaboratedFolders] = await Promise.all([
            // Owned folders
            prisma.folder.findMany({
                where: { userId: user.id },
                include: {
                    questionRelations: {
                        include: { question: true },
                        orderBy: { position: 'asc' },
                    },
                    collaborators: true, // Include collaborators to get count
                },
                orderBy: { createdAt: "desc" },
            }),
            // Collaborated folders
            prisma.folder.findMany({
                where: {
                    collaborators: {
                        some: { userId: user.id }
                    }
                },
                include: {
                    questionRelations: {
                        include: { question: true },
                        orderBy: { position: 'asc' },
                    },
                    collaborators: {
                        where: { userId: user.id }
                    },
                    _count: {
                        select: { collaborators: true }
                    }
                },
                orderBy: { createdAt: "desc" },
            })
        ]);

        // Transform owned folders to include collaboration metadata
        const transformedOwnedFolders: FolderWithCollaboration[] = ownedFolders.map(folder => ({
            ...folder,
            userRole: 'owner' as const,
            isCollaborated: false,
            collaboratorCount: folder.collaborators.length,
        }));

        // Transform collaborated folders to include collaboration metadata
        const transformedCollaboratedFolders: FolderWithCollaboration[] = collaboratedFolders.map(folder => {
            const userCollaboration = folder.collaborators[0]; // We filtered for current user
            return {
                ...folder,
                userRole: (userCollaboration?.role as 'editor' | 'viewer') || 'viewer',
                isCollaborated: true,
                collaboratorCount: folder._count?.collaborators || 0,
            };
        });

        // Combine and sort all folders by creation date (most recent first)
        const allFolders = [...transformedOwnedFolders, ...transformedCollaboratedFolders];
        allFolders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return allFolders;
    } catch (error) {
        // console.error("Error fetching folders:", error);
        throw error instanceof Error ? error : new Error("Failed to fetch folders");
    }
};

// Get a specific folder by ID with permission checking
export const getFolderById = async (folderId: string): Promise<CollaborationResponse> => {
    try {
        // Validate folder ID format
        if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
            const error = createCollaborationError(
                CollaborationErrorType.INVALID_FOLDER_ID,
                undefined,
                undefined,
                folderId
            );
            logCollaborationError(error, { function: 'getFolderById' });
            return { 
                success: false, 
                error: 'Invalid folder ID provided',
                collaborationError: error
            };
        }

        // Check access permissions first using existing checkFolderAccess function
        const accessCheck = await checkFolderAccess(folderId, 'viewer');
        if (!accessCheck.success) {
            // The checkFolderAccess function already creates and logs collaboration errors
            return accessCheck;
        }

        // Get the current user to determine their role and collaboration status
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            const error = createCollaborationError(
                CollaborationErrorType.AUTHENTICATION_REQUIRED,
                undefined,
                undefined,
                folderId
            );
            logCollaborationError(error, { function: 'getFolderById' });
            return { 
                success: false, 
                error: 'Unauthorized',
                collaborationError: error
            };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            const error = createCollaborationError(
                CollaborationErrorType.AUTHENTICATION_REQUIRED,
                'User account not found in database',
                undefined,
                folderId,
                clerkUserId
            );
            logCollaborationError(error, { function: 'getFolderById' });
            return { 
                success: false, 
                error: 'User not found in database',
                collaborationError: error
            };
        }

        // Fetch folder with questions and collaboration data
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: {
                questionRelations: {
                    include: { question: true },
                    orderBy: { position: 'asc' }, // Order by position if available
                },
                collaborators: true, // Include all collaborators for count
            },
        });

        if (!folder) {
            const error = createCollaborationError(
                CollaborationErrorType.FOLDER_NOT_FOUND,
                undefined,
                undefined,
                folderId,
                user.id
            );
            logCollaborationError(error, { function: 'getFolderById' });
            return { 
                success: false, 
                error: 'Folder not found',
                collaborationError: error
            };
        }

        // Determine user's role and collaboration status
        const isOwner = folder.userId === user.id;
        let userRole: 'owner' | 'editor' | 'viewer' = 'viewer';
        let isCollaborated = false;

        if (isOwner) {
            userRole = 'owner';
            isCollaborated = false;
        } else {
            // Find user's collaboration record
            const userCollaboration = folder.collaborators.find(collab => collab.userId === user.id);
            if (userCollaboration) {
                userRole = userCollaboration.role as 'editor' | 'viewer';
                isCollaborated = true;
            }
        }

        // Transform folder to include collaboration metadata
        const folderWithCollaboration: FolderWithCollaboration = {
            ...folder,
            userRole,
            isCollaborated,
            collaboratorCount: folder.collaborators.length,
        };

        return { 
            success: true, 
            data: folderWithCollaboration 
        };
    } catch (error) {
        const collaborationError = createCollaborationError(
            CollaborationErrorType.UNKNOWN_ERROR,
            'Failed to fetch folder. Please try again later.',
            error instanceof Error ? error.message : 'Unknown error occurred',
            folderId
        );
        logCollaborationError(collaborationError, { 
            function: 'getFolderById',
            originalError: error instanceof Error ? error.message : String(error)
        });
        console.error('Error fetching folder by ID:', error);
        return { 
            success: false, 
            error: 'Failed to fetch folder. Please try again later.',
            collaborationError: collaborationError
        };
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
