import { notFound } from 'next/navigation';
import TestWorkspace, { type TestWorkspaceData } from '@/components/examination/TestWorkspace';
import { getTestById } from '@/actions/examination/test/crudTest';

interface TestPageProps {
    params: Promise<{ testId: string }>;
}

export default async function TestPage({ params }: TestPageProps) {
    const { testId } = await params;
    const test = await getTestById(testId);

    if (!test?.id) notFound();

    const workspaceTest: TestWorkspaceData = {
        id: test.id,
        title: test.title || 'Untitled test',
        description: test.description ?? null,
        subject: test.subject || 'General',
        duration: test.duration || 0,
        totalMarks: test.totalMarks || 0,
        responseCount: test._count?.responses || 0,
        createdAt: (test.createdAt || new Date()).toISOString(),
        questions: (test.questions || []).map((question) => ({
            id: question.id,
            questionText: question.questionText,
            options: question.options,
            answer: question.answer,
            marks: question.marks,
            questionNumber: question.questionNumber,
        })),
    };

    return <TestWorkspace test={workspaceTest} />;
}
