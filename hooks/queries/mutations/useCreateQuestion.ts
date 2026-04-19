"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Question as PrismaQuestion } from "@/generated/prisma";
import { createQuestion } from "@/actions/question/insert";

export type CreateQuestionInput = Omit<PrismaQuestion, "id">;

/**
 * Phase 7 mutation hook wrapping `createQuestion`.
 *
 * Create mutations are not optimistic by default. A server-generated `id` is
 * required to identify the row, and inserting a placeholder into the cursor-
 * paginated `items` arrays would fight the server's `orderBy: { id: "asc" }`
 * ordering (see `actions/question/questionBank.ts:137`). Instead we just
 * invalidate on settled and let `useInfiniteQuery` refetch the affected page.
 *
 * `["filterOptions"]` is also invalidated — a create CAN introduce a new
 * distinct exam/subject/chapter/etc.
 */
export function useCreateQuestion() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateQuestionInput) => {
            const res = await createQuestion(input);
            if (!res.success) {
                throw new Error(res.error || "Failed to create question");
            }
            return res.data;
        },
        onError: (err) => {
            toast.error(
                err instanceof Error ? err.message : "Failed to create question",
            );
        },
        onSettled: () => {
            // Success messaging is the form caller's responsibility (it
            // toggles a local `success` flag and renders its own UI).
            qc.invalidateQueries({ queryKey: ["questions"] });
            qc.invalidateQueries({ queryKey: ["filterOptions"] });
        },
    });
}
