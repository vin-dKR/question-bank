'use client';

import { type QuestionFormData, useQuestionForm } from "@/hooks/question/insert";
import { useState } from 'react';

const inputClass =
    "w-full h-10 px-3 text-sm rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500";
const selectClass = inputClass;
const textareaClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-black/10 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500";
const labelClass = "block text-xs font-medium text-zinc-600 mb-1.5";

const toEditableQuestion = (question?: Question): QuestionFormData => ({
    question_number: question?.question_number ?? '',
    question_text: question?.question_text ?? '',
    options: Array.isArray(question?.options) ? question.options.join('\n') : question?.options ?? '',
    answer: question?.answer ?? '',
    exam_name: question?.exam_name ?? '',
    subject: question?.subject ?? '',
    chapter: question?.chapter ?? '',
    isOptionImage: question?.isOptionImage ?? false,
    isQuestionImage: question?.isQuestionImage ?? false,
    question_image: question?.question_image ?? '',
});

const QuestionForm = ({ initialData }: { initialData?: Question }) => {
    const { submitQuestion, loading, error, success } = useQuestionForm();
    const [formData, setFormData] = useState<QuestionFormData>(() => toEditableQuestion(initialData));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBooleanChange = (name: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitQuestion(formData, initialData?.id);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 rounded-xl border border-black/5 bg-white shadow-xs">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-6">
                {initialData ? 'Edit Question' : 'Add New Question'}
            </h2>

            {error && (
                <div className="mb-4 p-3 text-sm bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 text-sm bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                    Question {initialData ? 'updated' : 'created'} successfully!
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Question Number</label>
                        <input
                            type="number"
                            name="question_number"
                            value={formData.question_number}
                            onChange={handleChange}
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Exam Name</label>
                        <select
                            name="exam_name"
                            value={formData.exam_name || ''}
                            onChange={handleChange}
                            className={selectClass}
                        >
                            <option value="">Select Exam</option>
                            <option value="JEE">JEE</option>
                            <option value="NEET">NEET</option>
                            <option value="GATE">GATE</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Subject</label>
                    <select
                        name="subject"
                        value={formData.subject || ''}
                        onChange={handleChange}
                        className={selectClass}
                    >
                        <option value="">Select Subject</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Physics">Physics</option>
                        <option value="Mathematics">Mathematics</option>
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Chapter</label>
                    <input
                        type="text"
                        name="chapter"
                        value={formData.chapter || ''}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Question Text</label>
                    <textarea
                        name="question_text"
                        value={formData.question_text}
                        onChange={handleChange}
                        className={textareaClass}
                        rows={3}
                        required
                    />
                </div>

                <div>
                    <label className={labelClass}>Options (one per line)</label>
                    <textarea
                        name="options"
                        value={formData.options}
                        onChange={handleChange}
                        className={textareaClass}
                        rows={4}
                        required
                    />
                </div>

                <div>
                    <label className={labelClass}>Correct Answer (e.g., &quot;A&quot;, &quot;B&quot;, etc.)</label>
                    <input
                        type="text"
                        name="answer"
                        value={formData.answer}
                        onChange={handleChange}
                        className={inputClass}
                        required
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isQuestionImage"
                        name="isQuestionImage"
                        checked={formData.isQuestionImage === true || formData.isQuestionImage === 'true'}
                        onChange={(e) => handleBooleanChange('isQuestionImage', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300 rounded"
                    />
                    <label htmlFor="isQuestionImage" className="text-sm text-zinc-700">
                        Question has an image
                    </label>
                </div>

                {formData.isQuestionImage && (
                    <div>
                        <label className={labelClass}>Question Image URL</label>
                        <input
                            type="text"
                            name="question_image"
                            value={formData.question_image || ''}
                            onChange={handleChange}
                            className={inputClass}
                        />
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : (initialData ? 'Update Question' : 'Add Question')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuestionForm;
