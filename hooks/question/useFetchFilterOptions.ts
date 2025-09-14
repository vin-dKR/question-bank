import { useCallback } from "react"
import { getFilterOptions } from "@/actions/question/questionBank"
import { QuestionBankAction } from "../reducer/useQuestionBankReducer"

export const useFetchFilterOptions = (
    filters: Filters,
    role: UserRole,
    isTeacher: boolean,
    dispatch: (action: QuestionBankAction) => void,
    subject?: string
) => {
    const fetchFilterOptions = useCallback(async () => {
        dispatch({ type: "SET_OPTIONS_LOADING", loading: true })

        try {
            const response = await getFilterOptions(
                { exam_name: filters.exam_name, subject: isTeacher ? filters.subject : undefined, chapter: filters.chapter },
                role,
                isTeacher ? subject : undefined
            )

            if (response.success) {
                dispatch({ type: "SET_FILTER_OPTIONS", options: response.data })
            } else {
                dispatch({ type: "SET_FILTER_OPTIONS", options: { exams: [], subjects: [], chapters: [], section_names: [] } })
            }
        } catch (err) {
            console.log("Error on useFetchFilterOptions", err)
            dispatch({ type: "SET_FILTER_OPTIONS", options: { exams: [], subjects: [], chapters: [], section_names: [] } })
        } finally {
            dispatch({ type: "SET_OPTIONS_LOADING", loading: false })
        }
    }, [filters.exam_name, filters.chapter, filters.subject, filters.section_name, role, isTeacher, subject, dispatch])

    return fetchFilterOptions
}
