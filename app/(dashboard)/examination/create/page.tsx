import { randomBytes } from 'node:crypto';
import TestCreator from '@/components/examination/TestCreator';

export const dynamic = 'force-dynamic';

interface CreateTestPageProps {
    searchParams: Promise<{ paperId?: string }>;
}

export default async function CreateTestPage({ searchParams }: CreateTestPageProps) {
    const requestedPaperId = (await searchParams).paperId;
    const paperId = requestedPaperId && /^[A-Fa-f0-9]{24}$/.test(requestedPaperId)
        ? requestedPaperId
        : randomBytes(12).toString('hex');
    return <TestCreator paperId={paperId} />;
}
