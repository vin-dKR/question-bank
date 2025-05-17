'use server';

import prisma from '@/lib/prisma';

export async function getQuestions(filters: {
    exam_name?: string;
    subject?: string;
    chapter?: string;
    limit?: number;
    skip?: number;
}) {
    try {
        const questions = await prisma.question.findMany({
            where: {
                exam_name: filters.exam_name,
                subject: filters.subject,
                chapter: filters.chapter
            },
            select: {
                id: true,
                question_number: true,
                question_text: true,
                options: true,
                answer: true,
                subject: true,
                exam_name: true,
                chapter: true
            },
            take: filters.limit,
            skip: filters.skip,
            orderBy: {
                question_number: 'asc'
            }
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
}) {
    try {
        const count = await prisma.question.count({
            where: {
                exam_name: filters.exam_name,
                subject: filters.subject,
                chapter: filters.chapter
            }
        });
        return { success: true, data: count };
    } catch (error) {
        console.error('Error counting questions:', error);
        return { success: false, data: 0, error: 'Failed to count questions' };
    }
}
