"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuestionCount } from "@/actions/question/questionBank";
import { useOrgKey } from "@/provider/ActiveOrgProvider";

/**
 * Arguments for useQuestionCount.
 *
 * `filters` is the ambient `Filters` type so the cache key is a complete
 * function of everything the count depends on; role/subject are resolved
 * server-side (see getQuestionCount), so they are not part of the key. The
 * count is the org-scoped total of the PUBLISHED bank matching `filters` — the
 * `Question` collection holds only published questions (extraction/pre-publish
 * rows live in the ingest staging collection this app never reads), so nothing
 * unpublished is ever counted.
 */
export interface UseQuestionCountArgs {
    filters: Filters;
    /** Off while a keyword search is active — getQuestionCount does not filter by keyword. */
    enabled?: boolean;
}

export function useQuestionCount({ filters, enabled = true }: UseQuestionCountArgs) {
    const orgKey = useOrgKey();
    return useQuery({
        // Org segment LAST so the ["questions"]-prefixed mutation invalidations
        // (hooks/queries/mutations/*) still prefix-match this key — same rule as
        // useFilterOptions.
        queryKey: [
            "questionCount",
            {
                exam_name: filters.exam_name ?? null,
                subject: filters.subject ?? null,
                chapter: filters.chapter ?? null,
                section_name: filters.section_name ?? null,
                question_type: filters.question_type ?? null,
                flagged: filters.flagged ?? null,
            },
            orgKey,
        ],
        queryFn: async (): Promise<number> => {
            const response = await getQuestionCount({
                exam_name: filters.exam_name,
                subject: filters.subject,
                chapter: filters.chapter,
                section_name: filters.section_name,
                question_type: filters.question_type,
                flagged: filters.flagged,
            });
            return response.success ? response.data : 0;
        },
        enabled,
        // The bank total barely moves within a session (no add/delete on this
        // page), so keep it hot to avoid a Mongo count on every filter click.
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        placeholderData: (previous) => previous,
    });
}
