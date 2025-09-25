import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TestCreatorAction } from '@/hooks/reducer/useTestCreatorReducer';

interface BulkMarksAssignmentProps {
    bulkMarks: number;
    bulkNegativeMarks: number;
    dispatch: (action: TestCreatorAction) => void;
    questionCount: number;
}

export default function BulkMarksAssignment({ bulkMarks, bulkNegativeMarks, dispatch, questionCount }: BulkMarksAssignmentProps) {
    if (questionCount === 0) return null;

    return (
        <Card className="gap-2">
            <CardHeader>
                <CardTitle className="text-lg">Bulk Mark Assignment</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs md:text-sm font-medium">Set marks for all questions:</label>
                        <Input
                            className="w-20 border border-black/30"
                            type="number"
                            value={bulkMarks}
                            onChange={(e) => dispatch({ type: 'SET_BULK_MARKS', marks: parseInt(e.target.value) || 1 })}
                            min="1"
                        />
                        <Button onClick={() => dispatch({ type: 'APPLY_BULK_MARKS', marks: bulkMarks })} size="sm" className="bg-black text-white text-xs md:text-sm text-nowrap">
                            Apply to All
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs md:text-sm font-medium">Set negative marks for all questions:</label>
                        <Input
                            className="w-20 border border-black/30"
                            type="number"
                            value={bulkNegativeMarks}
                            onChange={(e) => dispatch({ type: 'SET_BULK_NEGATIVE_MARKS', negativeMarks: parseInt(e.target.value) || 0 })}
                            min="0"
                        />
                        <Button onClick={() => dispatch({ type: 'APPLY_BULK_NEGATIVE_MARKS', negativeMarks: bulkNegativeMarks })} size="sm" className="bg-black text-white text-xs md:text-sm text-nowrap">
                            Apply to All
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
