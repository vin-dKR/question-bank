"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Crop, QuestionDraft } from "@/lib/school-test/types";
import { renderMixedLatex } from "@/lib/render-tex";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-6">
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                            Confirm
                        </p>
                        <h2 className="mt-0.5 text-[18px] font-semibold tracking-tight text-neutral-900">
                            Does this look right?
                        </h2>
                        <p className="mt-1 text-[13px] text-neutral-500">
                            {totalQuestions} question{totalQuestions === 1 ? "" : "s"} across{" "}
                            {pages.length} page{pages.length === 1 ? "" : "s"}
                            {totalDiagrams > 0 ? ` · ${totalDiagrams} diagram${totalDiagrams === 1 ? "" : "s"}` : ""}
                            . They&rsquo;ll be saved to the question bank and loaded into Create Test.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"
                        aria-label="Close"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50 px-6 py-5">
                    <div className="space-y-6">
                        {pages.map((p) => (
                            <div key={p.pageNumber}>
                                {pages.length > 1 && (
                                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                                        Page {p.pageNumber}
                                    </p>
                                )}
                                <div className="space-y-3">
                                    {p.questions.length === 0 ? (
                                        <p className="rounded-lg border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-[12px] text-neutral-400">
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

                <div className="flex items-center justify-between gap-3 border-t border-neutral-200 bg-white px-6 py-4">
                    <p className="text-[11px] text-neutral-400">
                        Once saved, you can edit each question further on the Create Test page.
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="rounded-lg px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isSaving || totalQuestions === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-300"
                        >
                            {isSaving && (
                                <motion.span
                                    className="inline-block h-3 w-3 rounded-full border-[1.5px] border-white border-b-transparent"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                />
                            )}
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
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                    Q{question.question_number}
                </span>
            </div>
            <div className="text-[13px] leading-relaxed text-neutral-900">
                {question.question_text.trim().length > 0 ? (
                    renderMixedLatex(question.question_text)
                ) : (
                    <span className="italic text-neutral-400">No question text</span>
                )}
            </div>
            {question.options.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                    {question.options.map((opt, i) => (
                        <li
                            key={i}
                            className="text-[13px] leading-relaxed text-neutral-800"
                        >
                            {renderMixedLatex(opt)}
                        </li>
                    ))}
                </ul>
            )}
            {crop && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={crop.dataUrl}
                        alt={`Q${question.question_number} diagram`}
                        className="max-h-32 rounded border border-neutral-200 bg-white object-contain"
                    />
                </div>
            )}
        </div>
    );
}
