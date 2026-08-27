"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Pencil, Eye, Trash2, Plus } from "lucide-react";
import type { Crop, QuestionDraft } from "@/lib/school-test/types";
import { renderMixedLatex } from "@/lib/render-tex";
import { cn } from "@/lib/utils";

export function QuestionCard({
    question,
    crop,
    onChange,
    onDelete,
    onEditCrop,
    onRemoveCrop,
    onCleanCrop,
    onTouchUp,
    isCleaning,
    onHoverCrop,
}: {
    question: QuestionDraft;
    crop: Crop | undefined;
    onChange: (patch: Partial<QuestionDraft>) => void;
    onDelete: () => void;
    onEditCrop: () => void;
    onRemoveCrop: () => void;
    /** Omitted when the page image is unavailable, which is what cleaning needs. */
    onCleanCrop?: () => void;
    /** Opens the brush. Available whether or not the crop has been cleaned. */
    onTouchUp?: () => void;
    isCleaning?: boolean;
    onHoverCrop: (hover: boolean) => void;
}) {
    const [showPreview, setShowPreview] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => onHoverCrop(true)}
            onMouseLeave={() => onHoverCrop(false)}
            className="group rounded-xl border border-black/5 bg-white p-4 shadow-xs transition-all hover:border-indigo-100 hover:shadow-sm"
        >
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 items-center rounded-md bg-indigo-50 px-2 font-mono text-[11px] font-semibold text-indigo-700">
                        Q
                    </span>
                    <input
                        type="number"
                        value={question.question_number}
                        onChange={(e) =>
                            onChange({ question_number: Number(e.target.value) || 0 })
                        }
                        className="w-14 h-7 rounded-md border border-black/10 bg-white px-2 text-[13px] font-semibold text-zinc-900 tabular-nums focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setShowPreview((s) => !s)}
                        className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    >
                        {showPreview ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showPreview ? "Edit" : "Preview"}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete question"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {showPreview ? (
                <RenderedBlock value={question.question_text} onEdit={() => setShowPreview(false)} />
            ) : (
                <AutoTextarea
                    value={question.question_text}
                    onChange={(v) => onChange({ question_text: v })}
                    placeholder="Question text — supports LaTeX \(…\)"
                />
            )}

            <div className="mt-3 space-y-1.5">
                {question.options.map((opt, i) =>
                    showPreview ? (
                        <RenderedOption
                            key={i}
                            letter={String.fromCharCode(65 + i)}
                            value={opt}
                            onEdit={() => setShowPreview(false)}
                        />
                    ) : (
                        <OptionRow
                            key={i}
                            letter={String.fromCharCode(65 + i)}
                            value={opt}
                            onChange={(v) => {
                                const next = [...question.options];
                                next[i] = v;
                                onChange({ options: next });
                            }}
                            onRemove={() => {
                                const next = question.options.filter((_, idx) => idx !== i);
                                onChange({ options: next });
                            }}
                        />
                    ),
                )}
                {!showPreview && (
                    <button
                        type="button"
                        onClick={() => {
                            const letter = String.fromCharCode(65 + question.options.length);
                            onChange({ options: [...question.options, `(${letter}) `] });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-500 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors"
                    >
                        <Plus className="h-3 w-3" /> Add option
                    </button>
                )}
            </div>

            <div className="mt-3 border-t border-black/5 pt-3">
                {crop ? (
                    <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={crop.dataUrl}
                            alt={`Q${question.question_number} diagram`}
                            className="max-h-20 rounded-md border border-black/5 bg-white object-contain"
                        />
                        <div className="flex flex-col gap-1 text-[11px]">
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-500">
                                <ImageIcon className="h-3 w-3" />
                                Diagram
                            </span>
                            <button
                                type="button"
                                onClick={onEditCrop}
                                className="text-left font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Adjust crop
                            </button>
                            {onCleanCrop && (
                                <button
                                    type="button"
                                    onClick={onCleanCrop}
                                    disabled={isCleaning}
                                    title="Separate the drawing, whiten the paper and sharpen the ink"
                                    className="text-left font-medium text-indigo-600 hover:text-indigo-700 disabled:text-zinc-400"
                                >
                                    {isCleaning ? "Cleaning…" : "Clean background"}
                                </button>
                            )}
                            {onTouchUp && (
                                <button
                                    type="button"
                                    onClick={onTouchUp}
                                    title="Erase or restore parts of this diagram by hand"
                                    className="text-left font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    Touch up
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onRemoveCrop}
                                className="text-left font-medium text-zinc-400 hover:text-rose-600"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onEditCrop}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                        <ImageIcon className="h-3 w-3" />
                        Attach diagram crop
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function OptionRow({
    letter,
    value,
    onChange,
    onRemove,
}: {
    letter: string;
    value: string;
    onChange: (v: string) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-zinc-100 font-mono text-[11px] font-semibold text-zinc-600">
                {letter}
            </span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "flex-1 h-7 rounded-md border border-black/10 bg-white px-2.5 text-[13px] text-zinc-900",
                    "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition",
                )}
            />
            <button
                type="button"
                onClick={onRemove}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-zinc-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                aria-label="Remove option"
            >
                <Trash2 className="h-3 w-3" />
            </button>
        </div>
    );
}

function AutoTextarea({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition"
        />
    );
}

function RenderedBlock({ value, onEdit }: { value: string; onEdit: () => void }) {
    return (
        <button
            type="button"
            onClick={onEdit}
            title="Click to edit"
            className="block w-full rounded-md border border-transparent bg-zinc-50 px-3 py-2 text-left text-[13px] leading-relaxed text-zinc-900 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40"
        >
            {value.trim().length > 0 ? (
                renderMixedLatex(value)
            ) : (
                <span className="italic text-zinc-400">Empty question text — click to edit</span>
            )}
        </button>
    );
}

function RenderedOption({
    letter,
    value,
    onEdit,
}: {
    letter: string;
    value: string;
    onEdit: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onEdit}
            title="Click to edit"
            className="flex w-full items-start gap-2 rounded-md border border-transparent bg-zinc-50 px-2 py-1.5 text-left text-[13px] leading-relaxed text-zinc-900 transition-colors hover:border-indigo-100 hover:bg-indigo-50/40"
        >
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-white font-mono text-[10px] font-medium text-zinc-500 border border-black/5">
                {letter}
            </span>
            {value.trim().length > 0 ? (
                <span className="flex-1 min-w-0">{renderMixedLatex(value)}</span>
            ) : (
                <span className="italic text-zinc-400">Empty option</span>
            )}
        </button>
    );
}
