
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { renderMixedLatex } from '@/lib/render-tex';
import { Card, CardContent } from '@/components/ui/card';

const QuestionCard = ({ phq, isSelected, toggleSelection }: QuestionCardProps) => {
    const question = phq.question;
    const questionText = useMemo(() => renderMixedLatex(question.question_text), [question.question_text]);
    const answerText = useMemo(() => renderMixedLatex(question.answer || ''), [question.answer]);
    const renderedOptions = useMemo(() => question.options.map(option => renderMixedLatex(option)), [question.options]);

    return (
        <Card className={`transition-all duration-200 ${isSelected ? 'border-amber-500 bg-amber-50' : 'border-slate-200'}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(question.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline">Q{phq.questionNumber}</Badge>
                            {question.topic && <Badge variant="secondary">{question.topic}</Badge>}
                            {question.exam_name && <Badge variant="outline">{question.exam_name}</Badge>}
                            {question.subject && <Badge variant="outline">{question.subject}</Badge>}
                            {question.chapter && <Badge variant="outline">{question.chapter}</Badge>}
                        </div>
                        <h3 className="text-lg font-semibold mb-3">{questionText}</h3>
                        <div className="space-y-2 mb-3">
                            {renderedOptions.map((option, optIndex) => {
                                const optionLetter = String.fromCharCode(65 + optIndex);
                                const answers = (question.answer || '')
                                    .toString()
                                    .split(',')
                                    .map(a => a.trim().toUpperCase());
                                const isCorrect = answers.includes(optionLetter) || answers.includes(String(optIndex + 1));

                                return (
                                    <div
                                        key={optIndex}
                                        className={`pl-3 border-l-4 py-1 rounded-r-md ${isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                                    >
                                        <span className="text-sm">{option}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {question.answer && (
                            <div className="text-sm text-green-600">
                                <span className="font-medium">Answer:</span> {answerText}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default QuestionCard
