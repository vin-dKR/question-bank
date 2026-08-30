"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Maximize2, MoveHorizontal, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import type { Crop, PageResult, QuestionDraft } from "@/lib/school-test/types";
import { cn } from "@/lib/utils";
import { saveExtractedQuestions } from "@/actions/school-test/saveExtractedQuestions";
import { cleanCropRegion } from "@/actions/school-test/cleanCropRegion";
import { errorText } from "@/lib/errorText";
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
    /** Open touch-up session. */
    const [touchUp, setTouchUp] = useState<{
        pageIndex: number;
        questionId: string;
        cleaned: string;
        original: string;
    } | null>(null);
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
        async (
            i: number,
            questionId: string,
            bbox: [number, number, number, number],
        ) => {
            const toastId = toast.loading("Cleaning the adjusted crop…");
            try {
                const page = pages[i];
                if (!page?.sourceDataUrl) {
                    toast.error("The source page is not available for this crop.", {
                        id: toastId,
                    });
                    return;
                }

                const result = await cleanCropRegion({
                    pageDataUrl: page.sourceDataUrl,
                    bbox,
                });
                if (!result.success) {
                    toast.error(errorText(result.error, "Could not clean the diagram."), { id: toastId });
                    return;
                }

                updatePage(i, (p) => ({
                    ...p,
                    crops: {
                        ...p.crops,
                        [questionId]: {
                            id: `${questionId}-crop`,
                            q_no: p.questions.find((q) => q.id === questionId)?.question_number ?? 0,
                            bbox,
                            dataUrl: result.dataUrl,
                            restoreDataUrl: result.restoreDataUrl,
                        },
                    },
                }));

                setCropTarget(null);
                toast.success("Background cleaned.", { id: toastId });
            } catch (e) {
                toast.error(errorText(e, "Could not clean the diagram."), { id: toastId });
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
                toast.error(errorText(result.error, "Could not save the questions."));
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
        <div className="flex flex-col lg:h-full lg:min-h-0">
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

            <div className="grid grid-cols-1 gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 lg:min-h-0 lg:flex-1 lg:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-6 lg:px-6 lg:py-6">
                <div className="order-2 lg:order-none lg:h-full lg:min-h-0">
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
                                    onTouchUp={() => {
                                        const crop = page.crops[q.id];
                                        if (!crop) return;
                                        setTouchUp({
                                            pageIndex: activeIdx,
                                            questionId: q.id,
                                            cleaned: crop.dataUrl,
                                            original: crop.restoreDataUrl ?? crop.dataUrl,
                                        });
                                    }}
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
                    onSave={(bbox) => {
                        void saveCrop(cropTarget.pageIndex, cropTarget.questionId, bbox);
                    }}
                />
            )}

            {touchUp && (
                <TouchUpEditor
                    cleanedDataUrl={touchUp.cleaned}
                    originalDataUrl={touchUp.original}
                    onCancel={() => setTouchUp(null)}
                    onSave={(dataUrl) => {
                        updatePage(touchUp.pageIndex, (current) => ({
                            ...current,
                            crops: {
                                ...current.crops,
                                [touchUp.questionId]: {
                                    ...current.crops[touchUp.questionId],
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

// The viewer has two base views:
//   • "fit"   → the whole page is visible at once, no scrolling.
//   • "width" → the page fills the pane width; scroll vertically to read down.
// Zoom in/out switches to a "custom" scale. All scales are absolute multipliers
// of the page's native pixels (1 = 100%), independent of the container height,
// so the layout can never feed back into itself.
const ZOOM_STEP = 1.25;
const MAX_SCALE = 4;
// Breathing room (px) subtracted from the measured viewport when computing the
// fit scale, so a fitted page doesn't sit flush against the scroll edges (and
// so "Fit" doesn't itself trip the scroll layer's scrollbar).
const FIT_PADDING = 24;

type ViewMode = "fit" | "width" | "custom";

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
    const [mode, setMode] = useState<ViewMode>("fit");
    const [customScale, setCustomScale] = useState(1);

    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;
        const ro = new ResizeObserver((entries) => {
            const box = entries[0]?.contentRect;
            if (box) setContainerSize({ w: box.width, h: box.height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // New page → back to "fit" so the whole image is visible by default.
    useEffect(() => {
        setMode("fit");
        setCustomScale(1);
    }, [page.pageNumber]);

    const cropEntries = Object.entries(page.crops);

    // Scale that makes the whole page fit inside the pane (both axes) → no scroll.
    // FIT_PADDING keeps the fitted page off the scroll edges; capped at 1 so a
    // small source isn't upscaled past its native pixels.
    const fitScale = useMemo(() => {
        const availW = containerSize.w - FIT_PADDING;
        const availH = containerSize.h - FIT_PADDING;
        if (availW <= 0 || availH <= 0 || !page.sourceWidth || !page.sourceHeight) return 1;
        return Math.min(1, availW / page.sourceWidth, availH / page.sourceHeight);
    }, [containerSize, page.sourceWidth, page.sourceHeight]);

    // Scale that makes the page fill the pane width. Depends only on the pane
    // width (always stable), so it never feeds back through the height.
    const widthScale = useMemo(() => {
        const availW = containerSize.w - FIT_PADDING;
        if (availW <= 0 || !page.sourceWidth) return 1;
        return availW / page.sourceWidth;
    }, [containerSize.w, page.sourceWidth]);

    // Until the container has been measured we don't know the fit scale; render
    // nothing sized (avoids a full-native-size flash that would balloon the page
    // height on first paint).
    const measured = containerSize.w > 0 && containerSize.h > 0;

    // You can never zoom out past "fit" (whole page) or in past MAX_SCALE.
    const minScale = fitScale;
    const maxScale = Math.max(fitScale, MAX_SCALE);
    const clampScale = (s: number) => Math.min(maxScale, Math.max(minScale, s));

    const scale = mode === "width" ? widthScale : mode === "custom" ? customScale : fitScale;
    const displayW = page.sourceWidth * scale;
    const displayH = page.sourceHeight * scale;
    const percent = Math.round(scale * 100);

    const zoomTo = (next: number) => {
        setCustomScale(clampScale(next));
        setMode("custom");
    };

    const isFit = mode === "fit";
    const isWidth = mode === "width";
    const canZoomOut = scale > minScale + 0.001;
    const canZoomIn = scale < maxScale - 0.001;

    return (
        <div className="relative flex min-h-0 flex-col rounded-xl border border-black/5 bg-white shadow-xs lg:h-full">
            <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg border border-black/5 bg-white/90 p-1 shadow-sm backdrop-blur">
                <button
                    type="button"
                    onClick={() => zoomTo(scale / ZOOM_STEP)}
                    disabled={!canZoomOut}
                    aria-label="Zoom out"
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3ch] select-none text-center text-[11px] font-medium tabular-nums text-zinc-500">
                    {percent}%
                </span>
                <button
                    type="button"
                    onClick={() => zoomTo(scale * ZOOM_STEP)}
                    disabled={!canZoomIn}
                    aria-label="Zoom in"
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ZoomIn className="h-4 w-4" />
                </button>
                <div className="mx-0.5 h-4 w-px bg-black/10" />
                <button
                    type="button"
                    onClick={() => setMode("fit")}
                    aria-label="Fit whole page"
                    className={cn(
                        "pointer-events-auto flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors",
                        isFit
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Fit
                </button>
                <button
                    type="button"
                    onClick={() => setMode("width")}
                    aria-label="Fit to width"
                    className={cn(
                        "pointer-events-auto flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors",
                        isWidth
                            ? "bg-indigo-50 text-indigo-700"
                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                    )}
                >
                    <MoveHorizontal className="h-3.5 w-3.5" />
                    Width
                </button>
            </div>

            {/* Measured box: overflow-hidden so its size never changes when the
                inner scrollbar appears — this is what kills the zoom flicker.
                Bounded height so a tall page can't balloon the page height. */}
            <div
                ref={containerRef}
                className="relative h-[70vh] w-full overflow-hidden lg:h-auto lg:min-h-0 lg:flex-1"
            >
                {/* Scroll layer: absolutely fills the bounded box and owns the
                    scrollbars, so content size can never feed back into the
                    measured container height (this is what kills zoom flicker). */}
                <div className="absolute inset-0 overflow-auto">
                    {/* Centers small pages; grows + scrolls for large ones without clipping. */}
                    <div className="flex min-h-full min-w-full items-center justify-center p-3 lg:p-4">
                        <div
                            className="relative shrink-0"
                            style={{
                                width: measured ? displayW : "auto",
                                height: measured ? displayH : "auto",
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
                </div>
            </div>
        </div>
    );
}
