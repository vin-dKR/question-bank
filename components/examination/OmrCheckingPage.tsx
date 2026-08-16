'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ClipboardCheck,
    FileDown,
    Loader2,
    ScanLine,
    Upload,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTests } from '@/hooks/queries/useTests';
import { downloadOmrSheet } from './downloadOmrSheet';

interface TestOption {
    id: string;
    title: string;
    subject: string;
    duration: number;
    totalMarks: number;
    _count?: {
        responses: number;
    };
}

type OmrStatus = 'idle' | 'processing' | 'saving' | 'saved';

interface OmrDetectionResponse {
    field: string;
    question_no: number;
    type: 'MCQ' | 'MSQ' | 'TRUEFALSE' | 'FIB';
    detected: string;
    filled: string[];
    fill_ratios: Record<string, number>;
    confidence: number;
    is_ambiguous: boolean;
    reason?: string;
}

interface OmrDetectionResult {
    ok: boolean;
    status: string;
    paper_id?: string;
    version?: number;
    page?: number;
    warnings: string[];
    quality: {
        blur_score?: number;
        blur_floor?: number;
        marker_scores?: number[];
        roll_number?: string;
    };
    responses: OmrDetectionResponse[];
    needs_review: boolean;
    overlay_png_b64?: string;
}

interface PageDetection extends OmrDetectionResult {
    filename: string;
}

type OmrAnswerGradeStatus = 'correct' | 'incorrect' | 'unanswered' | 'no_key' | 'review';

interface OmrGradedAnswer {
    questionNumber: number;
    questionId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    confidence: number;
    marks: number;
    earnedMarks: number;
    isCorrect: boolean;
    isAmbiguous: boolean;
    status: OmrAnswerGradeStatus;
}

interface OmrGradeSummary {
    score: number;
    totalMarks: number;
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
    answers: OmrGradedAnswer[];
}

interface ScanResult {
    detection: OmrDetectionResult;
    detections: PageDetection[];
    pageCount: number;
    grading?: OmrGradeSummary;
    response?: {
        score: number;
        totalMarks: number;
        percentage: number;
        student: {
            name: string;
            rollNumber: string;
            className: string;
        };
    };
}

interface ApiResponse {
    message?: string;
    error?: string;
    data?: ScanResult;
}

interface OmrCheckingPageProps {
    initialTestId?: string;
}

