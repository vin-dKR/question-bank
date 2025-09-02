'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { renderMixedLatex } from '@/lib/render-tex';
import { createTest } from '@/actions/examination/test';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, AlertCircle, FolderOpen, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestCreator() {
    const router = useRouter();
    const [testData, setTestData] = useState<CreateTestData>({
        title: '',
        description: '',
        subject: '',
        duration: 60,
        totalMarks: 0,
        questions: [],
    });

    const [bulkMarks, setBulkMarks] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasLoadedQuestions, setHasLoadedQuestions] = useState(false);

    // Load selected questions from sessionStorage on component mount
    useEffect(() => {
        const loadSelectedQuestions = () => {
            const storedQuestions = sessionStorage.getItem('selectedQuestionsForTest');
            if (storedQuestions) {
                try {
                    const questions = JSON.parse(storedQuestions);
                    setTestData(prev => ({
                        ...prev,
                        questions,
                        // eslint-disable-next-line
                        totalMarks: questions.reduce((total: number, q: any) => total + (q.marks || 1), 0),
                    }));
                    setHasLoadedQuestions(true);
                    // Clear the stored data after loading
                    sessionStorage.removeItem('selectedQuestionsForTest');
                } catch (error) {
                    console.error('Error loading selected questions:', error);
                    toast.error('Failed to load selected questions');
                }
            }
        };

        loadSelectedQuestions();
    }, []);

    const handleChangeDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTestData(prev => ({
            ...prev,
            duration: value === "" ? "" : parseInt(value, 10)
        }));
    };
