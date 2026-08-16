import { randomBytes } from 'node:crypto';
import TestCreator from '@/components/examination/TestCreator';

export const dynamic = 'force-dynamic';

export default function CreateTestPage() {
    const paperId = randomBytes(12).toString('hex');
    return <TestCreator paperId={paperId} />;
}
