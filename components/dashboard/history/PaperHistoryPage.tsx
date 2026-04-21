'use client';

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
    getPaperHistories,
    deletePaperHistory,
} from '@/actions/paperHistory/paperHistory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PaperHistoryViewer from './PaperHistoryViewer';
import { Trash2, Eye, Calendar, FileText, Users, Clock } from 'lucide-react';
import { useAbortableEffect } from '@/lib/hooks/useAbortableEffect';

const PaperHistory = () => {
    const [loading, setLoading] = useState(true);
    const [showViewer, setShowViewer] = useState(false);
    const [paperHistories, setPaperHistories] = useState<PaperHistoryWithQuestions[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<PaperHistoryWithQuestions | null>(null);

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        []
    );

    // Phase 2: wrap the initial fetch in useAbortableEffect so that if the user
    // navigates away mid-load we don't stomp state on the next page. Server
    // actions can't be aborted server-side — this is a client-side guard only,
    // but it is enough to kill the "nav click feels stuck" symptom.
    useAbortableEffect(
        async (signal) => {
            try {
                setLoading(true);
                const histories = await getPaperHistories(50);
                if (signal.aborted) return;
                setPaperHistories(histories);
            } catch (error) {
                if (signal.aborted) return;
                console.error(error);
                toast.error('Failed to load paper history');
            } finally {
                if (!signal.aborted) setLoading(false);
            }
        },
        []
    );

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this paper history?')) return;

        try {
            const result = await deletePaperHistory(id);
            if (result.success) {
                setPaperHistories((prev) => prev.filter((h) => h.id !== id));
                toast.success('Paper history deleted');
            } else {
                toast.error(result.error || 'Failed to delete');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete');
        }
    }, []);

    const handleView = (history: PaperHistoryWithQuestions) => {
        setSelectedHistory(history);
        setShowViewer(true);
    };

    if (loading) {
        return (
            <div className="w-full mx-auto p-1 space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-black/5 bg-white p-5 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (showViewer && selectedHistory) {
        return <PaperHistoryViewer paperHistory={selectedHistory} onBack={() => setShowViewer(false)} />;
    }

    return (
        <div className="w-full mx-auto p-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900">Paper History</h1>
                    <p className="text-zinc-500 mt-1 text-xs md:text-sm">View and manage your previously generated papers</p>
                </div>
                <Badge variant="secondary" className="text-nowrap">
                    {paperHistories.length} Papers
                </Badge>
            </div>

            {paperHistories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-10 w-10 text-zinc-300 mb-4" />
                        <h3 className="text-base font-semibold text-zinc-900 mb-2">No Paper History</h3>
                        <p className="text-zinc-500 text-sm text-center">
                            Your generated papers will appear here. Start by creating and downloading a PDF from the Questions page.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paperHistories.map((history) => (
                        <Card key={history.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg line-clamp-2">{history.title}</CardTitle>
                                        {history.description && (
                                            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{history.description}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(history.id)}
                                        className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-200"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {history.subject && <Badge variant="outline" className="text-xs">{history.subject}</Badge>}
                                    {history.exam && <Badge variant="outline" className="text-xs bg-black/10">{history.exam}</Badge>}
                                    {history.standard && <Badge variant="secondary" className="text-xs">{history.standard}</Badge>}
                                </div>

                                <div className="space-y-2 text-sm text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span>{history.questions.length} Questions</span>
                                    </div>
                                    {history.marks && (
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <span>{history.marks} Marks</span>
                                        </div>
                                    )}
                                    {history.time && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{history.time}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{dateFormatter.format(new Date(history.createdAt))}</span>
                                    </div>
                                </div>

                                <Button onClick={() => handleView(history)} className="w-full">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Questions
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function PaperHistoryPage() {
    return <PaperHistory />;
}
