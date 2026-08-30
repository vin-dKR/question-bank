"use client";

import { useRef } from "react";
import { Braces, Divide, Eye, Radical, Sigma } from "lucide-react";
import { renderMixedLatex } from "@/lib/render-tex";

type QuestionTextEditorProps = {
    id: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
};

type InsertTemplate = {
    label: string;
    title: string;
    before: string;
    after: string;
    placeholder: string;
    icon: React.ReactNode;
};

const templates: InsertTemplate[] = [
    {
        label: "Inline math",
        title: "Insert inline LaTeX",
        before: "\\(",
        after: "\\)",
        placeholder: "x^2 + y^2",
        icon: <Sigma className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
        label: "Display math",
        title: "Insert a display equation",
        before: "\\[",
        after: "\\]",
        placeholder: "E = mc^2",
        icon: <Braces className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
        label: "Fraction",
        title: "Insert a LaTeX fraction",
        before: "\\(\\frac{",
        after: "}{denominator}\\)",
        placeholder: "numerator",
        icon: <Divide className="h-3.5 w-3.5" aria-hidden="true" />,
    },
    {
        label: "Square root",
        title: "Insert a LaTeX square root",
        before: "\\(\\sqrt{",
        after: "}\\)",
        placeholder: "value",
        icon: <Radical className="h-3.5 w-3.5" aria-hidden="true" />,
    },
];

/**
 * A LaTeX-aware rich editor that deliberately keeps Question.question_text as
 * plain text plus the bank's established delimiters. No HTML/editor JSON crosses
 * the storage boundary, so existing list, edit, PDF and slide consumers remain
 * backward compatible.
 */
export default function QuestionTextEditor({
    id,
    value,
    onChange,
    required = false,
}: QuestionTextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insert = (template: InsertTemplate) => {
        const field = textareaRef.current;
        const start = field?.selectionStart ?? value.length;
        const end = field?.selectionEnd ?? value.length;
        const selected = value.slice(start, end) || template.placeholder;
        const next = `${value.slice(0, start)}${template.before}${selected}${template.after}${value.slice(end)}`;
        onChange(next);

        requestAnimationFrame(() => {
            if (!field) return;
            const selectionStart = start + template.before.length;
            field.focus();
            field.setSelectionRange(selectionStart, selectionStart + selected.length);
        });
    };

    return (
        <div className="overflow-hidden rounded-lg border border-black/10 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/40">
            <div
                className="flex flex-wrap items-center gap-1 border-b border-black/5 bg-zinc-50 px-2 py-1.5"
                role="toolbar"
                aria-label="Question formatting tools"
            >
                {templates.map((template) => (
                    <button
                        key={template.label}
                        type="button"
                        title={template.title}
                        aria-label={template.title}
                        onClick={() => insert(template)}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        {template.icon}
                        <span className="hidden sm:inline">{template.label}</span>
                    </button>
                ))}
                <span className="ml-auto hidden items-center gap-1 text-[11px] text-zinc-400 md:inline-flex">
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    Live preview below
                </span>
            </div>

            <textarea
                ref={textareaRef}
                id={id}
                name="question_text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="min-h-32 w-full resize-y bg-white px-3 py-2.5 text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
                placeholder="Type the question. Use the toolbar for LaTeX expressions."
                aria-describedby={`${id}-help ${id}-preview-label`}
                required={required}
            />

            <div className="border-t border-black/5 bg-zinc-50/60 px-3 py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                    <p id={`${id}-preview-label`} className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        Preview
                    </p>
                    <p className="text-[11px] tabular-nums text-zinc-400">{value.length} characters</p>
                </div>
                <div className="min-h-8 text-sm leading-6 text-zinc-800" aria-live="polite">
                    {value.trim() ? renderMixedLatex(value) : (
                        <span className="text-zinc-400">Your formatted question will appear here.</span>
                    )}
                </div>
                <p id={`${id}-help`} className="mt-2 text-[11px] leading-4 text-zinc-500">
                    Math is saved using the question bank&rsquo;s existing LaTeX delimiters, so it remains compatible with lists, editing, PDFs and slides.
                </p>
            </div>
        </div>
    );
}
