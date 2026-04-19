'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail, createCollaborationInviteEmail } from '@/lib/email/emailService';

export interface CollaborationInvite {
    folderId: string;
    email: string;
    role: 'editor' | 'viewer';
}

import { CollaborationError, CollaborationErrorType, createCollaborationError, logCollaborationError } from '@/types/collaboration-errors';

export interface CollaborationResponse {
    success: boolean;
    error?: string;
    collaborationError?: CollaborationError;
    data?: any;
}

// Check if user has access to folder
export async function checkFolderAccess(folderId: string, requiredRole: 'owner' | 'editor' | 'viewer' = 'viewer'): Promise<CollaborationResponse> {
    try {
        // Validate folder ID format
        if (!folderId || typeof folderId !== 'string' || folderId.trim() === '') {
            const error = createCollaborationError(
                CollaborationErrorType.INVALID_FOLDER_ID,
                undefined,
                undefined,
                folderId
            );
            logCollaborationError(error, { requiredRole, function: 'checkFolderAccess' });
            return {
                success: false,
                error: 'Invalid folder ID provided',
                collaborationError: error
            };
        }

        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            const error = createCollaborationError(
                CollaborationErrorType.AUTHENTICATION_REQUIRED,
                undefined,
                undefined,
                folderId
            );
            logCollaborationError(error, { requiredRole, function: 'checkFolderAccess' });
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
            logCollaborationError(error, { requiredRole, function: 'checkFolderAccess' });
            return {
                success: false,
                error: 'User not found',
                collaborationError: error
            };
        }

        // Check if user is owner
        const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId: user.id },
            select: { id: true },
        });

        if (folder) {
            return { success: true, data: { role: 'owner' } };
        }

        // Check if user is collaborator
        const collaboration = await prisma.folderCollaborator.findFirst({
            where: { folderId, userId: user.id },
            select: { role: true },
        });

        if (!collaboration) {
            // Check if folder exists at all
            const folderExists = await prisma.folder.findUnique({
                where: { id: folderId },
                select: { id: true },
            });

            if (!folderExists) {
                const error = createCollaborationError(
                    CollaborationErrorType.FOLDER_NOT_FOUND,
                    undefined,
                    undefined,
                    folderId,
                    user.id
                );
                logCollaborationError(error, { requiredRole, function: 'checkFolderAccess' });
                return {
                    success: false,
                    error: 'Folder not found',
                    collaborationError: error
                };
            }

            const error = createCollaborationError(
                CollaborationErrorType.ACCESS_DENIED,
                undefined,
                undefined,
                folderId,
                user.id
            );
            logCollaborationError(error, { requiredRole, function: 'checkFolderAccess' });
            return {
                success: false,
                error: 'Access denied',
                collaborationError: error
            };
        }

        // Check role hierarchy
        const roleHierarchy = { owner: 3, editor: 2, viewer: 1 };
        const requiredLevel = roleHierarchy[requiredRole];
        const userLevel = roleHierarchy[collaboration.role as keyof typeof roleHierarchy];

        if (userLevel < requiredLevel) {
            const error = createCollaborationError(
                CollaborationErrorType.ACCESS_DENIED,
                `Insufficient permissions. Required: ${requiredRole}, Current: ${collaboration.role}`,
                undefined,
                folderId,
                user.id
            );
            logCollaborationError(error, { requiredRole, currentRole: collaboration.role, function: 'checkFolderAccess' });
            return {
                success: false,
                error: 'Insufficient permissions',
                collaborationError: error
            };
        }

        return { success: true, data: { role: collaboration.role } };
    } catch (error) {
        const collaborationError = createCollaborationError(
            CollaborationErrorType.UNKNOWN_ERROR,
            'Failed to check folder access',
            error instanceof Error ? error.message : 'Unknown error occurred',
            folderId
        );
        logCollaborationError(collaborationError, {
            requiredRole,
            function: 'checkFolderAccess',
            originalError: error instanceof Error ? error.message : String(error)
        });
        console.error('Error checking folder access:', error);
        return {
            success: false,
            error: 'Failed to check access',
            collaborationError: collaborationError
        };
    }
}

