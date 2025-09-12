import { useReducer } from "react";

interface QuestionBankState {
    loading: boolean
    error: string | null
    filters: Filters
    questions: Question[]
    pagination: Pagination
    filterOptions: FilterOptions
    totalCount: number
    optionsLoading: boolean
    searchQuery: string
    showOnlySelected: boolean
    selectedQuestionIds: Set<string>
}

export type QuestionBankAction =
    | { type: 'SET_QUESTIONS'; questions: Question[]; totalCount: number }
    | { type: 'SET_LOADING', loading: boolean }
    | { type: 'SET_ERROR', error: string | null }
    | { type: 'SET_FILTERS', filters: Partial<Filters> }
    | { type: 'SET_PAGINATION', pagination: Pagination }
    | { type: 'SET_FILTER_OPTIONS', options: FilterOptions }
    | { type: 'SET_OPTIONS_LOADING', optionsLoading: boolean }
    | { type: 'SET_SEARCH_QUERY', searchQuery: string }
    | { type: 'TOGGLE_FLAG', id: string }
    | { type: 'UPDATE_QUESTION', updatedQuestion: Pick<Question, 'id' | 'question_text' | 'options'> }
    | { type: 'TOGGLE_SELECTION', id: string }
    | { type: 'SET_SHOW_ONLY_SELECTED', show: boolean }

const initialState: QuestionBankState = {
    loading: false,
    error: null,
    filters: {},
    questions: [],
    pagination: { page: 1, limit: 20 },
    filterOptions: { exams: [], subjects: [], section_names: [], chapters: [] },
    totalCount: 0,
    optionsLoading: false,
    searchQuery: '',
    showOnlySelected: false,
    selectedQuestionIds: new Set()
}

const reducer = (state: QuestionBankState, action: QuestionBankAction): QuestionBankState => {
    switch (action.type) {
        case 'SET_QUESTIONS':
            return {
                ...state,
                questions: action.questions,
                totalCount: action.totalCount
            }
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.loading
            }
        case 'SET_ERROR':
            return {
                ...state,
                error: action.error
            }
        case 'SET_FILTERS':
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.filters
                }
            }
        case 'SET_PAGINATION':
            return {
                ...state,
                pagination: action.pagination
            }
        case 'SET_FILTER_OPTIONS':
            return {
                ...state,
                filterOptions: action.options
            }
        case 'SET_OPTIONS_LOADING':
            return {
                ...state,
                optionsLoading: action.optionsLoading
            }
        case 'SET_SEARCH_QUERY':
            return {
                ...state,
                searchQuery: action.searchQuery
            }
        case 'TOGGLE_FLAG':
            return {
                ...state,
                questions: state.questions.map((q) =>
                    q.id === action.id ? {
                        ...q,
                        flagged: !q.flagged
                    } : q
                )
            }
        case 'UPDATE_QUESTION':
            return {
                ...state,
                questions: state.questions.map((q) =>
                    q.id === action.updatedQuestion.id
                        ? {
                            ...q,
                            question_text: action.updatedQuestion.question_text,
                            options: action.updatedQuestion.options
                        }
                        : q
                )
            }
        case 'TOGGLE_SELECTION': {
            const newSet = new Set(state.selectedQuestionIds)

            if (newSet.has(action.id)) {
                newSet.delete(action.id)
            } else {
                newSet.add(action.id)
            }

            return {
                ...state,
                selectedQuestionIds: newSet
            }
        }
        case 'SET_SHOW_ONLY_SELECTED':
            return {
                ...state,
                showOnlySelected: action.show
            }
        default:
            return state
    }
}

export const useQuestionBankReducer = () => useReducer(reducer, initialState)
