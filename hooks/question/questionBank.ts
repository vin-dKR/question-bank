'use client';

import { useState, useEffect } from 'react';
import { getQuestions, getQuestionCount } from "@/actions/question/questionBank"

export const useQuestionBank = (initialFilters = {}) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [filters, setFilters] = useState(initialFilters);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 100
    })

    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);

        try {
            const [questionsRes, countRes] = await Promise.all([
                getQuestions({
                    ...filters,
                    limit: pagination.limit,
                    skip: (pagination.page - 1) * pagination.limit
                }),
                getQuestionCount(filters)
            ]);

            if (questionsRes.success && countRes.success) {
                setQuestions(questionsRes.data as Question[]);
                setCount(countRes.data);
            } else {
                setError(questionsRes.error || countRes.error || 'Failed to fetch data');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestionSelection = (id: string) => {
        setSelectedQuestions((prev) => {
            const isSelected = prev.some((q) => q.id === id);

            if (isSelected) {
                return prev.filter((q) => q.id !== id);
            } else {
                const questionToAdd = questions.find((q) => q.id === id);
                return questionToAdd ? [...prev, questionToAdd] : prev;
            }
        });
    };


    useEffect(() => {
        fetchQuestions();
    }, [filters, pagination.page, pagination.limit]);

    const updateFilters = (newFilters: any) => {
        setFilters(newFilters);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    return {
        questions,
        loading,
        error,
        count,
        filters,
        pagination,
        selectedQuestions,
        setPagination,
        updateFilters,
        toggleQuestionSelection,
        refresh: fetchQuestions
    };
};