// eslint-disable-next-line
    const updateQuestion = (index: number, field: keyof Omit<QuestionForCreateTestData, 'id'>, value: any) => {
        setTestData(prev => {
            const updatedQuestions = prev.questions.map((q, i) =>
                i === index ? { ...q, [field]: value } : q
            );

            return {
                ...prev,
                questions: updatedQuestions,
                totalMarks: updatedQuestions.reduce((total, q) => total + q.marks, 0),
            };
        });
    };

    const removeQuestion = (index: number) => {
        setTestData(prev => {
            const updatedQuestions = prev.questions.filter((_, i) => i !== index).map((q, i) => ({
                ...q,
                questionNumber: i + 1,
            }));

            return {
                ...prev,
                questions: updatedQuestions,
                totalMarks: updatedQuestions.reduce((total, q) => total + q.marks, 0),
            };
        });
    };

    const applyBulkMarks = () => {
        if (bulkMarks <= 0) {
            toast.error('Marks must be greater than 0');
            return;
        }

        setTestData(prev => {
            const updatedQuestions = prev.questions.map(q => ({
                ...q,
                marks: bulkMarks,
            }));

            return {
                ...prev,
                questions: updatedQuestions,
                totalMarks: updatedQuestions.reduce((total, q) => total + q.marks, 0),
            };
        });

        toast.success(`Applied ${bulkMarks} marks to all questions`);
    };

    const handleSubmit = async () => {
        if (!testData.title.trim()) {
            toast.error('Please enter a test title');
            return;
        }

        if (!testData.subject.trim()) {
            toast.error('Please select a subject');
            return;
        }

        if (testData.questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }

        // Validate questions
        for (let i = 0; i < testData.questions.length; i++) {
            const q = testData.questions[i];
            if (!q.questionText.trim()) {
                toast.error(`QuestionForCreateTestData ${i + 1}: Please enter question text`);
                return;
            }
            if (q.options.some(opt => !opt.trim())) {
                toast.error(`QuestionForCreateTestData ${i + 1}: Please fill all options`);
                return;
            }
            if (!q.answer) {
                toast.error(`QuestionForCreateTestData ${i + 1}: Please select correct answer`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await createTest({
                title: testData.title,
                description: testData.description,
                subject: testData.subject,
                duration: testData.duration,
                totalMarks: testData.questions.reduce((total, q) => total + q.marks, 0),
                questions: testData.questions,
            });

            toast.success('Test created successfully!');
            router.push('/examination');
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between tracking-2">
                <h1 className="text-3xl font-bold">Create New Test</h1>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='bg-gray-200 border border-gray-300 rounded-xl'
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Test'}
                </Button>
            </div>

            {hasLoadedQuestions && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-green-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Questions loaded from selection</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                            {testData.questions.length} questions have been loaded. You can modify marks and test details below.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Test Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Test Title</label>
                            <Input
                                className='border border-black/30'
                                value={testData.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Enter test title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Subject</label>
                            <Select
                                value={testData.subject}
                                onValueChange={(value) => setTestData(prev => ({ ...prev, subject: value }))}
                            >
                                <SelectTrigger className='border-black/30'>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent className='bg-white border border-black/10'>
                                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                                    <SelectItem value="Physics">Physics</SelectItem>
                                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                            <Input
                                className='border border-black/30'
                                type="number"
                                value={testData.duration}
                                onChange={handleChangeDuration}
                                min="1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Total Marks</label>
                            <Input
                                type="number"
                                value={testData.totalMarks}
                                disabled
                                className='bg-gray-50 border border-black/30'
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <Textarea
                            value={testData.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTestData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter test description"
                            rows={3}
                            className='border-black/30'
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-2">Questions ({testData.questions.length})</h2>
                <div className="flex items-center gap-2">
                    <Link href="/drafts">
                        <Button className='bg-yellow-300 border border-yellow-400'>
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Add from Drafts
                        </Button>
                    </Link>

                    <Link href={"/questions"}>
                        <Button className='bg-green-500 border border-green-600'>
                            <Plus className="w-4 h-4 mr-2" />
                            Add From Questions
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Bulk Marks Assignment */}
            {testData.questions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Bulk Mark Assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">Set marks for all questions:</label>
                                <Input
                                    className='w-20 border border-black/30'
                                    type="number"
                                    value={bulkMarks}
                                    onChange={(e) => setBulkMarks(parseInt(e.target.value) || 1)}
                                    min="1"
                                />
                                <Button onClick={applyBulkMarks} size="sm">
                                    Apply to All
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {testData.questions.map((question, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">QuestionForCreateTestData {question.questionNumber}</CardTitle>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium">Marks:</label>
                                        <Input
                                            className='w-16 border border-black/30'
                                            type="number"
                                            value={question.marks}
                                            onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                                            min="1"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => removeQuestion(index)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">QuestionForCreateTestData Text</label>
                                <div className="p-3 bg-gray-50 rounded-xl border">
                                    {renderMixedLatex(question.questionText)}
                                </div>
                                {/* Commented out for read-only mode
                                <Textarea
                                  value={question.questionText}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(index, 'questionText', e.target.value)}
                                  placeholder="Enter your question"
                                  rows={3}
                                />
                                */}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Options</label>
                                <div className="space-y-2">
                                    {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center gap-2">
                                            <div className="flex-1 p-2 bg-gray-50 rounded-xl border">
                                                {renderMixedLatex(option)}
                                            </div>
                                            <input
                                                type="radio"
                                                name={`correct-${index}`}
                                                value={option}
                                                checked={question.answer === option}
                                                onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-600">Correct</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Commented out for read-only mode
                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={optionIndex} className="flex items-center gap-2">
                                      <Input
                                        value={option}
                                        onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                                        placeholder={`Option ${optionIndex + 1}`}
                                      />
                                      <input
                                        type="radio"
                                        name={`correct-${index}`}
                                        value={option}
                                        checked={question.answer === option}
                                        onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm text-gray-600">Correct</span>
                                    </div>
                                  ))}
                                </div>
                                */}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {testData.questions.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No questions added yet. Select questions from the question bank, add from drafts, or click &quot;Add QuestionForCreateTestData&quot; to get started.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}




// const addQuestion = () => {
//     const newQuestion: Omit<QuestionForCreateTestData, 'id'> = {
//         questionText: '',
//         options: ['', '', '', ''],
//         answer: '',
//         marks: 1,
//         questionNumber: testData.questions.length + 1,
//     };

//     setTestData(prev => ({
//         ...prev,
//         questions: [...prev.questions, newQuestion],
//     }));
// };



// const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
//     setTestData(prev => ({
//         ...prev,
//         questions: prev.questions.map((q, i) =>
//             i === questionIndex
//                 ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
//                 : q
//         ),
//     }));
// };
