"use client";

import { useQuery } from "@tanstack/react-query";
import { getFilterOptions } from "@/actions/question/questionBank";
import { useOrgKey } from "@/provider/ActiveOrgProvider";

const sortValues = (values: string[]) =>
    [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }),
    );

async function loadTaxonomy(filters: {
    exam_name?: string;
    subject?: string;
}): Promise<FilterOptions> {
    // Role and teacher subject are resolved by the server action. The legacy
    // positional arguments are intentionally omitted so this form cannot spoof
    // either value from the browser.
    const response = await getFilterOptions({ ...filters, exact: true });
    if (!response.success) {
        throw new Error(response.error || "Question taxonomy could not be loaded.");
    }
    return response.data;
}

/**
 * Server-backed Exam -> Subject -> Chapter choices for the question form.
 *
 * Each level has its own cache entry so changing a parent never replaces the
 * still-valid choices above it with a narrowed result. The data source is the
 * org-scoped visible Question collection, the same metadata used by the bank's
 * filter panel; this avoids introducing a second taxonomy.
 */
export function useQuestionTaxonomy(exam: string, subject: string) {
    const orgKey = useOrgKey();

    const examsQuery = useQuery({
        queryKey: ["filterOptions", "question-form", "exams", orgKey],
        queryFn: () => loadTaxonomy({}),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const subjectsQuery = useQuery({
        queryKey: ["filterOptions", "question-form", "subjects", exam, orgKey],
        queryFn: () => loadTaxonomy({ exam_name: exam }),
        enabled: Boolean(exam),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const chaptersQuery = useQuery({
        queryKey: ["filterOptions", "question-form", "chapters", exam, subject, orgKey],
        queryFn: () => loadTaxonomy({ exam_name: exam, subject }),
        enabled: Boolean(exam && subject),
        staleTime: 15 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    return {
        exams: sortValues(examsQuery.data?.exams ?? []),
        subjects: sortValues(subjectsQuery.data?.subjects ?? []),
        chapters: sortValues(chaptersQuery.data?.chapters ?? []),
        examsQuery,
        subjectsQuery,
        chaptersQuery,
    };
}
