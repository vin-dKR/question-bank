import OmrCheckingPage from '@/components/examination/OmrCheckingPage';

interface OmrPageProps {
    searchParams: Promise<{ testId?: string }>;
}

export default async function OmrPage({ searchParams }: OmrPageProps) {
    const { testId } = await searchParams;

    return <OmrCheckingPage initialTestId={testId} />;
}
