'use server';

import prisma from '@/lib/prisma';
import { Question } from '@/generated/prisma';
import {
    AuthError,
    assertCanMutateQuestion,
    requireUser,
} from '@/lib/auth/guard';

/**
 * SECURITY NOTE: every export in this file is a Next.js server action, which
 * compiles to a public HTTP endpoint. "It's only called from the admin UI" is
 * not access control — anything exported here must check the caller itself.
 * See docs/WORKOS_MIGRATION_APPROACH.md §14.
 */

function toErrorResponse(error: unknown, fallback: string) {
    if (error instanceof AuthError) {
        return { success: false as const, error: error.message, status: error.status };
    }
    console.error(fallback, error);
    return { success: false as const, error: fallback };
}

export async function createQuestion(
    questionData: Omit<Question, 'id' | 'organizationId'>
) {
    try {
        // Creating is open to any signed-in user: a question you upload is
        // yours.
        const user = await requireUser();

        const newQuestion = await prisma.question.create({
            data: {
                ...questionData,
                // Stamped from the SESSION, never accepted from the caller —
                // otherwise anyone could post a question into another tenant's
                // org, or into the shared bank. The two cases are doc §13:
                //   admin  -> null, i.e. the global shared bank, read-only to orgs
                //   anyone -> their own org, readable and writable only by them
                organizationId: user.isAdmin ? null : user.organizationId,
            },
        });
        // `as const` matters: without it TS widens `success` to `boolean`, the
        // return type stops being a discriminated union, and callers doing
        // `if (!res.success) { ...res.error }` fail to compile. Three hooks were
        // already broken this way before this change.
        return { success: true as const, data: newQuestion };
    } catch (error) {
        return toErrorResponse(error, 'Failed to create question');
    }
}

export async function updateQuestion(id: string, questionData: Partial<Question>) {
    try {
        const user = await requireUser();
        await assertCanMutateQuestion(id, user);

        // `id` and `organizationId` are stripped so a caller can neither move a
        // question to a different id nor hand ownership of it to another org.
        const safeData: Record<string, unknown> = { ...questionData };
        delete safeData.id;
        delete safeData.organizationId;

        const updatedQuestion = await prisma.question.update({
            where: { id },
            data: safeData as Partial<Question>
        });
        return { success: true as const, data: updatedQuestion };
    } catch (error) {
        return toErrorResponse(error, 'Failed to update question');
    }
}

export async function deleteQuestion(id: string) {
    try {
        const user = await requireUser();
        await assertCanMutateQuestion(id, user);

        await prisma.question.delete({
            where: { id }
        });
        return { success: true as const };
    } catch (error) {
        return toErrorResponse(error, 'Failed to delete question');
    }
}
