'use client';

import Link from 'next/link';
import { BarChart3, BookOpen, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function TestAnalyticsIndex() {
    const { data, isLoading } = useTests({ skip: 0, take: PAGE_SIZE });
    const tests = (data?.items ?? []) as Test[];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="mt-2 h-4 w-80" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-9 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">Analysis</h1>
                    <p className="text-sm text-zinc-500 mt-0.5">Choose a test to view performance insights.</p>
                </div>
                <Button asChild size="sm">
                    <Link href="/examination/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test
                    </Link>
                </Button>
            </div>

            {tests.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                        <h3 className="text-base font-semibold text-zinc-900 mb-2">No tests available</h3>
                        <p className="text-sm text-zinc-500 mb-6">Create a test before opening analytics.</p>
                        <Button asChild>
                            <Link href="/examination/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Test
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {tests.map((test) => (
                        <Card key={test.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-base">{test.title}</CardTitle>
                                <p className="text-xs text-zinc-500">{test.subject}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {test.description && (
                                    <p className="text-sm text-zinc-500 line-clamp-2">{test.description}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                                    <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {test.duration} min
                                    </span>
                                    <span>{test.totalMarks} marks</span>
                                    <span>{test._count.responses} responses</span>
                                </div>
                                <Button asChild className="w-full">
                                    <Link href={`/examination/analytics/${test.id}`}>
                                        <BarChart3 className="w-4 h-4 mr-2" />
                                        View Analytics
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
