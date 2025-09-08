'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export const createTest = async (data: CreateTestData): Promise<Partial<ExaminationTest>> => {
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

        // console.log('------------DATA', data);

        const test = await prisma.test.create({
            data: {
                title: data.title,
                description: data.description,
                subject: data.subject,
                duration: typeof data.duration === 'string' ? parseInt(data.duration) : data.duration,
                totalMarks: data.totalMarks,
                createdBy: user.id,
                questions: {
                    create: data.questions.map(q => ({
                        question: {
                            connect: { id: q.id },
                        },
                        marks: q.marks,
                        questionNumber: q.questionNumber,
                    })),
                },
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
                                question_type: true,
                                section_name: true,
                                exam_name: true,
                                subject: true,
                                chapter: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
        });

        return {
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '',
                marks: tq.marks,
                questionNumber: tq.questionNumber,
                topic: tq.question.topic,
                questionType: tq.question.question_type,
                sectionName: tq.question.section_name,
                examName: tq.question.exam_name,
                subject: tq.question.subject,
                chapter: tq.question.chapter,
            })),
            _count: test._count,
        };
    } catch (error) {
        console.error('Error creating test:', error);
        throw error instanceof Error ? error : new Error('Failed to create test');
    }
};

export const getTests = async (): Promise<Partial<ExaminationTest>[]> => {
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

        const tests = await prisma.test.findMany({
            where: { createdBy: user.id },
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
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return tests.map((test) => ({
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '',
                marks: tq.marks,
                questionNumber: tq.questionNumber,
            })),
            _count: test._count,
        }));
    } catch (error) {
        console.error('Error fetching tests:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch tests');
    }
};

export const getTestById = async (testId: string): Promise<Partial<ExaminationTest> | null> => {
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

        const test = await prisma.test.findFirst({
            where: {
                id: testId,
                createdBy: user.id,
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
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
        });

        if (!test) {
            return null;
        }

        return {
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '',
                marks: tq.marks,
                questionNumber: tq.questionNumber,
            })),
            _count: test._count,
        };
    } catch (error) {
        console.error('Error fetching test:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch test');
    }
};

export const deleteTest = async (testId: string): Promise<void> => {
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

        await prisma.test.deleteMany({
            where: {
                id: testId,
                createdBy: user.id,
            },
        });
    } catch (error) {
        console.error('Error deleting test:', error);
        throw error instanceof Error ? error : new Error('Failed to delete test');
    }
}
