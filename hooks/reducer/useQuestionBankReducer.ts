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

/**
 * Phase 6: server-state lives in TanStack Query now. This reducer only
 * tracks UI state: filters, search query, selection set, show-only-selected
 * toggle, and local overlays applied on top of the server list
 * (`TOGGLE_FLAG`, `UPDATE_QUESTION`).
 *
 * The `TOGGLE_FLAG` / `UPDATE_QUESTION` actions mutate `selectedQuestions`
 * in-place so stale entries (a flag flipped on a question currently in the
 * selection) don't fall out of sync with what the user sees. The server list
 * itself is owned by TanStack Query — consumers should call
 * `queryClient.invalidateQueries({ queryKey: ['questions'] })` to resync.
 * That invalidation wiring is Phase 7's job.
 */
export interface QuestionBankState {
    filters: Filters;
    searchQuery: string;
    showOnlySelected: boolean;
    selectedQuestions: Question[];
}

export type QuestionBankAction =
    | { type: 'SET_FILTERS'; filters: Partial<Filters> }
    | { type: 'SET_SEARCH_QUERY'; query: string }
    | { type: 'TOGGLE_FLAG'; id: string }
    | { type: 'UPDATE_QUESTION'; updatedQuestion: Pick<Question, 'id' | 'question_text' | 'options'> }
    | { type: 'TOGGLE_SELECTION'; id: string; question?: Question }
    | { type: 'SET_SHOW_ONLY_SELECTED'; show: boolean }
    | { type: 'CLEAR_SELECTIONS' }
    | { type: 'SET_SELECTED_QUESTIONS'; questions: Question[] };

const initialState: QuestionBankState = {
    filters: {},
    searchQuery: '',
    showOnlySelected: getPersistedShowOnlySelected(),
    selectedQuestions: getPersistedSelectedQuestions(),
};

const reducer = (state: QuestionBankState, action: QuestionBankAction): QuestionBankState => {
    switch (action.type) {
        case 'SET_FILTERS':
            return { ...state, filters: { ...state.filters, ...action.filters } };
        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.query };
        case 'TOGGLE_FLAG':
            // The list of questions on screen comes from TanStack Query now;
            // we only keep our selection set in sync with flag toggles so a
            // `selectedQuestions` entry doesn't show a stale `flagged` value.
            return {
                ...state,
                selectedQuestions: state.selectedQuestions.map((q) =>
                    q.id === action.id ? { ...q, flagged: !q.flagged } : q
                ),
            };
        case 'UPDATE_QUESTION':
            return {
                ...state,
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
        case 'TOGGLE_SELECTION': {
            const isSelected = state.selectedQuestions.some((q) => q.id === action.id);
            if (isSelected) {
                return {
                    ...state,
                    selectedQuestions: state.selectedQuestions.filter((q) => q.id !== action.id),
                };
            }
            // The caller (useQuestionActions in the context) passes in the
            // full question object from the current page so we can stash it
            // in the selection — the server list is no longer on the context.
            if (!action.question) return state;
            return {
                ...state,
                selectedQuestions: [...state.selectedQuestions, action.question],
            };
        }
        case 'SET_SHOW_ONLY_SELECTED':
            return { ...state, showOnlySelected: action.show };
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
