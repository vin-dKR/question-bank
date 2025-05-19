import { useState, useEffect, useCallback } from 'react';
import { getQuestions, getQuestionCount, toggleFlag, getFilterOptions } from '@/actions/question/questionBank'

interface FilterOptions {
    exams: string[];
    subjects: string[];
    chapters: string[];
    section_names: string[];
}

// Simple debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
        clearTimeout(timeout);
        return new Promise((resolve) => {
            timeout = setTimeout(() => resolve(func(...args)), wait);
        });
    };
};

export const useQuestionBank = (initialFilters = {
    exam_name: undefined,
    subject: undefined,
    chapter: undefined,
    section_name: undefined,
    flagged: undefined,
}) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [filters, setFilters] = useState(initialFilters);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
    });
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        exams: [],
        subjects: [],
        chapters: [],
        section_names: [],
    });
    const [optionsLoading, setOptionsLoading] = useState(false);

    // Cache for filter options (key: filter combination, value: options)
    const optionsCache = useState<Map<string, { options: FilterOptions; timestamp: number }>>(new Map())[0];
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const [questionsRes, countRes] = await Promise.all([
                getQuestions({
                    exam_name: filters.exam_name,
                    subject: filters.subject,
                    chapter: filters.chapter,
                    section_name: filters.section_name,
                    flagged: filters.flagged,
                    limit: pagination.limit,
                    skip: (pagination.page - 1) * pagination.limit,
                }),
                getQuestionCount({
                    exam_name: filters.exam_name,
                    subject: filters.subject,
                    chapter: filters.chapter,
                    section_name: filters.section_name,
                    flagged: filters.flagged,
                }),
            ]);

            if (questionsRes.success && countRes.success) {
                setQuestions(questionsRes.data as Question[]);
                setCount(countRes.data);
            } else {
                setError(questionsRes.error || countRes.error || 'Failed to fetch data');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilterOptions = async (filterParams: {
        exam_name?: string;
        subject?: string;
        chapter?: string;
    }) => {
        const cacheKey = `${filterParams.exam_name || ''}|${filterParams.subject || ''}|${filterParams.chapter || ''}`;
        const cached = optionsCache.get(cacheKey);

        // Check cache and TTL
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setFilterOptions(cached.options);
            return;
        }

        setOptionsLoading(true);
        try {
            const response = await getFilterOptions(filterParams);
            if (response.success) {
                const newOptions = response.data;
                setFilterOptions(newOptions);
                optionsCache.set(cacheKey, { options: newOptions, timestamp: Date.now() });
            } else {
                throw new Error(response.error || 'Failed to fetch filter options');
            }
        } catch (err) {
            console.error('Error fetching filter options:', err);
            setError('Failed to fetch filter options');
        } finally {
            setOptionsLoading(false);
        }
    };

    // Debounced fetchFilterOptions
    const debouncedFetchFilterOptions = useCallback(
        debounce(fetchFilterOptions, 300),
        [optionsCache]
    );

    const toggleQuestionSelection = (id: string) => {
        setSelectedQuestionIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const selectAllQuestions = () => {
        setSelectedQuestionIds(new Set(questions.map((q) => q.id)));
    };

    const unselectAllQuestions = () => {
        setSelectedQuestionIds(new Set());
    };

    const toggleQuestionFlag = async (id: string) => {
        const question = questions.find((q) => q.id === id);
        if (!question) return;

        const originalFlagged = question.flagged;
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, flagged: !q.flagged } : q))
        );

        try {
            const response = await toggleFlag(id);
            if (!response.success) throw new Error(response.error);
        } catch (err) {
            console.error('Error toggling flag:', err);
            setQuestions((prev) =>
                prev.map((q) => (q.id === id ? { ...q, flagged: originalFlagged } : q))
            );
            setError('Failed to toggle flag');
        }
    };

    const getSelectedQuestions = () => {
        return questions.filter((q) => selectedQuestionIds.has(q.id));
    };

    useEffect(() => {
        debouncedFetchFilterOptions({
            exam_name: filters.exam_name,
            subject: filters.subject,
            chapter: filters.chapter,
        });
    }, [filters.exam_name, filters.subject, filters.chapter]);

    useEffect(() => {
        fetchQuestions();
    }, [filters.exam_name, filters.subject, filters.chapter, filters.section_name, filters.flagged, pagination.page, pagination.limit]);

    const updateFilters = (newFilters: any) => {
        setFilters((prev) => {
            const updated = { ...prev, ...newFilters };
            // Reset dependent filters when parent changes
            if (newFilters.exam_name !== undefined && newFilters.exam_name !== prev.exam_name) {
                updated.subject = undefined;
                updated.chapter = undefined;
                updated.section_name = undefined;
            } else if (newFilters.subject !== undefined && newFilters.subject !== prev.subject) {
                updated.chapter = undefined;
                updated.section_name = undefined;
            } else if (newFilters.chapter !== undefined && newFilters.chapter !== prev.chapter) {
                updated.section_name = undefined;
            }
            return updated;
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    return {
        questions,
        loading,
        error,
        count,
        filters,
        pagination,
        selectedQuestionIds,
        selectedQuestions: getSelectedQuestions(),
        filterOptions,
        optionsLoading,
        setPagination,
        updateFilters,
        toggleQuestionSelection,
        selectAllQuestions,
        unselectAllQuestions,
        toggleQuestionFlag,
        refresh: fetchQuestions,
    };
};
