"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Crop, PageResult, QuestionDraft } from "@/lib/school-test/types";
import { cn } from "@/lib/utils";
import { saveExtractedQuestions } from "@/actions/school-test/saveExtractedQuestions";
import { QuestionCard } from "./QuestionCard";
import { CropEditor } from "./CropEditor";
import { PreviewDialog } from "./PreviewDialog";

type EditablePage = {
    pageNumber: number;
    sourceDataUrl: string;
    sourceWidth: number;
    sourceHeight: number;
    questions: QuestionDraft[];
    crops: Record<string, Crop>;
};

type CropTarget = { pageIndex: number; questionId: string; existing?: Crop };

export function Verifier({
    results,
    fileName,
    onReset,
}: {
    results: PageResult[];
    fileName: string | null;
    onReset: () => void;
}) {
    const router = useRouter();
    const [pages, setPages] = useState<EditablePage[]>(() => results.map(hydrate));
    const [activeIdx, setActiveIdx] = useState(0);
    const [hoverCrop, setHoverCrop] = useState<string | null>(null);
    const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const page = pages[activeIdx];

    const updatePage = useCallback(
        (i: number, update: (p: EditablePage) => EditablePage) => {
            setPages((prev) => prev.map((p, idx) => (idx === i ? update(p) : p)));
        },
        [],
    );

    const updateQuestion = useCallback(
        (i: number, id: string, patch: Partial<QuestionDraft>) => {
            updatePage(i, (p) => ({
                ...p,
                questions: p.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
            }));
        },
        [updatePage],
    );

    const deleteQuestion = useCallback(
        (i: number, id: string) => {
            updatePage(i, (p) => {
                const q = p.questions.find((x) => x.id === id);
                const crops = { ...p.crops };
                if (q) delete crops[q.id];
                return {
                    ...p,
                    questions: p.questions.filter((x) => x.id !== id),
                    crops,
                };
            });
        },
        [updatePage],
    );

    const addQuestion = useCallback(
        (i: number) => {
            updatePage(i, (p) => {
                const nextNo =
                    p.questions.reduce((m, q) => Math.max(m, q.question_number), 0) + 1;
                const newQ: QuestionDraft = {
                    id: `p${p.pageNumber}-new-${Date.now()}`,
                    question_number: nextNo,
                    question_text: "",
                    options: [],
                };
                return { ...p, questions: [...p.questions, newQ] };
            });
        },
        [updatePage],
    );

    const removeCrop = useCallback(
        (i: number, questionId: string) => {
            updatePage(i, (p) => {
                const crops = { ...p.crops };
                delete crops[questionId];
                return { ...p, crops };
            });
        },
        [updatePage],
    );

    const saveCrop = useCallback(
        (i: number, questionId: string, bbox: [number, number, number, number], dataUrl: string) => {
            updatePage(i, (p) => {
                const q = p.questions.find((x) => x.id === questionId);
                const crop: Crop = {
                    id: `${questionId}-crop`,
                    q_no: q?.question_number ?? 0,
                    bbox,
                    dataUrl,
                };
                return { ...p, crops: { ...p.crops, [questionId]: crop } };
            });
            setCropTarget(null);
        },
        [updatePage],
    );

    const confirmCreateTest = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const payload = pages.flatMap((p) =>
                p.questions.map((q) => {
                    const crop = p.crops[q.id];
                    return {
                        question_number: q.question_number,
                        question_text: q.question_text,
                        options: q.options,
                        diagram_data_url: crop ? crop.dataUrl : null,
                    };
                }),
            );

            const result = await saveExtractedQuestions(payload);
            if (!result.success) {
                toast.error(result.error);
                setIsSaving(false);
                return;
            }

            // Match the shape TestCreator reads from sessionStorage (see
            // components/examination/TestCreator.tsx and the
            // QuestionForCreateTestData type in types/index.d.ts).
            const sessionPayload = result.questions.map((q, i) => ({
                id: q.id,
                question_text: q.question_text,
                question_number: q.question_number || i + 1,
                options: q.options,
                answer: q.answer,
                question_image: q.question_image ?? null,
                marks: q.marks,
                negativeMark: 0,
            }));
            sessionStorage.setItem(
                "selectedQuestionsForTest",
                JSON.stringify(sessionPayload),
            );
            router.push("/examination/create");
        } catch (e) {
            toast.error((e as Error).message || "Failed to save.");
            setIsSaving(false);
        }
    }, [isSaving, pages, router]);

    const totalQuestions = useMemo(
        () => pages.reduce((sum, p) => sum + p.questions.length, 0),
        [pages],
    );

    if (!page) return null;

    return (
        <div className="flex h-full flex-col">
            <TopBar
                fileName={fileName}
                pages={pages.length}
                totalQuestions={totalQuestions}
                onReset={onReset}
                onPreview={() => setPreviewOpen(true)}
            />

            {pages.length > 1 && (
                <PageTabs
                    count={pages.length}
                    active={activeIdx}
                    onChange={setActiveIdx}
                    perPageQuestions={pages.map((p) => p.questions.length)}
                />
            )}

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <SourcePane
                    page={page}
                    hoverCrop={hoverCrop}
                    onAdjustCrop={(questionId) =>
                        setCropTarget({
                            pageIndex: activeIdx,
                            questionId,
                            existing: page.crops[questionId],
                        })
                    }
                />
                <div className="min-h-0 overflow-y-auto pr-1">
                    <div className="space-y-4">
                        {page.questions.map((q) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                crop={page.crops[q.id]}
                                onChange={(patch) => updateQuestion(activeIdx, q.id, patch)}
                                onDelete={() => deleteQuestion(activeIdx, q.id)}
                                onEditCrop={() =>
                                    setCropTarget({
                                        pageIndex: activeIdx,
                                        questionId: q.id,
                                        existing: page.crops[q.id],
                                    })
                                }
                                onRemoveCrop={() => removeCrop(activeIdx, q.id)}
                                onHoverCrop={(hover) => setHoverCrop(hover ? q.id : null)}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={() => addQuestion(activeIdx)}
                            className="flex w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-4 text-[13px] font-medium text-neutral-500 transition-colors hover:border-neutral-500 hover:text-neutral-900"
                        >
                            Add question
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-neutral-200 bg-white px-6 py-3 text-[11px] text-neutral-400">
                Questions are saved to the question bank when you press Preview Test &rarr; Create test.
            </div>

            {cropTarget && (
                <CropEditor
                    page={pages[cropTarget.pageIndex]}
                    existing={cropTarget.existing}
                    onCancel={() => setCropTarget(null)}
                    onSave={(bbox, dataUrl) =>
                        saveCrop(cropTarget.pageIndex, cropTarget.questionId, bbox, dataUrl)
                    }
                />
            )}

            {previewOpen && (
                <PreviewDialog
                    pages={pages.map((p) => ({
                        pageNumber: p.pageNumber,
                        questions: p.questions,
                        crops: p.crops,
                    }))}
                    isSaving={isSaving}
                    onCancel={() => {
                        if (!isSaving) setPreviewOpen(false);
                    }}
                    onConfirm={confirmCreateTest}
                />
            )}
        </div>
    );
}

function hydrate(r: PageResult): EditablePage {
    const cropMap: Record<string, Crop> = {};
    for (const c of r.crops) {
        const match = r.questions.find((q) => q.question_number === c.q_no);
        if (match) cropMap[match.id] = c;
    }
    return {
        pageNumber: r.pageNumber,
        sourceDataUrl: r.sourceDataUrl,
        sourceWidth: r.sourceWidth,
        sourceHeight: r.sourceHeight,
        questions: r.questions,
        crops: cropMap,
    };
}

function TopBar({
    fileName,
    pages,
    totalQuestions,
    onReset,
    onPreview,
}: {
    fileName: string | null;
    pages: number;
    totalQuestions: number;
    onReset: () => void;
    onPreview: () => void;
}) {
    return (
        <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                    Review
                </p>
                <h1 className="mt-0.5 truncate text-[17px] font-semibold tracking-tight text-neutral-900">
                    {fileName ?? "Untitled"}
                </h1>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                    {pages} {pages === 1 ? "page" : "pages"} · {totalQuestions} questions
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onReset}
                    className="rounded-lg px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                    Start over
                </button>
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={totalQuestions === 0}
                    className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-300"
                >
                    Preview Test
                </button>
            </div>
        </div>
    );
}

