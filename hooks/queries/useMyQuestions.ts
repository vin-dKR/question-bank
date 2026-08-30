"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyQuestions } from "@/actions/question/questionBank";
import { useOrgKey } from "@/provider/ActiveOrgProvider";

export type MyQuestion = {
    id: string;
    question_text: string;
    question_image: string | null;
    options: string[];
    answer: string | null;
    exam_name: string | null;
    subject: string | null;
    chapter: string | null;
};

type MyQuestionsPage = {
    items: MyQuestion[];
    nextCursor: string | null;
};

export function useMyQuestions(pageSize = 10) {
    const orgKey = useOrgKey();

    return useInfiniteQuery<MyQuestionsPage>({
        queryKey: ["myQuestions", { pageSize }, orgKey],
        queryFn: async ({ pageParam }) => {
            const response = await getMyQuestions({
                cursor: (pageParam as string | null) ?? null,
                take: pageSize,
            });
            if (!response.success) {
                throw new Error(response.error || "Failed to fetch your questions");
            }
            return { items: response.items, nextCursor: response.nextCursor };
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 30_000,
    });
}
