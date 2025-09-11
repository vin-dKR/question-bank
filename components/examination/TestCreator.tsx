'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, FolderOpen, Plus, AlertCircle } from 'lucide-react';

import PDFGenerator from '../pdf/pdfPreview';
import QuestionCard from './test-creator/QuestionCard';
import TestDetailsForm from './test-creator/TestDetailsForm';
import EmptyQuestionsCard from './test-creator/EmptyQuestionsCard';
import BulkMarksAssignment from './test-creator/BulkMarksAssignment';

import { createTest } from '@/actions/examination/test/crudTest';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { useTestCreatorReducer } from '@/hooks/reducer/useTestCreatorReducer';

export default function TestCreator() {
    const router = useRouter();
    const { state, dispatch } = useTestCreatorReducer();
    const { testData, isSubmitting, hasLoadedQuestions, bulkMarks, bulkNegativeMarks } = state;
    const { institution, options } = usePDFGeneratorContext();

    const handleSubmit = async () => {
        if (!testData.title.trim()) {
            toast.error('Please enter a test title');
            return;
        }
        if (!testData.subject.trim()) {
            toast.error('Please select a subject');
            return;
        }
        if (testData.questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }
        for (let i = 0; i < testData.questions.length; i++) {
            const q = testData.questions[i];
            if (!q.question_text.trim()) {
                toast.error(`Question ${i + 1}: Please enter question text`);
                return;
            }
            if (q.options.some((opt) => !opt.trim())) {
                toast.error(`Question ${i + 1}: Please fill all options`);
                return;
            }
            if (!q.answer) {
                toast.error(`Question ${i + 1}: Please select correct answer`);
                return;
            }
        }

        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
        try {
            await createTest({
                title: testData.title,
                description: testData.description,
                subject: testData.subject,
                duration: typeof testData.duration === 'string' ? parseInt(testData.duration) || 60 : testData.duration,
                totalMarks: testData.questions.reduce((total, q) => total + q.marks, 0),
                questions: testData.questions.map((q) => ({
                    ...q,
                    negativeMark: q.negativeMark ?? 0,
                })),
            });
            toast.success('Test created successfully!');
            router.push('/examination');
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    };

    return (
        <div className="relative max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start md:items-center justify-between tracking-2">
                <h1 className="text-3xl font-bold">Create New Test</h1>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gray-200 border border-gray-300 rounded-xl"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Test'}
                </Button>
            </div>

            {hasLoadedQuestions && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-1">
                        <div className="flex items-center gap-2 text-green-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Questions loaded from selection</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            {testData.questions.length} questions have been loaded. You can modify marks and test details below.
                        </p>
                    </CardContent>
                </Card>
            )}

            <TestDetailsForm testData={testData} dispatch={dispatch} />
            <PDFGenerator saveToHistory={true} institution={institution} selectedQuestions={testData.questions} options={options} />
            <div className="flex flex-col sm:flex-row items-start md:items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-2">Questions ({testData.questions.length})</h2>
                <div className="flex items-center gap-2">
                    <Link href="/drafts">
                        <Button className="bg-yellow-300 border border-yellow-400">
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Add from Drafts
                        </Button>
                    </Link>
                    <Link href="/questions">
                        <Button className="bg-green-500 border border-green-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Add From Questions
                        </Button>
                    </Link>
                </div>
            </div>

            <BulkMarksAssignment
                bulkMarks={bulkMarks}
                bulkNegativeMarks={bulkNegativeMarks}
                dispatch={dispatch}
                questionCount={testData.questions.length}
            />

            <div className="space-y-6">
                {testData.questions.length > 0 ? (
                    testData.questions.map((question, index) => (
                        <QuestionCard key={question.id} question={question} index={index} dispatch={dispatch} />
                    ))
                ) : (
                    <EmptyQuestionsCard />
                )}
            </div>
        </div>
    );
}

