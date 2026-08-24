'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { Flag, FlagOff } from 'lucide-react';
import { memo, useMemo, useState, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { renderMixedLatex } from '@/lib/render-tex';
import { refineTextWithAI } from '@/lib/ai/aiService';
import { useQuestionBankContext, useQuestionsList } from '@/lib/context/QuestionBankContext';
import { resolveQuestionImage } from '@/lib/images';
import LoadingState from './question-list/LoadingState';
import ErrorState from './question-list/ErrorState';
import EmptyState from './question-list/EmptyState';
import SelectedQuestionsBanner from './question-list/SelectedQuestionsBanner';

interface QuestionProps {
    question: Question;
    isSelected: boolean;
    toggleQuestionSelection: (id: string, question?: Question) => void;
    toggleQuestionFlag: (id: string) => void;
    userRole?: 'coaching' | 'teacher' | 'student';
}

const QuestionItem = memo(({ question, isSelected, toggleQuestionSelection, toggleQuestionFlag }: QuestionProps) => {
    const { updateQuestion } = useQuestionBankContext();
    const [isFlagging, setIsFlagging] = useState(false);
    const [refiningField, setRefiningField] = useState<string | null>(null);
    const [originalQuestionText, setOriginalQuestionText] = useState<string | null>(null);
    const [originalOptions, setOriginalOptions] = useState<string[] | null>(null);

    // Memoize LaTeX renders keyed by (question.id, source text). This keeps the
    // expensive react-katex JSX trees stable across re-renders triggered by
    // sibling state changes (selection toggles, virtualization re-renders, etc).
    const questionText = useMemo(
        () => renderMixedLatex(question.question_text),
        [question.id, question.question_text],
    );
    const answerText = useMemo(
        () => renderMixedLatex(question.answer),
        [question.id, question.answer],
    );
    const renderedOptions = useMemo(
        () => question.options.map((option) => renderMixedLatex(option)),
        [question.id, question.options],
    );

    const handleFlagToggle = async () => {
        setIsFlagging(true);
        try {
            toggleQuestionFlag(question.id);
        } finally {
            setIsFlagging(false);
        }
    };

    const handleRefineField = async (
        property: keyof Pick<Question, 'question_text' | 'options'>,
        index: number | null = null,
    ) => {
        const fieldIdentifier = index !== null ? `${property}_${index}` : property;
        setRefiningField(fieldIdentifier);

        try {
            let textsToRefine: string[] = [];
            if (property === 'options' && index === null) {
                textsToRefine = question.options;
                if (textsToRefine.length === 0) {
                    toast.error('No options to refine.');
                    return;
                }
                setOriginalOptions([...question.options]);
            } else if (property === 'question_text') {
                textsToRefine = [question.question_text];
                if (!textsToRefine[0]) {
                    toast.error('There is no text to refine.');
                    return;
                }
                setOriginalQuestionText(question.question_text);
            } else if (property === 'options' && index !== null) {
                if (!question.options[index]) {
                    toast.error('Invalid option index');
                    return;
                }
                textsToRefine = [question.options[index]];
            } else {
                toast.error('Invalid property to refine');
                return;
            }

            const refinePromises = textsToRefine.map((text) => refineTextWithAI(text));
            const results = await Promise.all(refinePromises);

            const updatedQuestion = { ...question };
            if (property === 'options' && index === null) {
                updatedQuestion.options = results.map((result) => {
                    if (!result.success || !result.refined_text) {
                        throw new Error(result.error || 'Failed to refine one or more options');
                    }
                    return result.refined_text;
                });
            } else {
                const result = results[0];
                if (!result.success || !result.refined_text) {
                    throw new Error(result.error || 'Failed to refine text');
                }
                if (property === 'options' && index !== null) {
                    updatedQuestion.options = [...question.options];
                    updatedQuestion.options[index] = result.refined_text;
                } else {
                    updatedQuestion.question_text = result.refined_text;
                }
            }

            updateQuestion(updatedQuestion);
            toast.success(property === 'question_text' ? 'Question updated successfully!' : 'All options updated successfully!');
        } catch (err) {
            toast.error(`Refinement failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setRefiningField(null);
        }
    };

    const handleUndoQuestionText = async () => {
        if (!originalQuestionText) {
            toast.error('No previous question text to undo.');
            return;
        }
        const updatedQuestion = { ...question, question_text: originalQuestionText };
        try {
            updateQuestion(updatedQuestion);
            toast.success('Question text undone successfully!');
            setOriginalQuestionText(null);
        } catch (err) {
            toast.error(`Undo failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleUndoOptions = async () => {
        if (!originalOptions) {
            toast.error('No previous options to undo.');
            return;
        }
        const updatedQuestion = { ...question, options: originalOptions };
        try {
            updateQuestion(updatedQuestion);
            toast.success('Options undone successfully!');
            setOriginalOptions(null);
        } catch (err) {
            toast.error(`Undo failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const subjectColors: Record<string, string> = {
        Mathematics: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        Math: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        Physics: 'bg-violet-50 text-violet-700 border-violet-100',
        Chemistry: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        Biology: 'bg-teal-50 text-teal-700 border-teal-100',
        English: 'bg-amber-50 text-amber-700 border-amber-100',
    };
    const subjectClass = question.subject
        ? subjectColors[question.subject] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
        : 'bg-zinc-100 text-zinc-700 border-zinc-200';

    return (
        <div
            className={`group p-4 sm:p-5 bg-white rounded-xl border transition-all duration-150 ${isSelected
                ? 'border-indigo-200 bg-indigo-50/30 shadow-xs ring-1 ring-indigo-100'
                : 'border-black/5 shadow-xs hover:border-black/10'
                }`}
        >
            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onClick={() => toggleQuestionSelection(question.id, question)}
                    className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] border transition-colors ${isSelected
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-zinc-300 bg-white hover:border-zinc-400'
                        }`}
                    aria-label={isSelected ? 'Deselect question' : 'Select question'}
                >
                    {isSelected && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-white">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </button>
                <div className="flex-1 w-full text-wrap min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-3 items-center">
                        {question.exam_name && (
                            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                                {question.exam_name}
                            </span>
                        )}
                        {question.subject && (
                            <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md border ${subjectClass}`}>
                                {question.subject}
                            </span>
                        )}
                        {question.chapter && (
                            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-50 text-zinc-500 border border-zinc-200/60">
                                {question.chapter}
                            </span>
                        )}
                        <button
                            onClick={handleFlagToggle}
                            disabled={isFlagging}
                            className={`ml-auto p-1 rounded-md hover:bg-zinc-100 transition-colors ${isFlagging ? 'opacity-50 cursor-not-allowed' : ''
                                } ${question.flagged ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}`}
                            title={question.flagged ? 'Unflag question' : 'Flag question'}
                        >
                            {question.flagged ? <Flag className="h-3.5 w-3.5" /> : <FlagOff className="h-3.5 w-3.5" />}
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                onClick={() => handleRefineField('question_text', null)}
                                disabled={refiningField === 'question_text'}
                                className="px-3 text-white transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                title="Refine Question with AI"
                            >
                                {refiningField === 'question_text' ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                        />
                                    </svg>
                                )}
                            </Button>
                            {originalQuestionText && (
                                <Button
                                    onClick={handleUndoQuestionText}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                    title="Undo Question Update"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 14l-4-4m0 0l4-4m-4 4h12"
                                        />
                                    </svg>
                                </Button>
                            )}
                        </div>
                    </div>


                    <div>
                        <h3 className="text-sm md:text-base font-medium mb-2 text-zinc-900 leading-relaxed">
                            {questionText}
                        </h3>
                        {resolveQuestionImage(question.question_image) && (
                            <div>
                                <Image
                                    src={resolveQuestionImage(question.question_image)!}
                                    width={300}
                                    height={300}
                                    alt="question"
                                    unoptimized
                                />
                            </div>
                        )}
                    </div>

                    {question.option_images && resolveQuestionImage(question.option_images[0]) && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {question.option_images.map((imageUrl, index) => {
                                const optionLetter = String.fromCharCode(65 + index);
                                const src = resolveQuestionImage(imageUrl);
                                if (!src) return null;
                                return (
                                    <div key={index} className="relative flex justify-center items-center">
                                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 bg-slate-800/40 text-white px-2 py-1 rounded-md text-[9px] font-medium">
                                            {optionLetter}
                                        </div>
                                        <Image
                                            src={src}
                                            alt={`Option ${optionLetter}`}
                                            width={100}
                                            height={100}
                                            className="object-contain rounded-md"
                                            unoptimized
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!question.isOptionImage && (
                        <div className="space-y-2 mb-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleRefineField('options', null)}
                                    disabled={refiningField === 'options'}
                                    className="px-3 text-white transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                    title="Refine All Options with AI"
                                >
                                    {refiningField === 'options' ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                            />
                                        </svg>
                                    )}
                                </Button>
                                {originalOptions && (
                                    <Button
                                        onClick={handleUndoOptions}
                                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                        title="Undo Options Update"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 14l-4-4m0 0l4-4m-4 4h12"
                                            />
                                        </svg>
                                    </Button>
                                )}
                            </div>

                            {question.options.map((_option, index) => {
                                const optionLetter = String.fromCharCode(65 + index);
                                const optionNumber = String(index + 1);
                                const answers = (question.answer || '')
                                    .toString()
                                    .split(',')
                                    .map((a) => a.trim().toUpperCase());

                                const isCorrect = answers.includes(optionLetter) || answers.includes(optionNumber);

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-start gap-2.5 pl-3 pr-2 py-2 rounded-md border ${isCorrect
                                            ? 'border-emerald-100 bg-emerald-50/50'
                                            : 'border-black/5 bg-zinc-50/40'
                                            }`}
                                    >
                                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded font-mono text-[11px] font-medium ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-black/5 text-zinc-500'
                                            }`}>
                                            {optionLetter}
                                        </span>
                                        <span className="text-sm text-zinc-800 leading-relaxed flex-1 min-w-0">{renderedOptions[index]}</span>
                                        {isCorrect && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {question.answer && (
                        <div className="mt-2 text-xs text-emerald-700 inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded-md">
                            <span className="font-medium">Answer:</span> {answerText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
QuestionItem.displayName = 'QuestionItem';

// Spacer between virtual rows. Matches the visual `space-y-4` (16px) used by
// the original non-virtualized list so card spacing is preserved.
const ROW_GAP_PX = 16;
// Initial estimated row height before measurement kicks in. Cards vary because
// of LaTeX/MathJax content, so this is just a starting point — the virtualizer
// re-measures every mounted row via `measureElement`.
const ESTIMATED_ROW_HEIGHT_PX = 200;

const QuestionList = memo(() => {
    // UI state from context, server list from TanStack Query (Phase 6).
    const {
        showOnlySelected,
        toggleQuestionFlag,
        toggleQuestionSelection,
        selectedQuestions,
    } = useQuestionBankContext();

    const {
        questions,
        loading,
        error,
        hasMore,
        loadMore,
        isFetchingNextPage,
        initialFetchDone,
    } = useQuestionsList();

    const displayedQuestions = useMemo(
        () => (showOnlySelected ? selectedQuestions : questions),
        [showOnlySelected, selectedQuestions, questions]
    );

    // O(1) selected lookup so each row's `isSelected` prop is cheap to derive
    // without scanning `selectedQuestions` (which was the original O(n*m) hit).
    const selectedIdSet = useMemo(
        () => new Set(selectedQuestions.map((q) => q.id)),
        [selectedQuestions],
    );

    // Stable callback identities → child `memo` short-circuits when a row's
    // own props haven't changed (selection toggles only invalidate the row
    // whose `isSelected` flipped).
    const handleToggleQuestionSelection = useCallback(
        (id: string, question?: Question) => toggleQuestionSelection(id, question),
        [toggleQuestionSelection],
    );
    const handleToggleQuestionFlag = useCallback(
        (id: string) => toggleQuestionFlag(id),
        [toggleQuestionFlag],
    );

    // Virtualization: window the rendered question rows so we don't pay React
    // / react-katex render cost for the off-screen ~99% of a 2000-question list.
    const scrollParentRef = useRef<HTMLDivElement | null>(null);
    const rowVirtualizer = useVirtualizer({
        count: displayedQuestions.length,
        getScrollElement: () => scrollParentRef.current,
        estimateSize: () => ESTIMATED_ROW_HEIGHT_PX + ROW_GAP_PX,
        overscan: 5,
        // Stable key so React reconciles the same row across scroll/resize and
        // the inner LaTeX `useMemo` cache isn't trashed.
        getItemKey: (index) => displayedQuestions[index]?.id ?? index,
        // Dynamic measurement is handled by passing `rowVirtualizer.measureElement`
        // as the row ref below; TanStack Virtual then auto-measures via its
        // internal ResizeObserver and updates the layout as cards settle.
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    return (
        <div className="w-full">
            <div className="w-full mx-auto space-y-4">
                {showOnlySelected && (
                    <SelectedQuestionsBanner displayedCount={displayedQuestions.length} totalCount={selectedQuestions.length} />
                )}

                {loading && <LoadingState />}

                {error && <ErrorState error={error} />}

                {!loading && initialFetchDone && displayedQuestions.length === 0 && (
                    <EmptyState showOnlySelected={showOnlySelected} />
                )}

                {displayedQuestions.length > 0 && (
                    // Scroll container for the virtualized list. Using window-relative
                    // overflow keeps the visual layout (no nested scrollbar look) close
                    // to the original `space-y-4` stack while still giving the virtualizer
                    // a measurable scroll element.
                    <div
                        ref={scrollParentRef}
                        className="relative max-h-[calc(100vh-8rem)] overflow-y-auto"
                    >
                        <div
                            style={{
                                height: `${totalSize}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {virtualItems.map((virtualItem) => {
                                const question = displayedQuestions[virtualItem.index];
                                if (!question) return null;
                                return (
                                    <div
                                        key={virtualItem.key}
                                        data-index={virtualItem.index}
                                        ref={rowVirtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualItem.start}px)`,
                                            // Bottom padding emulates the original `space-y-4` gap
                                            // between cards without changing card styling.
                                            paddingBottom: `${ROW_GAP_PX}px`,
                                        }}
                                    >
                                        <QuestionItem
                                            question={question}
                                            isSelected={selectedIdSet.has(question.id)}
                                            toggleQuestionSelection={handleToggleQuestionSelection}
                                            toggleQuestionFlag={handleToggleQuestionFlag}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!showOnlySelected && displayedQuestions.length > 0 && hasMore && (
                    <div className="flex justify-center pt-2">
                        <button
                            onClick={loadMore}
                            disabled={isFetchingNextPage}
                            className="h-9 px-5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFetchingNextPage ? 'Loading…' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
QuestionList.displayName = 'QuestionList';

export default QuestionList;
