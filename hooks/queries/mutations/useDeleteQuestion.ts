"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteQuestion } from "@/actions/question/insert";

export interface DeleteQuestionInput {
    id: string;
}

type InfiniteQuestionsData = {
    pages: Array<{ items: Question[]; nextCursor: string | null }>;
    pageParams: unknown[];
};

/**
 * Phase 7 mutation hook wrapping `deleteQuestion`.
 *
 * Optimistic strategy:
 *   - Filter the deleted row out of every cached page's `items` across every
 *     `["questions", ...]` cache bucket (list + search).
 *   - `nextCursor` is preserved as-is — it's based on the server's ordering
 *     key (question id) and doesn't need to shift when a middle row is
 *     optimistically removed. The post-settle invalidation re-syncs.
 *   - Rollback restores the full snapshot so the row reappears on failure.
 *
 * Filter-option invalidation: a delete CAN change distinct exam_name /
 * subject / chapter / section_name / question_type sets if the deleted row
 * was the last holder of a given value. We invalidate `["filterOptions"]`
 * to cover that case — it's a 15min-stale cache so the cost of an extra
 * aggregation per delete is tolerable.
 */
export function useDeleteQuestion() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (input: DeleteQuestionInput) => {
            const res = await deleteQuestion(input.id);
            if (!res.success) {
                throw new Error(res.error || "Failed to delete question");
            }
            return res;
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
                            items: page.items.filter((q) => q.id !== input.id),
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
                err instanceof Error ? err.message : "Failed to delete question",
            );
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["questions"] });
            // A delete can prune the distinct-value sets — invalidate so the
            // next filter-panel open reflects the canonical list.
            qc.invalidateQueries({ queryKey: ["filterOptions"] });
        },
    });
}
