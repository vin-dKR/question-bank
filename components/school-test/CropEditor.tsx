"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import type { Crop } from "@/lib/school-test/types";
import { cn } from "@/lib/utils";

/*
 * CropEditor
 *
 * Single-tool crop editor: draw / resize / move a rectangle in SOURCE pixel
 * space. Output is `onSave(bbox, dataUrl)` — bbox in source pixel coords,
 * dataUrl a PNG crop of the source image at its native resolution.
 *
 * Interaction model:
 *   - If `existing.bbox` is supplied, the rectangle starts there with all 8
 *     handles visible; otherwise the canvas starts empty and the first
 *     click-drag draws a new rectangle.
 *   - Corners + edge midpoints act as resize handles (cursor-appropriate).
 *   - Dragging the rectangle body moves it.
 *   - Arrow keys nudge the rect by 1 px (Shift = 10 px); Esc cancels.
 */

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type EditablePage = {
    sourceDataUrl: string;
    sourceWidth: number;
    sourceHeight: number;
};

const MIN_RECT = 4;

function normalizeRect(r: Rect): Rect {
    const x = Math.min(r.x, r.x + r.w);
    const y = Math.min(r.y, r.y + r.h);
    return { x, y, w: Math.abs(r.w), h: Math.abs(r.h) };
}

function clampRect(r: Rect, sw: number, sh: number): Rect {
    const x = Math.max(0, Math.min(sw - 1, r.x));
    const y = Math.max(0, Math.min(sh - 1, r.y));
    const w = Math.max(1, Math.min(sw - x, r.w));
    const h = Math.max(1, Math.min(sh - y, r.h));
    return { x, y, w, h };
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = src;
    });
}

