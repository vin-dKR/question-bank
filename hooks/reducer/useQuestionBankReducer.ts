import { useReducer } from 'react';

const getPersistedSelectedQuestions = (): Question[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('qb:selectedQuestions');
    return stored ? JSON.parse(stored) : [];
};

const getPersistedShowOnlySelected = (): boolean => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('qb:showOnlySelected');
    return stored ? JSON.parse(stored) : false;
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
    selectedQuestions: Question[];
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
    | { type: 'SET_INITIAL_FETCH_DONE' }
    | { type: 'CLEAR_SELECTIONS' }
    | { type: 'SET_SELECTED_QUESTIONS'; questions: Question[] };

const initialState: QuestionBankState = {
    questions: [],
    loading: true,
    error: null,
    filters: {},
    pagination: { page: 1, limit: 20 },
    filterOptions: { exams: [], subjects: [], chapters: [], section_names: [], question_type: [] },
    optionsLoading: false,
    searchQuery: '',
    totalCount: 0,
    showOnlySelected: getPersistedShowOnlySelected(),
    selectedQuestions: getPersistedSelectedQuestions(),
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
            };
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
                selectedQuestions: state.selectedQuestions.map((q) =>
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
            const isSelected = state.selectedQuestions.some((q) => q.id === action.id);
            const question = state.questions.find((q) => q.id === action.id);
            newState = {
                ...state,
                selectedQuestions: isSelected
                    ? state.selectedQuestions.filter((q) => q.id !== action.id)
                    : question
                        ? [...state.selectedQuestions, question]
                        : state.selectedQuestions,
            };
            return newState;
        case 'SET_SHOW_ONLY_SELECTED':
            return { ...state, showOnlySelected: action.show };
        case 'SET_INITIAL_FETCH_DONE':
            return { ...state, initialFetchDone: true };
        case 'CLEAR_SELECTIONS':
            return { ...state, selectedQuestions: [] };
        case 'SET_SELECTED_QUESTIONS':
            return { ...state, selectedQuestions: action.questions };
        default:
            return state;
    }
};

export const useQuestionBankReducer = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    return [state, dispatch] as const;
};
