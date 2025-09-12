import { useReducer } from 'react';

interface State {
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
}

type Action =
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
    | { type: 'SET_SELECTED_PAGINATION'; pagination: Pagination };

const initialState: State = {
    questions: [],
    loading: false,
    error: null,
    filters: {},
    pagination: { page: 1, limit: 20 },
    filterOptions: { exams: [], subjects: [], chapters: [], section_names: [] },
    optionsLoading: false,
    searchQuery: '',
    totalCount: 0,
    showOnlySelected: false,
    selectedQuestionIds: new Set(),
    selectedQuestions: [],
    selectedPagination: { page: 1, limit: 20 },
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'SET_QUESTIONS':
            return { ...state, questions: action.questions, totalCount: action.totalCount };
        case 'SET_LOADING':
            return { ...state, loading: action.loading };
        case 'SET_ERROR':
            return { ...state, error: action.error };
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
            };
        case 'TOGGLE_SELECTION':
            const newSet = new Set(state.selectedQuestionIds);
            if (newSet.has(action.id)) {
                newSet.delete(action.id);
            } else {
                newSet.add(action.id);
            }
            return { ...state, selectedQuestionIds: newSet };
        case 'SET_SHOW_ONLY_SELECTED':
            return { ...state, showOnlySelected: action.show };
        case 'SET_SELECTED_QUESTIONS':
            return { ...state, selectedQuestions: action.questions };
        case 'SET_SELECTED_PAGINATION':
            return { ...state, selectedPagination: action.pagination };
        default:
            return state;
    }
};

export const useQuestionBankReducer = () => useReducer(reducer, initialState);
