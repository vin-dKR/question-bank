"use client"
import QuestionBankViewer from "./QuestionBankViewer"
import { FolderProvider } from "@/lib/context/FolderContext"
import { PDFGeneratorProvider } from "@/lib/context/PDFGeneratorContext"
import { QuestionBankProvider } from "@/lib/context/QuestionBankContext"

const QuesitonsPage = () => {
    return (
        <div>
            <QuestionBankProvider>
                <FolderProvider>
                    <PDFGeneratorProvider>
                        <QuestionBankViewer />
                    </PDFGeneratorProvider>
                </FolderProvider>
            </QuestionBankProvider>

        </div>
    )
}

export default QuesitonsPage
