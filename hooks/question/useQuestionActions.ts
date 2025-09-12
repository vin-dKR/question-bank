import { useCallback } from "react";
import { QuestionBankAction } from "../reducer/useQuestionBankReducer";
import { getQuestionsByIds, toggleFlag } from "@/actions/question/questionBank";
import { toast } from "sonner";
import { updateQuestionInDB } from "@/actions/question/questionUpdate";

export const useQuestionActions = (
    questions: Question[],
    role: UserRole,
    isTeacher: boolean,
    selectedQuestionIds: Set<string>,
    dispatch: (action: QuestionBankAction) => void,
    subject?: string,
) => {
    const toggleQuestionFlag = useCallback(async (id: string) => {
        const question = questions.find(q => id === q.id)
        if (!question) return

        dispatch({ type: "TOGGLE_FLAG", id })

        try {
            const response = await toggleFlag(id, role)
            if (!response.success) throw new Error(response.error || "Error in toggleing")
        } catch (error) {
            dispatch({ type: "TOGGLE_FLAG", id })
            toast.error(`Failed to toggle flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [questions, role, dispatch])

    const toggleQuestionSelection = useCallback((id: string) => {
        dispatch({ type: 'TOGGLE_SELECTION', id });
    }, [dispatch]);

    const updateQuestion = useCallback(
        async (updatedQuestion: Pick<Question, 'id' | 'question_text' | 'options'>) => {
            dispatch({ type: "UPDATE_QUESTION", updatedQuestion })

            try {
                const result = await updateQuestionInDB(updatedQuestion)

                if (!result.success) throw new Error(result.error || "Err in updateQuestionInDB in useQuestionActions")
                toast.success('Question updated successfully!');
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to update question');
            }
        }, [dispatch])

    const getAllSelectedQuestions = useCallback(async (): Promise<Question[]> => {
        if (selectedQuestionIds.size === 0) return []

        try {
            const response = await getQuestionsByIds(Array.from(selectedQuestionIds), role, isTeacher ? subject : undefined)
            if (response.success) return response.data as Question[]
            console.error('Failed to fetch selected questions:', response?.error);
            return []
        } catch (err) {
            console.log("Error fetching selected questions in useQuestionActions:", err)
            return []
        }
    }, [selectedQuestionIds, role, subject, isTeacher])

    return {
        toggleQuestionFlag,
        toggleQuestionSelection,
        updateQuestion,
        getAllSelectedQuestions
    }
}
