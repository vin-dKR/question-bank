'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Download, FolderOpen, Plus, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import QuestionCard from './test-creator/QuestionCard';
import UnifiedTestDetailsForm from './test-creator/UnifiedTestDetailsForm';
import EmptyQuestionsCard from './test-creator/EmptyQuestionsCard';
import RealTimePDFPreview from './test-creator/RealTimePDFPreview';
import { createTest } from '@/actions/examination/test/crudTest';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { useTestCreatorReducer } from '@/hooks/reducer/useTestCreatorReducer';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import BulkMarksAssignment from './test-creator/BulkMarksAssignment';
import { preRenderHtml } from '@/lib/preRenderHtml';
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf';
import { pdfConfigToAnswerKeyHTML, pdfConfigToHTML } from '@/lib/questionToHtmlUtils';
import { fetchOmrSheet } from './downloadOmrSheet';
import {
    closeDownloadSlots,
    deliverReservedDownload,
    reserveDownloadSlots,
    type ReservedDownloadSlot,
    type TestPdfKind,
} from './test-creator/downloadSlots';

const PDF_KINDS: TestPdfKind[] = ['questions', 'answers', 'omr'];
const PDF_LABELS: Record<TestPdfKind, string> = {
    questions: 'Questions',
    answers: 'Answer Key',
    omr: 'OMR Sheet',
};
const PDF_OPTIONS = {
    includeAnswers: false,
    includeMetadata: true,
    pageSize: 'a4' as const,
    orientation: 'portrait' as const,
    fontSize: 12,
    lineHeight: 1.4,
    margin: 20,
    pdfOptions: {
        pageSize: 'a4' as const,
        orientation: 'portrait' as const,
        margin: 20,
        scale: 0.8,
        quality: 0.8,
    },
};

type PdfProgress = Record<TestPdfKind, 'pending' | 'running' | 'downloaded' | 'failed'>;

interface WorkflowSnapshot {
    testData: CreateTestData;
    pdfFormData: TemplateFormData;
}

const INITIAL_PDF_PROGRESS: PdfProgress = {
    questions: 'pending',
    answers: 'pending',
    omr: 'pending',
};

function safeFilenamePart(value: string | undefined) {
    return (value || 'test').replace(/[^A-Za-z0-9._-]+/g, '_');
}

function cloneSnapshot(testData: CreateTestData, pdfFormData: TemplateFormData): WorkflowSnapshot {
    return {
        testData: {
            ...testData,
            questions: testData.questions.map((question) => ({
                ...question,
                options: [...question.options],
                option_images: question.option_images ? [...question.option_images] : question.option_images,
                crop_bbox: question.crop_bbox ? [...question.crop_bbox] as [number, number, number, number] : question.crop_bbox,
            })),
        },
        pdfFormData: { ...pdfFormData },
    };
}

