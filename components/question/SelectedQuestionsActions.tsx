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
        <div className="sticky top-[-20px] z-10 flex flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200">
            <div className="flex flex-row w-full justify-between items-center">
                <span className="text-xs md:text-sm font-bold font-medium text-slate-700">
                    {selectedCount} {selectedCount !== 1 ? 's' : ''} Selected
                </span>
                {selectedCount > 0 ? (
                    <button
                        onClick={() => setShowOnlySelected(!showOnlySelected)}
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                        <span className='text-xs sm:text-sm text-nowrap font-bold'>
                            {showOnlySelected ? 'Show All Questions' : 'See All Selected Questions'}
                        </span>
                    </button>
                ) : (
                    <button
                        onClick={() => setShowOnlySelected(false)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 text-right"
                    >
                        Show All Questions
                    </button>
                )}
            </div>

            <div className="flex flex-col w-full gap-3 md:w-auto md:flex-row md:items-center md:justify-between">
                {/* First row - becomes first column on desktop */}
                <div className="flex flex-row w-full gap-2 md:flex-row md:flex-1 md:gap-3">
                    <Button
                        size="sm"
                        onClick={selectAllQuestions}
                        disabled={showOnlySelected}
                        className="bg-indigo-600 w-full md:flex-1 text-white hover:bg-indigo-700 transition border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className='text-xs sm:text-sm text-nowrap font-bold'>
                            Select All
                        </span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={unselectAllQuestions}
                        className="px-3 py-1 w-full md:flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300 transition text-md border border-black/5"
                    >
                        <span className='text-xs sm:text-sm text-nowrap font-bold'>
                            Unselect All
                        </span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={createTestFromSelected}
                        disabled={selectedCount === 0}
                        className="bg-green-600 w-full md:flex-1 text-white hover:bg-green-700 transition text-md border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className='text-xs sm:text-sm text-nowrap font-bold'>
                            Create Test
                        </span>
                    </Button>
                </div>

                {/* Second row - becomes second column on desktop */}
                <div className='flex flex-row w-full gap-2 md:flex-row md:items-center md:justify-end md:flex-1 md:gap-3'>
                    {showPrintBtn && (
                        <div className="w-full md:w-auto">
                            <PDFGenerator
                                saveToHistory={true}
                                institution={institution}
                                selectedQuestions={selectedQuestions}
                                options={options}
                            />
                        </div>
                    )}

                    <div className="w-full md:w-auto">
                        <DialogCloseButton selectedQuestions={selectedQuestions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
