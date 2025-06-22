import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleCorsResponse, handleOptionsRequest } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return handleOptionsRequest(request);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const {
            question_number,
            file_name,
            question_text,
            isQuestionImage,
            question_image,
            isOptionImage,
            options,
            option_images,
            section_name,
            question_type,
            topic,
            exam_name,
            subject,
            chapter,
            answer,
            flagged
        } = body;

        // Find the question first
        const existingQuestion = await prisma.question.findUnique({
            where: { id }
        });

        if (!existingQuestion) {
            const response = NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            );

            return handleCorsResponse(request, response);
        }

        // Update the question
        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: {
                question_number,
                file_name,
                question_text,
                isQuestionImage,
                question_image,
                isOptionImage,
                options,
                option_images,
                section_name,
                question_type,
                topic,
                exam_name,
                subject,
                chapter,
                answer,
                flagged
            }
        });

        const response = NextResponse.json({ success: true, data: updatedQuestion });

        return handleCorsResponse(request, response);
    } catch (error) {
        console.error('Error updating question:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to update question' },
            { status: 500 }
        );

        return handleCorsResponse(request, response);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find and delete the question
        const question = await prisma.question.delete({
            where: { id }
        });

        if (!question) {
            const response = NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            );

            return handleCorsResponse(request, response);
        }

        const response = NextResponse.json({
            success: true,
            message: 'Question deleted successfully'
        });

        return handleCorsResponse(request, response);
    } catch (error) {
        console.error('Error deleting question:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to delete question' },
            { status: 500 }
        );

        return handleCorsResponse(request, response);
    }
} 
