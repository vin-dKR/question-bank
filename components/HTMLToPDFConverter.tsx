'use client';

import React, { useRef, useState } from 'react';
import { htmlToPDF, htmlStringToPDF, HTMLToPDFOptions } from '@/lib/htmlToPdfUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Globe, Code } from 'lucide-react';

interface HTMLToPDFConverterProps {
  defaultHTML?: string;
}

export default function HTMLToPDFConverter({ defaultHTML = '' }: HTMLToPDFConverterProps) {
  const [htmlContent, setHtmlContent] = useState(defaultHTML);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  
  const [options, setOptions] = useState<HTMLToPDFOptions>({
    filename: 'document.pdf',
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 10,
    scale: 2,
    quality: 1
  });

  const handleElementToPDF = async () => {
    if (!elementRef.current) {
      setError('No element to convert');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      await htmlToPDF(elementRef.current, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert element to PDF');
    } finally {
      setIsConverting(false);
    }
  };

  const handleStringToPDF = async () => {
    if (!htmlContent.trim()) {
      setError('Please enter HTML content');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      await htmlStringToPDF(htmlContent, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert HTML string to PDF');
    } finally {
      setIsConverting(false);
    }
  };

  const handleURLToPDF = async () => {
    if (!htmlContent.trim() || !htmlContent.startsWith('http')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      // For URL conversion, you might want to use the server-side version
      // This is a client-side example that fetches the HTML first
      const response = await fetch(htmlContent);
      const html = await response.text();
      await htmlStringToPDF(html, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert URL to PDF');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">HTML to PDF Converter</h2>
        </div>
        
        <div className="space-y-4">
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={options.filename}
                onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
                placeholder="document.pdf"
              />
            </div>
            
            <div>
              <Label htmlFor="pageSize">Page Size</Label>
              <select
                id="pageSize"
                value={options.pageSize}
                onChange={(e) => setOptions(prev => ({ ...prev, pageSize: e.target.value as 'a4' | 'letter' | 'legal' }))}
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
                value={options.orientation}
                onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'landscape' }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <Label htmlFor="margin">Margin (mm)</Label>
              <Input
                id="margin"
                type="number"
                value={options.margin}
                onChange={(e) => setOptions(prev => ({ ...prev, margin: Number(e.target.value) }))}
                min="0"
                max="50"
              />
            </div>

            <div>
              <Label htmlFor="scale">Scale</Label>
              <Input
                id="scale"
                type="number"
                value={options.scale}
                onChange={(e) => setOptions(prev => ({ ...prev, scale: Number(e.target.value) }))}
                min="1"
                max="4"
                step="0.5"
              />
            </div>

            <div>
              <Label htmlFor="quality">Quality</Label>
              <Input
                id="quality"
                type="number"
                value={options.quality}
                onChange={(e) => setOptions(prev => ({ ...prev, quality: Number(e.target.value) }))}
                min="0.1"
                max="1"
                step="0.1"
              />
            </div>
          </div>

          {/* HTML Content Input */}
          <div>
            <Label htmlFor="htmlContent">HTML Content or URL</Label>
            <textarea
              id="htmlContent"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="Enter HTML content or URL (starting with http:// or https://)"
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-vertical"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleElementToPDF}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Convert Element to PDF
            </Button>

            <Button
              onClick={handleStringToPDF}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Convert HTML String to PDF
            </Button>

            <Button
              onClick={handleURLToPDF}
              disabled={isConverting}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Convert URL to PDF
            </Button>
          </div>

          {isConverting && (
            <div className="text-center text-gray-600">
              Converting to PDF...
            </div>
          )}
        </div>
      </div>

      {/* Preview Element */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Preview Element</h3>
        <div
          ref={elementRef}
          className="border border-gray-200 rounded-md p-4 min-h-[200px] bg-white"
          dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Enter HTML content above to see preview</p>' }}
        />
      </div>
    </div>
  );
} 