export default function TestCreator({ paperId }: { paperId: string }) {
    const router = useRouter();
    const { state, dispatch } = useTestCreatorReducer();
    const { testData, isSubmitting, hasLoadedQuestions, bulkMarks, bulkNegativeMarks } = state;
    const { institution } = usePDFGeneratorContext();
    const { selectedQuestions } = useQuestionBankContext();
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [pdfProgress, setPdfProgress] = useState<PdfProgress>(INITIAL_PDF_PROGRESS);
    const [workflowStep, setWorkflowStep] = useState<string | null>(null);
    const [workflowError, setWorkflowError] = useState<string | null>(null);
    const [createdTestId, setCreatedTestId] = useState<string | null>(null);
    const workflowSnapshotRef = useRef<WorkflowSnapshot | null>(null);
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
        // Keep the idempotency key across a full-page retry without leaking it
        // into a future create flow: reload retains the query string, while a
        // fresh navigation to /examination/create receives a new server ID.
        const url = new URL(window.location.href);
        if (url.searchParams.get('paperId') !== paperId) {
            url.searchParams.set('paperId', paperId);
            window.history.replaceState(window.history.state, '', url);
        }
    }, [paperId]);

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

    const validateTest = (data: CreateTestData) => {
        if (!data.title.trim()) {
            toast.error('Please enter a test title');
            return false;
        }
        if (!data.subject.trim()) {
            toast.error('Please select a subject');
            return false;
        }
        if (data.questions.length === 0) {
            toast.error('Please add at least one question');
            return false;
        }
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            if (!q.question_text.trim()) {
                toast.error(`Question ${i + 1}: Please enter question text`);
                return false;
            }
            if (q.options.some((opt) => !opt.trim())) {
                toast.error(`Question ${i + 1}: Please fill all options`);
                return false;
            }
            if (!q.answer) {
                toast.error(`Question ${i + 1}: Please select correct answer`);
                return false;
            }
        }
        return true;
    };

    const renderPaperPdf = async (kind: 'questions' | 'answers', snapshot: WorkflowSnapshot) => {
        await preRenderHtml();
        const form = snapshot.pdfFormData;
        const config = {
            institution: form.institution || '',
            institutionAddress: form.institutionAddress,
            selectedQuestions: snapshot.testData.questions,
            options: PDF_OPTIONS,
            marks: form.marks,
            time: form.time,
            exam: form.exam,
            subject: form.subject,
            logo: form.logo || '',
            standard: form.standard,
            session: form.session,
        };
        const html = kind === 'questions'
            ? pdfConfigToHTML(config)
            : pdfConfigToAnswerKeyHTML(config);
        const result = await htmlTopdfBlob(html);
        if (!result.data) {
            throw new Error(result.errorMessage || `Failed to generate ${PDF_LABELS[kind]}`);
        }
        return new Blob([result.data], { type: 'application/pdf' });
    };

    const handleSubmit = async () => {
        const snapshot = workflowSnapshotRef.current ?? cloneSnapshot(testData, pdfFormData);
        if (!workflowSnapshotRef.current && !validateTest(snapshot.testData)) return;

        const remaining = PDF_KINDS.filter((kind) => pdfProgress[kind] !== 'downloaded');
        let slots: ReservedDownloadSlot[] = [];

        // This must remain before the first await: popup permission and browser
        // user activation do not survive the save/PDF server round-trips.
        try {
            slots = reserveDownloadSlots(remaining);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Allow pop-ups for this site, then try again.';
            setWorkflowError(message);
            toast.error(message);
            return;
        }

        workflowSnapshotRef.current = snapshot;
        setWorkflowError(null);

        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
        let currentKind: TestPdfKind | null = null;
        let savedTestId = createdTestId;
        const completed = new Set(PDF_KINDS.filter((kind) => pdfProgress[kind] === 'downloaded'));

        try {
            setWorkflowStep(savedTestId ? 'Confirming saved test…' : 'Saving test…');
            const createdTest = await createTest({
                omrPaperId: paperId,
                classId: snapshot.testData.classId ?? null,
                title: snapshot.testData.title,
                description: snapshot.testData.description,
                subject: snapshot.testData.subject,
                duration: typeof snapshot.testData.duration === 'string'
                    ? parseInt(snapshot.testData.duration) || 60
                    : snapshot.testData.duration,
                totalMarks: snapshot.testData.questions.reduce((total, q) => total + q.marks, 0),
                questions: snapshot.testData.questions.map((q) => ({
                    ...q,
                    negativeMark: 0,
                    question_number: q.question_number
                })),
            });
            if (!createdTest.id) throw new Error('The test was saved but no test ID was returned');
            savedTestId = createdTest.id;
            setCreatedTestId(createdTest.id);

            for (const kind of remaining) {
                currentKind = kind;
                setPdfProgress((progress) => ({ ...progress, [kind]: 'running' }));
                setWorkflowStep(`Generating ${PDF_LABELS[kind]}…`);
                const slot = slots.find((candidate) => candidate.kind === kind);
                if (!slot) throw new Error(`No download window is available for ${PDF_LABELS[kind]}`);

                const safeName = safeFilenamePart(snapshot.pdfFormData.exam || snapshot.testData.title);
                let blob: Blob;
                let filename: string;
                if (kind === 'questions') {
                    blob = await renderPaperPdf('questions', snapshot);
                    filename = `${safeName}_questions.pdf`;
                } else if (kind === 'answers') {
                    blob = await renderPaperPdf('answers', snapshot);
                    filename = `${safeName}_answers.pdf`;
                } else {
                    const omr = await fetchOmrSheet(createdTest.id, `${safeName}_omr_sheet.pdf`);
                    blob = omr.blob;
                    filename = omr.filename;
                }

                setWorkflowStep(`Downloading ${PDF_LABELS[kind]}…`);
                await deliverReservedDownload(slot, blob, filename);
                completed.add(kind);
                setPdfProgress((progress) => ({ ...progress, [kind]: 'downloaded' }));
            }

            setWorkflowStep('Downloads started');
            toast.success('Test created and all three PDF downloads started.');
            sessionStorage.removeItem('selectedQuestionsForTest');
            router.push(createdTest.id ? `/examination/tests/${createdTest.id}` : '/examination');
        } catch (error) {
            console.error('Create test and download workflow failed:', error);
            if (currentKind) {
                setPdfProgress((progress) => ({ ...progress, [currentKind!]: 'failed' }));
            }
            const detail = error instanceof Error ? error.message : 'Unknown error';
            const downloaded = PDF_KINDS.filter((kind) => completed.has(kind)).map((kind) => PDF_LABELS[kind]);
            const message = savedTestId
                ? `Test saved. ${downloaded.length > 0 ? `${downloaded.join(', ')} download${downloaded.length === 1 ? '' : 's'} started. ` : ''}${currentKind ? `${PDF_LABELS[currentKind]} failed: ` : ''}${detail} Retry to download only the remaining files.`
                : `The test was not created and no PDFs were downloaded: ${detail}`;
            setWorkflowStep(null);
            setWorkflowError(message);
            toast.error(message);
        } finally {
            closeDownloadSlots(slots.filter((slot) => !completed.has(slot.kind)));
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
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting
                            ? workflowStep || 'Working…'
                            : createdTestId || Object.values(pdfProgress).some((status) => status === 'downloaded')
                                ? 'Retry Remaining Downloads'
                                : 'Create Test & Download'}
                    </Button>
                </div>
            </div>

            {workflowError && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p className="text-xs leading-5">{workflowError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 @5xl/page:grid-cols-2 @5xl/page:gap-6">
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

                <div className="@5xl/page:sticky @5xl/page:top-20 @5xl/page:h-[calc(100dvh-6rem)]">
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
