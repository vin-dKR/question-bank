'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

interface PDFActionButtonsProps {
    onGeneratePDF: () => void;
    onPreviewAnswer: () => void;
    isGenerating: "question" | "answer" | null;
    disabled: {
        pdf: boolean;
        answer: boolean;
    };
    className?: string;
}

const PDFActionButtons = memo(({ 
    onGeneratePDF, 
    onPreviewAnswer, 
    isGenerating, 
    disabled, 
    className 
}: PDFActionButtonsProps) => {
    const buttonClasses = {
        pdf: clsx(
            "bg-indigo-600 hover:bg-indigo-600 text-white px-4 py-1 text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed border border-black/20", 
            className
        ),
        answer: clsx(
            "bg-green-600 hover:bg-green-700 text-white px-4 py-2 whitespace-nowrap text-sm sm:text-base disabled:bg-slate-400 disabled:cursor-not-allowed border border-black/20", 
            className
        )
    };

    return (
        <div className="flex gap-2 justify-end">
            <Button
                size="sm"
                onClick={onGeneratePDF}
                disabled={disabled.pdf}
                className={buttonClasses.pdf}
            >
                {isGenerating === "question" ? "Generating..." : "Generate PDF"}
            </Button>
            <Button
                size="sm"
                onClick={onPreviewAnswer}
                disabled={disabled.answer}
                className={buttonClasses.answer}
            >
                {isGenerating === "answer" ? "Generating..." : "Preview Answers"}
            </Button>
        </div>
    );
});

PDFActionButtons.displayName = 'PDFActionButtons';

export default PDFActionButtons;
