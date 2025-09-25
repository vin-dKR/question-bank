'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import TopicPerformance from './analytics/TopicPerformance';
import OverallStatistics from './analytics/OverallStatistics';
import ScoreDistribution from './analytics/ScoreDistribution';
import ChapterPerformance from './analytics/ChapterPerformance';
import StudentPerformance from './analytics/StudentPerformance';
import QuestionPerformance from './analytics/QuestionPerformance';
import { useTestAnalytics } from '@/hooks/analytics/useTestAnalytics';
import { buildAnalyticsHTML } from '@/lib/analytics/analyticsHtmlTemplate';
import { generateStudentAnalyticsPdf } from '@/actions/examination/analytics/generateStudentAnalyticsPdf';


export default function TestAnalytics() {
    const { testId } = useParams();
    const { analytics, loading } = useTestAnalytics(testId as string);

    const computeDerived = (data: TestAnalytics) => {
        const scores = data.studentAnalytics.map((s) => s.score).slice().sort((a, b) => a - b);
        const medianScore = scores.length === 0 ? 0 : scores.length % 2 === 1 ? scores[(scores.length - 1) / 2] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2;
        const passThreshold = 40; // percentage
        const passCount = data.studentAnalytics.filter((s) => s.percentage >= passThreshold).length;
        const passPercentage = data.studentAnalytics.length > 0 ? (passCount / data.studentAnalytics.length) * 100 : 0;
        const histogram = new Array(10).fill(0) as number[];
        for (const s of data.studentAnalytics) {
            let idx = Math.floor(s.percentage / 10);
            if (idx > 9) idx = 9;
            if (idx < 0) idx = 0;
            histogram[idx]++;
        }
        const difficultyLabel = data.averagePercentage >= 75 ? 'Easy' : data.averagePercentage >= 50 ? 'Moderate' : data.averagePercentage >= 30 ? 'Challenging' : 'Hard';
        return { medianScore, passPercentage, histogram, difficultyLabel };
    };

    const computeChapterAnalytics = (questionAnalytics: QuestionAnalytics[]) => {
        const chapterMap: Record<string, { correct: number; attempts: number; questions: number }> = {};
        questionAnalytics.forEach((q) => {
            const chapter = q.chapter || 'Unknown';
            if (!chapterMap[chapter]) {
                chapterMap[chapter] = { correct: 0, attempts: 0, questions: 0 };
            }
            chapterMap[chapter].correct += q.correctAnswers;
            chapterMap[chapter].attempts += q.totalAttempts;
            chapterMap[chapter].questions += 1;
        });
        return Object.entries(chapterMap).map(([chapter, data]) => ({
            chapter,
            totalQuestions: data.questions,
            totalCorrect: data.correct,
            totalAttempts: data.attempts,
            averageAccuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
        }));
    };

    const computeTopicAnalytics = (questionAnalytics: QuestionAnalytics[]) => {
        const topicMap: Record<string, { correct: number; attempts: number; questions: number }> = {};
        questionAnalytics.forEach((q) => {
            const topic = q.topic || 'Unknown';
            if (!topicMap[topic]) {
                topicMap[topic] = { correct: 0, attempts: 0, questions: 0 };
            }
            topicMap[topic].correct += q.correctAnswers;
            topicMap[topic].attempts += q.totalAttempts;
            topicMap[topic].questions += 1;
        });
        return Object.entries(topicMap).map(([topic, data]) => ({
            topic,
            totalQuestions: data.questions,
            totalCorrect: data.correct,
            totalAttempts: data.attempts,
            averageAccuracy: data.attempts > 0 ? (data.correct / data.attempts) * 100 : 0,
        }));
    };

    const exportToPDF = async () => {
        try {
            if (!analytics) return;
            const html = buildAnalyticsHTML(analytics);
            const res = await fetch('/api/analytics/pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html, filename: `test-${analytics.testId}-analytics` }),
            });
            if (!res.ok) throw new Error('Failed to export PDF');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `test-${analytics.testId}-analytics.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF downloaded');
        } catch {
            toast.error('Could not export PDF');
        }
    };

    const getPerformanceColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return 'bg-green-100 text-green-800';
        if (accuracy >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No analytics data available</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-row items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link href="/examination">
                        <Button size="sm" className="bg-black/10 border border-black/15">
                            <ArrowLeft className="w-4 h-4 mr-0 mr-2" />
                            <span className=''>
                                Back
                            </span>
                        </Button>
                    </Link>
                    <div className=''>
                        <h1 className="text-xl md:text-3xl font-bold">Test Analytics</h1>
                        <p className="text-xs md:text-sm text-gray-600 mt-0 sm:mt-1">Performance insights and results</p>
                    </div>
                </div>

                <Button onClick={exportToPDF} className="bg-black text-white">
                    <span>Export PDF</span>
                    <Download className="w-4 h-4 ml-2" />
                </Button>
            </div>

            <OverallStatistics analytics={analytics} computeDerived={computeDerived} />
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-6">
                    <ScoreDistribution histogram={computeDerived(analytics).histogram} />
                    <QuestionPerformance questions={analytics.questionAnalytics} getAccuracyColor={getAccuracyColor} />
                </div>
                <div className="flex-1 flex flex-col gap-6">
                    <StudentPerformance
                        students={analytics.studentAnalytics}
                        getPerformanceColor={getPerformanceColor}
                        downloadStudentPdf={async (studentId: string, studentName: string) => {
                            try {
                                if (!testId) return;
                                const { data, filename } = await generateStudentAnalyticsPdf(testId as string, studentId);
                                const blob = new Blob([data], { type: 'application/pdf' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename || `${studentName}-report.pdf`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                                toast.success('PDF downloaded');
                            } catch (e) {
                                console.error(e);
                                toast.error('Failed to generate student PDF');
                            }
                        }}
                    />
                </div>
            </div>
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Aggregated Performance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChapterPerformance chapters={computeChapterAnalytics(analytics.questionAnalytics)} getAccuracyColor={getAccuracyColor} />
                    <TopicPerformance topics={computeTopicAnalytics(analytics.questionAnalytics)} getAccuracyColor={getAccuracyColor} />
                </div>
            </div>
        </div>
    );
}
