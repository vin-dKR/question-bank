'use client';

import { memo } from 'react';

interface PDFBlobViewerProps {
    htmlContent: string | null;
    className?: string;
}

const PDFBlobViewer = memo(({ htmlContent, className }: PDFBlobViewerProps) => {
    if (!htmlContent) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
                <p className="text-gray-500">No preview available</p>
            </div>
        );
    }

    return (
        <div
            className={`overflow-auto bg-white rounded-lg ${className}`}
            style={{ maxHeight: '100%', minHeight: '600px' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
});

PDFBlobViewer.displayName = 'PDFBlobViewer';

export default PDFBlobViewer;
