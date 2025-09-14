import { toast } from "sonner"
import { useEffect, useReducer } from "react"

export interface TestCreatorState {
    testData: CreateTestData
    bulkMarks: number
    bulkNegativeMarks: number
    isSubmitting: boolean
    hasLoadedQuestions: boolean
}

export type TestCreatorAction =
    | {
        type: 'SET_TEST_FIELD';
        field: keyof Omit<CreateTestData, 'questions' | 'totalMarks'>;
        value: string | number
    }
    | {
        type: 'UPDATE_QUESTION';
        index: number;
        field: keyof Omit<QuestionForCreateTestData, 'id' | 'questionNumber'>;
        value: string | number;
    }
    | { type: 'REMOVE_QUESTION'; index: number; }
    | { type: 'APPLY_BULK_MARKS'; marks: number; }
    | { type: 'APPLY_BULK_NEGATIVE_MARKS'; negativeMarks: number; }
    | { type: 'SET_BULK_MARKS', marks: number }
    | { type: 'SET_BULK_NEGATIVE_MARKS', negativeMarks: number }
    | { type: 'LOAD_QUESTIONS', questions: QuestionForCreateTestData[] }
    | { type: 'SET_SUBMITTING', isSubmitting: boolean }

const initialState: TestCreatorState = {
    testData: {
        title: '',
        description: '',
        subject: '',
        duration: 60,
        totalMarks: 0,
        questions: [],
    },
    bulkMarks: 1,
    bulkNegativeMarks: 0,
    isSubmitting: false,
    hasLoadedQuestions: false,
}

const reducer = (state: TestCreatorState, action: TestCreatorAction): TestCreatorState => {
    switch (action.type) {
        case 'SET_TEST_FIELD':
            return {
                ...state,
                testData: { ...state.testData, [action.field]: action.value }
            };
        case 'UPDATE_QUESTION': {
            const updatedQuestion = state.testData.questions.map((q, i) =>
                i === action.index ? { ...q, [action.field]: action.value } : q
            )
            return {
                ...state,
                testData: {
                    ...state.testData,
                    questions: updatedQuestion,
                    totalMarks: updatedQuestion.reduce((total, q) => total + q.marks, 0)
                }
            }
        }
        case 'REMOVE_QUESTION': {
            const updatedQuestion = state.testData.questions
                .filter((_, i) => i != action.index)
                .map((q, i) => ({ ...q, questionNumber: i + 1 }))

            return {
                ...state,
                testData: {
                    ...state.testData,
                    questions: updatedQuestion,
                    totalMarks: updatedQuestion.reduce((total, q) => total + q.marks, 0)
                }
            }
        }
        case 'APPLY_BULK_MARKS': {
            if (action.marks <= 0) {
                toast("Marks must be greater than 0")
                return state
            }

            const updatedQuestion = state.testData.questions.map((q) => ({
                ...q,
                marks: action.marks
            }))

            toast.success(`Applied ${action.marks} marks to all questions`);

            return {
                ...state,
                testData: {
                    ...state.testData,
                    questions: updatedQuestion,
                    totalMarks: updatedQuestion.reduce((total, q) => total + q.marks, 0)
                }
            }
        }

        case 'APPLY_BULK_NEGATIVE_MARKS': {
            if (action.negativeMarks < 0) {
                toast("Negative marks cannot be less than 0.")
                return state
            }

            const updatedQuestion = state.testData.questions.map((q) => ({
                ...q,
                negativeMark: action.negativeMarks
            }))
            toast.success(`Applied ${action.negativeMarks} negative marks to all questions`);

            return {
                ...state,
                testData: {
                    ...state.testData,
                    questions: updatedQuestion,
                }
            }
        }

        case 'SET_BULK_MARKS':
            return { ...state, bulkMarks: action.marks }
        case 'SET_BULK_NEGATIVE_MARKS':
            return { ...state, bulkNegativeMarks: action.negativeMarks }
        case 'LOAD_QUESTIONS': {
            const formattedQuestions = action.questions.map((q, i) => ({
                ...q,
                question_text: q.question_text || '',
                questionNumber: i + 1,
                marks: q.marks || 1,
                negativeMark: q.negativeMark || 0,
            }))

            return {
                ...state,
                testData: {
                    ...state.testData,
                    questions: formattedQuestions,
                    totalMarks: formattedQuestions.reduce((total, q) => total + q.marks, 0)
                },
                hasLoadedQuestions: true
            }
        }

        case 'SET_SUBMITTING':
            return { ...state, isSubmitting: action.isSubmitting }
        default:
            return state
    }
}

export const useTestCreatorReducer = () => {
    const [state, dispatch] = useReducer(reducer, initialState)

    useEffect(() => {
        const loadSelectedQuestions = () => {
            const storedQuestions = sessionStorage.getItem("selectedQuestionsForTest")
            if (storedQuestions) {
                try {
                    const questions = JSON.parse(storedQuestions)
                    dispatch({ type: 'LOAD_QUESTIONS', questions })
                    sessionStorage.removeItem('selectedQuestionsForTest');

                } catch (error) {
                    console.error('Error loading selected questions:', error);
                    toast.error('Failed to load selected questions');
                }
            }
        }

        loadSelectedQuestions()
    }, [])

    return { state, dispatch }
}
