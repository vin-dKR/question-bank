'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Save, FolderOpen, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import QuestionCard from './test-creator/QuestionCard';
import UnifiedTestDetailsForm from './test-creator/UnifiedTestDetailsForm';
import EmptyQuestionsCard from './test-creator/EmptyQuestionsCard';
import RealTimePDFPreview from './test-creator/RealTimePDFPreview';
import { createTest } from '@/actions/examination/test/crudTest';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { useTestCreatorReducer } from '@/hooks/reducer/useTestCreatorReducer';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import BulkMarksAssignment from './test-creator/BulkMarksAssignment';

export default function TestCreator({ paperId }: { paperId: string }) {
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

    useEffect(() => {
        const storedQuestions = sessionStorage.getItem('selectedQuestionsForTest');
        if (storedQuestions) {
            try {
                const questions = JSON.parse(storedQuestions);
                dispatch({ type: 'LOAD_QUESTIONS', questions });
                return;
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
                    question_type: q.question_type || null,
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
            const createdTest = await createTest({
                omrPaperId: paperId,
                classId: testData.classId ?? null,
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
            router.push(createdTest.id ? `/examination/tests/${createdTest.id}` : '/examination');
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    };

    return (
        <div className="pb-6 space-y-5">
            {/* Page header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-700">
                        New Test
                    </div>
                    <h1 className="mt-1.5 text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">
                        Create Test
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Configure details, attach questions, and preview your paper.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {testData.questions.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 border border-black/5 text-xs font-medium text-zinc-600">
                            <span>{testData.questions.length}</span>
                            <span className="text-zinc-400">questions</span>
                        </div>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        size="sm"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? 'Creating…' : 'Create Test'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
                <div className="space-y-5">
                    {hasLoadedQuestions && (
                        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-indigo-900">
                                    Questions loaded from selection
                                </p>
                                <p className="text-xs text-indigo-700/80 mt-0.5">
                                    {testData.questions.length} questions have been loaded. Modify marks and details below.
                                </p>
                            </div>
                        </div>
                    )}

                    <UnifiedTestDetailsForm
                        testData={testData}
                        dispatch={dispatch}
                        onTemplateSelect={handleTemplateSelect}
                        selectedTemplate={selectedTemplate}
                    />

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-base md:text-lg font-semibold tracking-tight text-zinc-900">Questions</h2>
                            <span className="text-sm text-zinc-400 font-mono">
                                {testData.questions.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" asChild>
                                <Link href="/drafts" className="inline-flex items-center">
                                    <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                                    <span className="text-xs sm:text-sm whitespace-nowrap">From Drafts</span>
                                </Link>
                            </Button>
                            <Button size="sm" asChild>
                                <Link href="/questions" className="inline-flex items-center">
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                    <span className="text-xs sm:text-sm whitespace-nowrap">From Bank</span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <BulkMarksAssignment
                        bulkMarks={bulkMarks}
                        bulkNegativeMarks={bulkNegativeMarks}
                        dispatch={dispatch}
                        questionCount={testData.questions.length}
                    />

                    <div className="space-y-4">
                        {testData.questions.length > 0 ? (
                            testData.questions.map((question, index) => (
                                <QuestionCard key={question.id} question={question} index={index} dispatch={dispatch} />
                            ))
                        ) : (
                            <EmptyQuestionsCard />
                        )}
                    </div>
                </div>

                <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
                    <RealTimePDFPreview
                        paperId={paperId}
                        pdfFormData={pdfFormData}
                        selectedQuestions={testData.questions}
                    />
                </div>
            </div>
        </div>
    );
}
