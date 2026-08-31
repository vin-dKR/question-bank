"use client";

import { useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "@/actions/question/questionBank";
import { useOrgKey } from "@/provider/ActiveOrgProvider";

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
    const orgKey = useOrgKey();
    return useQuery({
        // The org segment sits LAST, not first, and that placement is load
        // bearing. TanStack matches invalidation keys by PREFIX, and the
        // mutations in hooks/queries/mutations/* invalidate with
        // `{ queryKey: ["questions"] }`. Putting the org id in front would make
        // that prefix stop matching and every optimistic update would silently
        // stop refetching — a bug with no error and no visible symptom until
        // stale data is on screen.
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
            orgKey,
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
