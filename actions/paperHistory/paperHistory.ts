'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const savePaperHistory = async (data: PaperHistoryData): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!data.isContinue) {
        return {
            success: false,
            error: "Not been pushed to Db"
        }
    }

    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const paperHistory = await prisma.paperHistory.create({
            data: {
                userId: user.id,
                title: data.title,
                description: data.description,
                institution: data.institution,
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
        console.error('Error saving paper history:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save paper history'
        };
    }
};

export const getPaperHistories = async (limit: number = 10): Promise<PaperHistoryWithQuestions[]> => {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const paperHistories = await prisma.paperHistory.findMany({
            where: { userId: user.id },
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
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const paperHistory = await prisma.paperHistory.findFirst({
            where: {
                id,
                userId: user.id,
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
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        await prisma.paperHistory.deleteMany({
            where: {
                id,
                userId: user.id,
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
