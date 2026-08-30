'use client';

import { FileText, AlertCircle, Loader2, FileQuestion, FileCheck2, ScanLine } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

import PDFBlobViewer from './PDFBlobViewer';

import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML } from '@/lib/questionToHtmlUtils';

interface RealTimePDFPreviewProps {
    paperId: string;
    pdfFormData: TemplateFormData;
    selectedQuestions: QuestionForCreateTestData[];
}

type Tab = 'questions' | 'answers' | 'omr';

export default function RealTimePDFPreview({ paperId, pdfFormData, selectedQuestions }: RealTimePDFPreviewProps) {
    const [activeTab, setActiveTab] = useState<Tab>('questions');
    const [questionHtml, setQuestionHtml] = useState<string | null>(null);
    const [answerHtml, setAnswerHtml] = useState<string | null>(null);
    const [isGeneratingOmr, setIsGeneratingOmr] = useState(false);
    const [omrHtml, setOmrHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const pdfOptions = useMemo(
        () => ({
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
        }),
        []
    );

    const questionHtmlContent = useMemo(() => {
        if (selectedQuestions.length === 0 || !pdfFormData.exam || !pdfFormData.subject) {
            return null;
        }
        return pdfConfigToHTML({
            institution: pdfFormData.institution || '',
            institutionAddress: pdfFormData.institutionAddress,
            selectedQuestions: selectedQuestions,
            options: pdfOptions,
            marks: pdfFormData.marks,
            time: pdfFormData.time,
            exam: pdfFormData.exam,
            subject: pdfFormData.subject,
            logo: pdfFormData.logo || '',
            standard: pdfFormData.standard,
            session: pdfFormData.session,
        });
    }, [
        selectedQuestions,
        pdfFormData.institution,
        pdfFormData.institutionAddress,
        pdfFormData.marks,
        pdfFormData.time,
        pdfFormData.exam,
        pdfFormData.subject,
        pdfFormData.logo,
        pdfFormData.standard,
        pdfFormData.session,
        pdfOptions,
    ]);

    const answerHtmlContent = useMemo(() => {
        if (selectedQuestions.length === 0 || !pdfFormData.exam || !pdfFormData.subject) {
            return null;
        }
        return pdfConfigToAnswerKeyHTML({
            institution: pdfFormData.institution || '',
            selectedQuestions: selectedQuestions,
            options: pdfOptions,
            marks: pdfFormData.marks,
            time: pdfFormData.time,
            exam: pdfFormData.exam,
            subject: pdfFormData.subject,
            logo: pdfFormData.logo || '',
        });
    }, [
        selectedQuestions,
        pdfFormData.institution,
        pdfFormData.marks,
        pdfFormData.time,
        pdfFormData.exam,
        pdfFormData.subject,
        pdfFormData.logo,
        pdfOptions,
    ]);

    useEffect(() => {
        if (generationTimeoutRef.current) {
            clearTimeout(generationTimeoutRef.current);
        }
        generationTimeoutRef.current = setTimeout(() => {
            setQuestionHtml(questionHtmlContent);
            setAnswerHtml(answerHtmlContent);
        }, 300);

        return () => {
            if (generationTimeoutRef.current) {
                clearTimeout(generationTimeoutRef.current);
            }
        };
    }, [questionHtmlContent, answerHtmlContent]);

    useEffect(() => {
        if (activeTab !== 'omr') return;

        const hasOmrContent = selectedQuestions.length > 0 && Boolean(pdfFormData.exam) && Boolean(pdfFormData.subject);
        if (!hasOmrContent) {
            setOmrHtml(null);
            return;
        }

        const abortController = new AbortController();
        const timeout = setTimeout(async () => {
            setIsGeneratingOmr(true);
            setError(null);

            try {
                const response = await fetch('/api/omr/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: abortController.signal,
                    body: JSON.stringify({
                        paperId,
                        examName: pdfFormData.exam,
                        subject: pdfFormData.subject,
                        durationMin: Math.max(1, Math.trunc(Number(pdfFormData.time) || 0)),
                        maxMarks: selectedQuestions.reduce((total, question) => total + (Number(question.marks) || 0), 0),
                        questions: selectedQuestions.map((question, index) => {
                            const normalizedOptions = question.options.map((option) => option.trim().toLowerCase());
                            const looksLikeTrueFalse = normalizedOptions.length === 2
                                && normalizedOptions.includes('true')
                                && normalizedOptions.includes('false');

                            return {
                                no: question.question_number || index + 1,
                                optionCount: question.options.length,
                                questionType: question.question_type || (looksLikeTrueFalse ? 'TRUEFALSE' : null),
                            };
                        }),
                    }),
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => null) as { error?: string } | null;
                    throw new Error(payload?.error || 'Could not generate the OMR preview');
                }

                setOmrHtml(await response.text());
            } catch (previewError) {
                if (previewError instanceof DOMException && previewError.name === 'AbortError') return;
                setError(previewError instanceof Error ? previewError.message : 'Could not generate the OMR preview');
            } finally {
                if (!abortController.signal.aborted) setIsGeneratingOmr(false);
            }
        }, 600);

        return () => {
            clearTimeout(timeout);
            abortController.abort();
        };
    }, [activeTab, paperId, pdfFormData.exam, pdfFormData.subject, pdfFormData.time, selectedQuestions]);

    const currentHtml = activeTab === 'questions' ? questionHtml : answerHtml;
    const hasContent = selectedQuestions.length > 0 && Boolean(pdfFormData.exam) && Boolean(pdfFormData.subject);

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                        <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold tracking-tight text-zinc-900">Live Preview</p>
                        <p className="text-[11px] text-zinc-500 truncate">
                            {hasContent
                                ? `${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'} · updates live`
                                : 'Fill in test details to preview'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Segmented tabs */}
            <div className="border-b border-black/5 px-3 py-2">
                <div className="inline-flex items-center rounded-lg bg-zinc-100 p-0.5 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('questions')}
                        className={cn(
                            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 h-7 text-xs font-medium transition-all",
                            activeTab === 'questions'
                                ? 'bg-white text-zinc-900 shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-900'
                        )}
                    >
                        <FileQuestion className="w-3 h-3" />
                        Questions
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('answers')}
                        className={cn(
                            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 h-7 text-xs font-medium transition-all",
                            activeTab === 'answers'
                                ? 'bg-white text-zinc-900 shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-900'
                        )}
                    >
                        <FileCheck2 className="w-3 h-3" />
                        Answer Key
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('omr')}
                        className={cn(
                            "inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-md px-3 h-7 text-xs font-medium transition-all",
                            activeTab === 'omr'
                                ? 'bg-white text-zinc-900 shadow-xs'
                                : 'text-zinc-500 hover:text-zinc-900'
                        )}
                    >
                        <ScanLine className="w-3 h-3" />
                        OMR Sheet
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-700 flex-1">{error}</p>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-xs text-rose-500 hover:text-rose-700 flex-shrink-0"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0 bg-zinc-50/40 p-3">
                {!hasContent ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white text-center px-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 mb-3">
                            <FileText className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-medium text-zinc-900">Preview not ready</p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                            Add a test title, subject, and at least one question to see the live PDF preview.
                        </p>
                    </div>
                ) : activeTab === 'omr' ? (
                    <div className="relative h-full min-h-[500px] overflow-hidden rounded-lg border border-zinc-200 bg-white">
                        {omrHtml ? (
                            <iframe
                                title="OMR sheet preview"
                                srcDoc={omrHtml}
                                sandbox=""
                                className="h-full min-h-[500px] w-full border-0"
                            />
                        ) : error && !isGeneratingOmr ? (
                            <div className="flex h-full min-h-[500px] flex-col items-center justify-center px-6 text-center">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                                    <AlertCircle className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-zinc-900">OMR preview unavailable</p>
                                <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                                    Check that every OMR question has between two and eight options, then update the paper to try again.
                                </p>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-3 text-zinc-500">
                                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                                <p className="text-xs font-medium">Preparing live HTML preview…</p>
                            </div>
                        )}
                        {isGeneratingOmr && omrHtml && (
                            <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-sm backdrop-blur">
                                <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                                Updating
                            </div>
                        )}
                    </div>
                ) : (
                    <PDFBlobViewer htmlContent={currentHtml} className="h-full min-h-[500px]" />
                )}
            </div>
        </div>
    );
}
