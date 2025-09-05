'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PDFGenerator from '../pdf/pdfPreview';
import { Button } from '@/components/ui/button';
import { DialogCloseButton } from '../DialogCloseButton';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';

export default function SelectedQuestionsActions() {
    const router = useRouter();
    const { institution, options } = usePDFGeneratorContext();
    const [isLoadingSelected, setIsLoadingSelected] = useState(false);
    const [allSelectedQuestions, setAllSelectedQuestions] = useState<Question[]>([]);
    const {
        questions,
        showOnlySelected,
        setShowOnlySelected,
        selectedQuestionIds,
        toggleQuestionSelection,
        getAllSelectedQuestions,
    } = useQuestionBankContext();

    const selectedCount = selectedQuestionIds.size;
    // Fetch all selected questions when selection changes
    useEffect(() => {
        const fetchAllSelected = async () => {
            if (selectedQuestionIds.size > 0) {
                setIsLoadingSelected(true);
                try {
                    const allQuestions = await getAllSelectedQuestions();
                    setAllSelectedQuestions(allQuestions);
                    // console.log('All selected questions fetched:', allQuestions);
                } catch (error) {
                    console.error('Failed to fetch selected questions:', error);
                } finally {
                    setIsLoadingSelected(false);
                }
            } else {
                setAllSelectedQuestions([]);
                setIsLoadingSelected(false);
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
        // Reset to show all questions when unselecting all
        setShowOnlySelected(false);
    };

    const createTestFromSelected = () => {
        if (selectedCount === 0) {
            alert('Please select at least one question to create a test.');
            return;
        }

        // Prepare the selected questions data for the examination creation page
        const questionsData = selectedQuestions.map((q, index) => ({
            id: q.id,
            questionText: q.question_text,
            options: q.options,
            answer: q.answer || '',
            marks: 1, // Default marks, can be changed in the creation page
            questionNumber: index + 1,
        }));

        // Store the data in sessionStorage for the examination creation page
        sessionStorage.setItem('selectedQuestionsForTest', JSON.stringify(questionsData));

        // Navigate to the examination creation page
        router.push('/examination/create');
    };

    return (
        <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200">

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
                {isLoadingSelected && showOnlySelected && (
                    <div className="flex items-center gap-2 mt-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-xs text-blue-600">Loading selected questions...</span>
                    </div>
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
                <PDFGenerator
                    saveToHistory={true}
                    institution={institution}
                    selectedQuestions={selectedQuestions}
                    options={options}
                />
                <DialogCloseButton selectedQuestions={selectedQuestions} />
            </div>

        </div>
    )
}
