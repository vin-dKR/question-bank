'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DialogCloseButton } from '../DialogCloseButton';
import { useQuestionBankContext, useQuestionsList } from '@/lib/context/QuestionBankContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import PDFGenerator from '../pdf/pdfPreview';

interface SelectedQuestionsActionsProps {
    showPrintBtn: boolean;
}

export default function SelectedQuestionsActions({ showPrintBtn }: SelectedQuestionsActionsProps) {
    const router = useRouter();
    const { institution, options } = usePDFGeneratorContext();
    // Selection lives on the context (UI state); the currently-loaded list
    // comes from TanStack Query (Phase 6). `Select All` still only selects
    // what is currently on screen — same behavior as before the refactor.
    const { showOnlySelected, setShowOnlySelected, selectedQuestions, setSelectedQuestions } = useQuestionBankContext();
    const { questions } = useQuestionsList();

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
        <div className="sticky top-[-20px] z-10 flex flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-xs border border-black/5">
            <div className="flex flex-row w-full justify-between items-center">
                <span className="text-xs md:text-sm font-medium text-zinc-700">
                    {selectedCount} Selected
                </span>
                <button
                    onClick={() => setShowOnlySelected(selectedCount > 0 ? !showOnlySelected : false)}
                    className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer text-nowrap"
                >
                    {selectedCount > 0 && showOnlySelected ? 'Show All Questions' : selectedCount > 0 ? 'See Selected Only' : 'Show All'}
                </button>
            </div>

            <div className="flex flex-col w-full gap-3 md:w-auto md:flex-row md:items-center md:justify-between">
                <div className="flex flex-row w-full gap-2 md:flex-row md:flex-1 md:gap-2">
                    <Button
                        size="sm"
                        onClick={selectAllQuestions}
                        disabled={showOnlySelected}
                        className="w-full md:flex-1"
                    >
                        <span className="text-xs sm:text-sm text-nowrap">
                            Select All
                        </span>
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={unselectAllQuestions}
                        className="w-full md:flex-1"
                    >
                        <span className="text-xs sm:text-sm text-nowrap">
                            Unselect All
                        </span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={createTestFromSelected}
                        disabled={selectedCount === 0}
                        className="w-full md:flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        <span className="text-xs sm:text-sm text-nowrap">
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
