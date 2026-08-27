'use server';

import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/session';

/**
 * Generated papers, scoped by ORGANISATION (doc §1).
 *
 * These used to be filtered by `userId` alone, which meant two things at once:
 * a colleague in the same institution couldn't see a paper you'd generated for
 * it, and — once a teacher belongs to two institutions — every paper they'd ever
 * made showed up under both. `userId` stays on the row as authorship; it is not
 * what decides who may see it.
 *
 * A caller with no organisation must match NOTHING. Left to itself,
 * `where: { organizationId: undefined }` drops the condition entirely and
 * returns every row in the collection, so each entry point guards first.
 */
export const savePaperHistory = async (data: PaperHistoryData): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!data.isContinue) {
        return {
            success: false,
            error: "Not been pushed to Db"
        }
    }

    try {
        const ctx = await getAuthContext();
        if (!ctx?.organizationId) {
            throw new Error('Unauthorized');
        }

        // getAuthContext() has already resolved — and if necessary created —
        // this user, so ctx.userId is authoritative. Re-querying it was a
        // leftover from the Clerk migration, where this lookup translated a
        // Clerk id into a local one. That translation no longer exists.
        const user = { id: ctx.userId };
        const paperHistory = await prisma.paperHistory.create({
            data: {
                // Authorship. Access is decided by organizationId below.
                userId: user.id,
                // The AUTHORIZATION key. Without it the paper is invisible to
                // the reads below — including to the person who just made it.
                organizationId: ctx.organizationId,
                title: data.title,
                description: data.description,
                // Falls back to the ACTIVE organisation's name. The institution
                // was previously typed independently into four places that never
                // agreed (doc §4, T-20); the org is the single source of truth,
                // and a teacher at two institutions gets the right header on the
                // paper without having to remember which one they're in.
                institution:
                    data.institution ||
                    ctx.memberships.find((m) => m.isActive)?.name ||
                    data.institution,
                subject: data.subject,
                marks: data.marks,
                time: data.time,
                exam: data.exam,
                logo: data.logo,
                standard: data.standard,
                session: data.session,
                questions: {
                    create: data.questions.map(q => ({
                        questionId: q.id,
                        marks: q.marks,
                        questionNumber: q.questionNumber,
                    })),
                },
            },
        });

        return { success: true, id: paperHistory.id };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save paper history'
        };
    }
};

export const getPaperHistories = async (limit: number = 10): Promise<PaperHistoryWithQuestions[]> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx?.organizationId) {
            throw new Error('Unauthorized');
        }

        // getAuthContext() has already resolved — and if necessary created —
        // this user, so ctx.userId is authoritative. Re-querying it was a
        // leftover from the Clerk migration, where this lookup translated a
        // Clerk id into a local one. That translation no longer exists.
        const user = { id: ctx.userId };
        const paperHistories = await prisma.paperHistory.findMany({
            where: { organizationId: ctx.organizationId },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: {
                            select: {
                                id: true,
                                question_text: true,
                                options: true,
                                answer: true,
                                topic: true,
                                exam_name: true,
                                subject: true,
                                chapter: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return paperHistories;
    } catch (error) {
        console.error('Error fetching paper histories:', error);
        throw new Error('Failed to fetch paper histories');
    }
};

export const getPaperHistoryById = async (id: string): Promise<PaperHistoryWithQuestions | null> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx?.organizationId) {
            throw new Error('Unauthorized');
        }

        const paperHistory = await prisma.paperHistory.findFirst({
            where: {
                id,
                organizationId: ctx.organizationId,
            },
            include: {
                questions: {
                    orderBy: { questionNumber: 'asc' },
                    include: {
                        question: {
                            select: {
                                id: true,
                                question_text: true,
                                options: true,
                                answer: true,
                                topic: true,
                                exam_name: true,
                                subject: true,
                                chapter: true,
                            },
                        },
                    },
                },
            },
        });

        return paperHistory;
    } catch (error) {
        console.error('Error fetching paper history:', error);
        throw new Error('Failed to fetch paper history');
    }
};

export const deletePaperHistory = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx?.organizationId) {
            throw new Error('Unauthorized');
        }

        await prisma.paperHistory.deleteMany({
            where: {
                id,
                organizationId: ctx.organizationId,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting paper history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete paper history'
        };
    }
};
