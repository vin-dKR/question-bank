'use client';

import { ReactNode } from 'react';
import { FolderProvider } from '@/lib/context/FolderContext';
import { PDFGeneratorProvider } from '@/lib/context/PDFGeneratorContext';
import { QuestionBankProvider } from '@/lib/context/QuestionBankContext';

interface AppProvidersProps {
    children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
    return (
        <QuestionBankProvider>
            <FolderProvider>
                <PDFGeneratorProvider>
                    {children}
                </PDFGeneratorProvider>
            </FolderProvider>
        </QuestionBankProvider>
    );
}
