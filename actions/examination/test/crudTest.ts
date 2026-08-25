'use server';

import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth/session';
export const createTest = async (data: CreateTestData): Promise<Partial<ExaminationTest>> => {
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
        if (data.omrPaperId && !/^[A-Fa-f0-9]{24}$/.test(data.omrPaperId)) {
            throw new Error('Invalid OMR paper ID');
        }

        // console.log('------------DATA', data);

        const test = await prisma.test.create({
            data: {
                ...(data.omrPaperId ? { id: data.omrPaperId } : {}),
                title: data.title,
                description: data.description,
                subject: data.subject,
                // Nullable and always will be: tests created before classes
                // existed have none, and a teacher may legitimately set a paper
                // without tying it to a roster.
                classId: data.classId ?? null,
                duration: typeof data.duration === 'string' ? parseInt(data.duration) : data.duration,
                totalMarks: data.totalMarks,
                createdBy: user.id,
                questions: {
                    // School-test questions live in a separate collection; route
                    // the `connect` to the right relation based on the source
                    // flag that travelled with the question through sessionStorage.
                    create: data.questions.map(q =>
                        q.source === 'school-test'
                            ? {
                                schoolTestQuestion: { connect: { id: q.id } },
                                marks: q.marks,
                                questionNumber: q.question_number,
                            }
                            : {
                                question: { connect: { id: q.id } },
                                marks: q.marks,
                                questionNumber: q.question_number,
                            },
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
                                topic: true,
                                question_type: true,
                                section_name: true,
                                exam_name: true,
                                subject: true,
                                chapter: true,
                            },
                        },
                        schoolTestQuestion: {
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
                                question_image: true,
                                baseImage: true,
                                cropBbox: true,
                                sourceWidth: true,
                                sourceHeight: true,
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
            questions: test.questions.map((tq) => {
                const q = tq.question ?? tq.schoolTestQuestion;
                return {
                    id: tq.id,
                    questionText: q?.question_text ?? '',
                    options: q?.options ?? [],
                    answer: q?.answer || '',
                    marks: tq.marks,
                    questionNumber: tq.questionNumber,
                    topic: q?.topic ?? null,
                    questionType: q?.question_type ?? null,
                    sectionName: q?.section_name ?? null,
                    examName: q?.exam_name ?? null,
                    subject: q?.subject ?? null,
                    chapter: q?.chapter ?? null,
                };
            }),
            _count: test._count,
        };
    } catch (error) {
        console.error('Error creating test:', error);
        throw error instanceof Error ? error : new Error('Failed to create test');
    }
};

export interface GetTestsArgs {
    skip?: number;
    take?: number;
}

export interface GetTestsResult {
    items: Partial<ExaminationTest>[];
    total: number;
    hasMore: boolean;
}

/**
 * Fetch tests owned by the current user with optional pagination.
 *
 * Backwards compatibility: when called with no args (or empty object), the
 * result shape is still `{ items, total, hasMore }`. Old callers that expected
 * an array should use `result.items`. Verified at migration time that the only
 * caller was `components/examination/TestDashboard.tsx`, which has been
 * updated in the same change set.
 *
 * Defaults: `take = 20`, `skip = 0`.
 */
export const getTests = async (
    args: GetTestsArgs = {},
): Promise<GetTestsResult> => {
    const { skip = 0, take = 20 } = args;

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
        const where = { createdBy: user.id } as const;

        const [tests, total] = await Promise.all([
            prisma.test.findMany({
                where,
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
                            schoolTestQuestion: {
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
                skip,
                take,
            }),
            prisma.test.count({ where }),
        ]);

        const items = tests.map((test) => ({
            ...test,
            description: test.description,
            questions: test.questions.map((tq) => {
                const q = tq.question ?? tq.schoolTestQuestion;
                return {
                    id: tq.id,
                    questionText: q?.question_text ?? '',
                    options: q?.options ?? [],
                    answer: q?.answer || '',
                    marks: tq.marks,
                    questionNumber: tq.questionNumber,
                };
            }),
            _count: test._count,
        }));

        return {
            items,
            total,
            hasMore: skip + items.length < total,
        };
    } catch (error) {
        console.error('Error fetching tests:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch tests');
    }
};

export const getTestById = async (testId: string): Promise<Partial<ExaminationTest> | null> => {
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
                                options: true,
                                answer: true,
                            },
                        },
                        schoolTestQuestion: {
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
            questions: test.questions.map((tq) => {
                const q = tq.question ?? tq.schoolTestQuestion;
                return {
                    id: tq.id,
                    questionText: q?.question_text ?? '',
                    options: q?.options ?? [],
                    answer: q?.answer || '',
                    marks: tq.marks,
                    questionNumber: tq.questionNumber,
                };
            }),
            _count: test._count,
        };
    } catch (error) {
        console.error('Error fetching test:', error);
        throw error instanceof Error ? error : new Error('Failed to fetch test');
    }
};

export const deleteTest = async (testId: string): Promise<void> => {
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