export function CropEditor({
    page,
    existing,
    onSave,
    onCancel,
}: {
    page: EditablePage;
    existing?: Crop;
    onSave: (bbox: [number, number, number, number], dataUrl: string) => void;
    onCancel: () => void;
}) {
    const { sourceWidth: sw, sourceHeight: sh, sourceDataUrl } = page;

    const viewportRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const srcImgRef = useRef<HTMLImageElement | null>(null);

    const [imgLoaded, setImgLoaded] = useState(false);
    const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
    /**
     * Off by default: the page renders wide enough to read, and the pane scrolls.
     * That is what you want when placing a crop precisely. On, it shrinks the
     * page until the whole thing is visible, for finding the right question.
     */
    const [fitToScreen, setFitToScreen] = useState(false);
    const canvasAreaRef = useRef<HTMLDivElement>(null);
    const [canvasArea, setCanvasArea] = useState({ w: 0, h: 0 });
    const [rect, setRect] = useState<Rect | null>(() => {
        if (!existing) return null;
        const [x, y, w, h] = existing.bbox;
        return { x, y, w, h };
    });

    // Active pointer drag (one at a time).
    const dragRef = useRef<
        | null
        | { kind: "new"; sx: number; sy: number }
        | { kind: "handle"; handle: Handle; start: Rect; sx: number; sy: number }
        | { kind: "body"; start: Rect; sx: number; sy: number }
    >(null);

    // --- Load source image (full-res, used for the final crop output) -------
    useEffect(() => {
        let cancelled = false;
        setImgLoaded(false);
        loadImage(sourceDataUrl)
            .then((img) => {
                if (cancelled) return;
                srcImgRef.current = img;
                setImgLoaded(true);
            })
            .catch((e) => console.error("[CropEditor] load source:", e));
        return () => {
            cancelled = true;
        };
    }, [sourceDataUrl]);

    // --- Track displayed image size for coord conversion --------------------
    useEffect(() => {
        const img = imgRef.current;
        if (!img) return;
        const measure = () => {
            setDisplaySize({ w: img.clientWidth, h: img.clientHeight });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(img);
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, [imgLoaded]);

    // Size of the scrolling pane, which "fit to screen" measures against. Its
    // height is set by the dialog, not by the image, so reading it is safe.
    useEffect(() => {
        const el = canvasAreaRef.current;
        if (!el) return;
        const measure = () => setCanvasArea({ w: el.clientWidth, h: el.clientHeight });
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    /**
     * Width the page is drawn at. Normally as wide as the pane allows, capped at
     * 960 so a big scan does not become unreadably huge; when fitting, narrow
     * enough that the full height lands inside the pane.
     */
    const stageWidth = useMemo(() => {
        const natural = Math.min(960, canvasArea.w || 960);
        if (!fitToScreen) return natural;
        if (!page.sourceWidth || !page.sourceHeight || !canvasArea.h) return natural;
        // p-4 on the pane, so take the padding off before fitting.
        const budget = canvasArea.h - 32;
        return Math.max(160, Math.min(natural, budget * (page.sourceWidth / page.sourceHeight)));
    }, [fitToScreen, canvasArea, page.sourceWidth, page.sourceHeight]);

    // --- Coord helper -------------------------------------------------------
    const clientToSource = useCallback(
        (clientX: number, clientY: number): Point => {
            const img = imgRef.current;
            if (!img) return { x: 0, y: 0 };
            const b = img.getBoundingClientRect();
            const xi = clientX - b.left;
            const yi = clientY - b.top;
            const x = Math.max(0, Math.min(sw, (xi * sw) / Math.max(1, b.width)));
            const y = Math.max(0, Math.min(sh, (yi * sh) / Math.max(1, b.height)));
            return { x, y };
        },
        [sw, sh],
    );

    const rectToDisplayPct = useCallback(
        (r: Rect) => ({
            left: `${(r.x / sw) * 100}%`,
            top: `${(r.y / sh) * 100}%`,
            width: `${(r.w / sw) * 100}%`,
            height: `${(r.h / sh) * 100}%`,
        }),
        [sw, sh],
    );

    // --- Overlay redraw: dim outside the rectangle + outline ----------------
    useEffect(() => {
        const overlay = overlayRef.current;
        if (!overlay || displaySize.w === 0 || displaySize.h === 0) return;
        if (overlay.width !== displaySize.w) overlay.width = displaySize.w;
        if (overlay.height !== displaySize.h) overlay.height = displaySize.h;
        const ctx = overlay.getContext("2d")!;
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (!rect) return;

        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(0, 0, overlay.width, overlay.height);
        const d = {
            x: (rect.x / sw) * overlay.width,
            y: (rect.y / sh) * overlay.height,
            w: (rect.w / sw) * overlay.width,
            h: (rect.h / sh) * overlay.height,
        };
        ctx.clearRect(d.x, d.y, d.w, d.h);
        ctx.strokeStyle = "rgb(34,197,94)";
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x + 0.5, d.y + 0.5, d.w - 1, d.h - 1);
    }, [rect, displaySize, sw, sh]);

    // --- Keyboard -----------------------------------------------------------
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
                return;
            }
            if (rect) {
                const step = e.shiftKey ? 10 : 1;
                if (e.key === "ArrowLeft") {
                    setRect(clampRect({ ...rect, x: rect.x - step }, sw, sh));
                    e.preventDefault();
                } else if (e.key === "ArrowRight") {
                    setRect(clampRect({ ...rect, x: rect.x + step }, sw, sh));
                    e.preventDefault();
                } else if (e.key === "ArrowUp") {
                    setRect(clampRect({ ...rect, y: rect.y - step }, sw, sh));
                    e.preventDefault();
                } else if (e.key === "ArrowDown") {
                    setRect(clampRect({ ...rect, y: rect.y + step }, sw, sh));
                    e.preventDefault();
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [rect, onCancel, sw, sh]);

    // --- Pointer handlers ---------------------------------------------------
    const onViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Handles + body use their own pointerdown handlers.
        if ((e.target as HTMLElement).dataset.cropHandle) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        const pt = clientToSource(e.clientX, e.clientY);
        dragRef.current = { kind: "new", sx: pt.x, sy: pt.y };
        setRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
    };

    const onViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        const pt = clientToSource(e.clientX, e.clientY);

        if (drag.kind === "new") {
            const x = Math.min(drag.sx, pt.x);
            const y = Math.min(drag.sy, pt.y);
            const w = Math.abs(pt.x - drag.sx);
            const h = Math.abs(pt.y - drag.sy);
            setRect(clampRect({ x, y, w, h }, sw, sh));
            return;
        }
        if (drag.kind === "body") {
            const dx = pt.x - drag.sx;
            const dy = pt.y - drag.sy;
            setRect(
                clampRect(
                    {
                        x: drag.start.x + dx,
                        y: drag.start.y + dy,
                        w: drag.start.w,
                        h: drag.start.h,
                    },
                    sw,
                    sh,
                ),
            );
            return;
        }
        // handle resize
        const dx = pt.x - drag.sx;
        const dy = pt.y - drag.sy;
        const s = drag.start;
        let x = s.x, y = s.y, w = s.w, h = s.h;
        if (drag.handle.includes("w")) {
            x = s.x + dx;
            w = s.w - dx;
        }
        if (drag.handle.includes("e")) {
            w = s.w + dx;
        }
        if (drag.handle.includes("n")) {
            y = s.y + dy;
            h = s.h - dy;
        }
        if (drag.handle.includes("s")) {
            h = s.h + dy;
        }
        if (w < 0) {
            x = x + w;
            w = -w;
        }
        if (h < 0) {
            y = y + h;
            h = -h;
        }
        setRect(clampRect({ x, y, w, h }, sw, sh));
    };

    const onViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        try {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
            // Not captured — safe to ignore.
        }
        const drag = dragRef.current;
        dragRef.current = null;

        if (drag?.kind === "new") {
            // Discard degenerate rects from a stray click.
            if (rect && (rect.w < MIN_RECT || rect.h < MIN_RECT)) {
                setRect(null);
            }
        }
    };

    // --- Handle + body drag starters ---------------------------------------
    const startHandleDrag = (handle: Handle) =>
        (e: React.PointerEvent<HTMLElement>) => {
            if (!rect) return;
            e.stopPropagation();
            viewportRef.current?.setPointerCapture(e.pointerId);
            const pt = clientToSource(e.clientX, e.clientY);
            dragRef.current = {
                kind: "handle",
                handle,
                start: { ...rect },
                sx: pt.x,
                sy: pt.y,
            };
        };

    const startBodyDrag = (e: React.PointerEvent<HTMLElement>) => {
        if (!rect) return;
        e.stopPropagation();
        viewportRef.current?.setPointerCapture(e.pointerId);
        const pt = clientToSource(e.clientX, e.clientY);
        dragRef.current = {
            kind: "body",
            start: { ...rect },
            sx: pt.x,
            sy: pt.y,
        };
    };

    // --- Save ---------------------------------------------------------------
    const hasRect = !!rect && rect.w >= MIN_RECT && rect.h >= MIN_RECT;

    const handleSave = () => {
        const src = srcImgRef.current;
        if (!src || !rect) return;
        const r = clampRect(normalizeRect(rect), sw, sh);
        const bbox: [number, number, number, number] = [
            Math.round(r.x),
            Math.round(r.y),
            Math.round(r.w),
            Math.round(r.h),
        ];
        if (bbox[2] < MIN_RECT || bbox[3] < MIN_RECT) return;
        const out = document.createElement("canvas");
        out.width = bbox[2];
        out.height = bbox[3];
        const ctx = out.getContext("2d")!;
        ctx.drawImage(src, bbox[0], bbox[1], bbox[2], bbox[3], 0, 0, bbox[2], bbox[3]);
        onSave(bbox, out.toDataURL("image/png"));
    };

    const displayRect = useMemo(
        () => (rect ? rectToDisplayPct(rect) : null),
        [rect, rectToDisplayPct],
    );

    const status = rect
        ? "Drag the handles to resize, drag inside to move. Arrow keys nudge (Shift = 10 px)."
        : "Click and drag on the image to draw a rectangle.";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-2 sm:p-6">
            <div className="flex max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-4xl">
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                            Crop
                        </p>
                        <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-neutral-900">
                            Edit the crop region
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFitToScreen((v) => !v)}
                            title={
                                fitToScreen
                                    ? "Show the page large enough to read"
                                    : "Shrink the page until all of it is visible"
                            }
                            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                        >
                            {fitToScreen ? (
                                <Maximize2 className="h-3.5 w-3.5" />
                            ) : (
                                <Minimize2 className="h-3.5 w-3.5" />
                            )}
                            {fitToScreen ? "Actual size" : "Fit to screen"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setRect(null)}
                            disabled={!rect}
                            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                            aria-label="Close"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Canvas area */}
                <div
                    ref={canvasAreaRef}
                    className="relative min-h-0 flex-1 overflow-auto bg-neutral-100 p-4"
                >
                    <div
                        ref={viewportRef}
                        className="relative mx-auto w-full max-w-full select-none touch-none"
                        style={{ maxWidth: stageWidth }}
                        onPointerDown={onViewportPointerDown}
                        onPointerMove={onViewportPointerMove}
                        onPointerUp={onViewportPointerUp}
                        onPointerCancel={onViewportPointerUp}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={sourceDataUrl}
                            alt="Source page"
                            crossOrigin={/^https?:/i.test(sourceDataUrl) ? "anonymous" : undefined}
                            onLoad={() => setImgLoaded(true)}
                            className={cn(
                                "block w-full transition-opacity duration-200",
                                imgLoaded ? "opacity-100" : "opacity-0",
                                !rect ? "cursor-crosshair" : "",
                            )}
                            draggable={false}
                        />
                        <canvas
                            ref={overlayRef}
                            className="pointer-events-none absolute inset-0 h-full w-full"
                        />
                        {imgLoaded && displayRect && (
                            <RectHandlesLayer
                                displayRect={displayRect}
                                onBodyPointerDown={startBodyDrag}
                                onHandlePointerDown={startHandleDrag}
                            />
                        )}
                        {!imgLoaded && (
                            <div className="absolute inset-0 flex min-h-[300px] items-center justify-center rounded-xl bg-neutral-100">
                                <div className="flex flex-col items-center gap-2 text-neutral-500">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-[12px]">Loading source page…</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-5 py-3">
                    <p className="truncate text-[11px] text-neutral-500">{status}</p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg px-3 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!imgLoaded || !hasRect}
                            className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-300"
                        >
                            Save crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RectHandlesLayer({
    displayRect,
    onBodyPointerDown,
    onHandlePointerDown,
}: {
    displayRect: { left: string; top: string; width: string; height: string };
    onBodyPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onHandlePointerDown: (handle: Handle) => (e: React.PointerEvent<HTMLElement>) => void;
}) {
    const handles: Array<{ h: Handle; cursor: string; style: React.CSSProperties }> = [
        { h: "nw", cursor: "nwse-resize", style: { left: 0, top: 0, transform: "translate(-50%, -50%)" } },
        { h: "n", cursor: "ns-resize", style: { left: "50%", top: 0, transform: "translate(-50%, -50%)" } },
        { h: "ne", cursor: "nesw-resize", style: { right: 0, top: 0, transform: "translate(50%, -50%)" } },
        { h: "e", cursor: "ew-resize", style: { right: 0, top: "50%", transform: "translate(50%, -50%)" } },
        { h: "se", cursor: "nwse-resize", style: { right: 0, bottom: 0, transform: "translate(50%, 50%)" } },
        { h: "s", cursor: "ns-resize", style: { left: "50%", bottom: 0, transform: "translate(-50%, 50%)" } },
        { h: "sw", cursor: "nesw-resize", style: { left: 0, bottom: 0, transform: "translate(-50%, 50%)" } },
        { h: "w", cursor: "ew-resize", style: { left: 0, top: "50%", transform: "translate(-50%, -50%)" } },
    ];
    return (
        <div
            data-crop-handle="body"
            className="absolute cursor-move"
            style={displayRect}
            onPointerDown={onBodyPointerDown}
        >
            {handles.map(({ h, cursor, style }) => (
                <div
                    key={h}
                    data-crop-handle={h}
                    onPointerDown={onHandlePointerDown(h)}
                    className="absolute h-3 w-3 rounded-sm border border-neutral-900 bg-white shadow"
                    style={{ ...style, cursor }}
                />
            ))}
        </div>
    );
}