// Generate invite link for folder
export async function generateInviteLink(folderId: string): Promise<CollaborationResponse> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check if user is owner or editor
        const accessCheck = await checkFolderAccess(folderId, 'editor');
        if (!accessCheck.success) {
            return accessCheck;
        }

        // Get folder details
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            select: { name: true },
        });

        if (!folder) {
            return { success: false, error: 'Folder not found' };
        }

        // Generate invite link (you can make this more secure with tokens)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduents.com';
        const inviteLink = `${baseUrl}/drafts?folder=${folderId}`;

        return {
            success: true,
            data: {
                inviteLink,
                folderName: folder.name
            }
        };
    } catch (error) {
        console.error('Error generating invite link:', error);
        return { success: false, error: 'Failed to generate invite link' };
    }
}

// Invite user to collaborate
export async function inviteCollaborator(invite: CollaborationInvite): Promise<CollaborationResponse> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check if user is owner or editor
        const accessCheck = await checkFolderAccess(invite.folderId, 'editor');
        if (!accessCheck.success) {
            return accessCheck;
        }

        // Get folder details
        const folder = await prisma.folder.findUnique({
            where: { id: invite.folderId },
            select: { name: true },
        });

        if (!folder) {
            return { success: false, error: 'Folder not found' };
        }

        // Find or create user by email
        let targetUser = await prisma.user.findUnique({
            where: { email: invite.email },
            select: { id: true },
        });

        if (!targetUser) {
            // Create placeholder user (they'll be prompted to sign up)
            targetUser = await prisma.user.create({
                data: {
                    email: invite.email,
                    clerkUserId: `placeholder_${Date.now()}`, // Will be updated when they sign up
                    name: invite.email.split('@')[0],
                    role: 'student', // Add the required role field
                },
                select: { id: true },
            });
        }

        // Check if already collaborating
        const existingCollaboration = await prisma.folderCollaborator.findFirst({
            where: { folderId: invite.folderId, userId: targetUser.id },
        });

        if (existingCollaboration) {
            return { success: false, error: 'User is already collaborating on this folder' };
        }

        // Create collaboration
        await prisma.folderCollaborator.create({
            data: {
                folderId: invite.folderId,
                userId: targetUser.id,
                role: invite.role,
            },
        });

        // Generate invite link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eduents.com';
        const inviteLink = `${baseUrl}/drafts?folder=${invite.folderId}`;

        // Send email invitation
        const emailHtml = createCollaborationInviteEmail(
            user.name || user.email,
            folder.name,
            inviteLink,
            invite.role
        );

        const emailSent = await sendEmail({
            to: invite.email,
            subject: `You've been invited to collaborate on "${folder.name}"`,
            html: emailHtml,
        });

        // Log the action
        await prisma.folderChangeLog.create({
            data: {
                folderId: invite.folderId,
                userId: user.id,
                action: 'add_collaborator',
                details: JSON.stringify({
                    invitedUserId: targetUser.id,
                    invitedEmail: invite.email,
                    role: invite.role,
                    emailSent,
                }),
            },
        });

        revalidatePath('/drafts');
        return {
            success: true,
            data: {
                emailSent,
                inviteLink
            }
        };
    } catch (error) {
        console.error('Error inviting collaborator:', error);
        return { success: false, error: 'Failed to invite collaborator' };
    }
}

// Remove collaborator
export async function removeCollaborator(folderId: string, collaboratorId: string): Promise<CollaborationResponse> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check if user is owner
        const accessCheck = await checkFolderAccess(folderId, 'owner');
        if (!accessCheck.success) {
            return { success: false, error: 'Only folder owners can remove collaborators' };
        }

        // Remove collaboration
        await prisma.folderCollaborator.deleteMany({
            where: { folderId, userId: collaboratorId },
        });

        // Log the action
        await prisma.folderChangeLog.create({
            data: {
                folderId,
                userId: user.id,
                action: 'remove_collaborator',
                details: JSON.stringify({ removedUserId: collaboratorId }),
            },
        });

        revalidatePath('/drafts');
        return { success: true };
    } catch (error) {
        console.error('Error removing collaborator:', error);
        return { success: false, error: 'Failed to remove collaborator' };
    }
}

