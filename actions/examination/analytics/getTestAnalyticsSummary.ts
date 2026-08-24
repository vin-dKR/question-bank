'use server';

import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/session';
export interface TopStudentEntry {
    studentId: string;
    studentName: string;
    rollNumber: string;
    className: string;
    score: number;
    percentage: number;
    timeTaken: number | null;
    submittedAt: Date;
}

export interface TestAnalyticsSummary {
    testId: string;
    title: string;
    subject: string;
    totalMarks: number;
    totalStudents: number;
    averageScore: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
    topStudents: TopStudentEntry[];
}

const TOP_N = 10;

/**
 * Lightweight analytics overview for a test.
 *
 * Returns aggregate counts, averages, extrema, and the top-N students by
 * score. Does NOT load per-response answer graphs — use
 * `getTestAnalyticsDetail` for drill-down.
 *
 * Shape is cheap and cacheable (bounded by `TOP_N`, independent of response
 * count). Suitable for `staleTime > 0` in TanStack Query.
 */
export const getTestAnalyticsSummary = async (
    testId: string,
): Promise<TestAnalyticsSummary> => {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({
            where: { id: ctx.userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Ownership check + overview fields + top-N responses in a single
        // round-trip. Prisma compiles this to one Mongo pipeline.
        const test = await prisma.test.findFirst({
            where: { id: testId, createdBy: user.id },
            select: {
                id: true,
                title: true,
                subject: true,
                totalMarks: true,
                _count: { select: { responses: true } },
                responses: {
                    orderBy: { score: 'desc' },
                    take: TOP_N,
                    select: {
                        studentId: true,
                        score: true,
                        percentage: true,
                        timeTaken: true,
                        submittedAt: true,
                        student: {
                            select: {
                                name: true,
                                rollNumber: true,
                                className: true,
                            },
                        },
                    },
                },
            },
        });

        if (!test) {
            throw new Error('Test not found');
        }

        const totalStudents = test._count.responses;

        if (totalStudents === 0) {
            return {
                testId,
                title: test.title,
                subject: test.subject,
                totalMarks: test.totalMarks,
                totalStudents: 0,
                averageScore: 0,
                averagePercentage: 0,
                highestScore: 0,
                lowestScore: 0,
                topStudents: [],
            };
        }

        // Separate aggregation for averages / min — this keeps the primary
        // query bounded regardless of response volume.
        const agg = await prisma.studentResponse.aggregate({
            where: { testId },
            _avg: { score: true, percentage: true },
            _max: { score: true },
            _min: { score: true },
        });

        const topStudents: TopStudentEntry[] = test.responses.map((r) => ({
            studentId: r.studentId,
            studentName: r.student.name,
            rollNumber: r.student.rollNumber,
            className: r.student.className,
            score: r.score,
            percentage: r.percentage,
            timeTaken: r.timeTaken,
            submittedAt: r.submittedAt,
        }));

        return {
            testId,
            title: test.title,
            subject: test.subject,
            totalMarks: test.totalMarks,
            totalStudents,
            averageScore: agg._avg.score ?? 0,
            averagePercentage: agg._avg.percentage ?? 0,
            highestScore: agg._max.score ?? 0,
            lowestScore: agg._min.score ?? 0,
            topStudents,
        };
    } catch (error) {
        console.error('Error fetching test analytics summary:', error);
        throw error instanceof Error
            ? error
            : new Error('Failed to fetch test analytics summary');
    }
};
