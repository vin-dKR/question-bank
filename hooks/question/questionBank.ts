'use client';

import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';

export const useQuestionBank = () => {
    const context = useQuestionBankContext();
    const { role, isTeacher, isLoading: roleLoading } = useUserRole();
    const { subject, isLoading: subjectLoading } = useUserSubject();

    return {
        ...context,
        role,
        isTeacher,
        subject,
        loading: context.loading || roleLoading || subjectLoading,
    };
};
