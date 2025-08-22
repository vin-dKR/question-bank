"use client"

import DraftManager from "@/components/question/DraftManager"
import { FolderProvider } from "@/lib/context/FolderContext"
import { PDFGeneratorProvider } from "@/lib/context/PDFGeneratorContext"
import { QuestionBankProvider } from "@/lib/context/QuestionBankContext"

const DraftQuestion = () => {
    return (
        <div className="relative">
            <QuestionBankProvider>
                <FolderProvider>
                    <PDFGeneratorProvider>
                        <DraftManager />
                    </PDFGeneratorProvider>
                </FolderProvider>
            </QuestionBankProvider>
        </div>
    )
}

export default DraftQuestion
