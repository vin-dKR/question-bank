'use client';

import { QuestionBankProvider } from '@/lib/context/QuestionBankContext';
import { FolderProvider } from '@/lib/context/FolderContext';
import { PDFGeneratorProvider } from '@/lib/context/PDFGeneratorContext';
import QuestionBankViewer from '@/components/question/QuestionBankViewer';

export default function Home() {


    return (
        <div className="container bg-gray-50 mx-auto">
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
