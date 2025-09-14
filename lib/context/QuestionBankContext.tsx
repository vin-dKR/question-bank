'use client';

import { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { useQuestionBankReducer } from '@/hooks/reducer/useQuestionBankReducer';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { useFetchQuestions } from '@/hooks/question/useFetchQuestions';
import { useFetchFilterOptions } from '@/hooks/question/useFetchFilterOptions';
import { usePersistentSelection } from '@/hooks/question/usePersistentSelection';
import { useQuestionActions } from '@/hooks/question/useQuestionActions';

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useQuestionBankReducer();
    const { questions, loading, error, filters, pagination, filterOptions, optionsLoading, searchQuery, totalCount, showOnlySelected, selectedQuestions, initialFetchDone } = state;

    const { role, isTeacher, isLoading: roleLoading } = useUserRole();
    const { subject } = useUserSubject();

    const fetchQuestions = useFetchQuestions(filters, pagination, searchQuery, role || 'student', isTeacher, dispatch, subject || '');

    const fetchFilterOptions = useFetchFilterOptions(filters, role || 'student', isTeacher, dispatch, subject || '');

    usePersistentSelection(selectedQuestions, showOnlySelected, dispatch);

    const { toggleQuestionFlag, updateQuestion, toggleQuestionSelection, getAllSelectedQuestions } = useQuestionActions(questions, role || 'student', isTeacher, new Set(selectedQuestions.map(q => q.id)), dispatch, subject || '');

    const loadMore = useCallback(() => {
        dispatch({ type: 'SET_PAGINATION', pagination: { ...pagination, limit: pagination.limit + 20 } });
    }, [pagination, dispatch]);

    const refreshQuestions = useCallback(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    const setSelectedQuestions = useCallback((questions: Question[]) => {
        dispatch({ type: 'SET_SELECTED_QUESTIONS', questions });
    }, [dispatch]);

    const hasMore = useMemo(() => questions.length < totalCount, [questions.length, totalCount]);

    // Fetch questions when dependencies change
    useEffect(() => {
        if (!roleLoading && role) {
            fetchQuestions();
        }
    }, [fetchQuestions, roleLoading, role]);

    // Fetch filter options when dependencies change
    useEffect(() => {
        if (!roleLoading && role) {
            fetchFilterOptions();
        }
    }, [fetchFilterOptions, roleLoading, role]);

    const value = useMemo<QuestionBankContextType>(
        () => ({
            questions,
            loading,
            error,
            filters,
            setFilters: (newFilters) => dispatch({ type: 'SET_FILTERS', filters: newFilters }),
            pagination,
            setPagination: (pagination) => dispatch({ type: 'SET_PAGINATION', pagination }),
            filterOptions,
            optionsLoading,
            searchQuery,
            setSearchQuery: (query) => dispatch({ type: 'SET_SEARCH_QUERY', query }),
            totalCount,
            hasMore,
            loadMore,
            refreshQuestions,
            toggleQuestionFlag,
            toggleQuestionSelection,
            getAllSelectedQuestions,
            updateQuestion,
            showOnlySelected,
            setShowOnlySelected: (show) => dispatch({ type: 'SET_SHOW_ONLY_SELECTED', show }),
            selectedQuestions,
            setSelectedQuestions,
            initialFetchDone,
        }),
        [
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
            toggleQuestionSelection,
            getAllSelectedQuestions,
            updateQuestion,
            showOnlySelected,
            selectedQuestions,
            setSelectedQuestions,
            initialFetchDone,
        ]
    );

    return <QuestionBankContext.Provider value={value}>{children}</QuestionBankContext.Provider>;
};

export const useQuestionBankContext = () => {
    const context = useContext(QuestionBankContext);
    if (!context) {
        throw new Error('useQuestionBankContext must be used within a QuestionBankProvider');
    }
    return context;
};
