'use client';

import { memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PDFDetailsForm from '../PDFDetailsForm';
import PDFPreviewContent from './PDFPreviewContent';

interface PDFFormDialogProps {
    selectedQuestions: Question[];
    formData: TemplateFormData;
    onFormSubmit: (data: TemplateFormData) => void;
    onPreviewAnswer: () => void;
    onDownload: () => void;
    onClose: () => void;
    previewUrl: string | null;
    error: string | null;
    isMobile: boolean;
    isGenerating: "question" | "answer" | null;
    step: 'form' | 'preview';
    dialogKey: number;
    disabled: {
        pdf: boolean;
        answer: boolean;
    };
    buttonClasses: {
        pdf: string;
        answer: string;
    };
}

const PDFFormDialog = memo(({
    selectedQuestions,
    formData,
    onFormSubmit,
    onPreviewAnswer,
    onDownload,
    onClose,
    previewUrl,
    error,
    isMobile,
    isGenerating,
    step,
    dialogKey,
    disabled,
    buttonClasses
}: PDFFormDialogProps) => {
    return (
        <Dialog key={dialogKey}>
            <DialogTrigger asChild>
                <div className="flex gap-2 justify-end">
                    <Button
                        size="sm"
                        onClick={() => { }}
                        disabled={disabled.pdf}
                        className={buttonClasses.pdf}
                    >
                        <span className='text-xs sm:text-sm text-nowrap font-bold'>
                            {isGenerating === "question" ? "Generating..." : "PDF"}
                        </span>
                    </Button>
                    <Button
                        size="sm"
                        onClick={onPreviewAnswer}
                        disabled={disabled.answer}
                        className={buttonClasses.answer}
                    >
                        <span className='text-xs sm:text-sm text-nowrap font-bold'>
                            {isGenerating === "answer" ? "Generating..." : "Preview Answers"}
                        </span>
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2 border border-black/20 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl tracking-3">
                        {step === 'form' ? 'Enter PDF Details' : 'PDF Preview'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'form' ? (
                    <>
                        {selectedQuestions.length === 0 ? (
                            <div className="text-amber-600 text-center p-4 bg-amber-50 rounded-lg">
                                <p className="mb-2">⚠️ No questions are currently selected in this view.</p>
                                <p className="text-sm">Please select questions or check if some selected questions are hidden by current filters.</p>
                            </div>
                        ) : (
                            <PDFDetailsForm
                                initialData={formData}
                                onSubmit={onFormSubmit}
                                onCancel={onClose}
                                isGenerating={isGenerating === "question"}
                            />
                        )}
                    </>
                ) : (
                    <PDFPreviewContent
                        previewUrl={previewUrl}
                        error={error}
                        isMobile={isMobile}
                        onRetry={() => onFormSubmit(formData)}
                        onDownload={onDownload}
                    />
                )}

                {step === 'preview' && (
                    <DialogFooter className="sm:justify-between mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                        </DialogClose>
                        {!isMobile && !error && (
                            <Button
                                onClick={onDownload}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Download PDF
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
});

PDFFormDialog.displayName = 'PDFFormDialog';

export default PDFFormDialog;
