'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';

interface PDFPreviewContentProps {
    previewUrl: string | null;
    error: string | null;
    isMobile: boolean;
    onRetry: () => void;
    onDownload: () => void;
}
 
const PDFPreviewContent = memo(({ 
    previewUrl, 
    error, 
    isMobile, 
    onRetry, 
    onDownload 
}: PDFPreviewContentProps) => {
    if (error) {
        return (
            <div className="text-red-600 text-center p-4">
                <p className="mb-2">{error}</p>
                <Button
                    onClick={onRetry}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="text-center p-4">
                <p className="mb-4">PDF preview is not supported on mobile devices. Please download the PDF.</p>
                <Button
                    onClick={onDownload}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    Download PDF
                </Button>
            </div>
        );
    }

    if (previewUrl) {
        return (
            <div className="w-full h-[70vh] lg:h-[80vh] border border-gray-200 rounded-md overflow-hidden">
                <iframe src={previewUrl} className="w-full h-full" />
            </div>
        );
    }

    return null;
});

PDFPreviewContent.displayName = 'PDFPreviewContent';

export default PDFPreviewContent;
