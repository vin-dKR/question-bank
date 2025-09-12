import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQuestionBankReducer } from '@/hooks/reducer/useQuestionBankReducer';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { useFetchQuestions } from '@/hooks/question/useFetchQuestions';
import { useFetchFilterOptions } from '@/hooks/question/useFetchFilterOptions';

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
    showOnlySelected: boolean;
    setShowOnlySelected: (show: boolean) => void;
}

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useQuestionBankReducer()
    const { questions, loading, error, filters, pagination, filterOptions, optionsLoading, searchQuery, showOnlySelected, selectedQuestionIds } = state

    const { role, isTeacher } = useUserRole()
    const { subject } = useUserSubject()

    const fetchQuestions = useFetchQuestions(filters, pagination, searchQuery, role, isTeacher, dispatch, subject)
    const fetchFilterOptions = useFetchFilterOptions(filters, role, isTeacher, dispatch, subject)
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
        updateQuestion,
        showOnlySelected,
        setShowOnlySelected
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
        showOnlySelected,
        setShowOnlySelected
    ]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    // Persist selected questions across navigation using localStorage
    // Keep selection in sync if changed in another tab
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'qb:selectedQuestionIds' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (Array.isArray(parsed)) {
                        setSelectedQuestionIds(new Set(parsed.filter((v: unknown): v is string => typeof v === 'string')));
                    }
                } catch { }
            }
            if (e.key === 'qb:showOnlySelected' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    setShowOnlySelected(Boolean(parsed));
                } catch { }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('qb:selectedQuestionIds', JSON.stringify(Array.from(selectedQuestionIds)));
            }
        } catch (e) {
            console.error('Failed to save selectedQuestionIds to storage', e);
        }
    }, [selectedQuestionIds]);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('qb:showOnlySelected', JSON.stringify(showOnlySelected));
            }
        } catch (e) {
            console.error('Failed to save showOnlySelected to storage', e);
        }
    }, [showOnlySelected]);

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
