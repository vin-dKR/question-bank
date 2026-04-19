"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateQuestionInDB } from "@/actions/question/questionUpdate";

/**
 * Input shape mirrors the server action: `id` + either `question_text` and/or
 * `options`. Everything else on the cached Question row is untouched.
 */
export interface UpdateQuestionInput {
    id: string;
    question_text?: string;
    options?: string[];
}

type InfiniteQuestionsData = {
    pages: Array<{ items: Question[]; nextCursor: string | null }>;
    pageParams: unknown[];
};

/**
 * Phase 7 mutation hook wrapping `updateQuestionInDB`.
 *
 * Optimistic strategy:
 *   - Snapshot every cached `["questions", ...]` entry (list + search buckets
 *     live under the same top-level key, so a single `cancelQueries` +
 *     `getQueriesData` covers both).
 *   - Walk each cached page's `items` and patch the matching row with
 *     `question_text` / `options` from the input (preserves every other
 *     field — including `flagged`, images, exam/subject metadata).
 *   - On error, restore every snapshot verbatim and surface a toast so the
 *     user sees the same "Failed to update" feedback the old reducer gave.
 *   - On settled, invalidate `["questions"]` to pull the canonical row back.
 *
 * `["filterOptions"]` is NOT invalidated — text/options edits don't change
 * the distinct set of exams/subjects/chapters/types, so the filter option
 * cache stays hot.
 */
export function useUpdateQuestion() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (input: UpdateQuestionInput) => {
            const res = await updateQuestionInDB({
                id: input.id,
                question_text: input.question_text,
                options: input.options,
            });
            if (!res.success) {
                throw new Error(res.error || "Failed to update question");
            }
            return res.data;
        },
        onMutate: async (input) => {
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
                            items: page.items.map((q) =>
                                q.id === input.id
                                    ? {
                                          ...q,
                                          question_text:
                                              input.question_text ?? q.question_text,
                                          options: input.options ?? q.options,
                                      }
                                    : q,
                            ),
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
            // Consumers drive their own success messaging — the refine/undo
            // flows in QuestionList have context-specific copy we shouldn't
            // override with a generic "Question updated" toast.
            qc.invalidateQueries({ queryKey: ["questions"] });
        },
    });
}
