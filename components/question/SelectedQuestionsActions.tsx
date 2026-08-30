'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DialogCloseButton } from '../DialogCloseButton';
import { useQuestionBankContext, useQuestionsList } from '@/lib/context/QuestionBankContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import PDFGenerator from '../pdf/pdfPreview';
import SlideDeckDialog from '../slides/SlideDeckDialog';
import { CheckCheck, ClipboardPlus, Eye, EyeOff, ListChecks, X } from 'lucide-react';

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

        // question_image has to travel with the handoff — the create-test preview
        // renders straight from this payload, so dropping it here is why figures
        // vanished from the live PDF preview even though the bank shows them.
        const questionsData = selectedQuestions.map((q, index) => ({
            id: q.id,
            question_text: q.question_text,
            question_image: q.question_image ?? null,
            isOptionImage: q.isOptionImage ?? false,
            option_images: q.option_images ?? [],
            options: q.options,
            answer: q.answer || '',
            question_type: q.question_type || null,
            marks: 1,
            questionNumber: index + 1,
        }));

        sessionStorage.setItem('selectedQuestionsForTest', JSON.stringify(questionsData));
        router.push('/examination/create');
    };

    return (
        <section
            aria-label="Selected question actions"
            className="sticky top-2 z-20 rounded-xl border border-indigo-100 bg-white/95 p-2 shadow-md shadow-zinc-950/5 backdrop-blur"
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-indigo-800">
                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                        <span className="text-xs font-semibold">
                            {selectedCount} selected
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowOnlySelected(!showOnlySelected)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-50"
                        aria-pressed={showOnlySelected}
                    >
                        {showOnlySelected ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                        {showOnlySelected ? 'Show all' : 'Selected only'}
                    </button>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 sm:justify-end sm:pb-0">
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={selectAllQuestions}
                        disabled={showOnlySelected}
                        className="h-8 shrink-0 rounded-lg px-2.5 text-xs text-zinc-700 shadow-none"
                    >
                        <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                        Select all
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={unselectAllQuestions}
                        className="h-8 shrink-0 rounded-lg px-2.5 text-xs text-zinc-700 shadow-none"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        Clear
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        onClick={createTestFromSelected}
                        className="h-8 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs text-white shadow-none hover:bg-indigo-700 hover:translate-y-0"
                    >
                        <ClipboardPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        Create Test
                    </Button>

                    {showPrintBtn && (
                        <div className="shrink-0">
                            <PDFGenerator
                                saveToHistory={true}
                                institution={institution}
                                selectedQuestions={selectedQuestions}
                                options={options}
                                className="h-8 w-auto rounded-lg border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-none hover:bg-zinc-100 hover:text-zinc-900 hover:translate-y-0"
                            />
                        </div>
                    )}

                    <div className="shrink-0">
                        <SlideDeckDialog
                            selectedQuestions={selectedQuestions}
                            deckName={institution}
                            triggerClassName="h-8 w-auto rounded-lg px-2.5 text-xs shadow-none"
                        />
                    </div>

                    <div className="shrink-0">
                        <DialogCloseButton selectedQuestions={selectedQuestions} />
                    </div>
                </div>
            </div>
        </section>
    );
}
