'use client';

import { useEffect } from 'react';
import { QuestionBankAction } from '../reducer/useQuestionBankReducer';

export const usePersistentSelection = (
    selectedQuestions: Question[],
    showOnlySelected: boolean,
    dispatch: (action: QuestionBankAction) => void
) => {
    useEffect(() => {
        try {
            localStorage.setItem('qb:selectedQuestions', JSON.stringify(selectedQuestions));
        } catch (err) {
            console.log('Failed saving selectedQuestions to localStorage', err);
        }
    }, [selectedQuestions]);

    useEffect(() => {
        try {
            localStorage.setItem('qb:showOnlySelected', JSON.stringify(showOnlySelected));
        } catch (err) {
            console.log('Error saving showOnlySelected to localStorage', err);
        }
    }, [showOnlySelected]);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'qb:selectedQuestions' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (Array.isArray(parsed)) {
                        dispatch({ type: 'SET_SELECTED_QUESTIONS', questions: parsed });
                    }
                } catch { }
            }

            if (e.key === 'qb:showOnlySelected' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    dispatch({ type: 'SET_SHOW_ONLY_SELECTED', show: Boolean(parsed) });
                } catch { }
            }
        };

        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [dispatch]);
};
