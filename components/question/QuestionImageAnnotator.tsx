"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Highlighter, PenLine, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type Point = { x: number; y: number };
type Mark = { kind: "mark"; points: Point[]; width: number };
type Highlight = { kind: "highlight"; x: number; y: number; width: number; height: number };
type Annotation = Mark | Highlight;

const numberClass =
    "h-9 w-full rounded-md border border-black/10 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

function paintAnnotation(ctx: CanvasRenderingContext2D, annotation: Annotation) {
    ctx.save();
    if (annotation.kind === "mark") {
        if (annotation.points.length === 0) return;
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = annotation.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
        for (const point of annotation.points.slice(1)) ctx.lineTo(point.x, point.y);
        if (annotation.points.length === 1) ctx.lineTo(annotation.points[0].x + 0.01, annotation.points[0].y);
        ctx.stroke();
    } else {
        ctx.fillStyle = "rgba(250, 204, 21, 0.34)";
        ctx.strokeStyle = "rgba(202, 138, 4, 0.9)";
        ctx.lineWidth = Math.max(2, Math.min(ctx.canvas.width, ctx.canvas.height) * 0.002);
        ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
        ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
    }
    ctx.restore();
}

/**
 * Reversible browser-canvas annotation built on the same stroke-list/replay
 * model as the school-test TouchUpEditor. The source image is never mutated;
 * saving produces a new PNG data URL that follows the existing secure upload
 * path when the question form is submitted.
 */
