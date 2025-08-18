'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';

const UpdateQuestionInputSchema = z.object({
    id: z.string().min(1, 'Question ID is required'),
    question_text: z.string().optional(),
    options: z.array(z.string()).optional(),
});

interface UpdateQuestionResponse {
    success: boolean;
    data?: {
        id: string;
        question_text: string;
        options: string[];
    };
    error?: string;
}

export async function updateQuestionInDB(
    question: z.infer<typeof UpdateQuestionInputSchema>,
): Promise<UpdateQuestionResponse> {
    try {
        const validation = UpdateQuestionInputSchema.safeParse(question);
        if (!validation.success) {
            return {
                success: false,
                error: validation.error.errors.map((e) => e.message).join(', '),
            };
        }

        if (!question.question_text && !question.options) {
            return {
                success: false,
                error: 'At least one field (question_text or options) must be provided to update',
            };
        }

        // Update the question in the database
        const updatedQuestion = await prisma.question.update({
            where: { id: question.id },
            data: {
                question_text: question.question_text,
                options: question.options,
            },
            select: {
                id: true,
                question_text: true,
                options: true,
            },
        });

        console.log('updateQuestionInDB - Updated question:', updatedQuestion);

        return {
            success: true,
            data: updatedQuestion,
        };
    } catch (error) {
        console.error('Error updating question:', error);
        let errorMessage = 'Failed to update question';
        if (error instanceof Error) {
            errorMessage = `Failed to update question: ${error.message}`;
        } else if (typeof error === 'string') {
            errorMessage = `Failed to update question: ${error}`;
        } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = `Failed to update question: ${(error as any).message}`;
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
