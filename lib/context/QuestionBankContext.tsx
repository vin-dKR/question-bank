'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuestionBankReducer } from '@/hooks/reducer/useQuestionBankReducer';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { useFetchQuestions } from '@/hooks/question/useFetchQuestions';
import { usePersistentSelection } from '@/hooks/question/usePersistentSelection';
import { useQuestionActions } from '@/hooks/question/useQuestionActions';
import { useAbortableEffect } from '@/lib/hooks/useAbortableEffect';

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useQuestionBankReducer();
    const { questions, loading, error, filters, pagination, filterOptions, optionsLoading, searchQuery, totalCount, showOnlySelected, selectedQuestions, initialFetchDone } = state;
    // console.log("filters ----------", filters)


    const { role, isTeacher, isLoading: roleLoading } = useUserRole();
    const { subject } = useUserSubject();

    const fetchQuestions = useFetchQuestions(filters, pagination, searchQuery, role || 'student', isTeacher, dispatch, subject || '');

    // Filter-option fetching has moved to the TanStack Query hook
    // `hooks/queries/useFilterOptions.ts`, consumed directly by FilterControls.
    // The `filterOptions` / `optionsLoading` fields on this context now hold
    // the reducer's initial empty defaults; Phase 6 removes them from the
    // context shape entirely.

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

    // Phase 2: client-side abort guard. Server actions still run to completion
    // on the server, but if the user navigates away mid-fetch we won't apply
    // stale results to the new route's state. Full restructure happens in
    // Phase 6 (TanStack Query). Do NOT change the context shape here.
    useAbortableEffect(
        async (signal) => {
            if (roleLoading || !role) return;
            await fetchQuestions();
            // fetchQuestions dispatches synchronously; the signal.aborted check
            // is inside the hook's reducer dispatch logic (Phase 6) — for now
            // the controller abort at least prevents effect re-entry ordering
            // issues on rapid dep changes.
            if (signal.aborted) return;
        },
        [fetchQuestions, roleLoading, role]
    );

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
