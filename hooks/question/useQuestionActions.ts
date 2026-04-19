import { useCallback } from "react";
import { QuestionBankAction } from "../reducer/useQuestionBankReducer";
import { getQuestionsByIds } from "@/actions/question/questionBank";
import {
    useToggleQuestionFlag,
    useUpdateQuestion,
} from "@/hooks/queries/mutations";

/**
 * Phase 6: the context no longer owns the question list (TanStack Query does),
 * so this hook no longer accepts a `questions` array. `toggleQuestionSelection`
 * takes the full Question object — the caller (a row in the list) already has
 * it in scope and passes it through so the reducer can keep selection state
 * self-contained.
 *
 * Phase 7: the server writes previously inlined here (`toggleFlag` +
 * `updateQuestionInDB`) now route through TanStack Query `useMutation` hooks,
 * which own optimistic cache patching + rollback + `["questions"]`
 * invalidation. This hook composes those mutations behind a stable callback
 * surface so consumers (`QuestionBankContext`, `QuestionList`) keep the exact
 * same ergonomics they had pre-refactor.
 *
 * Why compose-internally (vs. exposing mutations as separate imports at every
 * callsite)? There's a single consumer tree today (the question bank) and
 * every callsite that wants one of these writes also wants the local
 * selection state. Keeping them grouped avoids forcing every row to import
 * three hooks. The reducer keeps the "selected-questions-stay-in-sync-with-
 * flag-flip" overlay (`TOGGLE_FLAG` / `UPDATE_QUESTION`) — those mutate UI
 * state, not server state, so they still belong in the reducer. We dispatch
 * them alongside the mutation so the cached server row and the selection
 * overlay flip in lock-step.
 *
 * The old optimistic `dispatch({ type: "TOGGLE_FLAG" })` pattern (flip local,
 * call server, rollback on error) is retired on the server-list path — the
 * `useMutation`'s `onMutate` / `onError` do that work on the TanStack cache
 * (now the source of truth for what's on screen). The reducer dispatches
 * below only keep `selectedQuestions` in sync.
 */
export const useQuestionActions = (
    role: UserRole,
    isTeacher: boolean,
    selectedQuestionIds: Set<string>,
    dispatch: (action: QuestionBankAction) => void,
    subject?: string,
) => {
    const updateMutation = useUpdateQuestion();
    const toggleFlagMutation = useToggleQuestionFlag();

    const toggleQuestionFlag = useCallback(
        (id: string) => {
            // Keep the selection overlay in sync with the optimistic flip
            // that useToggleQuestionFlag applies to the server cache.
            dispatch({ type: "TOGGLE_FLAG", id });
            toggleFlagMutation.mutate(
                { id, role },
                {
                    onError: () => {
                        // Rollback the local selection overlay to match the
                        // server-cache rollback the mutation performs.
                        dispatch({ type: "TOGGLE_FLAG", id });
                    },
                },
            );
        },
        [dispatch, role, toggleFlagMutation],
    );

    const toggleQuestionSelection = useCallback(
        (id: string, question?: Question) => {
            dispatch({ type: "TOGGLE_SELECTION", id, question });
        },
        [dispatch],
    );

    const updateQuestion = useCallback(
        (updatedQuestion: Pick<Question, "id" | "question_text" | "options">) => {
            // Mirror the write into the selection overlay so a selected
            // question's edited text/options show immediately in the
            // "show only selected" view.
            dispatch({ type: "UPDATE_QUESTION", updatedQuestion });
            updateMutation.mutate({
                id: updatedQuestion.id,
                question_text: updatedQuestion.question_text,
                options: updatedQuestion.options,
            });
        },
        [dispatch, updateMutation],
    );

    const getAllSelectedQuestions = useCallback(async (): Promise<Question[]> => {
        if (selectedQuestionIds.size === 0) return [];

        try {
            const response = await getQuestionsByIds(
                Array.from(selectedQuestionIds),
                role,
                isTeacher ? subject : undefined,
            );
            if (response.success) return response.data as Question[];
            console.error("Failed to fetch selected questions:", response?.error);
            return [];
        } catch (err) {
            console.log(
                "Error fetching selected questions in useQuestionActions:",
                err,
            );
            return [];
        }
    }, [selectedQuestionIds, role, subject, isTeacher]);

    return {
        toggleQuestionFlag,
        toggleQuestionSelection,
        updateQuestion,
        getAllSelectedQuestions,
    };
};
