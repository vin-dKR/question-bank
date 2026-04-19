"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getQuestions, searchQuestions } from "@/actions/question/questionBank";

/**
 * Arguments for `useQuestions`.
 *
 * Mirrors what the old `useFetchQuestions` reducer-hook expected, collapsed
 * into a single object for clean query-key identity. `searchQuery` is part of
 * the key so the search/list paths don't share a cache bucket.
 */
export interface UseQuestionsArgs {
    filters: Filters;
    role: UserRole;
    isTeacher: boolean;
    subject?: string;
    searchQuery?: string;
    /** Page size. Defaults to 20. */
    pageSize?: number;
}

// A single "page" in the TanStack infinite-query cache. Both branches below
// (list + search) normalise into this shape so the caller just flatMaps over
// `data.pages`.
interface QuestionsPage {
    items: Question[];
    nextCursor: string | null;
}

/**
 * Infinite-query hook for the question bank list.
 *
 * When `searchQuery` is >= 2 chars we hit `searchQuestions` (single page, the
 * server action caps at 50 results today — tracked in §1.3 C9). Otherwise we
 * hit the cursor-paginated `getQuestions` server action.
 *
 * `staleTime: 30s` mirrors the QueryProvider defaults so revisits feel instant;
 * filters/searchQuery changes produce a distinct `queryKey` so no cache
 * collision can happen.
 */
export function useQuestions({
    filters,
    role,
    isTeacher,
    subject,
    searchQuery,
    pageSize = 20,
}: UseQuestionsArgs) {
    const trimmedQuery = (searchQuery ?? "").trim();
    const isSearching = trimmedQuery.length >= 2;
    const teacherSubject = isTeacher ? subject : undefined;

    return useInfiniteQuery<QuestionsPage>({
        queryKey: [
            "questions",
            {
                filters: {
                    exam_name: filters.exam_name ?? null,
                    // Teachers are locked to their assigned subject regardless of the
                    // UI filter; reflect that in the cache key.
                    subject: isTeacher
                        ? (subject ?? null)
                        : (filters.subject?.toLowerCase() ?? null),
                    chapter: filters.chapter ?? null,
                    section_name: filters.section_name ?? null,
                    question_type: filters.question_type ?? null,
                    flagged: filters.flagged ?? null,
                },
                role,
                isTeacher,
                subject: teacherSubject ?? null,
                searchQuery: isSearching ? trimmedQuery : null,
                pageSize,
            },
        ],
        queryFn: async ({ pageParam }): Promise<QuestionsPage> => {
            if (isSearching) {
                const res = await searchQuestions(trimmedQuery, role, teacherSubject);
                if (!res.success) {
                    throw new Error(res.error || "Failed to search questions");
                }
                // Search is a single-shot today; surface it as one page with no
                // `nextCursor` so infinite-scroll bails out after this batch.
                return {
                    items: (res.data ?? []) as Question[],
                    nextCursor: null,
                };
            }

            const res = await getQuestions(
                {
                    exam_name: filters.exam_name,
                    subject: isTeacher ? subject : filters.subject?.toLowerCase(),
                    chapter: filters.chapter,
                    section_name: filters.section_name,
                    question_type: filters.question_type,
                    flagged: filters.flagged,
                    cursor: (pageParam as string | null) ?? null,
                    take: pageSize,
                },
                role,
                teacherSubject,
            );

            if (!res.success) {
                throw new Error(res.error || "Failed to fetch questions");
            }

            return {
                items: (res.items ?? []) as Question[],
                nextCursor: res.nextCursor ?? null,
            };
        },
        initialPageParam: null as string | null,
        getNextPageParam: (last) => last.nextCursor ?? null,
        staleTime: 30_000,
    });
}
