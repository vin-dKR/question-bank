"use client";

import { useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "@/actions/question/questionBank";

/**
 * Arguments for useFilterOptions.
 *
 * Mirrors the 3-arg server-action signature of getFilterOptions so the query
 * key is a complete function of everything the server uses to compute the
 * result. The filters portion reuses the ambient `Filters` type (declared in
 * `types/index.d.ts`) — the server action only consumes a subset, but we
 * pass the whole object so the cache key stays stable across callers.
 */
export interface UseFilterOptionsArgs {
    filters: Filters;
    userRole: UserRole;
    userSubject?: string;
}

const EMPTY_OPTIONS: FilterOptions = {
    exams: [],
    subjects: [],
    chapters: [],
    section_names: [],
    question_type: [],
};

export function useFilterOptions({ filters, userRole, userSubject }: UseFilterOptionsArgs) {
    return useQuery({
        queryKey: [
            "filterOptions",
            {
                exam_name: filters.exam_name ?? null,
                subject: filters.subject ?? null,
                chapter: filters.chapter ?? null,
                question_type: filters.question_type ?? null,
                userRole,
                userSubject: userSubject ?? null,
            },
        ],
        queryFn: async (): Promise<FilterOptions> => {
            const response = await getFilterOptions(
                {
                    exam_name: filters.exam_name,
                    subject: filters.subject,
                    chapter: filters.chapter,
                    questionType: filters.question_type,
                },
                userRole,
                userSubject
            );

            if (!response.success) {
                return response.data ?? EMPTY_OPTIONS;
            }

            return response.data;
        },
        // Filter options rarely change — keep them hot for 15 minutes so
        // rapid filter clicks hit the cache instead of Mongo.
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        placeholderData: (previous) => previous,
    });
}
