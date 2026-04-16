"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
    onHoverCrop,
}: {
    question: QuestionDraft;
    crop: Crop | undefined;
    onChange: (patch: Partial<QuestionDraft>) => void;
    onDelete: () => void;
    onEditCrop: () => void;
    onRemoveCrop: () => void;
    onHoverCrop: (hover: boolean) => void;
}) {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={() => onHoverCrop(true)}
            onMouseLeave={() => onHoverCrop(false)}
            className="group rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
        >
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                        Question
                    </span>
                    <input
                        type="number"
                        value={question.question_number}
                        onChange={(e) =>
                            onChange({ question_number: Number(e.target.value) || 0 })
                        }
                        className="w-14 rounded-md border border-neutral-200 bg-transparent px-2 py-1 text-[13px] font-semibold text-neutral-900 tabular-nums focus:border-neutral-900 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    <button
                        type="button"
                        onClick={() => setShowPreview((s) => !s)}
                        className="font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                        {showPreview ? "Edit" : "Preview"}
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="font-medium text-neutral-400 underline-offset-4 hover:text-red-500 hover:underline"
                    >
                        Delete
                    </button>
                </div>
            </div>

            {showPreview ? (
                <RenderedBlock value={question.question_text} onEdit={() => setShowPreview(false)} />
            ) : (
                <AutoTextarea
                    value={question.question_text}
                    onChange={(v) => onChange({ question_text: v })}
                    placeholder="Question text"
                />
            )}

            <div className="mt-4 space-y-2">
                {question.options.map((opt, i) =>
                    showPreview ? (
                        <RenderedOption
                            key={i}
                            value={opt}
                            onEdit={() => setShowPreview(false)}
                        />
                    ) : (
                        <OptionRow
                            key={i}
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
                        className="text-[12px] font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                        Add option
                    </button>
                )}
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-3">
                {crop ? (
                    <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={crop.dataUrl}
                            alt={`Q${question.question_number} diagram`}
                            className="max-h-24 rounded border border-neutral-200 bg-white object-contain"
                        />
                        <div className="flex flex-col gap-1 text-[12px]">
                            <span className="font-medium text-neutral-500">Diagram</span>
                            <button
                                type="button"
                                onClick={onEditCrop}
                                className="text-left font-medium text-neutral-700 underline-offset-4 hover:underline"
                            >
                                Adjust crop
                            </button>
                            <button
                                type="button"
                                onClick={onRemoveCrop}
                                className="text-left font-medium text-neutral-400 underline-offset-4 hover:text-red-500 hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onEditCrop}
                        className="text-[12px] font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                        Attach diagram crop
                    </button>
                )}
            </div>
        </motion.div>
    );
}

function OptionRow({
    value,
    onChange,
    onRemove,
}: {
    value: string;
    onChange: (v: string) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex items-start gap-2">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "flex-1 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[13px] text-neutral-900",
                    "focus:border-neutral-900 focus:outline-none",
                )}
            />
            <button
                type="button"
                onClick={onRemove}
                className="px-1 py-1 text-[11px] font-medium text-neutral-300 hover:text-red-500"
                aria-label="Remove option"
            >
                ×
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
            className="w-full resize-y rounded-md border border-neutral-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
    );
}

function RenderedBlock({ value, onEdit }: { value: string; onEdit: () => void }) {
    return (
        <button
            type="button"
            onClick={onEdit}
            title="Click to edit"
            className="block w-full rounded-md border border-transparent bg-neutral-50 px-3 py-2 text-left text-[13px] leading-relaxed text-neutral-900 transition-colors hover:border-neutral-200"
        >
            {value.trim().length > 0 ? (
                renderMixedLatex(value)
            ) : (
                <span className="italic text-neutral-400">Empty question text — click to edit</span>
            )}
        </button>
    );
}

function RenderedOption({ value, onEdit }: { value: string; onEdit: () => void }) {
    return (
        <button
            type="button"
            onClick={onEdit}
            title="Click to edit"
            className="flex w-full items-start rounded-md border border-transparent bg-neutral-50 px-3 py-1.5 text-left text-[13px] leading-relaxed text-neutral-900 transition-colors hover:border-neutral-200"
        >
            {value.trim().length > 0 ? (
                renderMixedLatex(value)
            ) : (
                <span className="italic text-neutral-400">Empty option</span>
            )}
        </button>
    );
}
