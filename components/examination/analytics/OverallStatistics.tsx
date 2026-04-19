import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Target, Clock } from 'lucide-react';
import type { TestAnalyticsSummary } from '@/actions/examination/analytics/getTestAnalyticsSummary';

interface DerivedStats {
    medianScore: number;
    passPercentage: number;
    difficultyLabel: string;
}

interface OverallStatisticsProps {
    /**
     * Lightweight overview — counts, averages, extrema. Produced by
     * `useTestAnalyticsSummary`.
     */
    summary: TestAnalyticsSummary;
    /**
     * Second-row cards (median / pass % / difficulty / attempted) derived
     * from the full response list. Computed at the parent because those
     * values need the whole detail graph.
     */
    derived: DerivedStats;
    /**
     * Total responses actually loaded into the drill-down. Shown in the
     * "Attempted" card — kept separate from `summary.totalStudents` so the
     * caller can distinguish "total registered" vs "paginated-loaded" when
     * we wire attendance in future. For now, same value.
     */
    attemptedCount: number;
}

export default function OverallStatistics({ summary, derived, attemptedCount }: OverallStatisticsProps) {
    const { medianScore, passPercentage, difficultyLabel } = derived;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.totalStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.averageScore.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">{summary.averagePercentage.toFixed(1)}% average</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{summary.highestScore}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{summary.lowestScore}</div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Median Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{medianScore.toFixed(1)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Pass Percentage (≥40%)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{passPercentage.toFixed(1)}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Difficulty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{difficultyLabel}</div>
                        <p className="text-xs text-muted-foreground">Based on average %</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Attempted</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{attemptedCount}</div>
                        <p className="text-xs text-muted-foreground">Out of registered: N/A</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
