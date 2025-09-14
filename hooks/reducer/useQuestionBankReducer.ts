import { useReducer, useEffect } from 'react';

// Helper functions for localStorage
const getPersistedSelectedIds = (): Set<string> => {
    if (typeof window === 'undefined') return new Set<string>();
    const stored = localStorage.getItem('selectedQuestionIds');
    return stored ? new Set(JSON.parse(stored)) : new Set<string>();
};

const getPersistedSelectedQuestions = (): Question[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('selectedQuestions');
    return stored ? JSON.parse(stored) : [];
};

const saveSelectedIds = (ids: Set<string>) => {
    localStorage.setItem('selectedQuestionIds', JSON.stringify(Array.from(ids)));
};

const saveSelectedQuestions = (questions: Question[]) => {
    localStorage.setItem('selectedQuestions', JSON.stringify(questions));
};

export interface QuestionBankState {
    questions: Question[];
    loading: boolean;
    error: string | null;
    filters: Filters;
    pagination: Pagination;
    filterOptions: FilterOptions;
    optionsLoading: boolean;
    searchQuery: string;
    totalCount: number;
    showOnlySelected: boolean;
    selectedQuestionIds: Set<string>;
    selectedQuestions: Question[];
    selectedPagination: Pagination;
    initialFetchDone: boolean;
}

export type QuestionBankAction =
    | { type: 'SET_QUESTIONS'; questions: Question[]; totalCount: number }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'SET_ERROR'; error: string | null }
    | { type: 'SET_FILTERS'; filters: Partial<Filters> }
    | { type: 'SET_PAGINATION'; pagination: Pagination }
    | { type: 'SET_FILTER_OPTIONS'; options: FilterOptions }
    | { type: 'SET_OPTIONS_LOADING'; loading: boolean }
    | { type: 'SET_SEARCH_QUERY'; query: string }
    | { type: 'TOGGLE_FLAG'; id: string }
    | { type: 'UPDATE_QUESTION'; updatedQuestion: Pick<Question, 'id' | 'question_text' | 'options'> }
    | { type: 'TOGGLE_SELECTION'; id: string }
    | { type: 'SET_SHOW_ONLY_SELECTED'; show: boolean }
    | { type: 'SET_SELECTED_QUESTIONS'; questions: Question[] }
    | { type: 'SET_SELECTED_PAGINATION'; pagination: Pagination }
    | { type: 'SET_INITIAL_FETCH_DONE' };

const initialState: QuestionBankState = {
    questions: [],
    loading: true,
    error: null,
    filters: {},
    pagination: { page: 1, limit: 20 },
    filterOptions: { exams: [], subjects: [], chapters: [], section_names: [] },
    optionsLoading: false,
    searchQuery: '',
    totalCount: 0,
    showOnlySelected: false,
    selectedQuestionIds: getPersistedSelectedIds(),
    selectedQuestions: getPersistedSelectedQuestions(),
    selectedPagination: { page: 1, limit: 20 },
    initialFetchDone: false,
};

const reducer = (state: QuestionBankState, action: QuestionBankAction): QuestionBankState => {
    let newState: QuestionBankState;
    switch (action.type) {
        case 'SET_QUESTIONS':
            newState = {
                ...state,
                questions: action.questions,
                totalCount: action.totalCount,
                initialFetchDone: true,
                // Update selectedQuestions to match current questions if IDs exist
                selectedQuestions: state.selectedQuestionIds.size > 0
                    ? action.questions.filter((q) => state.selectedQuestionIds.has(q.id))
                    : state.selectedQuestions,
            };
            saveSelectedQuestions(newState.selectedQuestions);
            return newState;
        case 'SET_LOADING':
            return { ...state, loading: action.loading };
        case 'SET_ERROR':
            return { ...state, error: action.error, initialFetchDone: true };
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.filters } };
        case 'SET_PAGINATION':
            return { ...state, pagination: action.pagination };
        case 'SET_FILTER_OPTIONS':
            return { ...state, filterOptions: action.options };
        case 'SET_OPTIONS_LOADING':
            return { ...state, optionsLoading: action.loading };
        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.query };
        case 'TOGGLE_FLAG':
            return {
                ...state,
                questions: state.questions.map((q) =>
                    q.id === action.id ? { ...q, flagged: !q.flagged } : q
                ),
            };
        case 'UPDATE_QUESTION':
            return {
                ...state,
                questions: state.questions.map((q) =>
                    q.id === action.updatedQuestion.id
                        ? {
                            ...q,
                            question_text: action.updatedQuestion.question_text ?? q.question_text,
                            options: action.updatedQuestion.options ?? q.options,
                        }
                        : q
                ),
                selectedQuestions: state.selectedQuestions.map((q) =>
                    q.id === action.updatedQuestion.id
                        ? {
                            ...q,
                            question_text: action.updatedQuestion.question_text ?? q.question_text,
                            options: action.updatedQuestion.options ?? q.options,
                        }
                        : q
                ),
            };
        case 'TOGGLE_SELECTION':
            const newSet = new Set(state.selectedQuestionIds);
            const isSelected = newSet.has(action.id);
            if (isSelected) {
                newSet.delete(action.id);
            } else {
                newSet.add(action.id);
            }
            newState = {
                ...state,
                selectedQuestionIds: newSet,
                selectedQuestions: isSelected
                    ? state.selectedQuestions.filter((q) => q.id !== action.id)
                    : [
                        ...state.selectedQuestions,
                        ...state.questions.filter((q) => q.id === action.id && !state.selectedQuestions.some((sq) => sq.id === q.id)),
                    ],
            };
            saveSelectedIds(newSet);
            saveSelectedQuestions(newState.selectedQuestions);
            return newState;
        case 'SET_SHOW_ONLY_SELECTED':
            return { ...state, showOnlySelected: action.show };
        case 'SET_SELECTED_QUESTIONS':
            newState = { ...state, selectedQuestions: action.questions };
            saveSelectedQuestions(newState.selectedQuestions);
            return newState;
        case 'SET_SELECTED_PAGINATION':
            return { ...state, selectedPagination: action.pagination };
        case 'SET_INITIAL_FETCH_DONE':
            return { ...state, initialFetchDone: true };
        default:
            return state;
    }
};

export const useQuestionBankReducer = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Sync selectedQuestions with questions when questions change
    useEffect(() => {
        if (state.selectedQuestionIds.size > 0 && state.questions.length > 0) {
            const updatedSelectedQuestions = state.questions.filter((q) => state.selectedQuestionIds.has(q.id));
            if (updatedSelectedQuestions.length !== state.selectedQuestions.length) {
                dispatch({ type: 'SET_SELECTED_QUESTIONS', questions: updatedSelectedQuestions });
            }
        }
    }, [state.questions, state.selectedQuestionIds]);

    return [state, dispatch] as const;
};
