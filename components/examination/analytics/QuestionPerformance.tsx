import { Badge } from '@/components/ui/badge';
import { renderMixedLatex } from '@/lib/render-tex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuestionPerformanceProps {
    questions: QuestionAnalytics[];
    getAccuracyColor: (accuracy: number) => string;
}

export default function QuestionPerformance({ questions, getAccuracyColor }: QuestionPerformanceProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Question Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {questions.map((question) => (
                        <div key={question.questionId} className="border border-black/10 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">Q{question.questionNumber}</h4>
                                <Badge className={getAccuracyColor(question.accuracy)}>
                                    {question.accuracy.toFixed(1)}%
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{renderMixedLatex(question.questionText)}</p>
                            <div className="text-xs text-gray-500">
                                {question.correctAnswers} correct out of {question.totalAttempts} attempts
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
