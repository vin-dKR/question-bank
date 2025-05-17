'use client'

import { useState } from 'react';
import { createQuestion, updateQuestion } from '@/actions/question/insert';

export const useQuestionForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const submitQuestion = async (formData: any, id?: string) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const questionData = {
                question_number: Number(formData.question_number),
                file_name: formData.file_name || null,
                question_text: formData.question_text,
                isQuestionImage: formData.isQuestionImage === 'true',
                question_image: formData.question_image || null,
                isOptionImage: formData.isOptionImage === 'true',
                options: formData.options.split('\n').filter((opt: string) => opt.trim()),
                option_images: formData.option_images?.split('\n').filter((opt: string) => opt.trim()) || [],
                section_name: formData.section_name || null,
                question_type: formData.question_type || null,
                topic: formData.topic || null,
                exam_name: formData.exam_name || null,
                subject: formData.subject || null,
                chapter: formData.chapter || null,
                answer: formData.answer
            };

            let result;
            if (id) {
                result = await updateQuestion(id, questionData);
            } else {
                result = await createQuestion(questionData);
            }

            if (result.success) {
                setSuccess(true);
                return result.data;
            } else {
                setError(result.error || 'Operation failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return { submitQuestion, loading, error, success, setError, setSuccess }
}
