'use server';

import prisma from '@/lib/prisma';

export async function getQuestions(filters: {
    exam_name?: string;
    subject?: string;
    chapter?: string;
    section_name?: string;
    flagged?: boolean;
    limit?: number;
    skip?: number;
}) {
    try {
        const questions = await prisma.question.findMany({
            where: {
                exam_name: filters.exam_name,
                subject: filters.subject,
                chapter: filters.chapter,
                section_name: filters.section_name,
                flagged: filters.flagged,
            },
            select: {
                id: true,
                question_number: true,
                question_text: true,
                options: true,
                answer: true,
                subject: true,
                exam_name: true,
                chapter: true,
                section_name: true,
                flagged: true,
            },
            take: filters.limit,
            skip: filters.skip,
            orderBy: {
                question_number: 'asc',
            },
        });
        return { success: true, data: questions };
    } catch (error) {
        console.error('Error fetching questions:', error);
        return { success: false, data: [], error: 'Failed to fetch questions' };
    }
}

export async function getQuestionCount(filters: {
    exam_name?: string;
    subject?: string;
    chapter?: string;
    section_name?: string;
    flagged?: boolean;
}) {
    try {
        const count = await prisma.question.count({
            where: {
                exam_name: filters.exam_name,
                subject: filters.subject,
                chapter: filters.chapter,
                section_name: filters.section_name,
                flagged: filters.flagged,
            },
        });
        return { success: true, data: count };
    } catch (error) {
        console.error('Error counting questions:', error);
        return { success: false, data: 0, error: 'Failed to count questions' };
    }
}

export async function getFilterOptions(filters: {
    exam_name?: string;
    subject?: string;
    chapter?: string;
}) {
    try {
        const [exams, subjects, chapters, sections] = await Promise.all([
            prisma.question.findMany({
                select: { exam_name: true },
                distinct: ['exam_name'],
                where: {
                    exam_name: { not: null },
                },
            }),
            prisma.question.findMany({
                select: { subject: true },
                distinct: ['subject'],
                where: {
                    exam_name: filters.exam_name || undefined,
                    subject: { not: null },
                },
            }),
            prisma.question.findMany({
                select: { chapter: true },
                distinct: ['chapter'],
                where: {
                    exam_name: filters.exam_name || undefined,
                    subject: filters.subject || undefined,
                    chapter: { not: null },
                },
            }),
            prisma.question.findMany({
                select: { section_name: true },
                distinct: ['section_name'],
                where: {
                    exam_name: filters.exam_name || undefined,
                    subject: filters.subject || undefined,
                    chapter: filters.chapter || undefined,
                    section_name: { not: null },
                },
            }),
        ]);

        return {
            success: true,
            data: {
                exams: exams.map((e) => e.exam_name).filter((e): e is string => !!e),
                subjects: subjects.map((s) => s.subject).filter((s): s is string => !!s),
                chapters: chapters.map((c) => c.chapter).filter((c): c is string => !!c),
                section_names: sections.map((s) => s.section_name).filter((s): s is string => !!s),
            },
        };
    } catch (error) {
        console.error('Error fetching filter options:', error);
        return {
            success: false,
            data: { exams: [], subjects: [], chapters: [], section_names: [] },
            error: 'Failed to fetch filter options',
        };
    }
}

export async function selectFlagged(id: string) {
    try {
        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                flagged: true,
            },
            select: {
                id: true,
                flagged: true,
            },
        });
        return { success: true, data: updatedQuestion };
    } catch (error) {
        console.error('Error setting question flag:', error);
        return { success: false, data: null, error: 'Failed to set question flag' };
    }
}

export async function toggleFlag(id: string) {
    try {
        const question = await prisma.question.findUnique({
            where: { id },
            select: { flagged: true },
        });

        if (!question) {
            throw new Error('Question not found');
        }

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                flagged: !question.flagged,
            },
            select: {
                id: true,
                flagged: true,
            },
        });
        return { success: true, data: updatedQuestion };
    } catch (error) {
        console.error('Error toggling question flag:', error);
        return { success: false, data: null, error: 'Failed to toggle question flag' };
    }
}

export async function searchQuestions(keyword: string) {
    if (!keyword || keyword.trim().length < 2) {
        return { success: false, data: [], error: 'Keyword must be at least 2 characters' };
    }

    try {
        const questions = await prisma.question.findMany({
            where: {
                OR: [
                    { question_text: { contains: keyword, mode: 'insensitive' } },
                    { options: { has: keyword } },
                ],
            },
            select: {
                id: true,
                question_text: true,
                options: true,
                question_image: true,
                exam_name: true,
                subject: true,
                chapter: true,
                section_name: true,
                flagged: true,
            },
            take: 50,
        });
        return { success: true, data: questions };
    } catch (error) {
        console.error('Error searching questions:', error);
        return { success: false, data: [], error: 'Failed to search questions' };
    }
}
