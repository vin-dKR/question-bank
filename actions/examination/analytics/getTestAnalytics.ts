'use server';

import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

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
                                answer: true,
                                topic: true,
                                chapter: true,
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
                    chapter: q.question.chapter ?? 'Unknown',
                    topic: q.question.topic ?? 'Unknown',
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
                chapter: question.question.chapter ?? 'Unknown',
                topic: question.question.topic ?? 'Unknown',
            };
        });

        const studentAnalytics: StudentAnalytics[] = responses.map((response) => {
            let correctAnswers = 0;
            let calculatedScore = 0;
            const chapterMap: Record<string, { total: number; correct: number }> = {};
            const topicMap: Record<string, { total: number; correct: number }> = {};

            for (const answer of response.answers || []) {
                const question = test.questions.find((q) => q.questionId === answer.questionId);
                if (question) {
                    const chapter = question.question.chapter ?? 'Unknown Chapter';
                    if (!chapterMap[chapter]) {
                        chapterMap[chapter] = { total: 0, correct: 0 };
                    }
                    chapterMap[chapter].total += 1;

                    const topic = question.question.topic ?? 'Unknown Topic';
                    if (!topicMap[topic]) {
                        topicMap[topic] = { total: 0, correct: 0 };
                    }
                    topicMap[topic].total += 1;

                    if (answer.selectedAnswer === question.question.answer) {
                        correctAnswers++;
                        calculatedScore += question.marks;
                        chapterMap[chapter].correct += 1;
                        topicMap[topic].correct += 1;
                    }
                }
            }

            const chapterAnalytics = Object.entries(chapterMap).map(([chapter, { total, correct }]) => ({
                chapter,
                totalQuestions: total,
                correctAnswers: correct,
                accuracy: total > 0 ? (correct / total) * 100 : 0,
            }));

            const topicAnalytics = Object.entries(topicMap).map(([topic, { total, correct }]) => ({
                topic,
                totalQuestions: total,
                correctAnswers: correct,
                accuracy: total > 0 ? (correct / total) * 100 : 0,
            }));

            return {
                studentId: response.studentId,
                studentName: response.student.name,
                rollNumber: response.student.rollNumber,
                className: response.student.className,
                score: calculatedScore,
                percentage: test.totalMarks > 0 ? (calculatedScore / test.totalMarks) * 100 : 0,
                correctAnswers,
                totalQuestions: test.questions.length,
                timeTaken: response.timeTaken,
                chapterAnalytics,
                topicAnalytics,
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
