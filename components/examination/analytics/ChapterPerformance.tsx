import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChapterPerformanceProps {
    chapters: { chapter: string; totalQuestions: number; totalCorrect: number; totalAttempts: number; averageAccuracy: number }[];
    getAccuracyColor: (accuracy: number) => string;
}

export default function ChapterPerformance({ chapters, getAccuracyColor }: ChapterPerformanceProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Chapter Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {chapters.map((chapter) => (
                        <div key={chapter.chapter} className="border border-black/10 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{chapter.chapter}</h4>
                                <Badge className={getAccuracyColor(chapter.averageAccuracy)}>
                                    {chapter.averageAccuracy.toFixed(1)}%
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Total Questions: {chapter.totalQuestions}</p>
                            <div className="text-xs text-gray-500">
                                {chapter.totalCorrect} correct out of {chapter.totalAttempts} attempts
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
