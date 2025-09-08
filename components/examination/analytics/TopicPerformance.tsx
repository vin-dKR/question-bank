import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TopicPerformanceProps {
    topics: { topic: string; totalQuestions: number; totalCorrect: number; totalAttempts: number; averageAccuracy: number }[];
    getAccuracyColor: (accuracy: number) => string;
}

export default function TopicPerformance({ topics, getAccuracyColor }: TopicPerformanceProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Topic Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topics.map((topic) => (
                        <div key={topic.topic} className="border border-black/10 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{topic.topic}</h4>
                                <Badge className={getAccuracyColor(topic.averageAccuracy)}>
                                    {topic.averageAccuracy.toFixed(1)}%
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Total Questions: {topic.totalQuestions}</p>
                            <div className="text-xs text-gray-500">
                                {topic.totalCorrect} correct out of {topic.totalAttempts} attempts
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
