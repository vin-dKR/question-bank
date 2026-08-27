"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import type { Crop, PageResult, QuestionDraft } from "@/lib/school-test/types";
import { cn } from "@/lib/utils";
import { saveExtractedQuestions } from "@/actions/school-test/saveExtractedQuestions";
import { cleanCropRegion } from "@/actions/school-test/cleanCropRegion";
import { QuestionCard } from "./QuestionCard";
import { CropEditor } from "./CropEditor";
import { TouchUpEditor } from "./TouchUpEditor";
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
    /** Question id currently being whitened, so only its button shows progress. */
    const [cleaningId, setCleaningId] = useState<string | null>(null);
    /** Open touch-up session. */
    const [touchUp, setTouchUp] = useState<{
        pageIndex: number;
        questionId: string;
        cleaned: string;
        original: string;
    } | null>(null);
    /**
     * What the brush restores from, keyed by question: the crop levelled and
     * sharpened but with separation skipped, so a restored patch shows the text
     * on white paper. Restoring from the raw crop instead paints the original
     * paper cast back in as a coloured smear.
     */
    const [restoreSource, setRestoreSource] = useState<Record<string, string>>({});
    /**
     * Off by default: the page is drawn large enough to read, and the pane
     * scrolls. Fitting the whole page in makes the text too small to check
     * against the extracted questions, which is what this screen is for.
     */
    const [fitPage, setFitPage] = useState(false);
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

    /**
     * Whiten the paper behind one diagram. The page is sent rather than the crop
     * so the estimator has real paper to measure — see cleanCropRegion.
     */
    const cleanCrop = useCallback(
        async (i: number, questionId: string) => {
            setCleaningId(questionId);
            const toastId = toast.loading("Whitening the paper…");
            try {
                const page = pages[i];
                const crop = page?.crops?.[questionId];
                if (!page?.sourceDataUrl || !crop?.bbox) {
                    toast.error("The source page is not available for this crop.", { id: toastId });
                    return;
                }

                const res = await cleanCropRegion({
                    pageDataUrl: page.sourceDataUrl,
                    bbox: crop.bbox,
                });
                if (!res.success) {
                    toast.error(res.error, { id: toastId });
                    return;
                }

                // Only the picture changes; the bbox is untouched, so the overlay
                // on the page preview stays exactly where it was.
                updatePage(i, (p) => ({
                    ...p,
                    crops: {
                        ...p.crops,
                        [questionId]: { ...p.crops[questionId], dataUrl: res.dataUrl },
                    },
                }));

                setRestoreSource((prev) => ({ ...prev, [questionId]: res.restoreDataUrl }));
                toast.success("Background cleaned.", { id: toastId });
            } catch (e) {
                toast.error((e as Error).message || "Could not clean the diagram.", { id: toastId });
            } finally {
                setCleaningId(null);
            }
        },
        [pages, updatePage],
    );

    const confirmCreateTest = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            // Per-page payload — baseImage is uploaded once per page and
            // reused across every question, with the crop bbox sitting in
            // baseImage's pixel coord system so the create-test editor can
            // re-crop later without needing the original PDF.
            const payload = pages.map((p) => ({
                pageNumber: p.pageNumber,
                baseImageDataUrl: p.sourceDataUrl,
                sourceWidth: p.sourceWidth,
                sourceHeight: p.sourceHeight,
                sourceFileName: fileName,
                questions: p.questions.map((q) => {
                    const crop = p.crops[q.id];
                    return {
                        question_number: q.question_number,
                        question_text: q.question_text,
                        options: q.options,
                        diagram_data_url: crop ? crop.dataUrl : null,
                        crop_bbox: crop ? crop.bbox : null,
                    };
                }),
            }));

            const result = await saveExtractedQuestions(payload);
            if (!result.success) {
                toast.error(result.error);
                setIsSaving(false);
                return;
            }

            // Shape TestCreator reads from sessionStorage. Extra school-test
            // fields (base_image / crop_bbox / source dims / source flag)
            // travel alongside so the create-test QuestionCard can show and
            // re-crop the original page region.
            const sessionPayload = result.questions.map((q, i) => ({
                id: q.id,
                question_text: q.question_text,
                question_number: q.question_number || i + 1,
                options: q.options,
                answer: q.answer,
                question_image: q.question_image ?? null,
                marks: q.marks,
                negativeMark: 0,
                source: "school-test" as const,
                base_image: q.base_image ?? null,
                crop_bbox: q.crop_bbox ?? null,
                source_width: q.source_width ?? null,
                source_height: q.source_height ?? null,
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
    }, [isSaving, pages, fileName, router]);

    const totalQuestions = useMemo(
        () => pages.reduce((sum, p) => sum + p.questions.length, 0),
        [pages],
    );

    if (!page) return null;

    return (
        <div className="flex min-h-full flex-col lg:h-full">
            <TopBar
                fileName={fileName}
                pages={pages.length}
                totalQuestions={totalQuestions}
                fitPage={fitPage}
                onToggleFit={() => setFitPage((v) => !v)}
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

            <div className="grid grid-cols-1 gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6 lg:px-6 lg:py-6">
                <div className="order-2 lg:order-none lg:min-h-0">
                    <SourcePane
                        page={page}
                        hoverCrop={hoverCrop}
                        fitPage={fitPage}
                        onAdjustCrop={(questionId) =>
                            setCropTarget({
                                pageIndex: activeIdx,
                                questionId,
                                existing: page.crops[questionId],
                            })
                        }
                    />
                </div>
                <div className="order-1 lg:order-none lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                                    Extracted questions
                                </h2>
                                <p className="mt-0.5 text-xs text-zinc-500">
                                    Page {page.pageNumber} · {page.questions.length} question{page.questions.length === 1 ? "" : "s"}
                                </p>
                            </div>
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-indigo-50 px-2 text-xs font-semibold text-indigo-700">
                                {page.questions.length}
                            </span>
                        </div>
                        {page.questions.length > 0 ? (
                            page.questions.map((q) => (
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
                                    onCleanCrop={
                                        page.sourceDataUrl
                                            ? () => cleanCrop(activeIdx, q.id)
                                            : undefined
                                    }
                                    onTouchUp={() => {
                                        const c = page.crops[q.id];
                                        if (!c) return;
                                        setTouchUp({
                                            pageIndex: activeIdx,
                                            questionId: q.id,
                                            cleaned: c.dataUrl,
                                            // Falls back to the current image when the
                                            // crop was never cleaned; Restore then just
                                            // undoes brushwork.
                                            original: restoreSource[q.id] ?? c.dataUrl,
                                        });
                                    }}
                                    isCleaning={cleaningId === q.id}
                                    onHoverCrop={(hover) => setHoverCrop(hover ? q.id : null)}
                                />
                            ))
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center">
                                <p className="text-sm font-medium text-zinc-900">
                                    No extracted questions on Page {page.pageNumber}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                    You can switch pages or add one manually.
                                </p>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => addQuestion(activeIdx)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-4 py-3.5 text-[13px] font-medium text-zinc-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                            Add question
                        </button>
                    </div>
                </div>
            </div>

            <div className="border-t border-black/5 bg-white px-4 py-3 text-[11px] text-zinc-400 sm:px-6">
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

            {touchUp && (
                <TouchUpEditor
                    cleanedDataUrl={touchUp.cleaned}
                    originalDataUrl={touchUp.original}
                    onCancel={() => setTouchUp(null)}
                    onSave={(dataUrl) => {
                        updatePage(touchUp.pageIndex, (p) => ({
                            ...p,
                            crops: {
                                ...p.crops,
                                [touchUp.questionId]: {
                                    ...p.crops[touchUp.questionId],
                                    dataUrl,
                                },
                            },
                        }));
                        setTouchUp(null);
                    }}
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
    fitPage,
    onToggleFit,
    onReset,
    onPreview,
}: {
    fileName: string | null;
    pages: number;
    totalQuestions: number;
    fitPage: boolean;
    onToggleFit: () => void;
    onReset: () => void;
    onPreview: () => void;
}) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-black/5 bg-white px-4 py-3 sm:items-center sm:px-6 sm:py-4">
            <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-700">
                    Review
                </div>
                <h1 className="mt-1 truncate text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
                    {fileName ?? "Untitled"}
                </h1>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-700">{pages}</span> {pages === 1 ? "page" : "pages"} · <span className="font-medium text-zinc-700">{totalQuestions}</span> questions
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onToggleFit}
                    title={
                        fitPage
                            ? "Show the page large enough to read"
                            : "Shrink the page until all of it is visible"
                    }
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-[12px] font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                >
                    {fitPage ? (
                        <Maximize2 className="h-3.5 w-3.5" />
                    ) : (
                        <Minimize2 className="h-3.5 w-3.5" />
                    )}
                    {fitPage ? "Actual size" : "Fit to screen"}
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="h-9 rounded-lg px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                    Start over
                </button>
                <button
                    type="button"
                    onClick={onPreview}
                    disabled={totalQuestions === 0}
                    className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400"
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
        <div className="flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-4 pb-2 pt-1.5 sm:px-6">
            {Array.from({ length: count }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onChange(i)}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                        i === active
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                >
                    Page {i + 1}
                    <span className={cn(
                        "ml-1.5 text-[10px] font-mono",
                        i === active ? "opacity-70" : "opacity-50"
                    )}>{perPageQuestions[i]}</span>
                </button>
            ))}
        </div>
    );
}

