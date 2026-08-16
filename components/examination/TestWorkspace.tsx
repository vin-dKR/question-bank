'use client';

import Link from 'next/link';
import {
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    Clock3,
    Download,
    FileQuestion,
    ScanLine,
    Target,
    Trophy,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTestAnalyticsSummary } from '@/hooks/queries/useTestAnalyticsSummary';

interface WorkspaceQuestion {
    id: string;
    questionText: string;
    options: string[];
    answer: string;
    marks: number;
    questionNumber: number;
}

export interface TestWorkspaceData {
    id: string;
    title: string;
    description: string | null;
    subject: string;
    duration: number;
    totalMarks: number;
    responseCount: number;
    createdAt: string;
    questions: WorkspaceQuestion[];
}

const OPTION_LABELS = 'ABCDEFGH';

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function StatCard({ icon: Icon, label, value, hint }: {
    icon: typeof Users;
    label: string;
    value: string;
    hint: string;
}) {
    return (
        <div className="rounded-xl border border-black/5 bg-white p-4 shadow-xs">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon className="h-4 w-4" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        </div>
    );
}

export default function TestWorkspace({ test }: { test: TestWorkspaceData }) {
    const { data: summary, isLoading: isLoadingSummary } = useTestAnalyticsSummary(test.id);

    return (
        <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <Button variant="outline" size="sm" asChild className="mt-0.5">
                        <Link href="/examination" aria-label="Back to all tests">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="font-medium">{test.subject}</Badge>
                            <span className="text-xs text-zinc-400">Created {formatDate(test.createdAt)}</span>
                        </div>
                        <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">{test.title}</h1>
                        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                            {test.description || 'Review the paper, answer key, responses, and OMR workflow in one place.'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/examination/omr?testId=${test.id}`}>
                            <ScanLine className="mr-2 h-4 w-4" />
                            Scan responses
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <a href={`/api/omr/tests/${test.id}/sheet`} download>
                            <Download className="mr-2 h-4 w-4" />
                            OMR sheet
                        </a>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard icon={FileQuestion} label="Questions" value={String(test.questions.length)} hint="In this paper" />
                <StatCard icon={Target} label="Total marks" value={String(test.totalMarks)} hint="Maximum score" />
                <StatCard icon={Clock3} label="Duration" value={`${test.duration} min`} hint="Allowed time" />
                <StatCard icon={Users} label="Responses" value={String(test.responseCount)} hint="OMR submissions" />
            </div>

            <Tabs defaultValue="questions" className="space-y-4">
                <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-black/5 bg-white p-1 shadow-xs sm:w-auto">
                    <TabsTrigger value="questions" className="gap-2 rounded-lg px-4 py-2">
                        <FileQuestion className="h-4 w-4" />
                        Questions
                    </TabsTrigger>
                    <TabsTrigger value="answers" className="gap-2 rounded-lg px-4 py-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Answer key
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="gap-2 rounded-lg px-4 py-2">
                        <BarChart3 className="h-4 w-4" />
                        Analysis
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-3">
                    {test.questions.map((question) => (
                        <article key={question.id} className="rounded-xl border border-black/5 bg-white p-4 shadow-xs sm:p-5">
                            <div className="flex items-start gap-3">
                                <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-zinc-100 px-1.5 text-xs font-semibold text-zinc-600">
                                    {question.questionNumber}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-sm font-medium leading-6 text-zinc-900">{question.questionText}</p>
                                        <Badge variant="outline" className="shrink-0">{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</Badge>
                                    </div>
                                    {question.options.length > 0 && (
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            {question.options.map((option, optionIndex) => (
                                                <div key={`${question.id}-${optionIndex}`} className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                                                    <span className="font-semibold text-zinc-400">{OPTION_LABELS[optionIndex] || optionIndex + 1}.</span>
                                                    <span>{option}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </TabsContent>

                <TabsContent value="answers">
                    <div className="rounded-xl border border-black/5 bg-white p-4 shadow-xs sm:p-5">
                        <div className="mb-4">
                            <h2 className="text-base font-semibold tracking-tight text-zinc-900">Answer key</h2>
                            <p className="mt-0.5 text-xs text-zinc-500">Correct responses for all {test.questions.length} questions.</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {test.questions.map((question) => (
                                <div key={question.id} className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
                                    <span className="text-sm font-medium text-zinc-700">Question {question.questionNumber}</span>
                                    <Badge className="border-emerald-200 bg-white text-emerald-700 shadow-none">
                                        {question.answer || 'Not set'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                    {isLoadingSummary || !summary ? (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-36 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <StatCard icon={Users} label="Students" value={String(summary.totalStudents)} hint="Responses received" />
                                <StatCard icon={BarChart3} label="Average" value={`${summary.averagePercentage.toFixed(1)}%`} hint={`${summary.averageScore.toFixed(1)} marks`} />
                                <StatCard icon={Trophy} label="Highest" value={String(summary.highestScore)} hint={`Out of ${test.totalMarks}`} />
                                <StatCard icon={Target} label="Lowest" value={String(summary.lowestScore)} hint={`Out of ${test.totalMarks}`} />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-xs">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900">Detailed performance analysis</p>
                                    <p className="mt-0.5 text-xs text-zinc-500">Question accuracy, score distribution, topics, chapters, and student reports.</p>
                                </div>
                                <Button size="sm" asChild>
                                    <Link href={`/examination/analytics/${test.id}`}>
                                        Open full analysis
                                        <BarChart3 className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
