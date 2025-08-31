'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export interface CreateTestData {
    title: string;
    description?: string;
    subject: string;
    duration: number;
    totalMarks: number;
    questions: {
        questionText: string;
        options: string[];
        answer: string;
        marks: number;
        questionNumber: number;
    }[];
}

export interface TestWithQuestions {
    id: string;
    title: string;
    description: string | null | undefined;
    subject: string;
    duration: number;
    totalMarks: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    questions: {
        id: string;
        questionText: string;
        options: string[];
        answer: string;
        marks: number;
        questionNumber: number;
    }[];
    _count: {
        responses: number;
    };
}

export interface TestAnalytics {
    testId: string;
    totalStudents: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averagePercentage: number;
    questionAnalytics: {
        questionId: string;
        questionNumber: number;
        questionText: string;
        correctAnswers: number;
        totalAttempts: number;
        accuracy: number;
    }[];
    studentAnalytics: {
        studentId: string;
        studentName: string;
        rollNumber: string;
        className: string;
        score: number;
        percentage: number;
        correctAnswers: number;
        totalQuestions: number;
        timeTaken?: number;
    }[];
}

export const createTest = async (data: CreateTestData): Promise<TestWithQuestions> => {
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

        // WIP
        console.log("------------DATA", data)

        const test = await prisma.test.create({
            data: {
                title: data.title,
                description: data.description,
                subject: data.subject,
                duration: data.duration,
                totalMarks: data.totalMarks,
                createdBy: user.id,
                questions: {
                    create: await Promise.all(
                        data.questions.map(async (q) => {
                            // Create a Question record
                            const question = await prisma.question.create({
                                data: {
                                    question_text: q.questionText,
                                    options: q.options,
                                    answer: q.answer,
                                    question_number: q.questionNumber,
                                    isQuestionImage: false,
                                    isOptionImage: false,
                                    option_images: [],
                                },
                            });
                            // Return TestQuestion data
                            return {
                                questionId: question.id,
                                marks: q.marks,
                                questionNumber: q.questionNumber,
                            };
                        })
                    ),
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
                            },
                        },
                    },
                },
                _count: {
                    select: { responses: true },
                },
            },
        });

        // Map the response to match TestWithQuestions interface
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
        };
    } catch (error) {
        console.error('Error creating test:', error);
        throw error instanceof Error ? error : new Error('Failed to create test');
    }
};

export const getTests = async (): Promise<TestWithQuestions[]> => {
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

        // Map the response to match TestWithQuestions interface
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
        }));
    } catch (error) {
        console.error('Error fetching tests:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch tests');
    }
};

export const getTestById = async (testId: string): Promise<TestWithQuestions | null> => {
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

        // Map the response to match TestWithQuestions interface
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

export const getTestAnalytics = async (testId: string): Promise<TestAnalytics> => {
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

        // Get test with responses
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
                responses: {
                    include: {
                        student: true,
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        const responses = test.responses;
        const totalStudents = responses.length;

        if (totalStudents === 0) {
            return {
                testId,
                totalStudents: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                averagePercentage: 0,
                questionAnalytics: test.questions.map((q: any) => ({
                    questionId: q.id,
                    questionNumber: q.questionNumber,
                    questionText: q.question.question_text,
                    correctAnswers: 0,
                    totalAttempts: 0,
                    accuracy: 0,
                })),
                studentAnalytics: [],
            };
        }

        // Calculate overall statistics
        const scores = responses.map((r: any) => r.score);
        const percentages = responses.map((r: any) => r.percentage);

        const averageScore = scores.reduce((a: number, b: number) => a + b, 0) / totalStudents;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const averagePercentage = percentages.reduce((a: number, b: number) => a + b, 0) / totalStudents;

        // Calculate question analytics
        const questionAnalytics = test.questions.map((question: any) => {
            let correctAnswers = 0;
            let totalAttempts = 0;

            for (const response of responses) {
                const answer = (response.answers as any[]).find((a: any) => a.questionId === question.id);
                if (answer) {
                    totalAttempts++;
                    if (answer.selectedAnswer === question.question.answer) {
                        correctAnswers++;
                    }
                }
            }

            const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

            return {
                questionId: question.id,
                questionNumber: question.questionNumber,
                questionText: question.question.question_text,
                correctAnswers,
                totalAttempts,
                accuracy,
            };
        });

        // Calculate student analytics
        const studentAnalytics = responses.map((response: any) => {
            const correctAnswers = (response.answers as any[]).filter((answer: any) => {
                const question = test.questions.find((q: any) => q.id === answer.questionId);
                return question && question.question.answer === answer.selectedAnswer;
            }).length;

            return {
                studentId: response.studentId,
                studentName: response.student.name,
                rollNumber: response.student.rollNumber,
                className: response.student.className,
                score: response.score,
                percentage: response.percentage,
                correctAnswers,
                totalQuestions: test.questions.length,
                timeTaken: response.timeTaken || undefined,
            };
        });

        return {
            testId,
            totalStudents,
            averageScore,
            highestScore,
            lowestScore,
            averagePercentage,
            questionAnalytics,
            studentAnalytics,
        };
    } catch (error) {
        console.error('Error fetching test analytics:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch test analytics');
    }
};
