'use client';

import { useState } from 'react';
import { generatePDF } from '@/lib/pdfUtils';
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

export default function PDFGenerator({ institution, selectedQuestions, options }: PDFConfig) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handlePreview = async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        setIsGenerating(true);
        try {
            const pdfBlob = await generatePDF({ institution, selectedQuestions, options });
            const url = URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
        } catch (error) {
            console.error('Error generating PDF preview:', error);
            alert('Failed to generate PDF preview');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (previewUrl) {
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = 'mcq_question_paper.pdf';
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
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isGenerating ?
                            'Generating...' :
                            (
                                <>
                                    <Download /><span>PDF</span>
                                </>
                            )}
                    </Button>
                </DialogTrigger>
                {previewUrl && (
                    <DialogContent className="bg-white sm:max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>PDF Preview</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto">
                            <iframe
                                src={previewUrl}
                                title="PDF Preview"
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
                                className="bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                            >
                                Download PDF
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
