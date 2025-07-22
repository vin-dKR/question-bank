'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML } from '@/lib/questionToHtmlUtils';
import { Loader2, FileText, CheckCircle, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

declare global {
    interface Window {
        MathJax: any;
    }
}

interface PDFPreviewProps {
    institution: string;
    options: any;
    selectedQuestions: Question[];
}

type PreviewType = 'questions' | 'answers';

// Simple approach - just create HTML with MathJax and let it render naturally
const createMathJaxHTML = (html: string, title: string): string => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <script>
                window.MathJax = {
                    tex: {
                        inlineMath: [['\\\\(', '\\\\)']],
                        displayMath: [['\\\\[', '\\\\]']],
                        processEscapes: true,
                        processEnvironments: true
                    },
                    svg: {
                        fontCache: 'global',
                        displayAlign: 'center',
                        displayIndent: '0'
                    },
                    startup: {
                        pageReady: () => {
                            return window.MathJax.startup.defaultPageReady();
                        }
                    }
                };
            </script>
            <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async></script>
            <style>
                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #000;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                }
                .question {
                    margin-bottom: 20px;
                    page-break-inside: avoid;
                }
                .question-number {
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .question-text {
                    margin-bottom: 10px;
                }
                .options {
                    margin-left: 20px;
                }
                .option {
                    margin-bottom: 5px;
                }
                /* MathJax styling */
                mjx-container {
                    display: inline-block;
                    margin: 0 2px;
                }
                mjx-container[display="true"] {
                    display: block;
                    text-align: center;
                    margin: 15px 0;
                }
                mjx-container svg {
                    max-width: 100%;
                    height: auto;
                    vertical-align: middle;
                }
                h1, h2, h3 {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                }
                @media print {
                    body { 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `;
};

const PDFPreview: React.FC<PDFPreviewProps> = ({ institution, options, selectedQuestions }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [currentType, setCurrentType] = useState<PreviewType>('questions');

    const generateHTMLPreview = (type: PreviewType): string => {
        // Generate HTML content
        const htmlGenerator = type === 'questions' ? pdfConfigToHTML : pdfConfigToAnswerKeyHTML;
        const rawHTML = htmlGenerator({
            institution,
            selectedQuestions,
            options: {
                ...options,
                includeAnswers: type === 'questions' ? options.includeAnswers : true,
                includeMetadata: options.includeMetadata
            }
        });

        console.log('Generated HTML length:', rawHTML.length);
        console.log('First 500 chars:', rawHTML.substring(0, 500));

        // Create complete HTML document with better styling
        const fullHTML = createMathJaxHTML(rawHTML, type === 'questions' ? 'Question Paper' : 'Answer Key');

        return fullHTML;
    };

    const generatePDFFromHTML = async (htmlContent: string, type: PreviewType): Promise<Blob> => {
        return new Promise(async (resolve, reject) => {
            try {
                // Generate HTML content without MathJax for PDF generation
                const htmlGenerator = type === 'questions' ? pdfConfigToHTML : pdfConfigToAnswerKeyHTML;
                const rawHTML = htmlGenerator({
                    institution,
                    selectedQuestions,
                    options: {
                        ...options,
                        includeAnswers: type === 'questions' ? options.includeAnswers : true,
                        includeMetadata: options.includeMetadata
                    }
                });

                // Create a simplified HTML structure that will definitely be visible in PDF
                const simplifiedHTML = `
                    <div style="padding: 20px; font-family: Times New Roman, serif; color: black; background: white; font-size: 14px; line-height: 1.6;">
                        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 15px;">
                            <h1 style="color: black; margin: 0; font-size: 24px;">${institution}</h1>
                            <h2 style="color: black; margin: 10px 0 0 0; font-size: 18px;">${type === 'questions' ? 'Question Paper' : 'Answer Key'}</h2>
                        </div>
                        
                        ${selectedQuestions.map((question, index) => {
                    const questionNumber = index + 1;
                    const questionText = question.question_text
                        .replace(/\\\\?\(/g, '(')
                        .replace(/\\\\?\)/g, ')')
                        .replace(/\\\\?\[/g, '[')
                        .replace(/\\\\?\]/g, ']');

                    const optionsHTML = question.options.map((option, optIndex) => {
                        const optionLetter = String.fromCharCode(65 + optIndex);
                        const optionText = option
                            .replace(/\\\\?\(/g, '(')
                            .replace(/\\\\?\)/g, ')')
                            .replace(/\\\\?\[/g, '[')
                            .replace(/\\\\?\]/g, ']');

                        const answers = (question.answer || '').toString().split(',').map(a => a.trim().toUpperCase());
                        const isCorrect = answers.includes(optionLetter);

                        return `
                                    <div style="margin: 8px 0; padding: 4px 12px; border-left: 4px solid ${isCorrect ? '#10b981' : '#e5e7eb'}; background-color: ${isCorrect ? '#f0fdf4' : '#ffffff'}; color: black;">
                                        <strong style="color: black;">${optionLetter}.</strong> ${optionText}
                                    </div>
                                `;
                    }).join('');

                    const answerHTML = (type === 'questions' && options.includeAnswers) || type === 'answers' ? `
                                <div style="margin-top: 12px; padding: 8px 12px; background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 6px; color: #065f46;">
                                    <strong style="color: #065f46;">Answer: ${question.answer}</strong>
                                </div>
                            ` : '';

                    return `
                                <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: white; color: black;">
                                    <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
                                        <span style="background-color: #3b82f6; color: white; border-radius: 4px; font-weight: 600; font-size: 14px; width: 24px; height: 24px; text-align: center; line-height: 24px; display: inline-block;">${questionNumber}</span>
                                        <div style="flex: 1; color: black; margin-left: 8px;">
                                            <div style="color: black; margin-bottom: 16px;">${questionText}</div>
                                            <div>${optionsHTML}</div>
                                            ${answerHTML}
                                        </div>
                                    </div>
                                </div>
                            `;
                }).join('')}
                        
                        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                            <p>Total Questions: ${selectedQuestions.length}</p>
                        </div>
                    </div>
                `;

                console.log('Simplified HTML for PDF generation:', simplifiedHTML.substring(0, 500));

                // Create temporary element with the simplified content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = simplifiedHTML;

                // Apply essential styling to ensure content is visible in PDF
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '0px';
                tempDiv.style.width = '210mm';
                tempDiv.style.backgroundColor = '#ffffff';
                tempDiv.style.color = '#000000';
                tempDiv.style.padding = '0px';
                tempDiv.style.margin = '0px';
                tempDiv.style.fontFamily = 'Times New Roman, serif';
                tempDiv.style.fontSize = '14px';
                tempDiv.style.lineHeight = '1.6';

                // Ensure all text elements are visible
                const allTextElements = tempDiv.querySelectorAll('*');
                allTextElements.forEach(el => {
                    const element = el as HTMLElement;
                    if (element.style) {
                        if (element.tagName.toLowerCase() === 'div' || element.tagName.toLowerCase() === 'p' || element.tagName.toLowerCase() === 'span') {
                            element.style.color = element.style.color || '#000000';
                            element.style.fontFamily = 'Times New Roman, serif';
                        }
                    }
                });

                document.body.appendChild(tempDiv);

                // Wait for content to be ready (no MathJax needed)
                setTimeout(async () => {
                    try {
                        const opt = {
                            margin: [15, 15, 15, 15],
                            filename: `${type === 'questions' ? 'question-paper' : 'answer-key'}-${Date.now()}.pdf`,
                            image: { type: 'jpeg', quality: 0.95 },
                            html2canvas: {
                                scale: 1.5,
                                useCORS: true,
                                allowTaint: true,
                                backgroundColor: '#ffffff',
                                logging: true,
                                width: tempDiv.scrollWidth || 794,
                                height: tempDiv.scrollHeight || 1123
                            },
                            jsPDF: {
                                unit: 'mm',
                                format: 'a4',
                                orientation: 'portrait'
                            }
                        };

                        console.log('Generating PDF with dimensions:', {
                            width: tempDiv.scrollWidth,
                            height: tempDiv.scrollHeight,
                            contentLength: tempDiv.innerHTML.length
                        });

                        const pdfBlob = await html2pdf().set(opt).from(tempDiv).outputPdf('blob');

                        console.log('PDF generated successfully, size:', pdfBlob.size);
                        document.body.removeChild(tempDiv);

                        if (pdfBlob.size > 0) {
                            resolve(pdfBlob);
                        } else {
                            reject(new Error('PDF blob is empty'));
                        }
                    } catch (error) {
                        console.error('html2pdf error:', error);
                        if (document.body.contains(tempDiv)) {
                            document.body.removeChild(tempDiv);
                        }
                        reject(error);
                    }
                }, 1000); // Reduced wait time since no MathJax

            } catch (error) {
                console.error('Setup error:', error);
                reject(error);
            }
        });
    };

    const handlePreview = async (type: PreviewType) => {
        if (selectedQuestions.length === 0) {
            alert('Please select at least one question.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setPreviewUrl(null);
        setCurrentType(type);
        setDialogTitle(type === 'questions' ? 'Question Paper Preview' : 'Answer Key Preview');
        setDialogOpen(true);

        try {
            console.log('Starting PDF generation...', {
                type,
                questionsCount: selectedQuestions.length,
                firstQuestion: selectedQuestions[0]?.question_text?.substring(0, 100)
            });

            // Generate HTML content first
            const htmlContent = generateHTMLPreview(type);

            // For debugging: Let's first show the HTML content to see if it's working
            console.log('HTML content preview:', htmlContent.substring(0, 1000));

            // Show HTML preview first to debug
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlUrl = URL.createObjectURL(htmlBlob);
            setPreviewUrl(htmlUrl);

            // Try to generate PDF in the background
            setTimeout(async () => {
                try {
                    console.log('Attempting PDF generation...');
                    const pdfBlob = await generatePDFFromHTML(htmlContent, type);

                    if (pdfBlob && pdfBlob.size > 0) {
                        // Replace HTML preview with PDF
                        URL.revokeObjectURL(htmlUrl);
                        const pdfUrl = URL.createObjectURL(pdfBlob);
                        setPreviewUrl(pdfUrl);
                        console.log('PDF generated successfully, size:', pdfBlob.size);
                        setError(null);
                    } else {
                        console.warn('PDF blob is empty, keeping HTML preview');
                        setError('PDF generation produced empty result. Showing HTML preview. Use Ctrl+P to print as PDF.');
                    }
                } catch (pdfError) {
                    console.warn('PDF generation failed:', pdfError);
                    setError('PDF generation failed. Showing HTML preview. Use Ctrl+P to print as PDF.');
                }
            }, 2000);

        } catch (err: unknown) {
            console.error('Error generating preview:', err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate preview: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!previewUrl) return;

        try {
            // Create a temporary link element for download
            const link = document.createElement('a');
            link.href = previewUrl;
            link.download = `${currentType === 'questions' ? 'question-paper' : 'answer-key'}-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading PDF:', err);
            setError('Failed to download PDF. Please try again.');
        }
    };

    const handleDialogChange = (open: boolean) => {
        setDialogOpen(open);
        if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handlePreview('questions')} disabled={isGenerating}>
                        <FileText className="mr-2 h-4 w-4" />
                        Preview PDF
                    </Button>
                    {options.includeAnswers && (
                        <Button
                            onClick={() => handlePreview('answers')}
                            disabled={isGenerating}
                            variant="secondary"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Answer Key
                        </Button>
                    )}
                </div>
            </DialogTrigger>
            <DialogContent
                style={{ width: '800px', maxWidth: '95vw' }}
                className="h-[90vh] flex flex-col bg-white"
            >
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>

                <div className="w-full flex-grow my-4 flex items-center justify-center bg-gray-50 rounded-lg">
                    {isGenerating && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
                            <p className="text-sm text-gray-600">Rendering LaTeX expressions...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-red-500 p-4 rounded-md max-w-md text-center">
                            {error}
                        </div>
                    )}
                    {previewUrl && !isGenerating && !error && (
                        <iframe
                            src={previewUrl}
                            title={dialogTitle}
                            className="w-full h-full border-0 rounded-lg bg-white"
                            style={{ minHeight: '600px' }}
                        />
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleDownload}
                        disabled={!previewUrl || isGenerating || !!error}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PDFPreview;