'use server';

import prisma from '@/lib/prisma';

interface UpdateQuestionInput
    extends Partial<
        Pick<
            Question,
            | "question_text"
            | "options"
            | "answer"
            | "question_image"
            | "option_images"
            | "isQuestionImage"
            | "isOptionImage"
            | "section_name"
            | "question_type"
            | "topic"
            | "exam_name"
            | "subject"
            | "chapter"
            | "folderId"
        >
    > { }


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


{/*
export async function updateQuestion(fileName: string, updates: UpdateQuestionInput) {
    try {
        const updatedQuestion = await prisma.question.update({
            where: { file_name: fileName },
            data: {
                question_text: updates.question_text,
                options: updates.options,
                answer: updates.answer,
                question_image: updates.question_image,
                option_images: updates.option_images,
                isQuestionImage: updates.isQuestionImage,
                isOptionImage: updates.isOptionImage,
                section_name: updates.section_name,
                question_type: updates.question_type,
                topic: updates.topic,
                exam_name: updates.exam_name,
                subject: updates.subject,
                chapter: updates.chapter,
                folderId: updates.folderId,
            },
        });

        return { success: true, data: updatedQuestion };
    } catch (error) {
        console.error("Error updating question:", error);
        return { success: false, error: "Failed to update question" };
    }
}
*/}



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
