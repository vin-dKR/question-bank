import { useCallback } from 'react';
import { toast } from 'sonner';
import { getQuestions, getQuestionCount, searchQuestions } from '@/actions/question/questionBank';

export const useFetchQuestions = (
    filters: Filters,
    pagination: Pagination,
    searchQuery: string,
    role: UserRole,
    isTeacher: boolean,
    dispatch: (action: any) => void,
    subject: string
) => {
    const fetchQuestions = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', loading: true });
        dispatch({ type: 'SET_ERROR', error: null });

        console.log('Fetching questions with:', { filters, pagination, searchQuery, role, isTeacher, subject });

        try {
            if (searchQuery.trim().length >= 2) {
                const searchRes = await searchQuestions(searchQuery, role, isTeacher ? subject : undefined);
                console.log('Search response:', searchRes);
                if (searchRes?.success) {
                    dispatch({ type: 'SET_QUESTIONS', questions: searchRes.data as Question[], totalCount: searchRes.data.length });
                } else {
                    const error = searchRes?.error || 'Failed to search questions';
                    console.error('Search error:', error);
                    dispatch({ type: 'SET_ERROR', error });
                    dispatch({ type: 'SET_QUESTIONS', questions: [], totalCount: 0 });
                    toast.error(error);
                }
            } else {
                const queryFilters = {
                    exam_name: filters.exam_name,
                    subject: isTeacher ? subject : filters.subject,
                    chapter: filters.chapter,
                    section_name: filters.section_name,
                    flagged: filters.flagged,
                    limit: pagination.limit,
                    skip: (pagination.page - 1) * pagination.limit,
                };

                console.log('Query filters:', queryFilters);

                const [questionsRes, countRes] = await Promise.all([
                    getQuestions(queryFilters, role, isTeacher ? subject : undefined),
                    getQuestionCount({ ...queryFilters, limit: undefined, skip: undefined }, role, isTeacher ? subject : undefined),
                ]);

                console.log('Questions response:', questionsRes);
                console.log('Count response:', countRes);

                if (questionsRes?.success && countRes?.success) {
                    dispatch({ type: 'SET_QUESTIONS', questions: questionsRes.data as Question[], totalCount: countRes.data });
                } else {
                    const error = questionsRes?.error || countRes?.error || 'Failed to fetch questions';
                    console.error('Fetch error:', error);
                    dispatch({ type: 'SET_ERROR', error });
                    dispatch({ type: 'SET_QUESTIONS', questions: [], totalCount: 0 });
                    toast.error(error);
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'An unexpected error occurred';
            console.error('Unexpected error in fetchQuestions:', err);
            dispatch({ type: 'SET_ERROR', error });
            dispatch({ type: 'SET_QUESTIONS', questions: [], totalCount: 0 });
            toast.error(error);
        } finally {
            dispatch({ type: 'SET_LOADING', loading: false });
            dispatch({ type: 'SET_INITIAL_FETCH_DONE' }); // Set flag when fetch completes
        }
    }, [filters, pagination, searchQuery, role, isTeacher, subject, dispatch]);

    return fetchQuestions;
};
