'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ImagePlus, LoaderCircle, RefreshCw, Sparkles, X } from 'lucide-react';
import { type QuestionFormData, useQuestionForm } from '@/hooks/question/insert';
import { useQuestionTaxonomy } from '@/hooks/queries/useQuestionTaxonomy';
import type { PageResult, PreparedPage, QuestionDraft } from '@/lib/school-test/types';
import QuestionTextEditor from './QuestionTextEditor';
import { QuestionImageAnnotator } from './QuestionImageAnnotator';
import { QuestionSpeechControls } from './QuestionSpeechControls';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const inputClass =
    'w-full h-10 px-3 text-sm rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed';
const selectClass = inputClass;
const textareaClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';
const labelClass = 'block text-xs font-medium text-zinc-600 mb-1.5';

type ExtractionPhase = 'idle' | 'preparing' | 'extracting' | 'review' | 'error';

const toEditableQuestion = (question?: Question): QuestionFormData => ({
    question_number: question?.question_number ?? '',
    question_text: question?.question_text ?? '',
    options: Array.isArray(question?.options) ? question.options.join('\n') : question?.options ?? '',
    answer: question?.answer ?? '',
    exam_name: question?.exam_name ?? '',
    subject: question?.subject ?? '',
    chapter: question?.chapter ?? '',
    isOptionImage: question?.isOptionImage ?? false,
    isQuestionImage: question?.isQuestionImage ?? false,
    question_image: question?.question_image ?? '',
});

function requestFailureMessage(response: Response, stage: 'prepare' | 'extract') {
    if (response.status === 401) return 'Your session expired. Sign in again, then retry.';
    if (response.status === 413) return 'The image is too large to process. Choose a smaller image.';
    if (response.status === 415) return 'Choose a PNG, JPG or WebP image.';
    if (response.status === 429) return 'AI extraction is temporarily rate-limited. Wait a moment, then retry.';
    return stage === 'prepare'
        ? 'The image could not be prepared. Choose a clearer image and retry.'
        : 'AI could not extract this question. Retry, or choose a clearer image.';
}

