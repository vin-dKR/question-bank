"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Crop } from "@/lib/school-test/types";

type Rect = { x: number; y: number; w: number; h: number };

type EditablePage = {
    sourceDataUrl: string;
    sourceWidth: number;
    sourceHeight: number;
};

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
    const frameRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [rect, setRect] = useState<Rect | null>(() => {
        if (!existing) return null;
        const [x, y, w, h] = existing.bbox;
        return { x, y, w, h };
    });
    const [drawing, setDrawing] = useState<{ startX: number; startY: number } | null>(null);

    const toSourceCoords = useCallback(
        (clientX: number, clientY: number) => {
            const img = imgRef.current;
            if (!img) return null;
            const bounds = img.getBoundingClientRect();
            const xInImg = clientX - bounds.left;
            const yInImg = clientY - bounds.top;
            if (xInImg < 0 || yInImg < 0 || xInImg > bounds.width || yInImg > bounds.height) return null;
            const scaleX = page.sourceWidth / bounds.width;
            const scaleY = page.sourceHeight / bounds.height;
            return { x: xInImg * scaleX, y: yInImg * scaleY };
        },
        [page.sourceWidth, page.sourceHeight],
    );

    const onMouseDown = (e: React.MouseEvent) => {
        const pt = toSourceCoords(e.clientX, e.clientY);
        if (!pt) return;
        setDrawing({ startX: pt.x, startY: pt.y });
        setRect({ x: pt.x, y: pt.y, w: 0, h: 0 });
    };

    useEffect(() => {
        if (!drawing) return;
        const handleMove = (e: MouseEvent) => {
            const pt = toSourceCoords(e.clientX, e.clientY);
            if (!pt) return;
            const x = Math.min(drawing.startX, pt.x);
            const y = Math.min(drawing.startY, pt.y);
            const w = Math.abs(pt.x - drawing.startX);
            const h = Math.abs(pt.y - drawing.startY);
            setRect({ x, y, w, h });
        };
        const handleUp = () => setDrawing(null);
        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
        return () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };
    }, [drawing, toSourceCoords]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel]);

    const handleSave = async () => {
        if (!rect || rect.w < 4 || rect.h < 4) return;
        const img = imgRef.current;
        if (!img) return;

        const bbox: [number, number, number, number] = [
            Math.max(0, Math.round(rect.x)),
            Math.max(0, Math.round(rect.y)),
            Math.min(page.sourceWidth, Math.round(rect.w)),
            Math.min(page.sourceHeight, Math.round(rect.h)),
        ];

        // Client-side canvas crop to produce a PNG data URL.
        const source = document.createElement("img");
        source.decoding = "async";
        source.src = page.sourceDataUrl;
        await source.decode();

        const canvas = document.createElement("canvas");
        canvas.width = bbox[2];
        canvas.height = bbox[3];
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(source, bbox[0], bbox[1], bbox[2], bbox[3], 0, 0, bbox[2], bbox[3]);
        const dataUrl = canvas.toDataURL("image/png");
        onSave(bbox, dataUrl);
    };

    const displayRect = (() => {
        if (!rect || !page.sourceWidth || !page.sourceHeight) return null;
        return {
            left: `${(rect.x / page.sourceWidth) * 100}%`,
            top: `${(rect.y / page.sourceHeight) * 100}%`,
            width: `${(rect.w / page.sourceWidth) * 100}%`,
            height: `${(rect.h / page.sourceHeight) * 100}%`,
        };
    })();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-6">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                            Crop
                        </p>
                        <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-neutral-900">
                            Draw a rectangle around the diagram
                        </h2>
                    </div>
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

                <div
                    ref={frameRef}
                    className="relative min-h-0 flex-1 select-none overflow-auto bg-neutral-100 p-4"
                >
                    <div className="relative mx-auto w-full max-w-full" style={{ maxWidth: 900 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            ref={imgRef}
                            src={page.sourceDataUrl}
                            alt="Source page"
                            className="block w-full cursor-crosshair"
                            onMouseDown={onMouseDown}
                            draggable={false}
                        />
                        {displayRect && (
                            <div
                                className="pointer-events-none absolute border-2 border-neutral-900 bg-neutral-900/5"
                                style={displayRect}
                            />
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3">
                    <p className="text-[11px] text-neutral-400">
                        Click and drag to draw. Redraw to replace.
                    </p>
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
                            disabled={!rect || rect.w < 4 || rect.h < 4}
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
