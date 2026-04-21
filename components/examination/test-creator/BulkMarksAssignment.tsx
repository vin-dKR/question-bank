import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        <div className="rounded-xl border border-black/5 bg-white shadow-xs">
            <div className="border-b border-black/5 px-4 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Bulk assignment
                </p>
            </div>
            <div className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-zinc-600 flex-1 min-w-[140px]">Marks for all questions</label>
                    <Input
                        className="w-16 h-8 text-sm tabular-nums"
                        type="number"
                        value={bulkMarks}
                        onChange={(e) => dispatch({ type: 'SET_BULK_MARKS', marks: parseInt(e.target.value) || 1 })}
                        min="1"
                    />
                    <Button
                        onClick={() => dispatch({ type: 'APPLY_BULK_MARKS', marks: bulkMarks })}
                        size="sm"
                        variant="secondary"
                        className="text-xs whitespace-nowrap"
                    >
                        Apply
                    </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-zinc-600 flex-1 min-w-[140px]">Negative marks for all</label>
                    <Input
                        className="w-16 h-8 text-sm tabular-nums"
                        type="number"
                        value={bulkNegativeMarks}
                        onChange={(e) => dispatch({ type: 'SET_BULK_NEGATIVE_MARKS', negativeMarks: parseInt(e.target.value) || 0 })}
                        min="0"
                    />
                    <Button
                        onClick={() => dispatch({ type: 'APPLY_BULK_NEGATIVE_MARKS', negativeMarks: bulkNegativeMarks })}
                        size="sm"
                        variant="secondary"
                        className="text-xs whitespace-nowrap"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </div>
    );
}
