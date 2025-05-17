'use server';

import prisma from '@/lib/prisma';
import { Question } from '@/generated/prisma';

export async function createQuestion(questionData: Omit<Question, 'id'>) {
    try {
        const newQuestion = await prisma.question.create({
            data: questionData
        });
        return { success: true, data: newQuestion };
    } catch (error) {
        console.error('Error creating question:', error);
        return { success: false, error: 'Failed to create question' };
    }
}

export async function updateQuestion(id: string, questionData: Partial<Question>) {
    try {
        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: questionData
        });
        return { success: true, data: updatedQuestion };
    } catch (error) {
        console.error('Error updating question:', error);
        return { success: false, error: 'Failed to update question' };
    }
}

export async function deleteQuestion(id: string) {
    try {
        await prisma.question.delete({
            where: { id }
        });
        return { success: true };
    } catch (error) {
        console.error('Error deleting question:', error);
        return { success: false, error: 'Failed to delete question' };
    }
}
