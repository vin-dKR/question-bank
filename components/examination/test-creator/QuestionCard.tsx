import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { renderMixedLatex } from '@/lib/render-tex';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TestCreatorAction } from '@/hooks/reducer/useTestCreatorReducer';
import Image from 'next/image';

interface QuestionCardProps {
    question: QuestionForCreateTestData;
    index: number;
    dispatch: (action: TestCreatorAction) => void;
}

export default function QuestionCard({ question, index, dispatch }: QuestionCardProps) {
    return (
        <Card className="gap-2">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <CardTitle className="text-lg text-nowrap">Question {question.question_number}</CardTitle>
                        <Button
                            onClick={() => dispatch({ type: 'REMOVE_QUESTION', index })}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 sm:hidden"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap hidden sm:block">Marks:</label>
                            <label className="text-xs font-medium whitespace-nowrap sm:hidden">M:</label>
                            <Input
                                className="w-12 sm:w-16 border border-black/30 text-sm"
                                type="number"
                                value={question.marks}
                                onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', index, field: 'marks', value: parseInt(e.target.value) || 1 })}
                                min="1"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium whitespace-nowrap hidden sm:block">Negative:</label>
                            <label className="text-xs font-medium whitespace-nowrap sm:hidden">N:</label>
                            <Input
                                className="w-12 sm:w-16 border border-black/30 text-sm"
                                type="number"
                                value={question.negativeMark ?? 0}
                                onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', index, field: 'negativeMark', value: parseInt(e.target.value) || 0 })}
                                min="0"
                            />
                        </div>
                        <Button
                            onClick={() => dispatch({ type: 'REMOVE_QUESTION', index })}
                            size="sm"
                            className="text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-200 border border-red-300 hidden"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Question Text</label>
                        <div className="p-3 bg-gray-50 rounded-xl border border-black/40 overflow-x-auto">
                            {renderMixedLatex(question.question_text)}
                        </div>
                    </div>
                    {question.question_image &&
                        <div className="mt-2 flex justify-center sm:justify-start">
                            <Image
                                src={question.question_image}
                                alt='Question image'
                                width={200}
                                height={200}
                                className="max-w-full h-auto"
                            />
                        </div>
                    }
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Options</label>
                    <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 bg-gray-50 rounded-xl border border-black/40">
                                <div className="flex-1 p-2 min-w-0 overflow-x-auto w-full">
                                    {renderMixedLatex(option)}
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <input
                                        type="radio"
                                        name={`correct-${index}`}
                                        value={option}
                                        checked={question.answer === option || String.fromCharCode(optionIndex + 65) === question.answer}
                                        onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', index, field: 'answer', value: e.target.value })}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-600 whitespace-nowrap">Correct</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
