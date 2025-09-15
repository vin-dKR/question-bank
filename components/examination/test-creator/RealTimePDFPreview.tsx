'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, Eye } from 'lucide-react';
import { preRenderHtml } from '@/lib/preRenderHtml';
import { htmlTopdfBlob } from '@/actions/htmlToPdf/htmlToPdf';
import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML } from '@/lib/questionToHtmlUtils';
import PDFBlobViewer from './PDFBlobViewer';

interface RealTimePDFPreviewProps {
    testData: CreateTestData;
    pdfFormData: TemplateFormData;
    selectedQuestions: QuestionForCreateTestData[];
}

export default function RealTimePDFPreview({ testData, pdfFormData, selectedQuestions }: RealTimePDFPreviewProps) {
    const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
    const [questionHtml, setQuestionHtml] = useState<string | null>(null);
    const [answerHtml, setAnswerHtml] = useState<string | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<'questions' | 'answers' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // PDF options for downloads
    const pdfOptions = useMemo(
        () => ({
            includeAnswers: false,
            includeMetadata: true,
            pageSize: 'a4' as const,
            orientation: 'portrait' as const,
            fontSize: 12,
            lineHeight: 1.4,
            margin: 20,
            pdfOptions: {
                pageSize: 'a4' as const,
                orientation: 'portrait' as const,
                margin: 20,
                scale: 0.8,
                quality: 0.8,
            },
        }),
        []
    );

    // Generate HTML for questions preview
    const questionHtmlContent = useMemo(() => {
        if (selectedQuestions.length === 0 || !pdfFormData.exam || !pdfFormData.subject) {
            return null;
        }
        return pdfConfigToHTML({
            institution: pdfFormData.institution || '',
            institutionAddress: pdfFormData.institutionAddress || '',
            selectedQuestions: selectedQuestions.slice(0, 3),
            options: pdfOptions,
            marks: pdfFormData.marks || testData.totalMarks.toString(),
            time: pdfFormData.time || testData.duration.toString(),
            exam: pdfFormData.exam || testData.title,
            subject: pdfFormData.subject || testData.subject,
            logo: pdfFormData.logo || '',
            standard: pdfFormData.standard || '',
            session: pdfFormData.session || '',
        });
    }, [
        selectedQuestions,
        pdfFormData.institution,
        pdfFormData.institutionAddress,
        pdfFormData.marks,
        pdfFormData.time,
        pdfFormData.exam,
        pdfFormData.subject,
        pdfFormData.logo,
        pdfFormData.standard,
        pdfFormData.session,
        testData.totalMarks,
        testData.duration,
        testData.title,
        testData.subject,
        pdfOptions,
    ]);

    // Generate HTML for answers preview
    const answerHtmlContent = useMemo(() => {
        if (selectedQuestions.length === 0 || !pdfFormData.exam || !pdfFormData.subject) {
            return null;
        }
        return pdfConfigToAnswerKeyHTML({
            institution: pdfFormData.institution || '',
            selectedQuestions: selectedQuestions.slice(0, 3),
            options: pdfOptions,
            marks: pdfFormData.marks || testData.totalMarks.toString(),
            time: pdfFormData.time || testData.duration.toString(),
            exam: pdfFormData.exam || testData.title,
            subject: pdfFormData.subject || testData.subject,
            logo: pdfFormData.logo || '',
        });
    }, [
        selectedQuestions,
        pdfFormData.institution,
        pdfFormData.marks,
        pdfFormData.time,
        pdfFormData.exam,
        pdfFormData.subject,
        pdfFormData.logo,
        testData.totalMarks,
        testData.duration,
        testData.title,
        testData.subject,
        pdfOptions,
    ]);

    // Update HTML content on state changes
    useEffect(() => {
        if (generationTimeoutRef.current) {
            clearTimeout(generationTimeoutRef.current);
        }
        generationTimeoutRef.current = setTimeout(() => {
            setQuestionHtml(questionHtmlContent);
            setAnswerHtml(answerHtmlContent);
        }, 300); // 300ms debounce for smooth updates

        return () => {
            if (generationTimeoutRef.current) {
                clearTimeout(generationTimeoutRef.current);
            }
        };
    }, [questionHtmlContent, answerHtmlContent]);

    // Generate PDF for download (questions)
    const generateQuestionPDF = useCallback(async () => {
        if (selectedQuestions.length === 0) {
            setError('No questions available for download');
            return;
        }

        try {
            setIsGeneratingPdf('questions');
            setError(null);

            await preRenderHtml();

            const html = pdfConfigToHTML({
                institution: pdfFormData.institution || '',
                institutionAddress: pdfFormData.institutionAddress || '',
                selectedQuestions: selectedQuestions.slice(0, 3),
                options: pdfOptions,
                marks: pdfFormData.marks || testData.totalMarks.toString(),
                time: pdfFormData.time || testData.duration.toString(),
                exam: pdfFormData.exam || testData.title,
                subject: pdfFormData.subject || testData.subject,
                logo: pdfFormData.logo || '',
                standard: pdfFormData.standard || '',
                session: pdfFormData.session || '',
            });

            const blob = await htmlTopdfBlob(html);
            if (blob.data) {
                const pdfBlob = new Blob([blob.data], { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `${pdfFormData.exam || testData.title}_questions.pdf`;
                link.click();
                URL.revokeObjectURL(pdfUrl); // Clean up immediately after download
            } else {
                setError('Failed to generate question PDF: ' + blob.errorMessage);
            }
        } catch (error) {
            console.error('Error generating question PDF:', error);
            setError('Error generating question PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsGeneratingPdf(null);
        }
    }, [selectedQuestions, pdfFormData, testData, pdfOptions]);

    // Generate PDF for download (answers)
    const generateAnswerPDF = useCallback(async () => {
        if (selectedQuestions.length === 0) {
            setError('No questions available for download');
            return;
        }

        try {
            setIsGeneratingPdf('answers');
            setError(null);

            await preRenderHtml();

            const html = pdfConfigToAnswerKeyHTML({
                institution: pdfFormData.institution || '',
                selectedQuestions: selectedQuestions.slice(0, 3),
                options: pdfOptions,
                marks: pdfFormData.marks || testData.totalMarks.toString(),
                time: pdfFormData.time || testData.duration.toString(),
                exam: pdfFormData.exam || testData.title,
                subject: pdfFormData.subject || testData.subject,
                logo: pdfFormData.logo || '',
            });

            const blob = await htmlTopdfBlob(html);
            if (blob.data) {
                const pdfBlob = new Blob([blob.data], { type: 'application/pdf' });
                const pdfUrl = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = pdfUrl;
                link.download = `${pdfFormData.exam || testData.title}_answers.pdf`;
                link.click();
                URL.revokeObjectURL(pdfUrl); // Clean up immediately after download
            } else {
                setError('Failed to generate answer PDF: ' + blob.errorMessage);
            }
        } catch (error) {
            console.error('Error generating answer PDF:', error);
            setError('Error generating answer PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsGeneratingPdf(null);
        }
    }, [selectedQuestions, pdfFormData, testData, pdfOptions]);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Preview
                </CardTitle>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'questions' | 'answers')} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="questions" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Questions
                        </TabsTrigger>
                        <TabsTrigger value="answers" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Answers
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="questions" className="flex-1 mt-4">
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Question Paper Preview</h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={generateQuestionPDF}
                                        disabled={isGeneratingPdf === 'questions' || selectedQuestions.length === 0}
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        Download
                                    </Button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg mb-4">
                                    <p>{error}</p>
                                </div>
                            )}

                            <PDFBlobViewer htmlContent={questionHtml} className="flex-1 min-h-[600px]" />
                        </div>
                    </TabsContent>

                    <TabsContent value="answers" className="flex-1 mt-4">
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Answer Key Preview</h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={generateAnswerPDF}
                                        disabled={isGeneratingPdf === 'answers' || selectedQuestions.length === 0}
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        Download
                                    </Button>
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-600 text-center p-4 bg-red-50 rounded-lg mb-4">
                                    <p>{error}</p>
                                </div>
                            )}

                            <PDFBlobViewer htmlContent={answerHtml} className="flex-1 min-h-[600px]" />
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
