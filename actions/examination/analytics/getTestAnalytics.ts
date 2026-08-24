'use server';

import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/session';
import { normalizeChoiceKey } from '@/lib/examination/answerKey';

/**
 * @deprecated Use `getTestAnalyticsSummary` for overview metrics and
 * `getTestAnalyticsDetail` for paginated per-student detail. This function
 * pulls the entire response graph in one round-trip and does not scale past
 * a few hundred students. Scheduled for removal in a later cleanup phase.
 */
export const getTestAnalytics = async (testId: string): Promise<TestAnalytics> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            throw new Error('Unauthorized');
        }

        // getAuthContext() has already resolved — and if necessary created —
        // this user, so ctx.userId is authoritative. Re-querying it was a
        // leftover from the Clerk migration, where this lookup translated a
        // Clerk id into a local one. That translation no longer exists.
        const user = { id: ctx.userId };
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
                                options: true,
                                topic: true,
                                chapter: true,
                            },
                        },
                        schoolTestQuestion: {
                            select: {
                                id: true,
                                question_text: true,
                                answer: true,
                                options: true,
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
                questionAnalytics: test.questions.map((q) => {
                    const src = q.question ?? q.schoolTestQuestion;
                    return {
                        questionId: q.id,
                        questionNumber: q.questionNumber,
                        questionText: src?.question_text ?? '',
                        correctAnswers: 0,
                        totalAttempts: 0,
                        accuracy: 0,
                        chapter: src?.chapter ?? 'Unknown',
                        topic: src?.topic ?? 'Unknown',
                    };
                }),
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
            const src = question.question ?? question.schoolTestQuestion;
            let correctAnswers = 0;
            let totalAttempts = 0;

            for (const response of responses) {
                const answer = response.answers?.find((a) => src && a.questionId === src.id);
                if (answer) {
                    totalAttempts++;
                    const selectedKey = normalizeChoiceKey(answer.selectedAnswer, src?.options ?? []);
                    const correctKey = normalizeChoiceKey(src?.answer, src?.options ?? []);
                    if (selectedKey && correctKey && selectedKey === correctKey) {
                        correctAnswers++;
                    }
                }
            }

            const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

            return {
                questionId: question.id,
                questionNumber: question.questionNumber,
                questionText: src?.question_text ?? '',
                correctAnswers,
                totalAttempts,
                accuracy,
                chapter: src?.chapter ?? 'Unknown',
                topic: src?.topic ?? 'Unknown',
            };
        });

        const studentAnalytics: StudentAnalytics[] = responses.map((response) => {
            let correctAnswers = 0;
            let calculatedScore = 0;
            const chapterMap: Record<string, { total: number; correct: number }> = {};
            const topicMap: Record<string, { total: number; correct: number }> = {};

            for (const answer of response.answers || []) {
                const question = test.questions.find((q) => {
                    const src = q.question ?? q.schoolTestQuestion;
                    return src?.id === answer.questionId;
                });
                if (question) {
                    const src = question.question ?? question.schoolTestQuestion;
                    const chapter = src?.chapter ?? 'Unknown Chapter';
                    if (!chapterMap[chapter]) {
                        chapterMap[chapter] = { total: 0, correct: 0 };
                    }
                    chapterMap[chapter].total += 1;

                    const topic = src?.topic ?? 'Unknown Topic';
                    if (!topicMap[topic]) {
                        topicMap[topic] = { total: 0, correct: 0 };
                    }
                    topicMap[topic].total += 1;

                    const selectedKey = normalizeChoiceKey(answer.selectedAnswer, src?.options ?? []);
                    const correctKey = normalizeChoiceKey(src?.answer, src?.options ?? []);
                    if (selectedKey && correctKey && selectedKey === correctKey) {
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