// Get folder collaborators
export async function getFolderCollaborators(folderId: string): Promise<CollaborationResponse> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check access
        const accessCheck = await checkFolderAccess(folderId, 'viewer');
        if (!accessCheck.success) {
            return accessCheck;
        }

        const collaborators = await prisma.folderCollaborator.findMany({
            where: { folderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return { success: true, data: collaborators };
    } catch (error) {
        console.error('Error getting collaborators:', error);
        return { success: false, error: 'Failed to get collaborators' };
    }
}

/**
 * Get folder change log (legacy, unpaginated).
 *
 * @deprecated Phase 10 refactor: this returns the last 50 entries in a single
 * call, which is (a) unbounded in practice because it hits MongoDB on every
 * folder open and (b) incompatible with the TanStack Query infinite-scroll UI
 * we're moving towards. Prefer {@link getFolderChangeLogPage} which exposes a
 * `createdAt` cursor + `take` window and returns `{ items, nextCursor }`.
 *
 * Kept for now because other UI paths may still call the non-paginated shape;
 * remove once all callers have migrated to the paginated hook
 * (`hooks/queries/useFolderChangeLog.ts`).
 */
export async function getFolderChangeLog(folderId: string): Promise<CollaborationResponse> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check access
        const accessCheck = await checkFolderAccess(folderId, 'viewer');
        if (!accessCheck.success) {
            return accessCheck;
        }

        const changeLogs = await prisma.folderChangeLog.findMany({
            where: { folderId },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 changes
        });

        return { success: true, data: changeLogs };
    } catch (error) {
        console.error('Error getting change log:', error);
        return { success: false, error: 'Failed to get change log' };
    }
}

export interface GetFolderChangeLogPageOptions {
    /**
     * Exclusive cursor (ISO string of the last item's `createdAt` from the
     * previous page, or `null` for the first page). Newest-first ordering.
     */
    cursor?: string | null;
    /** Page size. Defaults to 30. Capped at 100 to avoid accidental blow-ups. */
    take?: number;
}

export interface FolderChangeLogPage {
    items: Array<{
        id: string;
        folderId: string;
        userId: string;
        action: string;
        details: string;
        createdAt: Date;
        user: {
            id: string;
            name: string | null;
            email: string;
        };
    }>;
    /**
     * Cursor to pass as `cursor` on the next request. `null` when the last
     * page has been reached.
     */
    nextCursor: string | null;
}

/**
 * Paginated, newest-first read of a folder's change log. Designed to be
 * consumed by {@link https://tanstack.com/query `useInfiniteQuery`}.
 *
 * Uses `FolderChangeLog.createdAt` as the cursor (indexed in
 * `prisma/schema.prisma`). We take `take + 1` rows so we can tell whether
 * there's a next page without a second round-trip.
 *
 * Kept separate from the legacy {@link getFolderChangeLog} so that any
 * lingering consumers of the unpaginated shape keep working until fully
 * migrated.
 */
export async function getFolderChangeLogPage(
    folderId: string,
    options: GetFolderChangeLogPageOptions = {}
): Promise<CollaborationResponse> {
    try {
        const { cursor = null, take: rawTake = 30 } = options;
        const take = Math.max(1, Math.min(rawTake ?? 30, 100));

        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check access
        const accessCheck = await checkFolderAccess(folderId, 'viewer');
        if (!accessCheck.success) {
            return accessCheck;
        }

        // Fetch one extra to determine whether another page exists.
        const rows = await prisma.folderChangeLog.findMany({
            where: {
                folderId,
                ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: take + 1,
        });

        const hasMore = rows.length > take;
        const items = hasMore ? rows.slice(0, take) : rows;
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        const page: FolderChangeLogPage = { items, nextCursor };
        return { success: true, data: page };
    } catch (error) {
        console.error('Error getting change log page:', error);
        return { success: false, error: 'Failed to get change log' };
    }
}

// Update folder with position-based ordering
export async function updateFolderQuestionsWithOrder(
    folderId: string,
    questionIds: string[]
): Promise<CollaborationResponse> {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check if user is owner or editor
        const accessCheck = await checkFolderAccess(folderId, 'editor');
        if (!accessCheck.success) {
            return accessCheck;
        }

        // Verify all question IDs exist
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            select: { id: true },
        });

        if (questions.length !== questionIds.length) {
            return { success: false, error: 'One or more questions not found' };
        }

        await prisma.$transaction(async (tx) => {
            // Delete existing relations
            await tx.folderQuestion.deleteMany({
                where: { folderId },
            });

            // Create new relations with positions
            const questionData = questionIds.map((questionId, index) => ({
                folderId,
                questionId,
                position: index * 1000, // Use 1000 intervals for easy reordering
            }));

            await tx.folderQuestion.createMany({
                data: questionData,
            });
        });

        // Log the action
        await prisma.folderChangeLog.create({
            data: {
                folderId,
                userId: user.id,
                action: 'reorder',
                details: JSON.stringify({ questionCount: questionIds.length }),
            },
        });

        revalidatePath('/drafts');
        return { success: true };
    } catch (error) {
        console.error('Error updating folder questions:', error);
        return { success: false, error: 'Failed to update folder questions' };
    }
} 
