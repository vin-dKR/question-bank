import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getQuestions, getQuestionCount, toggleFlag, getFilterOptions, searchQuestions, getQuestionsByIds } from "@/actions/question/questionBank";
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { updateQuestionInDB } from '@/actions/question/questionUpdate';
import { toast } from 'sonner';

interface QuestionBankContextType {
    questions: Question[];
    loading: boolean;
    error: string | null;
    filters: Filters;
    setFilters: (filters: Partial<Filters>) => void;
    pagination: Pagination;
    setPagination: React.Dispatch<React.SetStateAction<Pagination>>;
    filterOptions: FilterOptions;
    optionsLoading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    totalCount: number;
    hasMore: boolean;
    loadMore: () => void;
    refreshQuestions: () => void;
    toggleQuestionFlag: (id: string) => Promise<void>;
    selectedQuestionIds: Set<string>;
    toggleQuestionSelection: (id: string) => void;
    getAllSelectedQuestions: () => Promise<Question[]>;
    updateQuestion: (updatedQuestion: Question) => void;
}

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider = ({ children }: { children: React.ReactNode }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({});
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20 });
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        exams: [],
        subjects: [],
        chapters: [],
        section_names: [],
    });
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    const { role, isTeacher } = useUserRole();
    const { subject } = useUserSubject();

    const updateQuestion = async (
        updatedQuestion: Pick<Question, 'id' | 'question_text' | 'options'>,
    ) => {
        try {
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === updatedQuestion.id
                        ? {
                            ...q,
                            question_text: updatedQuestion.question_text ?? q.question_text,
                            options: updatedQuestion.options ?? q.options,
                        }
                        : q
                )
            );

            const result = await updateQuestionInDB(updatedQuestion);
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to update question in database');
            }

            toast.success('Question updated successfully!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update question';
            toast.error(errorMessage);
            throw error;
        }
    };

    const fetchQuestions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (searchQuery && searchQuery.trim().length >= 2) {
                const searchRes = await searchQuestions(searchQuery, (role || "student") as UserRole, isTeacher ? subject || undefined : undefined);
                if (searchRes && searchRes.success) {
                    setQuestions(searchRes.data as Question[]);
                    setTotalCount(searchRes.data.length);
                } else {
                    setError(searchRes?.error || 'Failed to search questions');
                    setQuestions([]);
                    setTotalCount(0);
                }
            } else {
                const queryFilters = {
                    exam_name: filters.exam_name,
                    subject: isTeacher ? subject || undefined : filters.subject,
                    chapter: filters.chapter,
                    section_name: filters.section_name,
                    flagged: filters.flagged,
                    limit: pagination.limit,
                    skip: (pagination.page - 1) * pagination.limit,
                };

                // console.log('Fetching questions with filters:', queryFilters);
                // console.log('User role:', role, 'isTeacher:', isTeacher, 'userSubject:', subject);

                const [questionsRes, countRes] = await Promise.all([
                    getQuestions(queryFilters, (role || "student") as UserRole, isTeacher ? subject || undefined : undefined),
                    getQuestionCount({
                        exam_name: filters.exam_name,
                        subject: isTeacher ? subject || undefined : filters.subject,
                        chapter: filters.chapter,
                        section_name: filters.section_name,
                        flagged: filters.flagged,
                    }, (role || "student") as UserRole, isTeacher ? subject || undefined : undefined),
                ]);

                if (questionsRes && questionsRes.success && countRes && countRes.success) {
                    console.log('Questions fetched successfully:', questionsRes.data.length);
                    // console.log('Total count:', countRes.data);
                    setQuestions(questionsRes.data as Question[]);
                    setTotalCount(countRes.data);
                } else {
                    console.error('Failed to fetch questions:', {
                        questionsRes: {
                            success: questionsRes?.success,
                            error: questionsRes?.error,
                            dataLength: questionsRes?.data?.length
                        },
                        countRes: {
                            success: countRes?.success,
                            error: countRes?.error,
                            data: countRes?.data
                        },
                        filters,
                        pagination,
                        searchQuery,
                        role,
                        isTeacher,
                        subject
                    });

                    const errorMessage = questionsRes?.error || countRes?.error || 'Failed to fetch data';
                    setError(errorMessage);
                    setQuestions([]);
                    setTotalCount(0);
                }
            }
        } catch (err) {
            console.error('Error in fetchQuestions:', err);
            setError('An unexpected error occurred');
            setQuestions([]);
            setTotalCount(0);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination, searchQuery, role, isTeacher, subject]);

    const fetchFilterOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const response = await getFilterOptions(
                { exam_name: filters.exam_name, subject: isTeacher ? subject || undefined : filters.subject, chapter: filters.chapter },
                (role || "student") as UserRole,
                isTeacher ? subject || undefined : undefined
            );
            if (response && response.success) {
                setFilterOptions(response.data);
                console.log('Filter options fetched successfully:', response.data);
            } else {
                setFilterOptions({
                    exams: [],
                    subjects: [],
                    chapters: [],
                    section_names: [],
                });
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
            setFilterOptions({
                exams: [],
                subjects: [],
                chapters: [],
                section_names: [],
            });
        } finally {
            setOptionsLoading(false);
        }
    }, [filters.exam_name, filters.chapter, filters.subject, role, isTeacher, subject]);

    const toggleQuestionFlag = useCallback(async (id: string) => {
        const question = questions.find((q) => q.id === id);
        if (!question) return;

        const originalFlagged = question.flagged;
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, flagged: !q.flagged } : q))
        );

        try {
            const response = await toggleFlag(id, (role || "student") as UserRole);
            if (!response || !response.success) throw new Error(response?.error);
        } catch (error) {
            setQuestions((prev) =>
                prev.map((q) => (q.id === id ? { ...q, flagged: originalFlagged } : q))
            );
            setError(`Failed to toggle flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [questions, role]);

    const toggleQuestionSelection = useCallback((id: string) => {
        setSelectedQuestionIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const getAllSelectedQuestions = useCallback(async (): Promise<Question[]> => {
        if (selectedQuestionIds.size === 0) {
            return [];
        }

        try {
            const response = await getQuestionsByIds(
                Array.from(selectedQuestionIds),
                (role || "student") as UserRole,
                isTeacher ? subject || undefined : undefined
            );

            if (response && response.success) {
                return response.data as Question[];
            } else {
                console.error('Failed to fetch selected questions:', response?.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching selected questions:', error);
            return [];
        }
    }, [selectedQuestionIds, role, isTeacher, subject]);

    const loadMore = useCallback(() => {
        setPagination(prev => ({ ...prev, limit: prev.limit + 20 }));
    }, []);

    const refreshQuestions = useCallback(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    // Memoize hasMore to prevent unnecessary re-renders
    const hasMore = useMemo(() => questions.length < totalCount, [questions.length, totalCount]);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo<QuestionBankContextType>(() => ({
        questions,
        loading,
        error,
        filters,
        setFilters,
        pagination,
        setPagination,
        filterOptions,
        optionsLoading,
        searchQuery,
        setSearchQuery,
        totalCount,
        hasMore,
        loadMore,
        refreshQuestions,
        toggleQuestionFlag,
        selectedQuestionIds,
        toggleQuestionSelection,
        getAllSelectedQuestions,
        updateQuestion
    }), [
        questions,
        loading,
        error,
        filters,
        pagination,
        filterOptions,
        optionsLoading,
        searchQuery,
        totalCount,
        hasMore,
        loadMore,
        refreshQuestions,
        toggleQuestionFlag,
        selectedQuestionIds,
        toggleQuestionSelection,
        getAllSelectedQuestions,
    ]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    return (
        <QuestionBankContext.Provider value={value}>
            {children}
        </QuestionBankContext.Provider>
    );
};

export const useQuestionBankContext = () => {
    const context = useContext(QuestionBankContext);
    if (!context) {
        throw new Error('useQuestionBankContext must be used within a QuestionBankProvider');
    }
    return context;
};
