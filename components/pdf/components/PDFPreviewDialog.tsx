'use client';

import { memo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PDFPreviewContent from './PDFPreviewContent';

interface PDFPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: () => void;
    previewUrl: string | null;
    error: string | null;
    isMobile: boolean;
    onRetry: () => void;
    title?: string;
}

const PDFPreviewDialog = memo(({ 
    isOpen, 
    onClose, 
    onDownload, 
    previewUrl, 
    error, 
    isMobile, 
    onRetry,
    title = "PDF Preview"
}: PDFPreviewDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2 border border-black/20 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl tracking-3">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                
                <PDFPreviewContent
                    previewUrl={previewUrl}
                    error={error}
                    isMobile={isMobile}
                    onRetry={onRetry}
                    onDownload={onDownload}
                />
                
                <DialogFooter className="sm:justify-between mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {!isMobile && !error && (
                        <Button
                            onClick={onDownload}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            Download PDF
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

PDFPreviewDialog.displayName = 'PDFPreviewDialog';

export default PDFPreviewDialog;
