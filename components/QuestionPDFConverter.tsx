'use client';

import React, { useRef, useState, useEffect } from 'react';
import { pdfConfigToHTML, pdfConfigToAnswerKeyHTML, QuestionToHTMLOptions } from '@/lib/questionToHtmlUtils';
import { htmlToPDF, HTMLToPDFOptions } from '@/lib/htmlToPdfUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Eye, Settings, CheckCircle } from 'lucide-react';

interface QuestionPDFConverterProps {
  config: PDFConfig;
}

export default function QuestionPDFConverter({ config }: QuestionPDFConverterProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  const [htmlOptions, setHtmlOptions] = useState<QuestionToHTMLOptions>({
    includeAnswers: config.options.includeAnswers,
    includeMetadata: true,
    institution: config.institution,
    logo: undefined,
    watermarkOpacity: config.options.watermarkOpacity,
    pageSize: 'a4',
    orientation: 'portrait',
    fontSize: 14,
    lineHeight: 1.6,
    margin: 20
  });

  const [pdfOptions, setPdfOptions] = useState<HTMLToPDFOptions>({
    filename: 'question_paper.pdf',
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 10,
    scale: 2,
    quality: 1
  });

  // Convert logo File to data URL if provided
  useEffect(() => {
    const convertLogo = async () => {
      if (config.options.logo) {
        const logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(config.options.logo!);
        });
        setHtmlOptions(prev => ({ ...prev, logo: logoBase64 }));
      }
    };
    convertLogo();
  }, [config.options.logo]);

  // Generate HTML preview
  const generateHTML = (isAnswerKey = false) => {
    try {
      const html = isAnswerKey 
        ? pdfConfigToAnswerKeyHTML(config, htmlOptions)
        : pdfConfigToHTML(config, htmlOptions);
      setPreviewHTML(html);
      return html;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate HTML');
      return null;
    }
  };

  // Preview HTML
  const handlePreview = (isAnswerKey = false) => {
    setError(null);
    const html = generateHTML(isAnswerKey);
    if (html) {
      setShowPreview(true);
      // Wait for the modal to render, then trigger MathJax
      setTimeout(() => {
        if (elementRef.current && window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([elementRef.current]).catch((error: unknown) => {
            console.error('MathJax preview rendering error:', error);
          });
        }
      }, 100);
    }
  };

  // Convert to PDF
  const handleConvertToPDF = async (isAnswerKey = false) => {
    if (config.selectedQuestions.length === 0) {
      setError('No questions selected');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const html = generateHTML(isAnswerKey);
      if (!html) return;

      // Create temporary container with the HTML
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.backgroundColor = '#ffffff';
      document.body.appendChild(container);

      // Wait for MathJax to load and render LaTeX
      await new Promise<void>((resolve) => {
        const checkMathJax = () => {
          if (window.MathJax && window.MathJax.typesetPromise) {
            // MathJax is loaded, now render the LaTeX
            window.MathJax.typesetPromise([container]).then(() => {
              console.log('MathJax rendering completed');
              resolve();
            }).catch((error: unknown) => {
              console.error('MathJax rendering error:', error);
              resolve(); // Continue anyway
            });
          } else {
            setTimeout(checkMathJax, 100);
          }
        };
        checkMathJax();
      });

      // Additional wait to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Convert to PDF
      await htmlToPDF(container, {
        ...pdfOptions,
        filename: isAnswerKey ? 'answer_key.pdf' : 'question_paper.pdf'
      });

      // Clean up
      document.body.removeChild(container);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert to PDF');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Question Paper PDF Converter</h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Questions</div>
            <div className="text-2xl font-bold text-blue-900">{config.selectedQuestions.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">Institution</div>
            <div className="text-lg font-semibold text-green-900">{config.institution}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">Include Answers</div>
            <div className="text-lg font-semibold text-purple-900">
              {config.options.includeAnswers ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">PDF Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filename">PDF Filename</Label>
                <Input
                  id="filename"
                  value={pdfOptions.filename}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, filename: e.target.value }))}
                  placeholder="question_paper.pdf"
                />
              </div>

              <div>
                <Label htmlFor="pageSize">Page Size</Label>
                <select
                  id="pageSize"
                  value={pdfOptions.pageSize}
                  onChange={(e) => {
                    const value = e.target.value as 'a4' | 'letter' | 'legal';
                    setPdfOptions(prev => ({ ...prev, pageSize: value }));
                    setHtmlOptions(prev => ({ ...prev, pageSize: value }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>

              <div>
                <Label htmlFor="orientation">Orientation</Label>
                <select
                  id="orientation"
                  value={pdfOptions.orientation}
                  onChange={(e) => {
                    const value = e.target.value as 'portrait' | 'landscape';
                    setPdfOptions(prev => ({ ...prev, orientation: value }));
                    setHtmlOptions(prev => ({ ...prev, orientation: value }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <Label htmlFor="fontSize">Font Size (px)</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={htmlOptions.fontSize}
                  onChange={(e) => setHtmlOptions(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                  min="10"
                  max="20"
                />
              </div>

              <div>
                <Label htmlFor="scale">PDF Scale</Label>
                <Input
                  id="scale"
                  type="number"
                  value={pdfOptions.scale}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, scale: Number(e.target.value) }))}
                  min="1"
                  max="4"
                  step="0.5"
                />
              </div>

              <div>
                <Label htmlFor="quality">PDF Quality</Label>
                <Input
                  id="quality"
                  type="number"
                  value={pdfOptions.quality}
                  onChange={(e) => setPdfOptions(prev => ({ ...prev, quality: Number(e.target.value) }))}
                  min="0.1"
                  max="1"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            onClick={() => handlePreview(false)}
            disabled={isConverting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="h-4 w-4" />
            Preview Questions
          </Button>

          <Button
            onClick={() => handleConvertToPDF(false)}
            disabled={isConverting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4" />
            {isConverting ? 'Converting...' : 'Download Questions PDF'}
          </Button>

          {config.options.includeAnswers && (
            <>
              <Button
                onClick={() => handlePreview(true)}
                disabled={isConverting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Eye className="h-4 w-4" />
                Preview Answer Key
              </Button>

              <Button
                onClick={() => handleConvertToPDF(true)}
                disabled={isConverting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                {isConverting ? 'Converting...' : 'Download Answer Key PDF'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* HTML Preview Modal */}
      {showPreview && previewHTML && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">HTML Preview</h3>
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div
                ref={elementRef}
                className="bg-white border border-gray-200 rounded-md p-4"
                dangerouslySetInnerHTML={{ __html: previewHTML }}
                style={{ minHeight: '500px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 