export function QuestionImageAnnotator({
    open,
    sourceDataUrl,
    onCancel,
    onSave,
}: {
    open: boolean;
    sourceDataUrl: string;
    onCancel: () => void;
    onSave: (dataUrl: string) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const annotationsRef = useRef<Annotation[]>([]);
    const activeRef = useRef<Annotation | null>(null);
    const startRef = useRef<Point | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [mode, setMode] = useState<"mark" | "highlight">("highlight");
    const [brushWidth, setBrushWidth] = useState(8);
    const [ready, setReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [region, setRegion] = useState({ x: 10, y: 10, width: 35, height: 20 });

    const redraw = useCallback((extra?: Annotation | null, originalOnly = false) => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        if (originalOnly) return;
        for (const annotation of annotationsRef.current) paintAnnotation(ctx, annotation);
        if (extra) paintAnnotation(ctx, extra);
    }, []);

    useEffect(() => {
        annotationsRef.current = annotations;
        if (ready) redraw(null, showOriginal);
    }, [annotations, ready, redraw, showOriginal]);

    useEffect(() => {
        if (!open) return;
        let alive = true;
        setReady(false);
        setLoadError(null);
        setAnnotations([]);
        annotationsRef.current = [];
        setShowOriginal(false);

        const image = new Image();
        if (!sourceDataUrl.startsWith("data:")) image.crossOrigin = "anonymous";
        image.onload = () => {
            if (!alive) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const maxDimension = 2400;
            const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            imageRef.current = image;
            setReady(true);
            requestAnimationFrame(() => redraw());
        };
        image.onerror = () => {
            if (alive) setLoadError("The image could not be opened for annotation. Try uploading it again.");
        };
        image.src = sourceDataUrl;
        return () => {
            alive = false;
            imageRef.current = null;
        };
    }, [open, redraw, sourceDataUrl]);

    const toImagePoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current!;
        const bounds = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
            y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
        };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ready || showOriginal) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const point = toImagePoint(event);
        startRef.current = point;
        activeRef.current = mode === "mark"
            ? { kind: "mark", points: [point], width: brushWidth }
            : { kind: "highlight", x: point.x, y: point.y, width: 0, height: 0 };
        redraw(activeRef.current);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const active = activeRef.current;
        const start = startRef.current;
        if (!active || !start) return;
        const point = toImagePoint(event);
        if (active.kind === "mark") active.points.push(point);
        else {
            active.x = Math.min(start.x, point.x);
            active.y = Math.min(start.y, point.y);
            active.width = Math.abs(point.x - start.x);
            active.height = Math.abs(point.y - start.y);
        }
        redraw(active);
    };

    const handlePointerEnd = () => {
        const active = activeRef.current;
        activeRef.current = null;
        startRef.current = null;
        if (!active) return;
        if (active.kind === "highlight" && (active.width < 2 || active.height < 2)) {
            redraw();
            return;
        }
        setAnnotations((current) => [...current, active]);
    };

    const addKeyboardRegion = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
        const x = clamp(region.x, 0, 99);
        const y = clamp(region.y, 0, 99);
        const width = clamp(region.width, 1, 100 - x);
        const height = clamp(region.height, 1, 100 - y);
        setRegion({ x, y, width, height });
        setAnnotations((current) => [
            ...current,
            {
                kind: "highlight",
                x: (x / 100) * canvas.width,
                y: (y / 100) * canvas.height,
                width: (width / 100) * canvas.width,
                height: (height / 100) * canvas.height,
            },
        ]);
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        redraw(null, false);
        onSave(canvas.toDataURL("image/png"));
    };

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Annotate question image</DialogTitle>
                    <DialogDescription>
                        Highlight a required area or add a red mark. The original is preserved until you save the question.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Annotation tools">
                    <Button type="button" size="sm" variant={mode === "highlight" ? "default" : "outline"} aria-pressed={mode === "highlight"} onClick={() => setMode("highlight")}>
                        <Highlighter className="h-4 w-4" aria-hidden="true" /> Highlight
                    </Button>
                    <Button type="button" size="sm" variant={mode === "mark" ? "default" : "outline"} aria-pressed={mode === "mark"} onClick={() => setMode("mark")}>
                        <PenLine className="h-4 w-4" aria-hidden="true" /> Mark
                    </Button>
                    {mode === "mark" && (
                        <label className="flex items-center gap-2 text-xs text-zinc-600">
                            Mark width
                            <input type="range" min="3" max="24" value={brushWidth} onChange={(event) => setBrushWidth(Number(event.target.value))} />
                        </label>
                    )}
                    <Button type="button" size="sm" variant="outline" disabled={annotations.length === 0} onClick={() => setAnnotations((current) => current.slice(0, -1))}>
                        <Undo2 className="h-4 w-4" aria-hidden="true" /> Undo
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={annotations.length === 0} onClick={() => setAnnotations([])}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
                    </Button>
                    <label className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
                        <input type="checkbox" checked={showOriginal} onChange={(event) => setShowOriginal(event.target.checked)} />
                        Show original
                    </label>
                </div>

                {loadError ? (
                    <div role="alert" className="rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">{loadError}</div>
                ) : (
                    <div className="flex min-h-52 items-center justify-center overflow-auto rounded-lg border border-black/10 bg-zinc-100 p-2">
                        {!ready && <p role="status" className="text-sm text-zinc-500">Loading image…</p>}
                        <canvas
                            ref={canvasRef}
                            className={`max-h-[50vh] max-w-full bg-white shadow-sm ${ready && !showOriginal ? "touch-none cursor-crosshair" : ""}`}
                            aria-label="Question image annotation canvas. Pointer users can draw; keyboard users can add a region below."
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerEnd}
                            onPointerCancel={handlePointerEnd}
                        />
                    </div>
                )}

                <fieldset className="rounded-lg border border-black/10 p-3">
                    <legend className="px-1 text-sm font-medium text-zinc-800">Keyboard highlight region</legend>
                    <p className="mb-3 text-xs text-zinc-500">Enter the region as percentages of the image, then add it for review.</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {(["x", "y", "width", "height"] as const).map((field) => (
                            <label key={field} className="text-xs capitalize text-zinc-600">
                                {field} (%)
                                <input
                                    className={`${numberClass} mt-1`}
                                    type="number"
                                    min={field === "width" || field === "height" ? 1 : 0}
                                    max="100"
                                    value={region[field]}
                                    onChange={(event) => setRegion((current) => ({ ...current, [field]: Number(event.target.value) }))}
                                />
                            </label>
                        ))}
                    </div>
                    <Button type="button" size="sm" variant="outline" className="mt-3" disabled={!ready || showOriginal} onClick={addKeyboardRegion}>
                        Add highlight region
                    </Button>
                </fieldset>

                <p className="text-xs text-zinc-500" aria-live="polite">
                    {showOriginal ? "Showing the unchanged original for comparison." : `${annotations.length} annotation${annotations.length === 1 ? "" : "s"} added.`}
                </p>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="button" disabled={!ready || annotations.length === 0} onClick={save}>Use annotated image</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
