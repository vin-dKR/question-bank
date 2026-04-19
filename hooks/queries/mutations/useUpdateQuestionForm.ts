"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Question as PrismaQuestion } from "@/generated/prisma";
import { updateQuestion as updateQuestionFull } from "@/actions/question/insert";

export interface UpdateQuestionFormInput {
    id: string;
    data: Partial<PrismaQuestion>;
}

type InfiniteQuestionsData = {
    pages: Array<{ items: Question[]; nextCursor: string | null }>;
    pageParams: unknown[];
};

/**
 * Phase 7 mutation hook for the full question-form edit path
 * (`actions/question/insert.ts → updateQuestion`), distinct from the
 * narrower `updateQuestionInDB` (text/options only). Used by the question
 * form in `hooks/question/insert.ts` to persist every field.
 *
 * Optimistic strategy:
 *   - We only apply fields that overlap with the cached `Question` shape
 *     (select-narrowed in `actions/question/questionBank.ts`). Fields like
 *     `question_number`, `file_name`, `topic`, `isQuestionImage` are written
 *     but aren't present on the list cache — they're simply ignored in the
 *     patch step.
 *
 * Filter-option invalidation: a full form edit CAN change the distinct sets
 * (e.g. subject/exam/chapter rename). Invalidate to be safe.
 */
export function useUpdateQuestionForm() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: UpdateQuestionFormInput) => {
            const res = await updateQuestionFull(id, data);
            if (!res.success) {
                throw new Error(res.error || "Failed to update question");
            }
            return res.data;
        },
        onMutate: async ({ id, data }) => {
            await qc.cancelQueries({ queryKey: ["questions"] });

            const previous = qc.getQueriesData<InfiniteQuestionsData>({
                queryKey: ["questions"],
            });

            qc.setQueriesData<InfiniteQuestionsData>(
                { queryKey: ["questions"] },
                (old) => {
                    if (!old?.pages) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            items: page.items.map((q) => {
                                if (q.id !== id) return q;
                                const next: Question = { ...q };
                                // Cherry-pick the fields that are actually on
                                // the list-cache Question shape. Everything
                                // else (question_number, topic, file_name,
                                // isQuestionImage, etc.) is persisted by the
                                // server but not displayed in the list.
                                if (data.question_text !== undefined)
                                    next.question_text = data.question_text;
                                if (data.options !== undefined)
                                    next.options = data.options;
                                if (data.option_images !== undefined)
                                    next.option_images = data.option_images;
                                if (data.question_image !== undefined)
                                    next.question_image = data.question_image;
                                if (data.isOptionImage !== undefined)
                                    next.isOptionImage = data.isOptionImage;
                                if (data.answer !== undefined) next.answer = data.answer;
                                if (data.exam_name !== undefined)
                                    next.exam_name = data.exam_name;
                                if (data.subject !== undefined) next.subject = data.subject;
                                if (data.chapter !== undefined) next.chapter = data.chapter;
                                if (data.section_name !== undefined)
                                    next.section_name = data.section_name;
                                if (data.flagged !== undefined) next.flagged = data.flagged;
                                return next;
                            }),
                        })),
                    };
                },
            );

            return { previous };
        },
        onError: (err, _input, ctx) => {
            ctx?.previous.forEach(([key, data]) => {
                qc.setQueryData(key, data);
            });
            toast.error(
                err instanceof Error ? err.message : "Failed to update question",
            );
        },
        onSettled: () => {
            // Success messaging is the form caller's responsibility.
            qc.invalidateQueries({ queryKey: ["questions"] });
            qc.invalidateQueries({ queryKey: ["filterOptions"] });
        },
    });
}