const QuestionForm = ({ initialData }: { initialData?: Question }) => {
    const { submitQuestion, loading, error, success, setError, setSuccess } = useQuestionForm();
    const [formData, setFormData] = useState<QuestionFormData>(() => toEditableQuestion(initialData));
    const [extractionPhase, setExtractionPhase] = useState<ExtractionPhase>('idle');
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [extractionResult, setExtractionResult] = useState<PageResult | null>(null);
    const [selectedDraftId, setSelectedDraftId] = useState('');
    const [reviewConfirmed, setReviewConfirmed] = useState(false);
    const [annotationOpen, setAnnotationOpen] = useState(false);
    const [annotatedImageDataUrl, setAnnotatedImageDataUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const preExtractionFormRef = useRef<QuestionFormData | null>(null);

    const exam = formData.exam_name?.trim() ?? '';
    const subject = formData.subject?.trim() ?? '';
    const { exams, subjects, chapters, examsQuery, subjectsQuery, chaptersQuery } =
        useQuestionTaxonomy(exam, subject);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setSuccess(false);
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const handleExamChange = (value: string) => {
        setSuccess(false);
        setFormData((previous) => ({ ...previous, exam_name: value, subject: '', chapter: '' }));
    };

    const handleSubjectChange = (value: string) => {
        setSuccess(false);
        setFormData((previous) => ({ ...previous, subject: value, chapter: '' }));
    };

    const handleBooleanChange = (name: string, checked: boolean) => {
        setFormData((previous) => ({
            ...previous,
            [name]: checked,
            ...(name === 'isQuestionImage' && !checked ? { question_image: '' } : {}),
        }));
    };

    const applyDraft = (draft: QuestionDraft, result: PageResult) => {
        const crop = result.crops.find((candidate) => candidate.q_no === draft.question_number);
        setAnnotatedImageDataUrl(null);
        setAnnotationOpen(false);
        setSelectedDraftId(draft.id);
        setReviewConfirmed(false);
        setSuccess(false);
        setFormData((previous) => ({
            ...previous,
            question_number: draft.question_number,
            question_text: draft.question_text,
            options: draft.options.join('\n'),
            isQuestionImage: Boolean(crop),
            question_image: crop?.dataUrl ?? '',
        }));
    };

    const extractImage = async (file: File) => {
        if (!preExtractionFormRef.current) preExtractionFormRef.current = formData;
        setError(null);
        setSuccess(false);
        setExtractionError(null);
        setExtractionResult(null);
        setSelectedDraftId('');
        setReviewConfirmed(false);
        setUploadedFile(file);

        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
            setExtractionPhase('error');
            setExtractionError('Choose a PNG, JPG or WebP image. Other file types are not supported.');
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setExtractionPhase('error');
            setExtractionError('The image is larger than 8 MB. Choose a smaller image and try again.');
            return;
        }

        setExtractionPhase('preparing');

        try {
            const body = new FormData();
            body.append('file', file);
            const prepareResponse = await fetch('/api/school-test/prepare', { method: 'POST', body });
            if (!prepareResponse.ok) {
                throw new Error(requestFailureMessage(prepareResponse, 'prepare'));
            }

            const prepared = (await prepareResponse.json()) as { pages?: PreparedPage[] };
            const page = prepared.pages?.[0];
            if (!page) throw new Error('The image did not contain a readable page.');

            setExtractionPhase('extracting');
            const extractionResponse = await fetch('/api/school-test/process-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(page),
            });
            if (!extractionResponse.ok) {
                throw new Error(requestFailureMessage(extractionResponse, 'extract'));
            }

            const payload = (await extractionResponse.json()) as { result?: PageResult };
            if (!payload.result || payload.result.questions.length === 0) {
                throw new Error('No question was detected. Try a clearer crop with the full question and options visible.');
            }

            setExtractionResult(payload.result);
            applyDraft(payload.result.questions[0], payload.result);
            setExtractionPhase('review');
        } catch (caught) {
            setExtractionPhase('error');
            setExtractionError(caught instanceof Error ? caught.message : 'The question could not be extracted. Try the image again.');
        }
    };

    const clearExtraction = () => {
        setExtractionPhase('idle');
        setExtractionError(null);
        setExtractionResult(null);
        setSelectedDraftId('');
        setReviewConfirmed(false);
        setUploadedFile(null);
        setAnnotatedImageDataUrl(null);
        setAnnotationOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (preExtractionFormRef.current) setFormData(preExtractionFormRef.current);
        preExtractionFormRef.current = null;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (extractionResult && !reviewConfirmed) {
            setError('Review the AI-extracted question and confirm it before saving.');
            return;
        }
        await submitQuestion(formData, initialData?.id);
    };

    const extractionBusy = extractionPhase === 'preparing' || extractionPhase === 'extracting';
    const selectedDraft = extractionResult?.questions.find((draft) => draft.id === selectedDraftId);
    const selectedCrop = selectedDraft
        ? extractionResult?.crops.find((crop) => crop.q_no === selectedDraft.question_number)
        : null;
    const annotationSource = selectedCrop?.dataUrl ?? extractionResult?.sourceDataUrl ?? '';

    return (
        <div className="mx-auto max-w-3xl rounded-xl border border-black/5 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
                    {initialData ? 'Edit Question' : 'Add New Question'}
                </h1>
                <p className="mt-1 text-sm text-zinc-500">
                    Choose the curriculum path, then write the question or extract it from an image.
                </p>
            </div>

            {error && (
                <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {error}
                </div>
            )}

            {success && (
                <div role="status" className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Question {initialData ? 'updated' : 'created'} successfully.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset className="space-y-4">
                    <legend className="text-sm font-semibold text-zinc-900">Curriculum</legend>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="question-number" className={labelClass}>Question Number</label>
                            <input id="question-number" type="number" min="1" name="question_number" value={formData.question_number} onChange={handleChange} className={inputClass} required />
                        </div>

                        <div>
                            <label htmlFor="exam-name" className={labelClass}>Exam</label>
                            <select id="exam-name" name="exam_name" value={formData.exam_name || ''} onChange={(event) => handleExamChange(event.target.value)} className={selectClass} aria-describedby="exam-status" disabled={examsQuery.isPending || examsQuery.isError} required>
                                <option value="">{examsQuery.isPending ? 'Loading exams…' : exams.length ? 'Select exam' : 'No exams available'}</option>
                                {exams.map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                            <div id="exam-status" className="mt-1 min-h-4 text-xs text-zinc-500" aria-live="polite">
                                {examsQuery.isError ? (
                                    <span className="inline-flex flex-wrap items-center gap-2 text-rose-600">Exam choices could not be loaded. <button type="button" onClick={() => examsQuery.refetch()} className="font-medium underline underline-offset-2">Retry</button></span>
                                ) : examsQuery.isPending ? 'Loading exam choices…' : null}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="subject" className={labelClass}>Subject</label>
                            <select id="subject" name="subject" value={formData.subject || ''} onChange={(event) => handleSubjectChange(event.target.value)} className={selectClass} aria-describedby="subject-status" disabled={!exam || subjectsQuery.isPending || subjectsQuery.isError} required>
                                <option value="">{!exam ? 'Select an exam first' : subjectsQuery.isPending ? 'Loading subjects…' : subjects.length ? 'Select subject' : 'No subjects available'}</option>
                                {subjects.map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                            <div id="subject-status" className="mt-1 min-h-4 text-xs text-zinc-500" aria-live="polite">
                                {subjectsQuery.isError ? (
                                    <span className="inline-flex flex-wrap items-center gap-2 text-rose-600">Subjects for this exam could not be loaded. <button type="button" onClick={() => subjectsQuery.refetch()} className="font-medium underline underline-offset-2">Retry</button></span>
                                ) : exam && subjectsQuery.isPending ? 'Loading subjects for this exam…' : exam && subjectsQuery.isSuccess && subjects.length === 0 ? 'No subjects are available for this exam.' : null}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="chapter" className={labelClass}>Chapter</label>
                            <select id="chapter" name="chapter" value={formData.chapter || ''} onChange={(event) => { setSuccess(false); setFormData((previous) => ({ ...previous, chapter: event.target.value })); }} className={selectClass} aria-describedby="chapter-status" disabled={!subject || chaptersQuery.isPending || chaptersQuery.isError} required>
                                <option value="">{!subject ? 'Select a subject first' : chaptersQuery.isPending ? 'Loading chapters…' : chapters.length ? 'Select chapter' : 'No chapters available'}</option>
                                {chapters.map((value) => <option key={value} value={value}>{value}</option>)}
                            </select>
                            <div id="chapter-status" className="mt-1 min-h-4 text-xs text-zinc-500" aria-live="polite">
                                {chaptersQuery.isError ? (
                                    <span className="inline-flex flex-wrap items-center gap-2 text-rose-600">Chapters for this subject could not be loaded. <button type="button" onClick={() => chaptersQuery.refetch()} className="font-medium underline underline-offset-2">Retry</button></span>
                                ) : subject && chaptersQuery.isPending ? 'Loading chapters for this subject…' : subject && chaptersQuery.isSuccess && chapters.length === 0 ? 'No chapters are available for this subject.' : null}
                            </div>
                        </div>
                    </div>
                </fieldset>

                {!initialData && (
                    <section aria-labelledby="image-extraction-title" className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                                    <h2 id="image-extraction-title" className="text-sm font-semibold text-zinc-900">Extract from an image</h2>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">Upload one clear question image. AI will fill the question and options for you to review.</p>
                            </div>
                            {extractionPhase !== 'idle' && (
                                <button type="button" onClick={clearExtraction} disabled={extractionBusy} className="rounded-md p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-700 disabled:opacity-50" aria-label="Clear uploaded image">
                                    <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                            )}
                        </div>

                        <div className="mt-3">
                            <input ref={fileInputRef} id="question-image-upload" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={extractionBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void extractImage(file); }} />
                            {extractionPhase === 'idle' ? (
                                <label htmlFor="question-image-upload" className="flex cursor-pointer flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-200 bg-white px-4 py-5 text-sm font-medium text-indigo-700 transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-500">
                                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                                    Choose question image
                                    <span className="font-normal text-zinc-400">PNG, JPG or WebP · 8 MB max</span>
                                </label>
                            ) : null}

                            <div aria-live="polite" aria-atomic="true">
                                {extractionBusy && (
                                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-indigo-100 bg-white p-3 text-sm text-zinc-700" role="status">
                                        <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" aria-hidden="true" />
                                        <div><p className="font-medium">{extractionPhase === 'preparing' ? 'Preparing image…' : 'Extracting question and options…'}</p><p className="mt-0.5 text-xs text-zinc-500">{uploadedFile?.name}</p></div>
                                    </div>
                                )}

                                {extractionPhase === 'error' && extractionError && (
                                    <div className="mt-3 rounded-lg border border-rose-100 bg-white p-3" role="alert">
                                        <div className="flex items-start gap-2 text-sm text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{extractionError}</span></div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {uploadedFile && <button type="button" onClick={() => void extractImage(uploadedFile)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Retry extraction</button>}
                                            <label htmlFor="question-image-upload" className="inline-flex h-8 cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50">Choose another image</label>
                                        </div>
                                    </div>
                                )}

                                {extractionPhase === 'review' && extractionResult && selectedDraft && (
                                    <div className="mt-3 space-y-3 rounded-lg border border-emerald-100 bg-white p-3">
                                        <div className="flex items-start gap-2 text-sm text-emerald-700" role="status">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                            <div><p className="font-medium">Extraction complete — review the fields below.</p><p className="mt-0.5 text-xs text-zinc-500">AI can make mistakes, especially in formulas and answer choices.</p></div>
                                        </div>
                                        {extractionResult.questions.length > 1 && (
                                            <div>
                                                <label htmlFor="detected-question" className={labelClass}>Detected question</label>
                                                <select id="detected-question" className={selectClass} value={selectedDraftId} onChange={(event) => { const draft = extractionResult.questions.find((item) => item.id === event.target.value); if (draft) applyDraft(draft, extractionResult); }}>
                                                    {extractionResult.questions.map((draft) => <option key={draft.id} value={draft.id}>Question {draft.question_number}</option>)}
                                                </select>
                                                <p className="mt-1 text-xs text-zinc-500">The image contains {extractionResult.questions.length} questions. Choose which one to add.</p>
                                            </div>
                                        )}
                                        {selectedCrop && (
                                            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-2">
                                                <Image src={annotatedImageDataUrl ?? selectedCrop.dataUrl} alt={annotatedImageDataUrl ? 'Annotated diagram preview' : 'Diagram detected for this question'} width={88} height={64} unoptimized className="h-16 w-20 rounded-md border border-black/5 bg-white object-contain" />
                                                <p className="text-xs leading-5 text-zinc-500">A diagram was detected and will be uploaded with the question when you save.</p>
                                            </div>
                                        )}
                                        <div className="rounded-lg border border-black/5 bg-zinc-50 p-3">
                                            <p className="text-xs leading-5 text-zinc-600">
                                                {selectedCrop
                                                    ? 'Mark or highlight the detected diagram before saving.'
                                                    : 'No separate diagram was detected. You can annotate the uploaded image if a marked region is required.'}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <button type="button" onClick={() => setAnnotationOpen(true)} className="inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
                                                    {annotatedImageDataUrl ? 'Replace annotations' : 'Annotate image'}
                                                </button>
                                                {annotatedImageDataUrl && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAnnotatedImageDataUrl(null);
                                                            setReviewConfirmed(false);
                                                            setFormData((previous) => ({
                                                                ...previous,
                                                                isQuestionImage: Boolean(selectedCrop),
                                                                question_image: selectedCrop?.dataUrl ?? '',
                                                            }));
                                                        }}
                                                        className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
                                                    >
                                                        Restore original
                                                    </button>
                                                )}
                                            </div>
                                            {annotatedImageDataUrl && !selectedCrop && (
                                                <Image src={annotatedImageDataUrl} alt="Annotated question image preview" width={240} height={160} unoptimized className="mt-3 max-h-40 w-auto rounded-md border border-black/5 bg-white object-contain" />
                                            )}
                                        </div>
                                        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/60 p-3 text-sm text-zinc-700">
                                            <input type="checkbox" checked={reviewConfirmed} onChange={(event) => { setReviewConfirmed(event.target.checked); if (event.target.checked) setError(null); }} className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                            <span>I reviewed the extracted text, options and mathematical notation.</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <div>
                    <label htmlFor="question-text" className={labelClass}>Question Text</label>
                    <QuestionTextEditor id="question-text" value={formData.question_text} onChange={(value) => { setSuccess(false); setFormData((previous) => ({ ...previous, question_text: value })); }} required />
                    <QuestionSpeechControls text={formData.question_text} />
                </div>

                <div>
                    <label htmlFor="question-options" className={labelClass}>Options (one per line)</label>
                    <textarea id="question-options" name="options" value={formData.options} onChange={handleChange} className={textareaClass} rows={4} placeholder={'(A) First option\n(B) Second option'} required />
                </div>

                <div>
                    <label htmlFor="correct-answer" className={labelClass}>Correct Answer (for example, A or B)</label>
                    <input id="correct-answer" type="text" name="answer" value={formData.answer} onChange={handleChange} className={inputClass} required />
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isQuestionImage" name="isQuestionImage" checked={formData.isQuestionImage === true || formData.isQuestionImage === 'true'} onChange={(event) => handleBooleanChange('isQuestionImage', event.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="isQuestionImage" className="text-sm text-zinc-700">Question has a diagram</label>
                </div>

                {formData.isQuestionImage && (
                    <div>
                        <label htmlFor="question-image-url" className={labelClass}>Question Image URL</label>
                        {typeof formData.question_image === 'string' && formData.question_image.startsWith('data:image/') ? (
                            <div className="rounded-lg border border-black/5 bg-zinc-50 p-3 text-xs text-zinc-500">The detected diagram is ready and will be stored when the question is saved.</div>
                        ) : (
                            <input id="question-image-url" type="url" name="question_image" value={formData.question_image || ''} onChange={handleChange} className={inputClass} placeholder="https://…" />
                        )}
                    </div>
                )}

                <div className="pt-1">
                    <button type="submit" disabled={loading || extractionBusy} className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {loading ? 'Saving question…' : initialData ? 'Update Question' : 'Add Question'}
                    </button>
                </div>
            </form>
            {annotationSource && (
                <QuestionImageAnnotator
                    open={annotationOpen}
                    sourceDataUrl={annotationSource}
                    onCancel={() => setAnnotationOpen(false)}
                    onSave={(dataUrl) => {
                        setAnnotatedImageDataUrl(dataUrl);
                        setReviewConfirmed(false);
                        setFormData((previous) => ({
                            ...previous,
                            isQuestionImage: true,
                            question_image: dataUrl,
                        }));
                        setAnnotationOpen(false);
                        setSuccess(false);
                    }}
                />
            )}
        </div>
    );
};

export default QuestionForm;
