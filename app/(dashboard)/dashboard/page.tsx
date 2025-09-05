"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuestionsData } from "@/hooks/dashboard/questionsData";
import { getPaperHistories } from "@/actions/paperHistory/paperHistory";
import { FileText, Calendar, Eye, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
    const [activeUsers] = useState(0);
    const [recentPapers, setRecentPapers] = useState<PaperHistoryWithQuestions[]>([]);
    const [loadingPapers, setLoadingPapers] = useState(true);

    const totalQuestions = useQuestionsData()
    console.log(totalQuestions)

    useEffect(() => {
        const fetchRecentPapers = async () => {
            try {
                const papers = await getPaperHistories(5); // Get last 5 papers
                setRecentPapers(papers);
            } catch (error) {
                console.error('Error fetching recent papers:', error);
            } finally {
                setLoadingPapers(false);
            }
        };

        fetchRecentPapers();
    }, []);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Total Questions</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalQuestions}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Active Users</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{activeUsers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-700">Quick Actions</h3>
                <p className="text-gray-600 mt-2">Add new question or category</p>
                <Button className="mt-4 bg-black text-white">Add Question</Button>
            </div>
            <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Recent Papers</h3>
                    <Link href="/history">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            View All
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {loadingPapers ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-gray-600">Loading recent papers...</span>
                    </div>
                ) : recentPapers.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No papers generated yet</p>
                        <p className="text-sm text-gray-500 mt-1">Create your first paper from the Questions page</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentPapers.map((paper) => (
                            <div key={paper.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-gray-500" />
                                    <div>
                                        <h4 className="font-medium text-gray-900">{paper.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span>{paper.questions.length} questions</span>
                                            {paper.subject && <span>{paper.subject}</span>}
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(paper.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/history?view=${paper.id}`}>
                                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        View
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
