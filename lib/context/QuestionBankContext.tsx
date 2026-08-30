'use client';

import { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuestionBankReducer } from '@/hooks/reducer/useQuestionBankReducer';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { usePersistentSelection } from '@/hooks/question/usePersistentSelection';
import { useQuestionActions } from '@/hooks/question/useQuestionActions';
import { useQuestions } from '@/hooks/queries/useQuestions';
import { useQuestionCount } from '@/hooks/queries/useQuestionCount';

/** A keyword only searches once it's meaningful — matches the search action's 2-char floor. */
const MIN_SEARCH_LENGTH = 2;

/**
 * QuestionBankContext — UI state only (Phase 6).
 *
 * Server state (the list of questions, loading flags, cursor/pagination,
 * total counts, filter-options metadata) has moved to TanStack Query:
 *   - The list itself: `useQuestions(...)` in `hooks/queries/useQuestions.ts`,
 *     exposed here as the thin `useQuestionsList()` wrapper so consumers don't
 *     have to re-derive role/subject/filters arguments from scratch.
 *   - Filter options: `useFilterOptions(...)` in `hooks/queries/useFilterOptions.ts`
 *     (wired directly by FilterControls).
 *
 * What stays on the context:
 *   - `filters` / `setFilters` — the active filter set. It drives both the
 *     `useQuestions` cache key and the `useFilterOptions` cascading options.
 *   - `searchQuery` / `setSearchQuery` — debounced input from SearchBar.
 *     Also fed into `useQuestions` as a query key component so list ↔ search
 *     have distinct cache buckets.
 *   - `selectedQuestions` / `setSelectedQuestions` + `showOnlySelected` —
 *     pure client state with localStorage persistence.
 *   - `toggleQuestionFlag` / `toggleQuestionSelection` / `updateQuestion` /
 *     `getAllSelectedQuestions` — action helpers that still need role/subject.
 *     (Phase 7 will replace the server-side writes with `useMutation`.)
 */

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useQuestionBankReducer();
    const { filters, searchQuery, showOnlySelected, selectedQuestions } = state;

    const { role, isTeacher } = useUserRole();
    const { subject } = useUserSubject();

    usePersistentSelection(selectedQuestions, showOnlySelected, dispatch);

    const selectedIdSet = useMemo(
        () => new Set(selectedQuestions.map((q) => q.id)),
        [selectedQuestions]
    );

    const {
        toggleQuestionFlag,
        updateQuestion,
        toggleQuestionSelection,
        getAllSelectedQuestions,
    } = useQuestionActions(
        role || 'student',
        isTeacher,
        selectedIdSet,
        dispatch,
        subject || ''
    );

    const setSelectedQuestions = useCallback((questions: Question[]) => {
        dispatch({ type: 'SET_SELECTED_QUESTIONS', questions });
    }, [dispatch]);

    const value = useMemo<QuestionBankContextType>(
        () => ({
            filters,
            setFilters: (newFilters) => dispatch({ type: 'SET_FILTERS', filters: newFilters }),
            searchQuery,
            setSearchQuery: (query) => dispatch({ type: 'SET_SEARCH_QUERY', query }),
            toggleQuestionFlag,
            toggleQuestionSelection,
            getAllSelectedQuestions,
            updateQuestion,
            showOnlySelected,
            setShowOnlySelected: (show) => dispatch({ type: 'SET_SHOW_ONLY_SELECTED', show }),
            selectedQuestions,
            setSelectedQuestions,
        }),
        [
            filters,
            searchQuery,
            toggleQuestionFlag,
            toggleQuestionSelection,
            getAllSelectedQuestions,
            updateQuestion,
            showOnlySelected,
            selectedQuestions,
            setSelectedQuestions,
            dispatch,
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

/**
 * Thin ergonomic wrapper around `useQuestions` that reads filters + searchQuery
 * from the context and role/subject from the auth hooks. Components inside
 * `QuestionBankProvider` can call this without having to re-plumb those args.
 *
 * Returns the full TanStack `useInfiniteQuery` result plus a pre-flattened
 * `questions` array and a `loadMore` helper that mirrors the old context
 * API's ergonomics (`hasMore` / `loadMore`). Components that want more
 * granular control (isFetchingNextPage, refetch, etc.) can destructure from
 * `query` directly.
 */
export const useQuestionsList = () => {
    const { filters, searchQuery } = useQuestionBankContext();
    const { role, isTeacher, isLoading: roleLoading, error: roleError } = useUserRole();
    const { subject, isLoading: subjectLoading } = useUserSubject();
    const metadataLoading = roleLoading || subjectLoading;
    const questionsEnabled = Boolean(role) && !metadataLoading;

    const query = useQuestions({
        filters,
        role: role ?? 'student',
        isTeacher,
        subject: subject ?? undefined,
        searchQuery,
        // Without this guard, the fallback role/empty subject form a real
        // cache key and fetch an overlapping first page before the final
        // teacher metadata arrives.
        enabled: questionsEnabled,
    });

    const questions = useMemo<Question[]>(
        () => query.data?.pages.flatMap((page) => page.items) ?? [],
        [query.data]
    );

    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = query;
    const hasMore = Boolean(hasNextPage);
    const loadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            // `cancelRefetch: false` also closes the same-render double-click
            // window before isFetchingNextPage has propagated to the button.
            void fetchNextPage({ cancelRefetch: false });
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const queryError = query.error ? (query.error as Error).message : null;

    return {
        questions,
        // True on first-ever load (no data yet). Use `isFetchingNextPage` to
        // differentiate "loading another page" from "initial empty load".
        loading: metadataLoading || (questionsEnabled && query.isPending),
        isFetchingNextPage: query.isFetchingNextPage,
        error: roleError ?? queryError,
        hasMore,
        loadMore,
        refetch: query.refetch,
        // `initialFetchDone` parity for components that guard EmptyState on it.
        initialFetchDone: Boolean(roleError) || (questionsEnabled && !query.isPending),
        query,
    };
};

/**
 * The org-scoped total of the published bank matching the active filters, for
 * the "Showing X of N published questions" header. Disabled while a keyword
 * search is active — the search path (`searchQuestions`) matches on text that
 * `getQuestionCount` does not, so during search the list itself is the count.
 */
export const useQuestionsCount = () => {
    const { filters, searchQuery } = useQuestionBankContext();
    const isSearching = searchQuery.trim().length >= MIN_SEARCH_LENGTH;

    const query = useQuestionCount({ filters, enabled: !isSearching });

    return {
        total: query.data ?? 0,
        loading: query.isPending && !isSearching,
        isSearching,
    };
};
