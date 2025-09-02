'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { getTestAnalytics } from '@/actions/examination/test';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, TrendingUp, Users, Target, Clock } from 'lucide-react';


export default function TestAnalytics() {
    const { testId } = useParams()

    const [analytics, setAnalytics] = useState<TestAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        try {
            const data = await getTestAnalytics(testId as string);
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    }, [testId]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

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

    const escapeHtml = (input: string) => input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const computeDerived = (data: TestAnalytics) => {
        const scores = data.studentAnalytics.map((s) => s.score).slice().sort((a, b) => a - b);
        const medianScore = scores.length === 0 ? 0 : (scores.length % 2 === 1 ? scores[(scores.length - 1) / 2] : (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2);
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

    const buildAnalyticsHTML = (data: TestAnalytics) => {
        const { medianScore, passPercentage, histogram, difficultyLabel } = computeDerived(data);
        const style = `
            <style>
                body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 24px; }
                h1 { font-size: 24px; margin: 0 0 8px; }
                h2 { font-size: 18px; margin: 16px 0 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
                .small { color: #6b7280; font-size: 12px; }
                .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
                .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
                .kv { font-size: 14px; }
                .kv b { font-size: 18px; }
                .hist { display: grid; grid-template-columns: repeat(10, 1fr); gap: 6px; align-items: end; height: 120px; margin-top: 8px; }
                .bar { background: #6366f1; width: 100%; }
                .bar-label { text-align: center; font-size: 10px; margin-top: 4px; color: #6b7280; }
            </style>
        `;
        const histBars = histogram
            .map((count, idx) => {
                const height = Math.max(4, Math.round((count / Math.max(1, Math.max(...histogram))) * 100));
                return `<div><div class="bar" style="height:${height}px"></div><div class="bar-label">${idx * 10}-${idx * 10 + 9}</div></div>`;
            })
            .join('');
        const studentRows = data.studentAnalytics
            .map(
                (s) => `<tr><td>${s.studentName}</td><td>${s.rollNumber}</td><td>${s.className}</td><td>${s.score}/${s.totalQuestions}</td><td>${s.percentage.toFixed(1)}%</td><td>${s.correctAnswers}</td><td>${s.timeTaken ?? '-'}</td></tr>`
            )
            .join('');
        const questionRows = data.questionAnalytics
            .map(
                (q) => `<tr><td>Q${q.questionNumber}</td><td>${escapeHtml(q.questionText)}</td><td>${q.correctAnswers}/${q.totalAttempts}</td><td>${q.accuracy.toFixed(1)}%</td></tr>`
            )
            .join('');
        return `<!DOCTYPE html><html><head><meta charset="utf-8"/>${style}</head><body>
                <h1>Test Analytics</h1>
                <div class="small">Test ID: ${data.testId}</div>
                <div class="grid" style="margin-top:12px;">
                    <div class="card kv">Total Students<br/><b>${data.totalStudents}</b></div>
                    <div class="card kv">Average Score<br/><b>${data.averageScore.toFixed(1)}</b> <span class="small">(${data.averagePercentage.toFixed(1)}%)</span></div>
                    <div class="card kv">Highest / Lowest<br/><b>${data.highestScore}</b> / <b>${data.lowestScore}</b></div>
                    <div class="card kv">Median Score<br/><b>${medianScore.toFixed(1)}</b></div>
                </div>

                <div class="grid" style="margin-top:12px;">
                    <div class="card kv">Pass Percentage<br/><b>${passPercentage.toFixed(1)}%</b></div>
                    <div class="card kv">Difficulty<br/><b>${difficultyLabel}</b></div>
                    <div class="card kv">Attempted<br/><b>${data.studentAnalytics.length}</b></div>
                    <div class="card kv">Questions<br/><b>${data.questionAnalytics.length}</b></div>
                </div>

                <h2>Score Distribution (percentage)</h2>
                <div class="hist">${histBars}</div>

                <h2>Student Performance</h2>
                <table>
                    <thead><tr><th>Name</th><th>Roll</th><th>Class</th><th>Score</th><th>%</th><th>Correct</th><th>Time</th></tr></thead>
                    <tbody>${studentRows}</tbody>
                </table>

                <h2>Question Performance</h2>
                <table>
                    <thead><tr><th>Question</th><th>Text</th><th>Correct/Attempts</th><th>Accuracy</th></tr></thead>
                    <tbody>${questionRows}</tbody>
                </table>
            </body></html>`;
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
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Link href="/examination">
                        <Button size="sm" className='bg-black/10 border border-black/15'>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Tests
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Test Analytics</h1>
                        <p className="text-gray-600 mt-1">Performance insights and student results</p>
                    </div>
                </div>
                <Button onClick={exportToPDF} className='bg-black text-white'>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                </Button>
            </div>

            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">
                            {analytics.averagePercentage.toFixed(1)}% average
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{analytics.highestScore}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{analytics.lowestScore}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Median Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{computeDerived(analytics).medianScore.toFixed(1)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pass Percentage (≥40%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{computeDerived(analytics).passPercentage.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Difficulty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{computeDerived(analytics).difficultyLabel}</div>
                        <p className="text-xs text-muted-foreground">Based on average %</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Attempted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.studentAnalytics.length}</div>
                        <p className="text-xs text-muted-foreground">Out of registered: N/A</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* First Column */}
                <div className="flex-1 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Score Distribution (by %)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-10 gap-2 items-end h-40">
                                {computeDerived(analytics).histogram.map((count, idx, arr) => {
                                    const max = Math.max(...arr, 1);
                                    const height = Math.max(4, Math.round((count / max) * 100));
                                    return (
                                        <div key={idx} className="flex flex-col items-center">
                                            <div className="w-full bg-indigo-500" style={{ height }} />
                                            <div className="text-[10px] text-gray-500 mt-1">{idx * 10}-{idx * 10 + 9}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Question Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.questionAnalytics.map((question) => (
                                    <div key={question.questionId} className="border border-black/10 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium">Q{question.questionNumber}</h4>
                                            <Badge className={getAccuracyColor(question.accuracy)}>
                                                {question.accuracy.toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                            {question.questionText}
                                        </p>
                                        <div className="text-xs text-gray-500">
                                            {question.correctAnswers} correct out of {question.totalAttempts} attempts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Second Column */}
                <div className="flex-1 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.studentAnalytics.map((student) => (
                                    <div key={student.studentId} className="border border-black/10 rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium">{student.studentName}</h4>
                                                <p className="text-sm text-gray-600">
                                                    {student.rollNumber} • {student.className}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${getPerformanceColor(student.percentage)}`}>
                                                    {student.score}/{student.totalQuestions}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {student.percentage.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {student.correctAnswers} correct answers
                                            {student.timeTaken && ` • ${student.timeTaken} min`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