function PageTabs({
    count,
    active,
    onChange,
    perPageQuestions,
}: {
    count: number;
    active: number;
    onChange: (i: number) => void;
    perPageQuestions: number[];
}) {
    return (
        <div className="flex gap-1 border-b border-neutral-200 bg-white px-6 pb-2 pt-1">
            {Array.from({ length: count }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onChange(i)}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                        i === active
                            ? "bg-neutral-900 text-white"
                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                    )}
                >
                    Page {i + 1}
                    <span className="ml-1.5 text-[10px] opacity-60">{perPageQuestions[i]}</span>
                </button>
            ))}
        </div>
    );
}

function SourcePane({
    page,
    hoverCrop,
    onAdjustCrop,
}: {
    page: EditablePage;
    hoverCrop: string | null;
    onAdjustCrop: (questionId: string) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const ro = new ResizeObserver(() => {
            setContainerSize({ w: el.clientWidth, h: el.clientHeight });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const cropEntries = Object.entries(page.crops);

    const scale = useMemo(() => {
        if (containerSize.w === 0 || containerSize.h === 0 || page.sourceWidth === 0) return 1;
        return Math.min(containerSize.w / page.sourceWidth, containerSize.h / page.sourceHeight);
    }, [containerSize, page.sourceWidth, page.sourceHeight]);

    const displayW = page.sourceWidth * scale;
    const displayH = page.sourceHeight * scale;

    return (
        <div
            ref={containerRef}
            className="relative flex min-h-0 items-start justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-4"
        >
            <div
                className="relative"
                style={{ width: displayW || "auto", height: displayH || "auto" }}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={page.sourceDataUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="block h-full w-full select-none"
                    draggable={false}
                />
                {cropEntries.map(([questionId, crop]) => {
                    const [x, y, w, h] = crop.bbox;
                    const left = (x / page.sourceWidth) * 100;
                    const top = (y / page.sourceHeight) * 100;
                    const width = (w / page.sourceWidth) * 100;
                    const height = (h / page.sourceHeight) * 100;
                    const isHovered = hoverCrop === questionId;
                    return (
                        <motion.button
                            key={questionId}
                            type="button"
                            onClick={() => onAdjustCrop(questionId)}
                            className={cn(
                                "absolute rounded-[2px] border transition-colors",
                                isHovered
                                    ? "border-neutral-900 bg-neutral-900/5"
                                    : "border-neutral-500/60 hover:border-neutral-900",
                            )}
                            style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                        >
                            <span className="absolute -top-5 left-0 rounded bg-neutral-900 px-1.5 py-[2px] text-[10px] font-medium text-white">
                                Q{crop.q_no}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
