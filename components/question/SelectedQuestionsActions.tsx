'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import PDFGenerator from '../pdf/pdfPreview';
import { DialogCloseButton } from '../DialogCloseButton';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function SelectedQuestionsActions() {
    const { selectedQuestionIds, questions, toggleQuestionSelection, getAllSelectedQuestions } = useQuestionBankContext();
    const { institution, options } = usePDFGeneratorContext();
    const [allSelectedQuestions, setAllSelectedQuestions] = useState<Question[]>([]);


    const selectedCount = selectedQuestionIds.size;
    // Fetch all selected questions when selection changes
    useEffect(() => {
        const fetchAllSelected = async () => {
            if (selectedQuestionIds.size > 0) {
                const allQuestions = await getAllSelectedQuestions();
                setAllSelectedQuestions(allQuestions);
                // console.log('All selected questions fetched:', allQuestions);
            } else {
                setAllSelectedQuestions([]);
            }
        };

        fetchAllSelected();
    }, [selectedQuestionIds, getAllSelectedQuestions]);

    // Use all selected questions for PDF generation
    const selectedQuestions = allSelectedQuestions;

    const selectAllQuestions = () => {
        questions.forEach(q => {
            if (!selectedQuestionIds.has(q.id)) {
                toggleQuestionSelection(q.id);
            }
        });
    };

    const unselectAllQuestions = () => {
        selectedQuestionIds.forEach(id => {
            toggleQuestionSelection(id);
        });
    };

    return (
        <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200">

            <div className="flex flex-col">
                <span className="text-md font-medium text-slate-700">
                    {selectedCount} Question{selectedCount !== 1 ? 's' : ''} Selected
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    onClick={selectAllQuestions}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 transition text-md border border-black/20"
                >
                    Select All
                </Button>
                <Button
                    size="sm"
                    onClick={unselectAllQuestions}
                    className="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 transition text-md border border-black/5"
                >
                    Unselect All
                </Button>
                <PDFGenerator
                    institution={institution}
                    selectedQuestions={selectedQuestions}
                    options={options}
                />
                <DialogCloseButton selectedQuestions={selectedQuestions} />
            </div>

        </div>
    )
}
