'use client';

import { memo, useEffect, useRef } from 'react';

interface PDFBlobViewerProps {
    htmlContent: string | null;
    className?: string;
}

const PDFBlobViewer = memo(({ htmlContent, className }: PDFBlobViewerProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!htmlContent || !containerRef.current) return;

        let cancelled = false;

        const typeset = async () => {
            // Wait for MathJax (loaded via <Script> in examination layout with
            // lazyOnload strategy — may not be ready on first render).
            let attempts = 0;
            while (attempts < 60) {
                if (cancelled) return;
                if (window.MathJax?.typesetPromise) break;
                await new Promise((r) => setTimeout(r, 100));
                attempts++;
            }
            if (cancelled || !containerRef.current || !window.MathJax?.typesetPromise) return;

            try {
                // Clear any previous MathJax typeset state on this subtree, then
                // re-typeset so LaTeX renders on every content update (not just
                // first mount).
                if (window.MathJax.typesetClear) {
                    window.MathJax.typesetClear([containerRef.current]);
                }
                await window.MathJax.typesetPromise([containerRef.current]);
            } catch {
                // swallow — preview degrades to raw \(...\) text
            }
        };

        typeset();

        return () => {
            cancelled = true;
        };
    }, [htmlContent]);

    if (!htmlContent) {
        return (
            <div className={`flex items-center justify-center bg-zinc-50 rounded-lg ${className}`}>
                <p className="text-sm text-zinc-500">Fill in the test details to preview.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`overflow-auto rounded-lg ${className}`}
            style={{ maxHeight: '100%', minHeight: '600px' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
});

PDFBlobViewer.displayName = 'PDFBlobViewer';

export default PDFBlobViewer;
