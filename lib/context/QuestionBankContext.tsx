import { createContext, useContext } from 'react';
import { useQuestionBank } from '@/hooks/question/questionBank';

type QuestionBankContextType = ReturnType<typeof useQuestionBank>;

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export const QuestionBankProvider = ({ children }: { children: React.ReactNode }) => {
    const questionBank = useQuestionBank();
    return (
        <QuestionBankContext.Provider value={questionBank}>
            {children}
        </QuestionBankContext.Provider>
    );
};

export const useQuestionBankContext = () => {
    const context = useContext(QuestionBankContext);
    if (!context) {
        throw new Error('useQuestionBankContext must be used within a QuestionBankProvider');
    }
    return context;
};
