'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingOverlay } from '@/components/Loader';
import { QuestionBankProvider } from '@/lib/context/QuestionBankContext';
import { FolderProvider } from '@/lib/context/FolderContext';
import { PDFGeneratorProvider } from '@/lib/context/PDFGeneratorContext';
import QuestionBankViewer from '@/components/question/QuestionBankViewer';

export default function Home() {
    const { user } = useUser();
    const router = useRouter()


    useEffect(() => {
        if (!user) {
            router.push('/auth/signup')
        }
    }, [user, router]);

    if (!user) return <LoadingOverlay text="Authenticating..." />


    return (
        <div className="container bg-slate-100 mx-auto">
            <QuestionBankProvider>
                <FolderProvider>
                    <PDFGeneratorProvider>
                        <QuestionBankViewer />
                    </PDFGeneratorProvider>
                </FolderProvider>
            </QuestionBankProvider>
        </div>
    )
}
