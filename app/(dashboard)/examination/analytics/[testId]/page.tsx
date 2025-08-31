import TestAnalytics from '@/components/examination/TestAnalytics';

interface Props {
  params: {
    testId: string;
  };
}

export default function TestAnalyticsPage({ params }: Props) {
  return <TestAnalytics testId={params.testId} />;
} 