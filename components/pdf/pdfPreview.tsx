'use client';

import clsx from 'clsx';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, useMemo } from 'react';
import PDFActionButtons from './components/PDFActionButtons';
import PDFPreviewDialog from './components/PDFPreviewDialog';
import PDFFormDialog from './components/PDFFormDialog';
import { preRenderHtml } from '@/lib/preRenderHtml';
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf';
import { savePaperHistory } from '@/actions/paperHistory/paperHistory';
import { pdfConfigToAnswerKeyHTML, pdfConfigToHTML } from '@/lib/questionToHtmlUtils';


export default function PDFGenerator({
    institution,
    selectedQuestions,
    options,
    className,
    saveToHistory,
    showInPDFPreview = true,
    marks,
    time,
    exam,
    subject,
    logo,
    standard,
    session,
    institutionAddress
}: PDFConfig) {
    // const [isMobile, setIsMobile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'form' | 'preview'>('form');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<"question" | "answer" | null>(null);
    const [formData, setFormData] = useState<TemplateFormData>({
        templateName: '',
        institution: institution || '',
        institutionAddress: institutionAddress || '',
        marks: marks || '',
        time: time || '',
        exam: exam || '',
        subject: subject || '',
        logo: logo || '',
        standard: standard || '',
        session: session || ''
    });

    // Memoize mobile detection to avoid repeated calculations
    const isMobileDevice = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const userAgent = navigator.userAgent;
        return /android|iPad|iPhone|iPod/i.test(userAgent);
    }, []);

    useEffect(() => {
    }, [isMobileDevice]);

    // Cleanup effect for preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Update form data when props change
    useEffect(() => {
        setFormData({
            templateName: '',
            institution: institution || '',
            institutionAddress: institutionAddress || '',
            marks: marks || '',
            time: time || '',
            exam: exam || '',
            subject: subject || '',
            logo: logo || '',
            standard: standard || '',
            session: session || ''
        });
    }, [institution, institutionAddress, marks, time, exam, subject, logo, standard, session]);

    const handleFormSubmit = useCallback((data: TemplateFormData) => {
        setFormData(data);
        setIsGenerating("question");
        handlePreviewCompiledHTML(data);
    }, []);

    const handlePreviewCompiledHTML = useCallback(async (data: typeof formData) => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            setIsGenerating(null);
            return;
        }

        try {
            await preRenderHtml();

            const html = pdfConfigToHTML({
                institution: data?.institution || "",
                institutionAddress: data?.institutionAddress,
                selectedQuestions,
                options,
                marks: data.marks,
                time: data.time,
                exam: data.exam,
                subject: data.subject,
                logo: data.logo,
                standard: data.standard,
                session: data.session
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
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError("Error generating PDF: " + (error instanceof Error ? error.message : 'Unknown error'));
            setIsGenerating(null);
        }
    }, [selectedQuestions, options]);

    const handlePreviewAnswer = useCallback(async () => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question');
            return;
        }

        try {
            setIsGenerating("answer");
            const html = pdfConfigToAnswerKeyHTML({
                institution: formData?.institution || "",
                selectedQuestions,
                options,
                marks: formData.marks,
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
        } catch (error) {
            console.error('Error generating answer key:', error);
            setError("Error generating answer key: " + (error instanceof Error ? error.message : 'Unknown error'));
            setIsGenerating(null);
        }
    }, [selectedQuestions, options, formData]);

    const handleDownload = useCallback(async () => {
        if (previewUrl) {
            try {
                const link = document.createElement('a');
                link.href = previewUrl;
                link.download = `${formData.institution}_${formData.exam}.pdf`;
                link.click();

                if (saveToHistory) {
                    const paperHistoryData = {
                        isContinue: saveToHistory,
                        title: formData.exam || 'Untitled Paper',
                        description: `${formData.subject || 'General'} - ${formData.standard || 'All Levels'}`,
                        institution: formData.institution,
                        subject: formData.subject,
                        marks: formData.marks,
                        time: formData.time,
                        exam: formData.exam,
                        logo: formData.logo,
                        standard: formData.standard,
                        session: formData.session,
                        questions: selectedQuestions.map((q, index) => ({
                            id: q.id,
                            marks: 1, // Default marks
                            questionNumber: index + 1,
                        })),
                    };

                    const { success } = await savePaperHistory(paperHistoryData);
                    if (success) {
                        toast.success('Paper history saved successfully');
                    } else {
                        toast.error('Paper history did not save');
                    }
                }
            } catch (error) {
                console.error('Failed to save paper history:', error);
                toast.error('Failed to save paper history');
            }
        }
    }, [previewUrl, formData, selectedQuestions, saveToHistory]);

    const handleClose = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setError(null);
        setStep('form');
        setDialogKey(prev => prev + 1);
    }, [previewUrl]);

    const [dialogKey, setDialogKey] = useState(0);

    // Memoize button click handlers to prevent unnecessary re-renders
    const handleGeneratePDF = useCallback(() => {
        setIsGenerating("question");
        handlePreviewCompiledHTML(formData);
    }, [handlePreviewCompiledHTML, formData]);

    // Memoize button classes to prevent recalculation
    const buttonClasses = useMemo(() => ({
        pdf: clsx("bg-indigo-600 w-full hover:bg-indigo-600 text-white px-4 py-1 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed border border-black/20", className),
        answer: clsx("bg-green-600 w-full hover:bg-green-700 text-white px-4 py-2 whitespace-nowrap text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed border border-black/20", className)
    }), [className]);

    // Memoize disabled states
    const isDisabled = useMemo(() => ({
        pdf: !selectedQuestions || selectedQuestions.length === 0 || isGenerating === "question",
        answer: !selectedQuestions || selectedQuestions.length === 0 || isGenerating === "answer"
    }), [selectedQuestions, isGenerating]);

    if (!showInPDFPreview) {
        return (
            <>
                <PDFActionButtons
                    onGeneratePDF={handleGeneratePDF}
                    onPreviewAnswer={handlePreviewAnswer}
                    isGenerating={isGenerating}
                    disabled={isDisabled}
                    className={className}
                />

                <PDFPreviewDialog
                    isOpen={!!previewUrl}
                    onClose={handleClose}
                    onDownload={handleDownload}
                    previewUrl={previewUrl}
                    error={error}
                    isMobile={isMobileDevice}
                    onRetry={() => handlePreviewCompiledHTML(formData)}
                />
            </>
        );
    }

    return (
        <PDFFormDialog
            selectedQuestions={selectedQuestions}
            formData={formData}
            onFormSubmit={handleFormSubmit}
            onPreviewAnswer={handlePreviewAnswer}
            onDownload={handleDownload}
            onClose={handleClose}
            previewUrl={previewUrl}
            error={error}
            isMobile={isMobileDevice}
            isGenerating={isGenerating}
            step={step}
            dialogKey={dialogKey}
            disabled={isDisabled}
            buttonClasses={buttonClasses}
        />
    );
}
