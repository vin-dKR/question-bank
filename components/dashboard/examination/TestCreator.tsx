'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  questionNumber: number;
}

interface CreateTestData {
  title: string;
  description: string;
  subject: string;
  duration: number;
  totalMarks: number;
  questions: Omit<Question, 'id'>[];
}

export default function TestCreator() {
  const [testData, setTestData] = useState<CreateTestData>({
    title: '',
    description: '',
    subject: '',
    duration: 60,
    totalMarks: 20,
    questions: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    const newQuestion: Omit<Question, 'id'> = {
      questionText: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1,
      questionNumber: testData.questions.length + 1,
    };

    setTestData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (index: number, field: keyof Omit<Question, 'id'>, value: any) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.map((opt, j) => j === optionIndex ? value : opt) }
          : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({
        ...q,
        questionNumber: i + 1,
      })),
    }));
  };

  const calculateTotalMarks = () => {
    return testData.questions.reduce((total, q) => total + q.marks, 0);
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
        toast.error(`Question ${i + 1}: Please enter question text`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`Question ${i + 1}: Please fill all options`);
        return;
      }
      if (!q.correctAnswer) {
        toast.error(`Question ${i + 1}: Please select correct answer`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/examination/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testData,
          totalMarks: calculateTotalMarks(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      toast.success('Test created successfully!');
      setTestData({
        title: '',
        description: '',
        subject: '',
        duration: 60,
        totalMarks: 20,
        questions: [],
      });
    } catch (error) {
      console.error('Error creating test:', error);
      toast.error('Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Create New Test</h1>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Creating...' : 'Create Test'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Title</label>
              <Input
                value={testData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter test title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Select value={testData.subject} onValueChange={(value) => setTestData(prev => ({ ...prev, subject: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
              <Input
                type="number"
                value={testData.duration}
                onChange={(e) => setTestData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Marks</label>
              <Input
                type="number"
                value={calculateTotalMarks()}
                disabled
                className="bg-gray-50"
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
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Questions ({testData.questions.length})</h2>
        <Button onClick={addQuestion} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="space-y-6">
        {testData.questions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Question {question.questionNumber}</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Marks:</label>
                    <Input
                      type="number"
                      value={question.marks}
                      onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                      className="w-16"
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
                {/* <Textarea
                  value={question.questionText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(index, 'questionText', e.target.value)}
                  placeholder="Enter your question"
                  rows={3}
                /> */}
                <p className="text-sm text-gray-500">{question.questionText}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Options</label>
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
                        checked={question.correctAnswer === option}
                        onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
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
      </div>

      {testData.questions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">No questions added yet. Click "Add Question" to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
