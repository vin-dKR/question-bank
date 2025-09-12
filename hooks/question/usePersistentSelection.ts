import { useEffect } from "react"
import { QuestionBankAction } from "../reducer/useQuestionBankReducer"

export const usePersistentSelection = (
    selectedQuestionIds: Set<string>,
    showOnlySelected: boolean,
    dispatch: (action: QuestionBankAction) => void
) => {
    useEffect(() => {
        try {
            localStorage.setItem('qb:selectedQuestionIds', JSON.stringify(Array.from(selectedQuestionIds)))
        } catch (err) {
            console.log("Failed saving LS, in usePersistentSelection", err)
        }
    }, [selectedQuestionIds])

    useEffect(() => {
        try {
            localStorage.setItem('qb:showOnlySelected', JSON.stringify(showOnlySelected))
        } catch (err) {
            console.log('ERror in showOnlySelected in usePersistentSelection', err)
        }
    }, [showOnlySelected])

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'qb:selectedQuestionIds' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue)
                    if (Array.isArray(parsed)) {
                        dispatch({ type: "TOGGLE_SELECTION", id: '' })
                    }
                } catch { }
            }

            if (e.key === 'qb:showOnlySelected' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue)
                    dispatch({ type: "SET_SHOW_ONLY_SELECTED", show: Boolean(parsed) })
                } catch { }
            }
        }

        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [dispatch])
}