export default function OmrCheckingPage({ initialTestId }: OmrCheckingPageProps) {
    const [selectedTestId, setSelectedTestId] = useState(initialTestId ?? '');
    const [files, setFiles] = useState<File[]>([]);
    const [studentName, setStudentName] = useState('');
    const [className, setClassName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [timeTaken, setTimeTaken] = useState('');
    const [status, setStatus] = useState<OmrStatus>('idle');
    const [isDownloadingSheet, setIsDownloadingSheet] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useTests({ skip: 0, take: 100 });

    const tests = useMemo(() => (data?.items ?? []) as TestOption[], [data?.items]);
    const selectedTest = useMemo(
        () => tests.find((test) => test.id === selectedTestId) ?? null,
        [selectedTestId, tests],
    );

    useEffect(() => {
        if (!selectedTestId && tests.length > 0) {
            setSelectedTestId(tests[0].id);
        }
    }, [selectedTestId, tests]);

    useEffect(() => {
        if (isError) {
            toast.error('Failed to load tests');
        }
    }, [isError]);

    useEffect(() => {
        const detectedRoll = result?.detection.quality.roll_number;
        if (detectedRoll && !rollNumber) {
            setRollNumber(detectedRoll);
        }
    }, [result, rollNumber]);

    const canProcess = Boolean(selectedTestId && files.length > 0);
    const canSave = Boolean(
        result?.detection.ok &&
        !result.detection.needs_review &&
        studentName.trim() &&
        className.trim() &&
        rollNumber.trim() &&
        files.length > 0,
    );

    const processScan = async (save: boolean) => {
        if (!selectedTestId) {
            toast.error('Select a test first');
            return;
        }

        if (files.length === 0) {
            toast.error('Upload at least one scanned OMR image');
            return;
        }

        if (save && (!studentName.trim() || !className.trim() || !rollNumber.trim())) {
            toast.error('Student name, class, and roll number are required before saving');
            return;
        }

        setStatus(save ? 'saving' : 'processing');

        const form = new FormData();
        files.forEach((file) => form.append('files', file));
        form.append('includeImages', save ? 'false' : 'true');
        form.append('save', save ? 'true' : 'false');
        form.append('name', studentName.trim());
        form.append('className', className.trim());
        form.append('rollNumber', rollNumber.trim());
        if (timeTaken.trim()) form.append('timeTaken', timeTaken.trim());

        try {
            const response = await fetch(`/api/omr/tests/${selectedTestId}/scan`, {
                method: 'POST',
                body: form,
            });
            const payload = (await response.json()) as ApiResponse;

            if (!response.ok) {
                if (payload.data) setResult(payload.data);
                throw new Error(payload.error || 'OMR scan failed');
            }

            if (!payload.data) {
                throw new Error('OMR scan returned no data');
            }

            setResult(payload.data);

            if (save) {
                setStatus('saved');
                toast.success('OMR response saved');
                queryClient.invalidateQueries({ queryKey: ['tests'] });
                queryClient.invalidateQueries({ queryKey: ['testAnalytics', selectedTestId] });
            } else {
                setStatus('idle');
                toast.success(payload.data.detection.needs_review ? 'Scan needs review' : 'Scan processed');
            }
        } catch (error) {
            setStatus('idle');
            toast.error(error instanceof Error ? error.message : 'OMR scan failed');
        }
    };

    const handleDownloadSheet = async () => {
        if (!selectedTestId) return;

        setIsDownloadingSheet(true);
        try {
            await downloadOmrSheet(
                selectedTestId,
                `${selectedTest?.title.replace(/[^A-Za-z0-9._-]+/g, '_') || 'omr_sheet'}_omr.pdf`,
            );
            toast.success('OMR sheet downloaded');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to download OMR sheet');
        } finally {
            setIsDownloadingSheet(false);
        }
    };

    const detection = result?.detection;
    const gradingByQuestion = useMemo(
        () => new Map((result?.grading?.answers ?? []).map((answer) => [answer.questionNumber, answer])),
        [result?.grading],
    );
    const clearScan = () => {
        setFiles([]);
        setResult(null);
        setStatus('idle');
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-56" />
                <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
                    <Skeleton className="h-[520px]" />
                    <Skeleton className="h-[520px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-6 pb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                        <ScanLine className="h-3 w-3" />
                        OMR checking
                    </div>
                    <h1 className="mt-1.5 text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">
                        Scan OMR Sheets
                    </h1>
                    <p className="text-sm text-zinc-500 mt-0.5">
                        Upload completed sheets, review detected marks, and save scores.
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedTestId && (
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isDownloadingSheet}
                            onClick={handleDownloadSheet}
                        >
                            {isDownloadingSheet ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <FileDown className="h-4 w-4 mr-2" />
                            )}
                            OMR Sheet
                        </Button>
                    )}
                    {selectedTestId && (
                        <Button asChild>
                            <Link href={`/examination/analytics/${selectedTestId}`}>
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                Analytics
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
                <Card className="border-black/10">
                    <CardHeader>
                        <CardTitle className="text-base">Scan Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label>Test</Label>
                            <Select value={selectedTestId} onValueChange={(value) => {
                                setSelectedTestId(value);
                                setResult(null);
                            }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a test" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tests.map((test) => (
                                        <SelectItem key={test.id} value={test.id}>
                                            {test.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedTest && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Badge variant="secondary">{selectedTest.subject}</Badge>
                                    <Badge variant="outline">{selectedTest.totalMarks} marks</Badge>
                                    <Badge variant="outline">{selectedTest._count?.responses ?? 0} saved</Badge>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="omr-files">Scanned sheet image</Label>
                            <Input
                                id="omr-files"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(event) => {
                                    setFiles(Array.from(event.target.files ?? []));
                                    setResult(null);
                                }}
                            />
                            {files.length > 0 && (
                                <div className="rounded-md border border-black/10 bg-zinc-50 p-2 text-xs text-zinc-600">
                                    {files.map((file) => file.name).join(', ')}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="student-name">Student name</Label>
                                <Input
                                    id="student-name"
                                    value={studentName}
                                    onChange={(event) => setStudentName(event.target.value)}
                                    placeholder="Student name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="class-name">Class</Label>
                                    <Input
                                        id="class-name"
                                        value={className}
                                        onChange={(event) => setClassName(event.target.value)}
                                        placeholder="Class"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roll-number">Roll number</Label>
                                    <Input
                                        id="roll-number"
                                        value={rollNumber}
                                        onChange={(event) => setRollNumber(event.target.value)}
                                        placeholder="Roll"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time-taken">Time taken (minutes)</Label>
                                <Input
                                    id="time-taken"
                                    type="number"
                                    min="0"
                                    value={timeTaken}
                                    onChange={(event) => setTimeTaken(event.target.value)}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => processScan(false)}
                                disabled={!canProcess || status === 'processing' || status === 'saving'}
                            >
                                {status === 'processing' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                )}
                                Review
                            </Button>
                            <Button
                                onClick={() => processScan(true)}
                                disabled={!canSave || status === 'processing' || status === 'saving'}
                            >
                                {status === 'saving' ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Save
                            </Button>
                        </div>
                        {(files.length > 0 || result) && (
                            <Button variant="ghost" className="w-full" onClick={clearScan}>
                                Clear scan
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-5">
                    {!detection ? (
                        <Card className="border-black/10">
                            <CardContent className="flex min-h-[420px] items-center justify-center">
                                <div className="text-center">
                                    <ScanLine className="mx-auto h-10 w-10 text-zinc-300" />
                                    <h2 className="mt-4 text-base font-semibold text-zinc-900">No scan reviewed yet</h2>
                                    <p className="mt-1 text-sm text-zinc-500">Select a test and upload the completed sheet image.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Alert className={detection.needs_review ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}>
                                {detection.needs_review ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                                )}
                                <AlertTitle className={detection.needs_review ? 'text-amber-900' : 'text-emerald-900'}>
                                    {detection.needs_review ? 'Review required' : status === 'saved' ? 'Saved to analytics' : 'Ready to save'}
                                </AlertTitle>
                                <AlertDescription className={detection.needs_review ? 'text-amber-800' : 'text-emerald-800'}>
                                    {detection.needs_review
                                        ? 'One or more fields are unclear. Re-scan the sheet before saving.'
                                        : 'Detected answers are clear enough to save.'}
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <Metric label="Pages" value={`${result?.detections.length ?? 0}/${result?.pageCount ?? 1}`} />
                                <Metric label="Roll" value={detection.quality.roll_number || rollNumber || '-'} />
                                <Metric
                                    label="Score"
                                    value={result?.grading ? `${result.grading.score}/${result.grading.totalMarks}` : '-'}
                                />
                                <Metric
                                    label="Correct"
                                    value={result?.grading ? `${result.grading.correctAnswers}/${result.grading.totalQuestions}` : '-'}
                                />
                            </div>

                            {result?.grading && (
                                <Card className="border-black/10">
                                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-zinc-900">Grading preview</div>
                                            <div className="text-xs text-zinc-500">
                                                {detection.responses.filter((r) => r.is_ambiguous).length + detection.warnings.length} flag(s), {detection.responses.filter((r) => r.detected).length} detected answer(s)
                                            </div>
                                        </div>
                                        <div className="text-lg font-semibold text-zinc-900">
                                            {result.grading.score}/{result.grading.totalMarks}
                                            <span className="ml-2 text-sm font-medium text-zinc-500">
                                                {result.grading.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {result?.response && (
                                <Card className="border-emerald-200 bg-emerald-50">
                                    <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-emerald-950">
                                                {result.response.student.name} saved
                                            </div>
                                            <div className="text-xs text-emerald-800">
                                                Roll {result.response.student.rollNumber} - {result.response.student.className}
                                            </div>
                                        </div>
                                        <div className="text-lg font-semibold text-emerald-950">
                                            {result.response.score}/{result.response.totalMarks}
                                            <span className="ml-2 text-sm font-medium text-emerald-800">
                                                {result.response.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {detection.warnings.length > 0 && (
                                <Card className="border-amber-200">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base text-amber-950">
                                            <AlertTriangle className="h-4 w-4" />
                                            Warnings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {detection.warnings.map((warning) => (
                                            <div key={warning} className="text-sm text-amber-800">{warning}</div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_380px] gap-5">
                                <Card className="border-black/10">
                                    <CardHeader>
                                        <CardTitle className="text-base">Detected Answers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="max-h-[460px] overflow-auto rounded-md border border-black/10">
                                            <table className="w-full text-sm">
                                                <thead className="sticky top-0 bg-zinc-100 text-xs uppercase text-zinc-500">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Q</th>
                                                        <th className="px-3 py-2 text-left">Selected</th>
                                                        <th className="px-3 py-2 text-left">Correct</th>
                                                        <th className="px-3 py-2 text-left">Confidence</th>
                                                        <th className="px-3 py-2 text-left">Marks</th>
                                                        <th className="px-3 py-2 text-left">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-black/5">
                                                    {detection.responses.map((response) => {
                                                        const grade = gradingByQuestion.get(response.question_no);
                                                        return (
                                                            <tr key={`${response.field}-${response.question_no}`}>
                                                                <td className="px-3 py-2 font-medium text-zinc-900">Q{response.question_no}</td>
                                                                <td className="px-3 py-2 font-mono text-zinc-700">
                                                                    {grade?.selectedAnswer || response.detected || '-'}
                                                                </td>
                                                                <td className="px-3 py-2 font-mono text-zinc-700">{grade?.correctAnswer || '-'}</td>
                                                                <td className="px-3 py-2 text-zinc-600">{Math.round(response.confidence * 100)}%</td>
                                                                <td className="px-3 py-2 text-zinc-600">
                                                                    {grade ? `${grade.earnedMarks}/${grade.marks}` : '-'}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    {grade ? (
                                                                        <GradeBadge status={grade.status} />
                                                                    ) : response.is_ambiguous ? (
                                                                        <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
                                                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                                                            Review
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                            Clear
                                                                        </Badge>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="space-y-5">
                                    {result?.detections.map((page) => (
                                        <Card key={`${page.filename}-${page.page ?? 'unknown'}`} className="border-black/10">
                                            <CardHeader>
                                                <CardTitle className="flex items-center justify-between gap-3 text-base">
                                                    <span className="truncate">{page.filename}</span>
                                                    {page.ok && !page.needs_review ? (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-amber-600" />
                                                    )}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
                                                    <span>Page {page.page ?? '-'}</span>
                                                    <span>{page.responses.length} rows</span>
                                                    <span>Blur {page.quality.blur_score ?? '-'}</span>
                                                    <span>{page.warnings.length} warnings</span>
                                                </div>
                                                {page.overlay_png_b64 && (
                                                    <div className="overflow-hidden rounded-md border border-black/10 bg-zinc-100">
                                                        <Image
                                                            src={`data:image/png;base64,${page.overlay_png_b64}`}
                                                            alt={`OMR detection overlay for ${page.filename}`}
                                                            width={520}
                                                            height={740}
                                                            className="h-auto w-full"
                                                            unoptimized
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <Card className="border-black/10">
            <CardContent className="p-4">
                <div className="text-xs font-medium uppercase text-zinc-400">{label}</div>
                <div className="mt-1 text-xl font-semibold text-zinc-900">{value}</div>
            </CardContent>
        </Card>
    );
}

function GradeBadge({ status }: { status: OmrAnswerGradeStatus }) {
    if (status === 'correct') {
        return (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Correct
            </Badge>
        );
    }

    if (status === 'review') {
        return (
            <Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Review
            </Badge>
        );
    }

    if (status === 'no_key') {
        return (
            <Badge className="border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50">
                No key
            </Badge>
        );
    }

    if (status === 'unanswered') {
        return (
            <Badge className="border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-50">
                Blank
            </Badge>
        );
    }

    return (
        <Badge className="border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-50">
            <XCircle className="mr-1 h-3 w-3" />
            Incorrect
        </Badge>
    );
}
