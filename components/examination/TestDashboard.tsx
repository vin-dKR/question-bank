'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BarChart3, Users, Clock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTests } from '@/hooks/queries/useTests';

const PAGE_SIZE = 20;

interface Test {
    id: string;
    title: string;
    description?: string | null;
    subject: string;
    duration: number;
    totalMarks: number;
    createdAt: Date;
    _count: {
        responses: number;
    };
}

export default function TestDashboard() {
    const [take, setTake] = useState(PAGE_SIZE);
    const { data, isLoading, isError, isFetching } = useTests({ skip: 0, take });

    // Surface errors through toast — match the behaviour of the previous
    // effect-based implementation.
    if (isError) {
        toast.error('Failed to load tests');
    }

    const tests = (data?.items ?? []) as Test[];
    const total = data?.total ?? 0;
    const hasMore = data?.hasMore ?? false;

    const getSubjectColor = (subject: string) => {
        const colors: { [key: string]: string } = {
            Mathematics: 'bg-blue-50 text-blue-700 border border-blue-100',
            Physics: 'bg-violet-50 text-violet-700 border border-violet-100',
            Chemistry: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
            Biology: 'bg-teal-50 text-teal-700 border border-teal-100',
            English: 'bg-amber-50 text-amber-700 border border-amber-100',
            History: 'bg-rose-50 text-rose-700 border border-rose-100',
            Geography: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
        };
        return colors[subject] || 'bg-zinc-100 text-zinc-700 border border-zinc-200';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="w-full mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-9 w-36" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-20" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-2/3" />
                                <Skeleton className="h-8 w-full mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-6">
            <div className="flex flex-row items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">Test Dashboard</h1>
                    <p className="text-zinc-500 text-sm mb-2 sm:mb-0">Manage and analyze your examination tests</p>
                </div>
                <Link href="/examination/create">
                    <Button className='items-center justify-center'>
                        <Plus className="w-4 h-4 mr-0 sm:mr-2" />
                        <span className='hidden sm:block'>
                            Create New Test
                        </span>
                    </Button>
                </Link>
            </div>

            {tests.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-base font-semibold text-zinc-900 mb-2">No tests created yet</h3>
                        <p className="text-sm text-zinc-500 mb-6">Get started by creating your first examination test</p>
                        <Link href="/examination/create">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Test
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {tests.map((test) => (
                            <Card key={test.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg mb-2">{test.title}</CardTitle>
                                            <Badge className={getSubjectColor(test.subject)}>
                                                {test.subject}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {test.description && (
                                        <p className="text-sm text-zinc-500 line-clamp-2">
                                            {test.description}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 text-sm text-zinc-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-zinc-400" />
                                            <span>{test.duration} min</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-zinc-400" />
                                            <span>{test.totalMarks} marks</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                                        <Users className="w-4 h-4 text-zinc-400" />
                                        <span>{test._count.responses} responses</span>
                                    </div>

                                    <div className="text-xs text-zinc-400">
                                        Created {formatDate(test.createdAt.toISOString())}
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Link href={`/examination/analytics/${test.id}`} className="flex-1">
                                            <Button className="w-full">
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                View Analytics
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="flex items-center justify-center pt-4">
                            <Button
                                onClick={() => setTake((t) => t + PAGE_SIZE)}
                                disabled={isFetching}
                            >
                                {isFetching ? 'Loading…' : `Load more (${tests.length} of ${total})`}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
