'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DialogCloseButton } from '../DialogCloseButton';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import PDFGenerator from '../pdf/pdfPreview';

interface SelectedQuestionsActionsProps {
    showPrintBtn: boolean;
}

export default function SelectedQuestionsActions({ showPrintBtn }: SelectedQuestionsActionsProps) {
    const router = useRouter();
    const { institution, options } = usePDFGeneratorContext();
    const { questions, showOnlySelected, setShowOnlySelected, selectedQuestions, setSelectedQuestions } = useQuestionBankContext();

    const selectedCount = selectedQuestions.length;

    const selectAllQuestions = () => {
        setSelectedQuestions(questions);
    };

    const unselectAllQuestions = () => {
        setSelectedQuestions([]);
        localStorage.setItem('qb:selectedQuestions', JSON.stringify([]));
        setShowOnlySelected(false);
    };

    const createTestFromSelected = () => {
        if (selectedCount === 0) {
            alert('Please select at least one question to create a test.');
            return;
        }

        const questionsData = selectedQuestions.map((q, index) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            answer: q.answer || '',
            marks: 1,
            questionNumber: index + 1,
        }));

        sessionStorage.setItem('selectedQuestionsForTest', JSON.stringify(questionsData));
        router.push('/examination/create');
    };

    return (
        <div className="sticky top-0 z-10 flex flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200">
            <div className="flex flex-col">
                <span className="text-md font-medium text-slate-700">
                    {selectedCount} Question{selectedCount !== 1 ? 's' : ''} Selected
                </span>
                {selectedCount > 0 ? (
                    <button
                        onClick={() => setShowOnlySelected(!showOnlySelected)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 text-left"
                    >
                        {showOnlySelected ? 'Show All Questions' : 'See All Selected Questions'}
                    </button>
                ) : (
                    <button
                        onClick={() => setShowOnlySelected(false)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 text-left"
                    >
                        Show All Questions
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="sm"
                    onClick={selectAllQuestions}
                    disabled={showOnlySelected}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 transition text-md border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <Button
                    size="sm"
                    onClick={createTestFromSelected}
                    disabled={selectedCount === 0}
                    className="bg-green-600 text-white hover:bg-green-700 transition text-md border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Create Test
                </Button>
                {showPrintBtn && (
                    <PDFGenerator
                        saveToHistory={true}
                        institution={institution}
                        selectedQuestions={selectedQuestions}
                        options={options}
                    />
                )}
                <DialogCloseButton selectedQuestions={selectedQuestions} />
            </div>
        </div>
    );
}
