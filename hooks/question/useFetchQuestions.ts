import { useCallback } from "react";
import { QuestionBankAction } from "../reducer/useQuestionBankReducer";
import { getQuestionCount, getQuestions, searchQuestions } from "@/actions/question/questionBank";

export const useFetchQuestions = (
    filters: Filters,
    pagination: Pagination,
    searchQuery: string,
    role: UserRole,
    isTeacher: boolean,
    dispatch: (action: QuestionBankAction) => void,
    subject?: string,
) => {
    const fetchQuestions = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', loading: true })
        dispatch({ type: 'SET_ERROR', error: null })

        try {
            if (searchQuery.trim().length >= 2) {
                const searchRes = await searchQuestions(searchQuery, role, isTeacher ? subject : undefined)

                if (searchRes?.success) {
                    dispatch({ type: 'SET_QUESTIONS', questions: searchRes.data as Question[], totalCount: searchRes.data.length })
                } else {
                    dispatch({ type: 'SET_ERROR', error: searchRes?.error || "Failed to search questions" })
                    dispatch({ type: 'SET_QUESTIONS', questions: [], totalCount: 0 })
                }
            } else {
                const queryFilters = {
                    exam_name: filters.exam_name,
                    subject: filters.subject,
                    chapter: filters.chapter,
                    section_name: filters.section_name,
                    flagged: filters.flagged,
                    limit: pagination.limit,
                    skip: (pagination.page - 1) * pagination.limit
                }

                const [questionsRes, countRes] = await Promise.all([
                    getQuestions(queryFilters, role, isTeacher ? subject : undefined),
                    getQuestionCount({ ...queryFilters, limit: undefined, skip: undefined }, role, isTeacher ? subject : undefined)
                ])

                if (questionsRes.success && countRes.success) {
                    dispatch({ type: 'SET_QUESTIONS', questions: questionsRes.data as Question[], totalCount: countRes.data })
                } else {
                    dispatch({ type: 'SET_ERROR', error: questionsRes?.error || countRes?.error || 'Failed to fetch data' });
                    dispatch({ type: 'SET_QUESTIONS', questions: [], totalCount: 0 });
                }
            }
        } catch (err) {
            dispatch({ type: 'SET_ERROR', error: 'An unexpected error occurred' });
            dispatch({ type: 'SET_QUESTIONS', questions: [], totalCount: 0 });
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false });
        }
    }, [filters, pagination, searchQuery, role, isTeacher, subject, dispatch])

    return fetchQuestions
}
