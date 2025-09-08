import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScoreDistributionProps {
    histogram: number[];
}

export default function ScoreDistribution({ histogram }: ScoreDistributionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Score Distribution (by %)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-10 gap-2 items-end h-40">
                    {histogram.map((count, idx, arr) => {
                        const max = Math.max(...arr, 1);
                        const height = Math.max(4, Math.round((count / max) * 100));
                        return (
                            <div key={idx} className="flex flex-col items-center">
                                <div className="w-full bg-indigo-500" style={{ height }} />
                                <div className="text-[10px] text-gray-500 mt-1">{idx * 10}-{idx * 10 + 9}</div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
