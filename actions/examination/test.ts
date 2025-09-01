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

        console.log('------------DATA', data);

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
                            const question = await prisma.question.create({
                                data: {
                                    question_text: q.questionText,
                                    options: q.options,
                                    answer: q.answer, // Stored as string
                                    question_number: q.questionNumber,
                                    isQuestionImage: false,
                                    isOptionImage: false,
                                    option_images: [],
                                },
                            });
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

        return {
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => ({
                id: tq.id,
                questionText: tq.question.question_text,
                options: tq.question.options,
                answer: tq.question.answer || '', // Default to empty string
                marks: tq.marks,
                questionNumber: tq.questionNumber,
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
};

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
                        answers: {
                            select: {
                                questionId: true,
                                selectedAnswer: true,
                            },
                        },
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        const responses = test.responses;
        console.log('responses -----------------', responses);
        const totalStudents = responses.length;

        if (totalStudents === 0) {
            return {
                testId,
                totalStudents: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                averagePercentage: 0,
                questionAnalytics: test.questions.map((q) => ({
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

        const scores = responses.map((r) => r.score);
        const percentages = responses.map((r) => r.percentage);

        const averageScore = scores.reduce((a, b) => a + b, 0) / totalStudents;
        const highestScore = Math.max(...scores);
        const lowestScore = Math.min(...scores);
        const averagePercentage = percentages.reduce((a, b) => a + b, 0) / totalStudents;

        const questionAnalytics: QuestionAnalytics[] = test.questions.map((question) => {
            let correctAnswers = 0;
            let totalAttempts = 0;

            for (const response of responses) {
                const answer = response.answers?.find((a) => a.questionId === question.questionId);
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
        //WIP

        const studentAnalytics: StudentAnalytics[] = responses.map((response) => {
            const correctAnswers = response.answers?.filter((answer) => {
                const question = test.questions.find((q) => q.questionId === answer.questionId);
                return question && answer.selectedAnswer === question.question.answer;
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
                timeTaken: response.timeTaken,
            };
        });

        console.log(testId,
            totalStudents,
            averageScore,
            highestScore,
            lowestScore,
            averagePercentage,
            questionAnalytics,
            studentAnalytics,
        )

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
