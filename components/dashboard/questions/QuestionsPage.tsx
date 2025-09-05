"use client"
import QuestionBankViewer from "./QuestionBankViewer"
import AppProviders from "@/components/providers/AppProviders"

const QuesitonsPage = () => {
    return (
        <div>
            <AppProviders>
                <QuestionBankViewer />
            </AppProviders>
        </div>
    )
}

export default QuesitonsPage
