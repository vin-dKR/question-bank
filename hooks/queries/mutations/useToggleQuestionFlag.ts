"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toggleFlag } from "@/actions/question/questionBank";

export interface ToggleQuestionFlagInput {
    id: string;
    role: UserRole;
}

type InfiniteQuestionsData = {
    pages: Array<{ items: Question[]; nextCursor: string | null }>;
    pageParams: unknown[];
};

/**
 * Phase 7 mutation hook wrapping `toggleFlag`.
 *
 * The server action has two "identity" operations we replicate optimistically:
 *   - A permissions check (only `coaching` can toggle). We let the server
 *     return the failure and rely on `onError` rollback — there's no need to
 *     duplicate that check client-side, and doing so would diverge from the
 *     server if the rule ever changes.
 *   - The actual toggle. The server reads the current value then flips it.
 *     Client-side we just flip whatever's currently cached — that's the
 *     "derived field" part: we don't know the absolute target value until
 *     the server call resolves, so we flip and trust the final invalidation
 *     to reconcile if an edge case made our flip wrong.
 *
 * `["filterOptions"]` is NOT invalidated — the flagged state is per-row and
 * doesn't participate in any aggregation that filter options expose.
 */
export function useToggleQuestionFlag() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (input: ToggleQuestionFlagInput) => {
            const res = await toggleFlag(input.id, input.role);
            if (!res.success) {
                throw new Error(res.error || "Failed to toggle question flag");
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
                                q.id === input.id ? { ...q, flagged: !q.flagged } : q,
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
                err instanceof Error
                    ? err.message
                    : "Failed to toggle question flag",
            );
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["questions"] });
        },
    });
}
