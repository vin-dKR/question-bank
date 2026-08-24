import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crop as CropIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { renderMixedLatex } from '@/lib/render-tex';
import { TestCreatorAction } from '@/hooks/reducer/useTestCreatorReducer';
import Image from 'next/image';
import { CropEditor } from '@/components/school-test/CropEditor';
import { updateSchoolTestCrop } from '@/actions/school-test/updateSchoolTestCrop';
import { resolveQuestionImage } from '@/lib/images';

interface QuestionCardProps {
    question: QuestionForCreateTestData;
    index: number;
    dispatch: (action: TestCreatorAction) => void;
}

export default function QuestionCard({ question, index, dispatch }: QuestionCardProps) {
    const [cropOpen, setCropOpen] = useState(false);
    const [isSavingCrop, setIsSavingCrop] = useState(false);

    const canEditCrop =
        question.source === 'school-test' &&
        !!question.base_image &&
        !!question.source_width &&
        !!question.source_height;

    const handleCropSave = async (
        bbox: [number, number, number, number],
        dataUrl: string,
    ) => {
        if (isSavingCrop) return;
        setIsSavingCrop(true);
        try {
            const res = await updateSchoolTestCrop({
                schoolTestQuestionId: question.id,
                dataUrl,
                bbox,
            });
            if (!res.success) {
                toast.error(res.error);
                return;
            }
            dispatch({
                type: 'UPDATE_QUESTION_CROP',
                index,
                question_image: res.question_image,
                crop_bbox: res.crop_bbox,
            });
            setCropOpen(false);
        } catch (e) {
            toast.error((e as Error).message || 'Failed to update crop');
        } finally {
            setIsSavingCrop(false);
        }
    };

    return (
        <div className="rounded-xl border border-black/5 bg-white shadow-xs overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 items-center rounded-md bg-indigo-50 px-2 font-mono text-[11px] font-semibold text-indigo-700">
                        Q{question.question_number}
                    </span>
                    <Button
                        onClick={() => dispatch({ type: 'REMOVE_QUESTION', index })}
                        size="sm"
                        variant="ghost"
                        className="ml-auto sm:hidden h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                        aria-label="Remove question"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-medium text-zinc-500 whitespace-nowrap">Marks</label>
                        <Input
                            className="w-14 h-7 text-sm tabular-nums"
                            type="number"
                            value={question.marks}
                            onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', index, field: 'marks', value: parseInt(e.target.value) || 1 })}
                            min="1"
                        />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-medium text-zinc-500 whitespace-nowrap">Neg.</label>
                        <Input
                            className="w-14 h-7 text-sm tabular-nums"
                            type="number"
                            value={question.negativeMark ?? 0}
                            onChange={(e) => dispatch({ type: 'UPDATE_QUESTION', index, field: 'negativeMark', value: parseInt(e.target.value) || 0 })}
                            min="0"
                        />
                    </div>
                    <Button
                        onClick={() => dispatch({ type: 'REMOVE_QUESTION', index })}
                        size="sm"
                        variant="ghost"
                        className="hidden sm:inline-flex h-7 w-7 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                        aria-label="Remove question"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
                <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-1.5">
                        Question
                    </label>
                    <div className="rounded-lg bg-zinc-50/70 border border-black/5 p-3 text-sm text-zinc-900 leading-relaxed overflow-x-auto">
                        {renderMixedLatex(question.question_text)}
                    </div>
                    {resolveQuestionImage(question.question_image) && (
                        <div className="mt-3 flex flex-col items-start gap-2">
                            <Image
                                src={resolveQuestionImage(question.question_image)!}
                                alt="Question image"
                                width={200}
                                height={200}
                                className="max-w-full h-auto rounded-md border border-black/5"
                                unoptimized
                            />
                            {canEditCrop && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCropOpen(true)}
                                    disabled={isSavingCrop}
                                >
                                    <CropIcon className="w-3.5 h-3.5 mr-1.5" />
                                    {isSavingCrop ? 'Saving…' : 'Edit crop'}
                                </Button>
                            )}
                        </div>
                    )}
                    {!question.question_image && canEditCrop && (
                        <div className="mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setCropOpen(true)}
                                disabled={isSavingCrop}
                            >
                                <CropIcon className="w-3.5 h-3.5 mr-1.5" />
                                Add crop from source
                            </Button>
                        </div>
                    )}
                    {cropOpen && canEditCrop && (
                        <CropEditor
                            page={{
                                sourceDataUrl: question.base_image!,
                                sourceWidth: question.source_width!,
                                sourceHeight: question.source_height!,
                            }}
                            existing={
                                question.crop_bbox
                                    ? {
                                          id: `q-${question.id}`,
                                          q_no: question.question_number,
                                          bbox: question.crop_bbox,
                                          dataUrl: question.question_image ?? '',
                                      }
                                    : undefined
                            }
                            onSave={handleCropSave}
                            onCancel={() => setCropOpen(false)}
                        />
                    )}
                </div>

                <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 mb-1.5">
                        Options
                    </label>
                    <div className="space-y-1.5">
                        {question.options.map((option, optionIndex) => {
                            const letter = String.fromCharCode(65 + optionIndex);
                            const isCorrect =
                                question.answer === option || letter === question.answer;
                            return (
                                <label
                                    key={optionIndex}
                                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                                        isCorrect
                                            ? 'border-emerald-200 bg-emerald-50/50'
                                            : 'border-black/5 bg-white hover:border-zinc-200 hover:bg-zinc-50/60'
                                    }`}
                                >
                                    <span
                                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded font-mono text-[10px] font-semibold ${
                                            isCorrect
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-zinc-100 text-zinc-500'
                                        }`}
                                    >
                                        {letter}
                                    </span>
                                    <div className="flex-1 min-w-0 text-sm text-zinc-800 leading-relaxed overflow-x-auto">
                                        {renderMixedLatex(option)}
                                    </div>
                                    <div className="flex items-center gap-1.5 self-center">
                                        <input
                                            type="radio"
                                            name={`correct-${index}`}
                                            value={option}
                                            checked={isCorrect}
                                            onChange={(e) =>
                                                dispatch({
                                                    type: 'UPDATE_QUESTION',
                                                    index,
                                                    field: 'answer',
                                                    value: e.target.value,
                                                })
                                            }
                                            className="w-3.5 h-3.5 accent-indigo-600"
                                        />
                                        {isCorrect && (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
