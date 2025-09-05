'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
    getPaperHistories,
    deletePaperHistory,
    type PaperHistoryWithQuestions
} from '@/actions/paperHistory/paperHistory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PaperHistoryViewer from './PaperHistoryViewer';
import { Trash2, Eye, Calendar, FileText, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppProviders from '@/components/providers/AppProviders';

const PaperHistory = () => {
    const [loading, setLoading] = useState(true);
    const [showViewer, setShowViewer] = useState(false);
    const [paperHistories, setPaperHistories] = useState<PaperHistoryWithQuestions[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<PaperHistoryWithQuestions | null>(null);

    const fetchPaperHistories = async () => {
        try {
            setLoading(true);
            const histories = await getPaperHistories(50); // Get more for history page
            setPaperHistories(histories);
        } catch (error) {
            console.error('Error fetching paper histories:', error);
            toast.error('Failed to load paper history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaperHistories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this paper history?')) {
            return;
        }

        try {
            const result = await deletePaperHistory(id);
            if (result.success) {
                setPaperHistories(prev => prev.filter(h => h.id !== id));
                toast.success('Paper history deleted successfully');
            } else {
                toast.error(result.error || 'Failed to delete paper history');
            }
        } catch (error) {
            console.error('Error deleting paper history:', error);
            toast.error('Failed to delete paper history');
        }
    };

    const handleView = (history: PaperHistoryWithQuestions) => {
        setSelectedHistory(history);
        setShowViewer(true);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading paper history...</p>
                </div>
            </div>
        );
    }

    if (showViewer && selectedHistory) {
        return (
            <PaperHistoryViewer
                paperHistory={selectedHistory}
                onBack={() => setShowViewer(false)}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Paper History</h1>
                    <p className="text-gray-600 mt-1">View and manage your previously generated papers</p>
                </div>
                <Badge variant="outline" className="text-sm">
                    {paperHistories.length} Papers
                </Badge>
            </div>

            {paperHistories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Paper History</h3>
                        <p className="text-gray-600 text-center">
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
                                        <CardTitle className="text-lg line-clamp-2">
                                            {history.title}
                                        </CardTitle>
                                        {history.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                {history.description}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(history.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {history.subject && (
                                        <Badge variant="secondary" className="text-xs">
                                            {history.subject}
                                        </Badge>
                                    )}
                                    {history.exam && (
                                        <Badge variant="outline" className="text-xs">
                                            {history.exam}
                                        </Badge>
                                    )}
                                    {history.standard && (
                                        <Badge variant="outline" className="text-xs">
                                            {history.standard}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
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
                                        <span>{formatDate(history.createdAt)}</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleView(history)}
                                    className="w-full"
                                    variant="outline"
                                >
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

const PaperHistoryPage = () => {
    return (
        <AppProviders>
            <PaperHistory />
        </AppProviders>
    )
}
export default PaperHistoryPage
