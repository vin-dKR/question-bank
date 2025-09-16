'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, FolderOpen, Plus, AlertCircle } from 'lucide-react';
import QuestionCard from './test-creator/QuestionCard';
import UnifiedTestDetailsForm from './test-creator/UnifiedTestDetailsForm';
import EmptyQuestionsCard from './test-creator/EmptyQuestionsCard';
import RealTimePDFPreview from './test-creator/RealTimePDFPreview';
import { createTest } from '@/actions/examination/test/crudTest';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { useTestCreatorReducer } from '@/hooks/reducer/useTestCreatorReducer';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import BulkMarksAssignment from './test-creator/BulkMarksAssignment';

export default function TestCreator() {
    const router = useRouter();
    const { state, dispatch } = useTestCreatorReducer();
    const { testData, isSubmitting, hasLoadedQuestions, bulkMarks, bulkNegativeMarks } = state;
    const { institution } = usePDFGeneratorContext();
    const { selectedQuestions } = useQuestionBankContext();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [pdfFormData, setPdfFormData] = useState<TemplateFormData>({
        templateName: '',
        institution: institution || '',
        institutionAddress: '',
        marks: testData.totalMarks.toString(),
        time: testData.duration.toString(),
        exam: testData.title,
        subject: testData.subject,
        logo: '',
        standard: '',
        session: '',
    });

    // Initialize testData.questions from sessionStorage or selectedQuestions
    useEffect(() => {
        const storedQuestions = sessionStorage.getItem('selectedQuestionsForTest');
        if (storedQuestions) {
            try {
                const questions = JSON.parse(storedQuestions);
                dispatch({ type: 'LOAD_QUESTIONS', questions });
            } catch (error) {
                console.error('Error parsing sessionStorage questions:', error);
                toast.error('Failed to load selected questions from session');
            }
        }

        if (selectedQuestions.length > 0) {
            dispatch({
                type: 'SET_QUESTIONS',
                questions: selectedQuestions.map((q, index) => ({
                    id: q.id,
                    question_text: q.question_text || '',
                    options: q.options || [],
                    answer: q.answer || '',
                    question_image: q.question_image || null,
                    marks: 1,
                    question_number: q.question_number || index + 1,
                    negativeMark: 0,
                })),
            });
        }
    }, [dispatch, selectedQuestions]);

    const handleTemplateSelect = (template: Template) => {
        setSelectedTemplate(template);
        setPdfFormData(template);
    };

    // Sync pdfFormData with testData changes
    useEffect(() => {
        setPdfFormData((prev) => ({
            ...prev,
            marks: testData.totalMarks.toString(),
            time: testData.duration.toString(),
            exam: testData.title,
            subject: testData.subject,
            institution: testData.institution,
            institutionAddress: testData.institutionAddress,
            standard: testData.standard,
            session: testData.session
        }));
    }, [testData.totalMarks, testData.duration, testData.title, testData.subject, testData.institution, testData.institutionAddress, testData.standard, testData.session]);

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
                    negativeMark: 0,
                    question_number: q.question_number
                })),
            });
            toast.success('Test created successfully!');
            sessionStorage.removeItem('selectedQuestionsForTest');
            router.push('/examination');
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    };

    return (
        <div className="min-h-screen">
            <div className="w-full mx-auto">
                <div className="flex flex-col sm:flex-row items-start md:items-center justify-between tracking-2 mb-6">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
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

                        <UnifiedTestDetailsForm
                            testData={testData}
                            dispatch={dispatch}
                            onTemplateSelect={handleTemplateSelect}
                            selectedTemplate={selectedTemplate}
                        />

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

                    <div className="lg:sticky lg:top-2 lg:h-[calc(100vh-3rem)]">
                        <RealTimePDFPreview
                            pdfFormData={pdfFormData}
                            selectedQuestions={testData.questions}
                        />
                    </div>
                </div>

                {/*
                <div className="mt-8 flex justify-center">
                    <PDFGenerator
                        saveToHistory={true}
                        institution={pdfFormData.institution || institution}
                        selectedQuestions={testData.questions}
                        options={options}
                        showInPDFPreview={false}
                        marks={pdfFormData.marks}
                        time={pdfFormData.time}
                        exam={pdfFormData.exam}
                        subject={pdfFormData.subject}
                        logo={pdfFormData.logo}
                        standard={pdfFormData.standard}
                        session={pdfFormData.session}
                        institutionAddress={pdfFormData.institutionAddress}
                    />
                </div>
                */}
            </div>
        </div>
    );
}
