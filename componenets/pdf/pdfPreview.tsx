'use client';

import { useState, useEffect } from 'react';
import { generatePDF, generatePDFWithoutMathJax } from '@/lib/pdfUtils';
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
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Detect mobile device
        const userAgent = navigator.userAgent || navigator.vendor;
        setIsMobile(/android|iPad|iPhone|iPod/i.test(userAgent));

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handlePreview = async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        // Clear any existing preview
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        setIsGenerating(true);
        setError(null);
        
        try {
            let pdfBlob: Blob;
            
            // Try with MathJax first with longer timeout
            try {
                console.log('Attempting PDF generation with MathJax...');
                pdfBlob = await generatePDF({ institution, selectedQuestions, options });
                console.log('PDF generated successfully with MathJax');
            } catch (mathJaxError) {
                console.warn('MathJax PDF generation failed, trying without MathJax:', mathJaxError);
                
                // Fallback to PDF without MathJax
                try {
                    console.log('Attempting PDF generation without MathJax...');
                    pdfBlob = await generatePDFWithoutMathJax({ institution, selectedQuestions, options });
                    console.log('PDF generated successfully without MathJax');
                } catch (fallbackError) {
                    console.error('Both MathJax and fallback PDF generation failed:', fallbackError);
                    throw new Error('Failed to generate PDF. Please try again.');
                }
            }
            
            const url = URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
        } catch (error) {
            console.error('Error generating PDF preview:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate PDF preview');
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
        setError(null);
        setIsGenerating(false);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    onClick={handlePreview}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isGenerating ? 'Generating...' : (
                        <>
                            <Download className="h-4 w-4" />
                            <span>PDF</span>
                        </>
                    )}
                </Button>
            </DialogTrigger>
            {previewUrl && (
                <DialogContent className="sm:max-w-4xl bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
                    <DialogHeader>
                        <DialogTitle className="text-center">PDF Preview</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        {error ? (
                            <div className="text-red-600 text-center p-4">
                                <p className="mb-2">{error}</p>
                                <Button
                                    onClick={handlePreview}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : isMobile ? (
                            <div className="text-center p-4">
                                <p className="mb-4">PDF preview is not supported on mobile devices. Please download the PDF.</p>
                                <Button
                                    onClick={handleDownload}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Download PDF
                                </Button>
                            </div>
                        ) : (
                            <iframe
                                src={previewUrl}
                                title="PDF Preview"
                                className="w-full h-[70vh] lg:h-[80vh] border border-gray-200 rounded-md"
                            />
                        )}
                    </div>
                    <DialogFooter className="sm:justify-between mt-4">
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        {!isMobile && !error && (
                            <Button
                                onClick={handleDownload}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Download PDF
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );
}
