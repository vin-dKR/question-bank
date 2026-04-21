"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Crop, QuestionDraft } from "@/lib/school-test/types";
import { renderMixedLatex } from "@/lib/render-tex";
import { X, CheckCircle2, Loader2 } from "lucide-react";

type PreviewPage = {
    pageNumber: number;
    questions: QuestionDraft[];
    crops: Record<string, Crop>;
};

export function PreviewDialog({
    pages,
    isSaving,
    onCancel,
    onConfirm,
}: {
    pages: PreviewPage[];
    isSaving: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSaving) onCancel();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel, isSaving]);

    const totalQuestions = pages.reduce((sum, p) => sum + p.questions.length, 0);
    const totalDiagrams = pages.reduce((sum, p) => sum + Object.keys(p.crops).length, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-2 sm:p-6">
            <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 sm:max-h-[88vh] sm:max-w-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-black/5 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Review & Confirm
                        </div>
                        <h2 className="mt-2 text-lg sm:text-xl font-semibold tracking-tight text-zinc-900">
                            Does this look right?
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                            <span>
                                <span className="font-medium text-zinc-700">{totalQuestions}</span> question{totalQuestions === 1 ? "" : "s"}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span>
                                <span className="font-medium text-zinc-700">{pages.length}</span> page{pages.length === 1 ? "" : "s"}
                            </span>
                            {totalDiagrams > 0 && (
                                <>
                                    <span className="text-zinc-300">·</span>
                                    <span>
                                        <span className="font-medium text-zinc-700">{totalDiagrams}</span> diagram{totalDiagrams === 1 ? "" : "s"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50/60 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="space-y-6">
                        {pages.map((p) => (
                            <div key={p.pageNumber}>
                                {pages.length > 1 && (
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                            Page {p.pageNumber}
                                        </span>
                                        <span className="h-px flex-1 bg-zinc-200" />
                                        <span className="text-[10px] text-zinc-400">
                                            {p.questions.length} question{p.questions.length === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                )}
                                <div className="space-y-2.5">
                                    {p.questions.length === 0 ? (
                                        <p className="rounded-lg border border-dashed border-zinc-200 bg-white px-4 py-6 text-center text-xs text-zinc-400">
                                            No questions on this page.
                                        </p>
                                    ) : (
                                        p.questions.map((q) => (
                                            <PreviewQuestion
                                                key={q.id}
                                                question={q}
                                                crop={p.crops[q.id]}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-2 border-t border-black/5 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                    <p className="text-[11px] text-zinc-500">
                        Saved to the question bank. Editable later on Create Test.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="h-9 rounded-lg px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isSaving || totalQuestions === 0}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:bg-zinc-300"
                        >
                            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {isSaving ? "Saving…" : "Create test"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function PreviewQuestion({ question, crop }: { question: QuestionDraft; crop?: Crop }) {
    return (
        <div className="rounded-xl border border-black/5 bg-white p-4 shadow-xs">
            <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-5 items-center rounded-md bg-indigo-50 px-2 font-mono text-[10px] font-semibold text-indigo-700">
                    Q{question.question_number}
                </span>
                {crop && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                        <span className="h-1 w-1 rounded-full bg-zinc-300" />
                        Diagram attached
                    </span>
                )}
            </div>
            <div className="text-sm leading-relaxed text-zinc-900">
                {question.question_text.trim().length > 0 ? (
                    renderMixedLatex(question.question_text)
                ) : (
                    <span className="italic text-zinc-400">No question text</span>
                )}
            </div>
            {question.options.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {question.options.map((opt, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-sm leading-relaxed text-zinc-700"
                        >
                            <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-zinc-100 font-mono text-[10px] font-medium text-zinc-500">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span className="flex-1 min-w-0">{renderMixedLatex(opt)}</span>
                        </li>
                    ))}
                </ul>
            )}
            {crop && (
                <div className="mt-3 border-t border-black/5 pt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={crop.dataUrl}
                        alt={`Q${question.question_number} diagram`}
                        className="max-h-32 rounded-md border border-black/5 bg-white object-contain"
                    />
                </div>
            )}
        </div>
    );
}
