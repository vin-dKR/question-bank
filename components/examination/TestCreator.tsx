'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Save, FolderOpen, Plus, AlertCircle } from 'lucide-react';

import PDFGenerator from '../pdf/pdfPreview';
import QuestionCard from './test-creator/QuestionCard';
import TestDetailsForm from './test-creator/TestDetailsForm';
import EmptyQuestionsCard from './test-creator/EmptyQuestionsCard';
import BulkMarksAssignment from './test-creator/BulkMarksAssignment';

import { createTest } from '@/actions/examination/test/crudTest';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { useTestCreatorReducer } from "@/hooks/test-creator/useTestCreatorReducer"

export default function TestCreator() {
    const router = useRouter();
<<<<<<< HEAD
    const [testData, setTestData] = useState<CreateTestData>({
        title: '',
        description: '',
        subject: '',
        duration: 60,
        totalMarks: 0,
        questions: [] as QuestionForCreateTestData[],
    });
    const { institution, options } = usePDFGeneratorContext();

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
                    const formattedQuestions = questions.map((q: any) => ({
                        ...q,
                        question_text: q.question_text || '', // Ensure question_text exists
                    }));
                    setTestData(prev => ({
                        ...prev,
                        questions: formattedQuestions,
                        totalMarks: formattedQuestions.reduce((total: number, q: any) => total + (q.marks || 1), 0),
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
=======
    const { state, dispatch } = useTestCreatorReducer();
    const { testData, isSubmitting, hasLoadedQuestions, bulkMarks, bulkNegativeMarks } = state;
    const { institution, options } = usePDFGeneratorContext();
>>>>>>> 08f5e7e (reducer state implemented @TestCreator)

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
        for (let i = 0; i < testData.questions.length; i++) {
            const q = testData.questions[i];
            if (!q.question_text.trim()) {
                toast.error(`Question ${i + 1}: Please enter question text`);
                return;
            }
            if (q.options.some((opt) => !opt.trim())) {
                toast.error(`Question ${i + 1}: Please fill all options`);
                return;
            }
            if (!q.answer) {
                toast.error(`Question ${i + 1}: Please select correct answer`);
                return;
            }
        }

        dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
        try {
            await createTest({
                title: testData.title,
                description: testData.description,
                subject: testData.subject,
                duration: typeof testData.duration === 'string' ? parseInt(testData.duration) || 60 : testData.duration,
                totalMarks: testData.questions.reduce((total, q) => total + q.marks, 0),
                questions: testData.questions.map((q) => ({
                    ...q,
                    negativeMark: q.negativeMark ?? 0,
                })),
            });
            toast.success('Test created successfully!');
            router.push('/examination');
        } catch (error) {
            console.error('Error creating test:', error);
            toast.error('Failed to create test');
        } finally {
            dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
        }
    };

    return (
        <div className="relative max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start md:items-center justify-between tracking-2">
                <h1 className="text-3xl font-bold">Create New Test</h1>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gray-200 border border-gray-300 rounded-xl"
                >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Test'}
                </Button>
            </div>

            {hasLoadedQuestions && (
                <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-1">
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

            <TestDetailsForm testData={testData} dispatch={dispatch} />
            <PDFGenerator saveToHistory={true} institution={institution} selectedQuestions={testData.questions} options={options} />
            <div className="flex flex-col sm:flex-row items-start md:items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-2">Questions ({testData.questions.length})</h2>
                <div className="flex items-center gap-2">
                    <Link href="/drafts">
                        <Button className="bg-yellow-300 border border-yellow-400">
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Add from Drafts
                        </Button>
                    </Link>
                    <Link href="/questions">
                        <Button className="bg-green-500 border border-green-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Add From Questions
                        </Button>
                    </Link>
                </div>
            </div>

<<<<<<< HEAD
            {/* Bulk Marks Assignment */}
            {testData.questions.length > 0 && (
                <Card className='gap-2'>
                    <CardHeader>
                        <CardTitle className="text-lg">Bulk Mark Assignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-2">
                                <div className='flex items-center gap-2'>
                                    <label className="text-sm font-medium">Set marks for all questions:</label>
                                    <Input
                                        className='w-20 border border-black/30'
                                        type="number"
                                        value={bulkMarks}
                                        onChange={(e) => setBulkMarks(parseInt(e.target.value) || 1)}
                                        min="1"
                                    />
                                    <Button onClick={applyBulkMarks} size="sm" className='bg-black text-white'>
                                        Apply to All
                                    </Button>
                                </div>

                                <div className='flex items-center gap-2'>
                                    <label className="text-sm font-medium">Negative Mark</label>
                                    <Input
                                        className='w-20 border border-black/30'
                                        type="number"
                                        value={bulkMarks}
                                        onChange={(e) => }
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {testData.questions.map((question, index) => (
                    <Card key={index} className='gap-2'>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Question {question.questionNumber}</CardTitle>
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
                                <label className="block text-sm font-medium mb-2">Question Text</label>
                                <div className="p-3 bg-gray-50 rounded-xl border border-black/40">
                                    {renderMixedLatex(question.question_text)}
                                </div>
                                {/* Commented out for read-only mode
                                <Textarea
                                  value={question.question_text}
                                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(index, 'question_text', e.target.value)}
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
                                            <div className="flex-1 p-2 bg-gray-50 rounded-xl border border-black/40">
                                                {renderMixedLatex(option)}
                                            </div>
                                            <input
                                                type="radio"
                                                name={`correct-${index}`}
                                                value={option}
                                                checked={question.answer === option || String.fromCharCode(optionIndex + 65) === question.answer}
                                                onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-600">Correct</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
=======
            <BulkMarksAssignment
                bulkMarks={bulkMarks}
                bulkNegativeMarks={bulkNegativeMarks}
                dispatch={dispatch}
                questionCount={testData.questions.length}
            />

            <div className="space-y-6">
                {testData.questions.length > 0 ? (
                    testData.questions.map((question, index) => (
                        <QuestionCard key={question.id} question={question} index={index} dispatch={dispatch} />
                    ))
                ) : (
                    <EmptyQuestionsCard />
                )}
>>>>>>> 08f5e7e (reducer state implemented @TestCreator)
            </div>
        </div>
    );
}
<<<<<<< HEAD


// Feature for options

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


// const addQuestion = () => {
//     const newQuestion: Omit<QuestionForCreateTestData, 'id'> = {
//         question_text: '',
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
=======
>>>>>>> 08f5e7e (reducer state implemented @TestCreator)
