'use client';

import { memo, useMemo, useState } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { renderMixedLatex } from '@/lib/render-tex';
import { Flag, FlagOff } from 'lucide-react';

interface QuestionProps {
    question: Question;
    isSelected: boolean;
    toggleQuestionSelection: (id: string) => void;
    toggleQuestionFlag: (id: string) => void;
}

const QuestionItem = memo(({ question, isSelected, toggleQuestionSelection, toggleQuestionFlag }: QuestionProps) => {
    const [isFlagging, setIsFlagging] = useState(false);

    const questionText = useMemo(() => renderMixedLatex(question.question_text), [question.question_text]);
    const renderedOptions = useMemo(
        () => question.options.map((option) => renderMixedLatex(option)),
        [question.options]
    );

    const handleFlagToggle = async () => {
        setIsFlagging(true);
        try {
            toggleQuestionFlag(question.id);
        } finally {
            setIsFlagging(false);
        }
    };

    return (
        <div
            className={`p-3 sm:p-4 bg-white rounded-lg shadow-md border transition-all duration-200 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:shadow-lg'
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
                        {question.exam_name && (
                            <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
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
                            {question.flagged ? (
                                <Flag className="h-4 w-4 text-amber-600" />
                            ) : (
                                <FlagOff className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    <h3 className="text-base font-semibold mb-2 text-slate-800 sm:text-lg">
                        Q: {questionText}
                    </h3>

                    <div className="space-y-2 mb-2">
                        {question.options.map((option, index) => {
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

                    {question.answer && (
                        <div className="text-sm text-green-600">
                            <span className="font-medium">Answer:</span> {question.answer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default function QuestionList() {
    const { questions, loading, error } = useQuestionBankContext();

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Search Bar */}

            {/* Question List */}
            <div className="w-full max-w-4xl mx-auto">
                {loading && (
                    <div className="text-center py-6">
                        <p className="text-slate-600">Loading questions...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-6">
                        <p className="text-red-600">{error}</p>
                    </div>
                )}

                {!loading && questions.length === 0 && (
                    <div className="text-center py-6">
                        <p className="text-slate-600">No questions found matching your criteria.</p>
                    </div>
                )}

                {!loading && questions.length > 0 && (
                    <div className="space-y-4 sm:space-y-6">
                        {questions.map((question) => (
                            <QuestionItem
                                key={question.id}
                                question={question}
                                isSelected={useQuestionBankContext().selectedQuestionIds.has(question.id)}
                                toggleQuestionSelection={useQuestionBankContext().toggleQuestionSelection}
                                toggleQuestionFlag={useQuestionBankContext().toggleQuestionFlag}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
