'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import PDFGenerator from '../pdf/pdfPreview';
import AnswerPDFGenerator from '../pdf/AnswerPdfGenerator';
import { DialogCloseButton } from '../DialogCloseButton';
import { Button } from '@/components/ui/button';

export default function SelectedQuestionsActions() {
    const { selectedQuestionIds, selectAllQuestions, unselectAllQuestions } = useQuestionBankContext();
    const { institution, options } = usePDFGeneratorContext();

    const selectedCount = selectedQuestionIds.size;
    const selectedQuestions = useQuestionBankContext().selectedQuestions;

    return (
        <div className="flex flex-row flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-lg shadow-md border border-slate-200 items-start">
            <div className='flex items-center gap-3'>
                <span className="text-md font-medium text-slate-700">
                    {selectedCount} Question{selectedCount !== 1 ? 's' : ''} Selected
                </span>
                <Button
                    onClick={selectAllQuestions}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-md text-md"
                >
                    Select All
                </Button>
                <Button
                    onClick={unselectAllQuestions}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition shadow-md text-md"
                >
                    Unselect All
                </Button>
            </div>

            <div className='flex gap-2 items-center'>
                <PDFGenerator
                    institution={institution}
                    selectedQuestions={selectedQuestions}
                    options={options}
                />
                <AnswerPDFGenerator />
                <DialogCloseButton selectedQuestions={selectedQuestions} />
            </div>

        </div>
    );
}
