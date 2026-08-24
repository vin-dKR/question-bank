import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { handleCorsResponse, handleOptionsRequest } from "@/lib/cors";
import {
    AuthError,
    assertCanMutateQuestion,
    requireApiActor,
} from "@/lib/auth/guard";

/**
 * SECURITY NOTE: before this change, PUT and DELETE here had no authentication
 * of any kind — any caller who knew a question id could rewrite or delete it,
 * cross-origin. See docs/WORKOS_MIGRATION_APPROACH.md §14.
 *
 * Callers must now present EITHER a signed-in session OR
 * `Authorization: Bearer $QUESTION_API_KEY`. The satellite tools
 * (question-editor, multi-crop, omr-checker) should use the bearer path —
 * cross-site cookies are fragile and get more so with AuthKit (doc §8).
 */

function authFailure(request: NextRequest, error: AuthError) {
    return handleCorsResponse(
        request,
        NextResponse.json({ success: false, error: error.message }, { status: error.status })
    );
}

export async function OPTIONS(request: NextRequest) {
    return handleOptionsRequest(request);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const actor = await requireApiActor(request);

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

        // A service-key caller is trusted (it is one of our own tools); a user
        // caller must own the question. Note this runs AFTER the 404 check so
        // the two cases stay distinguishable for our own tooling.
        if (actor.kind === "user") {
            await assertCanMutateQuestion(id, actor.user);
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
        if (error instanceof AuthError) return authFailure(request, error);

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

        const actor = await requireApiActor(request);

        // Check existence and ownership BEFORE deleting. The previous version
        // deleted first and then tested the result for null, which meant the
        // 404 branch was unreachable (prisma.delete throws on a missing row)
        // and an unauthorized delete had already happened by the time anything
        // was checked.
        const existingQuestion = await prisma.question.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existingQuestion) {
            const response = NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            );

            return handleCorsResponse(request, response);
        }

        if (actor.kind === "user") {
            await assertCanMutateQuestion(id, actor.user);
        }

        await prisma.question.delete({
            where: { id }
        });

        const response = NextResponse.json({
            success: true,
            message: 'Question deleted successfully'
        });

        return handleCorsResponse(request, response);
    } catch (error) {
        if (error instanceof AuthError) return authFailure(request, error);

        console.error('Error deleting question:', error);
        const response = NextResponse.json(
            { success: false, error: 'Failed to delete question' },
            { status: 500 }
        );

        return handleCorsResponse(request, response);
    }
}
