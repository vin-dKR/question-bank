'use client'

import { useCallback, useState } from 'react';
import {
    useCreateQuestion,
    useUpdateQuestionForm,
} from '@/hooks/queries/mutations';

/**
 * Phase 7: the question-form submit path now routes through TanStack Query
 * `useMutation` hooks so creates/updates invalidate `["questions"]` (and
 * `["filterOptions"]`) on settle. Local `loading` / `error` / `success`
 * state is preserved so callers that already wire those flags into form UI
 * don't have to change.
 */
export const useQuestionForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const createMutation = useCreateQuestion();
    const updateMutation = useUpdateQuestionForm();

    const submitQuestion = useCallback(
        async (formData: any, id?: string) => {
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
                    answer: formData.answer,
                    flagged: false,
                };

                const data = id
                    ? await updateMutation.mutateAsync({ id, data: questionData })
                    : await createMutation.mutateAsync(questionData);

                setSuccess(true);
                return data;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : 'An unexpected error occurred';
                setError(message);
                console.error(err);
            } finally {
                setLoading(false);
            }
        },
        [createMutation, updateMutation],
    );

    return { submitQuestion, loading, error, success, setError, setSuccess };
};
