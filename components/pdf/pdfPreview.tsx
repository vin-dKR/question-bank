'use client';

import { useState, useEffect } from 'react';
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
import { pdfConfigToAnswerKeyHTML, pdfConfigToHTML } from '@/lib/questionToHtmlUtils';
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf';
import clsx from 'clsx';
import PDFDetailsForm from './PDFDetailsForm';


export default function PDFGenerator({ institution, selectedQuestions, options, className }: PDFConfig) {
    const [isGenerating, setIsGenerating] = useState<"question" | "answer" | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'form' | 'preview'>('form');
    const [formData, setFormData] = useState({
        templateName: '',
        institution: institution || '',
        marks: '',
        time: '',
        exam: '',
        subject: '',
        logo: '',
    });

    useEffect(() => {
        // Detect mobile device
        const userAgent = navigator.userAgent;
        setIsMobile(/android|iPad|iPhone|iPod/i.test(userAgent));

        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFormSubmit = (data: typeof formData) => {
        setFormData(data);
        handlePreviewCompiledHTML(data);
    };

    const handlePreviewCompiledHTML = async (data: typeof formData) => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        setIsGenerating("question");
        const html = pdfConfigToHTML({
            institution: data.institution,
            selectedQuestions,
            options,
            marks: parseInt(data.marks),
            time: data.time,
            exam: data.exam,
            subject: data.subject,
            logo: data.logo,
        });

        const blob = await htmlTopdfBlob(html);
        if (!blob.data) {
            setError("Error generating PDF: " + blob.errorMessage);
            setIsGenerating(null);
            return;
        }

        const pdfBlob = new Blob([blob.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPreviewUrl(pdfUrl);
        setStep('preview');
        setIsGenerating(null);
    };

    const handlePreviewAnswer = async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        setIsGenerating("answer");
        const html = pdfConfigToAnswerKeyHTML({
            institution: formData.institution,
            selectedQuestions,
            options,
            marks: parseInt(formData.marks),
            time: formData.time,
            exam: formData.exam,
            subject: formData.subject,
            logo: formData.logo,
        });

        const blob = await htmlTopdfBlob(html);
        if (!blob.data) {
            setError("Error generating answer key: " + blob.errorMessage);
            setIsGenerating(null);
            return;
        }

        const pdfBlob = new Blob([blob.data], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPreviewUrl(pdfUrl);
        setStep('preview');
        setIsGenerating(null);
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
        setStep('form');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => setStep('form')}
                        disabled={!selectedQuestions || selectedQuestions.length === 0}
                        className={clsx("bg-indigo-600 hover:bg-indigo-600 text-white px-4 py-1 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed border border-black/20", className)}
                    >
                        {isGenerating === "question" ? "Generating..." : "PDF"}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handlePreviewAnswer}
                        disabled={!selectedQuestions || selectedQuestions.length === 0}
                        className={clsx("bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed border border-black/20", className)}
                    >
                        {isGenerating === "answer" ? "Generating..." : "Preview Answers"}
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
                    <PDFDetailsForm
                        initialData={formData}
                        onSubmit={handleFormSubmit}
                        onCancel={handleClose}
                    />
                ) : error ? (
                    <div className="text-red-600 text-center p-4">
                        <p className="mb-2">{error}</p>
                        <Button
                            onClick={() => handlePreviewCompiledHTML(formData)}
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
                    <div className="w-full h-[70vh] lg:h-[80vh] border border-gray-200 rounded-md overflow-hidden">
                        {previewUrl && <iframe src={previewUrl} className="w-full h-full" />}
                    </div>
                )}
                {step === 'preview' && (
                    <DialogFooter className="sm:justify-between mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" onClick={handleClose}>
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
                )}
            </DialogContent>
        </Dialog>
    );
}
