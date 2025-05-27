'use client';

import { useState } from 'react';
import { generateAnswersPDF } from '@/lib/pdfUtils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import { Download } from 'lucide-react';

export default function AnswerPDFGenerator({ institution, selectedQuestions, options }: PDFConfig) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handlePreview = async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        setIsGenerating(true);
        try {
            const pdfBlob = await generateAnswersPDF({ institution, selectedQuestions, options });
            const url = URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
        } catch (error) {
            console.error('Error generating answers PDF preview:', error);
            alert('Failed to generate answers PDF preview');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (previewUrl) {
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = 'answer_key.pdf';
            link.click();
        }
    };

    const handleClose = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    return (
        <div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        onClick={handlePreview}
                        disabled={isGenerating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isGenerating ?
                            'Generating...' :
                            (
                                <>
                                    <Download /><span>Answer PDF</span>
                                </>
                            )}

                    </Button>
                </DialogTrigger>
                {previewUrl && (
                    <DialogContent className="sm:max-w-4xl bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
                        <DialogHeader>
                            <DialogTitle>Answer Key Preview</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto">
                            <iframe
                                src={previewUrl}
                                title="Answer Key Preview"
                                className="w-full h-[60vh] sm:h-[70vh] border border-slate-200 rounded-md"
                            />
                        </div>
                        <DialogFooter className="sm:justify-between">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    onClick={handleClose}
                                    className="border-slate-500 text-slate-50 bg-black cursor-pointer"
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleDownload}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            >
                                Download Answer Key
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
