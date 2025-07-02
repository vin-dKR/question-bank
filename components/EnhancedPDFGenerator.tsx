'use client';

import { useState } from 'react';
import { generatePDFFromConfig, generateAnswersPDFFromConfig } from '@/lib/pdfConfigToPdfUtils';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Settings } from 'lucide-react';

export default function EnhancedPDFGenerator({ institution, selectedQuestions, options }: PDFConfig) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    const handleGeneratePDF = async (isAnswerKey = false) => {
        if (selectedQuestions.length === 0) {
            setError('Please select at least one question');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const config = { institution, selectedQuestions, options };

            if (isAnswerKey) {
                await generateAnswersPDFFromConfig(config);
            } else {
                await generatePDFFromConfig(config);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError(error instanceof Error ? error.message : 'Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Enhanced PDF Features
                    </h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>• ✅ Proper LaTeX equation rendering with MathJax</li>
                        <li>• ✅ No PNG conversion - LaTeX stays as vector graphics</li>
                        <li>• ✅ Beautiful HTML formatting with correct styling</li>
                        <li>• ✅ Better typography and layout</li>
                        <li>• ✅ Consistent rendering across browsers</li>
                        <li>• ✅ Support for complex mathematical expressions</li>
                    </ul>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <Button
                    onClick={() => handleGeneratePDF(false)}
                    disabled={isGenerating}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isGenerating ? 'Generating...' : (
                        <>
                            <FileText className="h-4 w-4" />
                            <span>Enhanced PDF</span>
                        </>
                    )}
                </Button>

                {options.includeAnswers && (
                    <Button
                        onClick={() => handleGeneratePDF(true)}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? 'Generating...' : (
                            <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Enhanced Answer PDF</span>
                            </>
                        )}
                    </Button>
                )}

                <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                >
                    <Settings className="h-4 w-4" />
                    {showSettings ? 'Hide' : 'Show'} Features
                </Button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600">
                <p>This enhanced PDF generator uses HTML-to-PDF conversion with proper LaTeX rendering.</p>
                <p>LaTeX equations are rendered as vector graphics, ensuring crisp quality at any zoom level.</p>
            </div>
        </div>
    );
} 
