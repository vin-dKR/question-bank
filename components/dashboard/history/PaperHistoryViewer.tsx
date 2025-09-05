'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PDFGenerator from '@/components/pdf/pdfPreview';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, FileText, Users, Clock, Building } from 'lucide-react';
import QuestionCard from './QuestionCard';

const PaperHistoryViewer = ({ paperHistory, onBack }: PaperHistoryViewerProps) => {
    const { institution, options } = usePDFGeneratorContext();
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // Convert paper history questions to Question format for compatibility
    const questions = useMemo(() => {
        return paperHistory.questions.map(phq => ({
            id: phq.questionId,
            question_number: phq.questionNumber,
            question_text: phq.question.question_text,
            options: phq.question.options,
            answer: phq.question.answer || '',
            topic: phq.question.topic,
            exam_name: phq.question.exam_name,
            subject: phq.question.subject,
            chapter: phq.question.chapter,
            flagged: false,
        }));
    }, [paperHistory.questions]);

    // Derive selected questions from selectedQuestionIds
    const selectedQuestions = useMemo(() => {
        return questions.filter(q => selectedQuestionIds.has(q.id));
    }, [questions, selectedQuestionIds]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    // Toggle selection of a question
    const toggleSelection = (id: string) => {
        setSelectedQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Create a custom SelectedQuestionsActions component
    const LocalSelectedQuestionsActions = () => {
        const selectedCount = selectedQuestionIds.size;

        const selectAllQuestions = () => {
            setSelectedQuestionIds(new Set(questions.map(q => q.id)));
        };

        const unselectAllQuestions = () => {
            setSelectedQuestionIds(new Set());
        };

        const createTestFromSelected = () => {
            if (selectedCount === 0) {
                alert('Please select at least one question to create a test.');
                return;
            }

            const questionsData = selectedQuestions.map((q, index) => ({
                id: q.id,
                questionText: q.question_text,
                options: q.options,
                answer: q.answer || '',
                marks: 1,
                questionNumber: index + 1,
            }));

            sessionStorage.setItem('selectedQuestionsForTest', JSON.stringify(questionsData));
            window.location.href = '/examination/create';
        };

        return (
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-3 md:p-4 rounded-xl shadow-md border border-slate-200">
                <div className="flex flex-col">
                    <span className="text-md font-medium text-slate-700">
                        {selectedCount} Question{selectedCount !== 1 ? 's' : ''} Selected
                    </span>
                </div>
                <div></div>
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
                    <Button
                        size="sm"
                        onClick={createTestFromSelected}
                        disabled={selectedCount === 0}
                        className="bg-green-600 text-white hover:bg-green-700 transition text-md border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Test
                    </Button>
                    <PDFGenerator
                        saveToHistory={false}
                        institution={institution}
                        selectedQuestions={selectedQuestions}
                        options={options}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to History
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{paperHistory.title}</h1>
                        <p className="text-gray-600 mt-1">Paper History Details</p>
                    </div>
                </div>
            </div>

            {/* Paper Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Paper Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paperHistory.institution && (
                            <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Institution:</span>
                                <span className="text-sm text-gray-600">{paperHistory.institution}</span>
                            </div>
                        )}
                        {paperHistory.subject && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Subject:</span>
                                <span className="text-sm text-gray-600">{paperHistory.subject}</span>
                            </div>
                        )}
                        {paperHistory.exam && (
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Exam:</span>
                                <span className="text-sm text-gray-600">{paperHistory.exam}</span>
                            </div>
                        )}
                        {paperHistory.marks && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Total Marks:</span>
                                <span className="text-sm text-gray-600">{paperHistory.marks}</span>
                            </div>
                        )}
                        {paperHistory.time && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Duration:</span>
                                <span className="text-sm text-gray-600">{paperHistory.time}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Created:</span>
                            <span className="text-sm text-gray-600">{formatDate(paperHistory.createdAt)}</span>
                        </div>
                    </div>

                    {paperHistory.description && (
                        <div className="mt-4">
                            <span className="text-sm font-medium">Description:</span>
                            <p className="text-sm text-gray-600 mt-1">{paperHistory.description}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                        {paperHistory.standard && <Badge variant="secondary">{paperHistory.standard}</Badge>}
                        {paperHistory.session && <Badge variant="outline">{paperHistory.session}</Badge>}
                        <Badge variant="outline">{paperHistory.questions.length} Questions</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Questions Actions */}
            {selectedQuestionIds.size > 0 && <LocalSelectedQuestionsActions />}

            {/* Questions List */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Questions ({paperHistory.questions.length})</h2>
                {paperHistory.questions.map(phq => (
                    <QuestionCard
                        key={phq.id}
                        phq={phq}
                        isSelected={selectedQuestionIds.has(phq.question.id)}
                        toggleSelection={toggleSelection}
                    />
                ))}
            </div>
        </div>
    );
};

export default PaperHistoryViewer;
