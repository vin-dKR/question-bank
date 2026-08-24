'use server';

import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/session';
import { normalizeChoiceKey } from '@/lib/examination/answerKey';

export interface TestAnalyticsDetailArgs {
    cursor?: string;
    take?: number;
}

export interface ChapterAnalyticsEntry {
    chapter: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
}

export interface TopicAnalyticsEntry {
    topic: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
}

export interface ResponseDetailEntry {
    responseId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    className: string;
    score: number;
    percentage: number;
    totalMarks: number;
    correctAnswers: number;
    totalQuestions: number;
    timeTaken: number | null;
    submittedAt: Date;
    chapterAnalytics: ChapterAnalyticsEntry[];
    topicAnalytics: TopicAnalyticsEntry[];
}

export interface TestAnalyticsDetail {
    items: ResponseDetailEntry[];
    nextCursor: string | null;
}

const DEFAULT_TAKE = 25;

/**
 * Paginated per-student response detail for a test.
 *
 * Uses cursor pagination on `StudentResponse.id` with a stable `score desc,
 * id asc` ordering. `nextCursor` is `null` when the page is the last one.
 *
 * Per-student chapter/topic accuracy is computed server-side from the test's
 * question-source map, which is loaded once per call (bounded by the number
 * of questions in the test).
 *
 * Wire through `useInfiniteQuery` on the client.
 */
export const getTestAnalyticsDetail = async (
    testId: string,
    args: TestAnalyticsDetailArgs = {},
): Promise<TestAnalyticsDetail> => {
    const { cursor, take = DEFAULT_TAKE } = args;

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
        // Load the test with its question source map in one round-trip. This
        // doubles as an ownership check.
        const test = await prisma.test.findFirst({
            where: { id: testId, createdBy: user.id },
            select: {
                id: true,
                totalMarks: true,
                questions: {
                    select: {
                        questionId: true,
                        marks: true,
                        question: {
                            select: {
                                id: true,
                                answer: true,
                                options: true,
                                chapter: true,
                                topic: true,
                            },
                        },
                        schoolTestQuestion: {
                            select: {
                                id: true,
                                answer: true,
                                options: true,
                                chapter: true,
                                topic: true,
                            },
                        },
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        // Build a lookup by the underlying question id — TestAnswer.questionId
        // references the Question (not SchoolTestQuestion), which is why the
        // original analytics code matched on `q.questionId`.
        const questionMap = new Map<
            string,
            { answer: string | null; options: string[]; chapter: string | null; topic: string | null; marks: number }
        >();
        for (const tq of test.questions) {
            const src = tq.question ?? tq.schoolTestQuestion;
            if (src) {
                questionMap.set(src.id, {
                    answer: src.answer ?? null,
                    options: src.options ?? [],
                    chapter: src.chapter ?? null,
                    topic: src.topic ?? null,
                    marks: tq.marks,
                });
            }
        }

        const totalQuestions = test.questions.length;

        // Request one extra row to determine whether there is a next page.
        const responses = await prisma.studentResponse.findMany({
            where: { testId },
            orderBy: [{ score: 'desc' }, { id: 'asc' }],
            take: take + 1,
            ...(cursor
                ? { cursor: { id: cursor }, skip: 1 }
                : {}),
            select: {
                id: true,
                studentId: true,
                score: true,
                percentage: true,
                totalMarks: true,
                timeTaken: true,
                submittedAt: true,
                student: {
                    select: {
                        name: true,
                        rollNumber: true,
                        className: true,
                    },
                },
                answers: {
                    select: {
                        questionId: true,
                        selectedAnswer: true,
                    },
                },
            },
        });

        const hasMore = responses.length > take;
        const pageRows = hasMore ? responses.slice(0, take) : responses;
        const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

        const items: ResponseDetailEntry[] = pageRows.map((r) => {
            let correctAnswers = 0;
            const chapterMap: Record<string, { total: number; correct: number }> = {};
            const topicMap: Record<string, { total: number; correct: number }> = {};

            for (const ans of r.answers) {
                const src = questionMap.get(ans.questionId);
                if (!src) continue;

                const chapter = src.chapter ?? 'Unknown Chapter';
                const topic = src.topic ?? 'Unknown Topic';

                if (!chapterMap[chapter]) chapterMap[chapter] = { total: 0, correct: 0 };
                if (!topicMap[topic]) topicMap[topic] = { total: 0, correct: 0 };

                chapterMap[chapter].total += 1;
                topicMap[topic].total += 1;

                const selectedKey = normalizeChoiceKey(ans.selectedAnswer, src.options);
                const correctKey = normalizeChoiceKey(src.answer, src.options);
                if (selectedKey && correctKey && selectedKey === correctKey) {
                    correctAnswers += 1;
                    chapterMap[chapter].correct += 1;
                    topicMap[topic].correct += 1;
                }
            }

            const chapterAnalytics: ChapterAnalyticsEntry[] = Object.entries(chapterMap).map(
                ([chapter, { total, correct }]) => ({
                    chapter,
                    totalQuestions: total,
                    correctAnswers: correct,
                    accuracy: total > 0 ? (correct / total) * 100 : 0,
                }),
            );

            const topicAnalytics: TopicAnalyticsEntry[] = Object.entries(topicMap).map(
                ([topic, { total, correct }]) => ({
                    topic,
                    totalQuestions: total,
                    correctAnswers: correct,
                    accuracy: total > 0 ? (correct / total) * 100 : 0,
                }),
            );

            return {
                responseId: r.id,
                studentId: r.studentId,
                studentName: r.student.name,
                rollNumber: r.student.rollNumber,
                className: r.student.className,
                score: r.score,
                percentage: r.percentage,
                totalMarks: r.totalMarks,
                correctAnswers,
                totalQuestions,
                timeTaken: r.timeTaken,
                submittedAt: r.submittedAt,
                chapterAnalytics,
                topicAnalytics,
            };
        });

        return { items, nextCursor };
    } catch (error) {
        console.error('Error fetching test analytics detail:', error);
        throw error instanceof Error
            ? error
            : new Error('Failed to fetch test analytics detail');
    }
};
