'use client';

import { memo, useEffect } from 'react';

interface PDFBlobViewerProps {
    htmlContent: string | null;
    className?: string;
}

const PDFBlobViewer = memo(({ htmlContent, className }: PDFBlobViewerProps) => {
    useEffect(() => {
        // Ensure MathJax typesetting runs after render
        if (window.MathJax) {
            window.MathJax.typesetPromise();
        }
    }, []);
    if (!htmlContent) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
                <p className="text-gray-500">Please fill the Test Details or select the Templates.</p>
            </div>
        );
    }

    return (
        <div
            className={`overflow-auto rounded-lg ${className}`}
            style={{ maxHeight: '100%', minHeight: '600px' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
});

PDFBlobViewer.displayName = 'PDFBlobViewer';

export default PDFBlobViewer;
