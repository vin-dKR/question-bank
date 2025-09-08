import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StudentPerformanceProps {
    students: StudentAnalytics[];
    getPerformanceColor: (percentage: number) => string;
    downloadStudentPdf: (studentId: string, studentName: string) => void;
}

export default function StudentPerformance({ students, getPerformanceColor, downloadStudentPdf }: StudentPerformanceProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {students.map((student) => (
                        <div key={student.studentId} className="border border-black/10 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h4 className="font-medium">{student.studentName}</h4>
                                    <p className="text-sm text-gray-600">
                                        {student.rollNumber} • {student.className}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <div>
                                        <div className={`font-bold ${getPerformanceColor(student.percentage)} text-right`}>
                                            {student.score}/{student.totalQuestions}
                                        </div>
                                        <div className="text-sm text-gray-600 text-right">{student.percentage.toFixed(1)}%</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-black text-white"
                                        onClick={() => downloadStudentPdf(student.studentId, student.studentName)}
                                    >
                                        <Download className="w-3 h-3 mr-1" /> PDF
                                    </Button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                                {student.correctAnswers} correct answers{student.timeTaken && ` • ${student.timeTaken} min`}
                            </div>
                            <Accordion type="single" collapsible>
                                <AccordionItem value="chapter">
                                    <AccordionTrigger>Chapter Performance</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            {student.chapterAnalytics.map((ca) => (
                                                <div key={ca.chapter} className="flex justify-between text-sm">
                                                    <span>{ca.chapter}</span>
                                                    <span>
                                                        {ca.correctAnswers}/{ca.totalQuestions} ({ca.accuracy.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="topic">
                                    <AccordionTrigger>Topic Performance</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            {student.topicAnalytics.map((ta) => (
                                                <div key={ta.topic} className="flex justify-between text-sm">
                                                    <span>{ta.topic}</span>
                                                    <span>
                                                        {ta.correctAnswers}/{ta.totalQuestions} ({ta.accuracy.toFixed(1)}%)
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
