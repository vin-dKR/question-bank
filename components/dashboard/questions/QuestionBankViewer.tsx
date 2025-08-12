import { Suspense } from "react"
import QuestionBankViewerContent from "./QuestionBankViewerContent"
import Loader from "./Loader"

const QuestionBankViewer = () => {
    return (
        <Suspense
            fallback={<Loader />}
        >
            <QuestionBankViewerContent />
        </Suspense>

    )
}

export default QuestionBankViewer
