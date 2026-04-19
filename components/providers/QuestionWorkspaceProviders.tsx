'use client';

import { ReactNode } from 'react';
import { CollaborationProvider } from '@/lib/context/CollaborationContext';
import { FolderProvider } from '@/lib/context/FolderContext';
import { PDFGeneratorProvider } from '@/lib/context/PDFGeneratorContext';
import { QuestionBankProvider } from '@/lib/context/QuestionBankContext';

interface QuestionWorkspaceProvidersProps {
    children: ReactNode;
}

/**
 * Bundles every client-side context needed by routes that read/write the
 * question bank, manage folders/templates/drafts, generate PDFs, or open the
 * folder collaboration panel. Mount this in route layouts that need it
 * instead of the dashboard root layout, so cold-start dashboards stay
 * provider-free.
 */
export default function QuestionWorkspaceProviders({ children }: QuestionWorkspaceProvidersProps) {
    return (
        <QuestionBankProvider>
            <FolderProvider>
                <PDFGeneratorProvider>
                    <CollaborationProvider>{children}</CollaborationProvider>
                </PDFGeneratorProvider>
            </FolderProvider>
        </QuestionBankProvider>
    );
}
