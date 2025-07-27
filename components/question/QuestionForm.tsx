'use client';

import { useQuestionForm } from "@/hooks/question/insert";
import { useState } from 'react';

const QuestionForm = ({ initialData }: { initialData?: Question }) => {
    const { submitQuestion, loading, error, success } = useQuestionForm();
    const [formData, setFormData] = useState(initialData || {
        question_number: '',
        question_text: '',
        options: '',
        answer: '',
        exam_name: '',
        subject: '',
        chapter: '',
        isOptionImage: false,
        isQuestionImage: false,
        question_image: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitQuestion(formData, initialData?.id);
    };

    return (
        <div className="max-w-4xl text-black mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">
                {initialData ? 'Edit Question' : 'Add New Question'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
                    Question {initialData ? 'updated' : 'created'} successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Number
                        </label>
                        <input
                            type="number"
                            name="question_number"
                            value={formData.question_number}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Exam Name
                        </label>
                        <select
                            name="exam_name"
                            value={formData.exam_name || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Select Exam</option>
                            <option value="JEE">JEE</option>
                            <option value="NEET">NEET</option>
                            <option value="GATE">GATE</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                    </label>
                    <select
                        name="subject"
                        value={formData.subject || ''}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select Subject</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Physics">Physics</option>
                        <option value="Mathematics">Mathematics</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chapter
                    </label>
                    <input
                        type="text"
                        name="chapter"
                        value={formData.chapter || ''}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text
                    </label>
                    <textarea
                        name="question_text"
                        value={formData.question_text}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        rows={3}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Options (one per line)
                    </label>
                    <textarea
                        name="options"
                        value={formData.options}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        rows={4}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answer (e.g., &quot;A&quot;, &quot;B&quot;, etc.)
                    </label>
                    <input
                        type="text"
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isQuestionImage"
                        name="isQuestionImage"
                        checked={formData.isQuestionImage}
                        onChange={(e) => handleChange({
                            target: {
                                name: 'isQuestionImage',
                                value: e.target.checked ? 'true' : 'false'
                            }
                            // eslint-disable-next-line
                        } as any)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isQuestionImage" className="text-sm font-medium text-gray-700">
                        Question has an image
                    </label>
                </div>

                {formData.isQuestionImage && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question Image URL
                        </label>
                        <input
                            type="text"
                            name="question_image"
                            value={formData.question_image || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                )}

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : (initialData ? 'Update Question' : 'Add Question')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuestionForm;
