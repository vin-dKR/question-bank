"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { refineTextWithAI } from "@/lib/ai/aiService";

export interface RefineQuestionTextInput {
    text: string;
}

/**
 * Phase 7 mutation hook wrapping `refineTextWithAI`.
 *
 * Strictly speaking this is not a DB write — the AI call derives formatted
 * LaTeX text and returns it. But it's a long-running side-effectful call that
 * benefits from `useMutation`'s lifecycle (isPending, retries, error surface),
 * so it's wrapped here alongside the actual writes. The caller is expected
 * to feed the refined text into `useUpdateQuestion` to persist it.
 *
 * Because nothing in the cache changes as a result of this call, there is
 * NO query invalidation or optimistic patch here. If the follow-up persist
 * fails separately, `useUpdateQuestion` handles its own rollback.
 */
export function useRefineQuestionText() {
    return useMutation({
        mutationFn: async ({ text }: RefineQuestionTextInput): Promise<string> => {
            const res = await refineTextWithAI(text);
            if (!res.success || !res.refined_text) {
                throw new Error(res.error || "Failed to refine text");
            }
            return res.refined_text;
        },
        onError: (err) => {
            toast.error(
                err instanceof Error
                    ? `Refinement failed: ${err.message}`
                    : "Refinement failed",
            );
        },
    });
}