function SourcePane({
    page,
    hoverCrop,
    fitPage,
    onAdjustCrop,
}: {
    page: EditablePage;
    hoverCrop: string | null;
    /** Shrink the page until all of it is visible, instead of scrolling. */
    fitPage: boolean;
    onAdjustCrop: (questionId: string) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

    // Width only. The container's height comes from its content on some
    // breakpoints, so reading it back to size that same content is circular; the
    // width comes from the grid column and is independent of what we draw.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
        ro.observe(el);
        setContainerWidth(el.clientWidth);
        return () => ro.disconnect();
    }, []);

    // The height budget comes from the viewport, which nothing here can change —
    // so there is no loop to fall into.
    useEffect(() => {
        const read = () => setViewportHeight(window.innerHeight);
        read();
        window.addEventListener("resize", read);
        return () => window.removeEventListener("resize", read);
    }, []);

    const cropEntries = Object.entries(page.crops);

    const scale = useMemo(() => {
        // 0, not 1. The previous fallback was 1 — natural size — so until the
        // observer fired the page rendered at full camera resolution inside a
        // container that clips, and a 1200x1600 photo showed only its top-left
        // corner. 0 defers to the aspect-ratio box below, which already fits.
        if (!containerWidth || !page.sourceWidth || !page.sourceHeight) return 0;

        // Fill the column, never enlarging past the source's own resolution.
        // The pane scrolls, so a tall page stays readable.
        const byWidth = Math.min(containerWidth / page.sourceWidth, 1);
        if (!fitPage) return byWidth;

        // Fitting: also bound by the viewport, which nothing here can change.
        const heightBudget = (viewportHeight || 800) * 0.62;
        return Math.min(byWidth, heightBudget / page.sourceHeight);
    }, [containerWidth, viewportHeight, fitPage, page.sourceWidth, page.sourceHeight]);

    const displayW = page.sourceWidth * scale;
    const displayH = page.sourceHeight * scale;

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex items-start justify-center rounded-xl border border-black/5 bg-white p-3 shadow-xs lg:p-4",
                // Scrolling only matters when the page is drawn larger than the
                // pane; fitted, there is nothing to scroll to.
                fitPage ? "overflow-hidden" : "max-h-[72vh] overflow-auto",
            )}
        >
            <div
                className="relative"
                style={{
                    // Hold the page's ratio before the measurement lands, so the
                    // pane does not jump from full-bleed to fitted on first paint.
                    width: displayW || "100%",
                    height: displayH || undefined,
                    aspectRatio: displayH ? undefined : `${page.sourceWidth} / ${page.sourceHeight}`,
                }}
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
                                "absolute rounded-[3px] border-2 transition-colors",
                                isHovered
                                    ? "border-indigo-600 bg-indigo-500/10"
                                    : "border-indigo-400/70 hover:border-indigo-600",
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
                            <span className="absolute -top-5 left-0 rounded-md bg-indigo-600 px-1.5 py-[2px] text-[10px] font-semibold text-white shadow-sm">
                                Q{crop.q_no}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
