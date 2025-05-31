import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
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
            answer
        } = body;
        
        // Find the question first
        const existingQuestion = await prisma.question.findUnique({
            where: { id }
        });
        
        if (!existingQuestion) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            );
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
                answer
            }
        });
        
        return NextResponse.json({ success: true, data: updatedQuestion });
    } catch (error) {
        console.error('Error updating question:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update question' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        
        // Find and delete the question
        const question = await prisma.question.delete({
            where: { id }
        });
        
        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ 
            success: true, 
            message: 'Question deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete question' },
            { status: 500 }
        );
    }
} 