'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { Flag, FlagOff } from 'lucide-react';
import { memo, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { renderMixedLatex } from '@/lib/render-tex';
import { refineTextWithAI } from '@/lib/ai/aiService';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import LoadingState from './question-list/LoadingState';
import ErrorState from './question-list/ErrorState';
import EmptyState from './question-list/EmptyState';
import SelectedQuestionsBanner from './question-list/SelectedQuestionsBanner';
import PaginationControls from './question-list/PaginationControls';
import { useQuestionBankReducer } from '@/hooks/reducer/useQuestionBankReducer';

interface QuestionProps {
    question: Question;
    isSelected: boolean;
    toggleQuestionSelection: (id: string) => void;
    toggleQuestionFlag: (id: string) => void;
    userRole?: 'coaching' | 'teacher' | 'student';
}

const QuestionItem = memo(({ question, isSelected, toggleQuestionSelection, toggleQuestionFlag }: QuestionProps) => {
    const { updateQuestion } = useQuestionBankContext();
    const [isFlagging, setIsFlagging] = useState(false);
    const [refiningField, setRefiningField] = useState<string | null>(null);
    const [originalQuestionText, setOriginalQuestionText] = useState<string | null>(null);
    const [originalOptions, setOriginalOptions] = useState<string[] | null>(null);

    const questionText = useMemo(() => renderMixedLatex(question.question_text), [question.question_text]);
    const answerText = useMemo(() => renderMixedLatex(question.answer), [question.answer]);
    const renderedOptions = useMemo(() => question.options.map((option) => renderMixedLatex(option)), [question.options]);

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

    return (
        <div
            className={`p-3 sm:p-4 bg-white rounded-xl shadow-md border transition-all duration-200 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:shadow-md'
                }`}
        >
            <div className="flex items-start">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleQuestionSelection(question.id)}
                    className="mt-1 mr-2 sm:mr-3 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1 w-full text-wrap">
                    <div className="flex flex-wrap gap-2 mb-2 items-center">
                        <div>
                            {question.exam_name && (
                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-center">
                                    {question.exam_name}
                                </span>
                            )}
                            {question.subject && (
                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                                    {question.subject}
                                </span>
                            )}
                            {question.chapter && (
                                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                                    {question.chapter}
                                </span>
                            )}
                            <button
                                onClick={handleFlagToggle}
                                disabled={isFlagging}
                                className={`ml-2 p-1 text-slate-600 hover:text-amber-600 transition ${isFlagging ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                title={question.flagged ? 'Unflag question' : 'Flag question'}
                            >
                                {question.flagged ? <Flag className="h-4 w-4 text-amber-600" /> : <FlagOff className="h-4 w-4" />}
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handleRefineField('question_text', null)}
                                disabled={refiningField === 'question_text'}
                                className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
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
                        <h3 className="text-base font-semibold mb-2 text-slate-800 sm:text-lg">
                            Q: {questionText}
                        </h3>
                        {question.question_image?.startsWith('https') && (
                            <div>
                                <Image src={question.question_image} width={300} height={300} alt="question" />
                            </div>
                        )}
                    </div>

                    {question.option_images && question.option_images[0]?.startsWith('https') && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {question.option_images.map((imageUrl, index) => {
                                const optionLetter = String.fromCharCode(65 + index);
                                return (
                                    <div key={index} className="relative flex justify-center items-center">
                                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10 bg-slate-800/40 text-white px-2 py-1 rounded-md text-[9px] font-medium">
                                            {optionLetter}
                                        </div>
                                        <Image
                                            src={imageUrl}
                                            alt={`Option ${optionLetter}`}
                                            width={100}
                                            height={100}
                                            className="object-contain rounded-md"
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
                                    className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
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
                                        className={`pl-3 border-l-4 py-1 rounded-r-md ${isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'
                                            }`}
                                    >
                                        <span className="text-sm sm:text-base">{renderedOptions[index]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {question.answer && (
                        <div className="text-sm text-green-600">
                            <span className="font-medium">Answer:</span> {answerText}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
QuestionItem.displayName = 'QuestionItem';

const QuestionList = memo(() => {
    const {
        error,
        loading,
        questions,
        showOnlySelected,
        toggleQuestionFlag,
        selectedQuestionIds,
        toggleQuestionSelection,
        totalCount,
        pagination,
        setPagination,
        hasMore,
        loadMore,
        selectedQuestions,
        selectedPagination,
        setSelectedPagination,
        initialFetchDone,
        setSelectedQuestions,
    } = useQuestionBankContext();

    const [, dispatch] = useQuestionBankReducer()

    const displayedQuestions = useMemo(
        () =>
            showOnlySelected
                ? selectedQuestions.slice(
                    (selectedPagination.page - 1) * selectedPagination.limit,
                    selectedPagination.page * selectedPagination.limit
                )
                : questions,
        [showOnlySelected, selectedQuestions, selectedPagination, questions]
    );

    const displayedTotal = useMemo(() => (showOnlySelected ? selectedQuestions.length : totalCount), [
        showOnlySelected,
        selectedQuestions.length,
        totalCount,
    ]);

    const displayedHasMore = useMemo(
        () => (showOnlySelected ? selectedPagination.page * selectedPagination.limit < selectedQuestions.length : hasMore),
        [showOnlySelected, selectedPagination, selectedQuestions.length, hasMore]
    );

    const handlePrevious = useCallback(() => {
        const currentPagination = showOnlySelected ? selectedPagination : pagination;
        if (currentPagination.page > 1) {
            const newPagination = { ...currentPagination, page: currentPagination.page - 1 };
            if (showOnlySelected) {
                setSelectedPagination(newPagination);
            } else {
                setPagination(newPagination);
            }
        }
    }, [showOnlySelected, selectedPagination, pagination, setSelectedPagination, setPagination]);

    const handleNext = useCallback(() => {
        const currentPagination = showOnlySelected ? selectedPagination : pagination;
        if (currentPagination.page * currentPagination.limit < displayedTotal) {
            const newPagination = { ...currentPagination, page: currentPagination.page + 1 };
            if (showOnlySelected) {
                setSelectedPagination(newPagination);
            } else {
                setPagination(newPagination);
            }
        }
    }, [showOnlySelected, selectedPagination, pagination, displayedTotal, setSelectedPagination, setPagination]);

    const handleLoadMore = useCallback(() => {
        const currentPagination = showOnlySelected ? selectedPagination : pagination;
        const newPagination = { ...currentPagination, limit: currentPagination.limit + 20 };
        if (showOnlySelected) {
            setSelectedPagination(newPagination);
        } else {
            loadMore();
        }
    }, [showOnlySelected, selectedPagination, pagination, setSelectedPagination, loadMore]);

    const handleClearSelected = useCallback(() => {
        setSelectedQuestions([]);
        dispatch({ type: 'TOGGLE_SELECTION', id: '' });
        localStorage.removeItem('selectedQuestionIds');
        localStorage.removeItem('selectedQuestions');
        toast.success('Selected questions cleared.');
    }, [setSelectedQuestions]);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="w-full mx-auto space-y-6">
                <div className="flex gap-4">
                    {selectedQuestions.length > 0 && (
                        <Button
                            className="text-red-600 hover:text-red-800 underline"
                            onClick={handleClearSelected}
                        >
                            Clear Selected Questions
                        </Button>
                    )}
                </div>

                {showOnlySelected && (
                    <SelectedQuestionsBanner displayedCount={displayedQuestions.length} totalCount={selectedQuestions.length} />
                )}

                {loading && <LoadingState />}

                {error && <ErrorState error={error} />}

                {!loading && initialFetchDone && displayedQuestions.length === 0 && (
                    <EmptyState showOnlySelected={showOnlySelected} />
                )}

                {displayedQuestions.length > 0 && (
                    <div className="space-y-4">
                        {displayedQuestions.map((question) => (
                            <QuestionItem
                                key={question.id}
                                question={question}
                                isSelected={selectedQuestionIds.has(question.id)}
                                toggleQuestionSelection={toggleQuestionSelection}
                                toggleQuestionFlag={toggleQuestionFlag}
                            />
                        ))}
                    </div>
                )}

                {displayedQuestions.length > 0 && (
                    <PaginationControls
                        currentPage={showOnlySelected ? selectedPagination.page : pagination.page}
                        limit={showOnlySelected ? selectedPagination.limit : pagination.limit}
                        totalCount={displayedTotal}
                        hasMore={displayedHasMore}
                        onPrevious={handlePrevious}
                        onNext={handleNext}
                        onLoadMore={handleLoadMore}
                        showOnlySelected={showOnlySelected}
                        pagination={pagination}
                    />
                )}
            </div>
        </div>
    );
});
QuestionList.displayName = 'QuestionList';

export default QuestionList;
