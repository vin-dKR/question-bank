import { getQuestionsData } from "@/actions/dashboard/questionsData"
import { useEffect, useState } from "react"

export const useQuestionsData = () => {
    const [totalQuestions, setTotalQuestions] = useState(0)

    useEffect(() => {
        const questionsData = async () => {
            const { totalQuestions } = await getQuestionsData()
            setTotalQuestions(totalQuestions)
        }

        questionsData()
    }, [])

    return totalQuestions
}
