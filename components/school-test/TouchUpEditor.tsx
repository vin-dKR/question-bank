"use client";

/**
 * Brush touch-up for a cleaned diagram.
 *
 * Automatic cleaning is good but not perfect: a smudge on the page survives, or
 * a stray mark from the neighbouring question creeps into the crop. Rather than
 * make the algorithm guess harder, this lets a teacher paint the last few
 * percent by hand.
 *
 * Two brushes, and the pairing is what makes it safe to experiment:
 *   Erase   — paint the cleaned paper colour over something unwanted
 *   Restore — paint the ORIGINAL crop back, undoing both the brush and any
 *             over-eager automatic cleaning in that spot
 *
 * Everything runs on a canvas in the browser — no server round trip per stroke.
 * Committed strokes are kept as a list so undo is just dropping the last entry
 * and replaying, rather than holding a stack of pixel buffers.
 *
 * The stroke in progress is painted straight onto the canvas segment by segment
 * and only committed on release. Pushing every pointer move through React state
 * meant a re-render and a full replay of every previous stroke per move, which
 * on a large crop lags visibly behind the cursor.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Loader2, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stroke {
    mode: "erase" | "restore";
    radius: number;
    /** Points in image pixel coordinates. */
    points: { x: number; y: number }[];
}

export function TouchUpEditor({
    cleanedDataUrl,
    originalDataUrl,
    onSave,
    onCancel,
}: {
    cleanedDataUrl: string;
    /** The crop before cleaning, so Restore has something to paint back. */
    originalDataUrl: string;
    onSave: (dataUrl: string) => void;
    onCancel: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cleanedRef = useRef<HTMLImageElement | null>(null);
    const originalRef = useRef<HTMLImageElement | null>(null);

    const [ready, setReady] = useState(false);
    const [mode, setMode] = useState<"erase" | "restore">("erase");
    const [brush, setBrush] = useState(14);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [saving, setSaving] = useState(false);

    /**
     * The stroke being drawn right now. Held in a ref, not state: it changes on
     * every pointer move and must not trigger a render, or the canvas falls
     * behind the cursor.
     */
    const activeRef = useRef<Stroke | null>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    // Load both images once.
    useEffect(() => {
        let alive = true;
        const load = (src: string) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("Could not load the image."));
                img.src = src;
            });

        Promise.all([load(cleanedDataUrl), load(originalDataUrl)])
            .then(([cleaned, original]) => {
                if (!alive) return;
                cleanedRef.current = cleaned;
                originalRef.current = original;
                setReady(true);
            })
            .catch(() => alive && setReady(false));

        return () => {
            alive = false;
        };
    }, [cleanedDataUrl, originalDataUrl]);

    /** Paint one dab or segment, in whichever mode. */
    const paint = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            stroke: Pick<Stroke, "mode" | "radius">,
            from: { x: number; y: number } | null,
            to: { x: number; y: number },
        ) => {
            const original = originalRef.current;
            if (!original) return;

            ctx.save();

            // Clip to the swept brush shape: overlapping discs stamped along the
            // segment. clip() takes the current PATH, and a stroked line is not
            // part of the path — an earlier version added a bounding rect to
            // bridge the gap, which clipped to a rectangle and painted blocks
            // instead of brush strokes.
            ctx.beginPath();
            const r = stroke.radius;
            if (from) {
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const dist = Math.hypot(dx, dy);
                // Half-radius spacing: close enough that consecutive discs
                // overlap, so the edge stays smooth without stamping hundreds.
                const steps = Math.max(1, Math.ceil(dist / Math.max(1, r * 0.5)));
                for (let i = 0; i <= steps; i++) {
                    const x = from.x + (dx * i) / steps;
                    const y = from.y + (dy * i) / steps;
                    ctx.moveTo(x + r, y);
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                }
            } else {
                ctx.moveTo(to.x + r, to.y);
                ctx.arc(to.x, to.y, r, 0, Math.PI * 2);
            }
            ctx.clip();

            if (stroke.mode === "restore") {
                // Stretched to the canvas rather than drawn 1:1. The cleaned crop
                // is re-cut from the source page, so rounding in that extract can
                // leave it a pixel off the original — drawing at natural size then
                // shifts everything Restore paints.
                ctx.drawImage(original, 0, 0, ctx.canvas.width, ctx.canvas.height);
            } else {
                // White rather than transparent: the crop is destined for a
                // printed paper, where transparent flattens to white anyway.
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }
            ctx.restore();
        },
        [],
    );

    /** Repaint from scratch. Only needed for undo, clear and first load. */
    const redraw = useCallback(
        (list: Stroke[]) => {
            const canvas = canvasRef.current;
            const cleaned = cleanedRef.current;
            if (!canvas || !cleaned) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(cleaned, 0, 0);

            for (const stroke of list) {
                let prev: { x: number; y: number } | null = null;
                for (const p of stroke.points) {
                    paint(ctx, stroke, prev, p);
                    prev = p;
                }
            }
        },
        [paint],
    );

    // Size once. Assigning width/height clears the canvas, so doing it on every
    // stroke would blank the drawing mid-session.
    useEffect(() => {
        const canvas = canvasRef.current;
        const cleaned = cleanedRef.current;
        if (!ready || !canvas || !cleaned) return;
        canvas.width = cleaned.naturalWidth;
        canvas.height = cleaned.naturalHeight;
        redraw([]);
    }, [ready, redraw]);

    // Replay after undo or clear. A committed stroke is already on the canvas
    // from the live pass, so this only matters when the list shrinks.
    const strokeCount = strokes.length;
    const prevCountRef = useRef(0);
    useEffect(() => {
        if (!ready) return;
        if (strokeCount < prevCountRef.current) redraw(strokes);
        prevCountRef.current = strokeCount;
    }, [ready, strokeCount, strokes, redraw]);

    /** Pointer position in image pixels, not CSS pixels. */
    const toImage = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * canvas.width,
            y: ((e.clientY - rect.top) / rect.height) * canvas.height,
        };
    };

    const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!ready) return;
        e.currentTarget.setPointerCapture(e.pointerId);

        const p = toImage(e);
        // The mode is captured here, so switching Erase/Restore later never
        // rewrites a stroke that is already down.
        activeRef.current = { mode, radius: brush, points: [p] };
        lastPointRef.current = null;

        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) paint(ctx, activeRef.current, null, p);
        lastPointRef.current = p;
    };

    const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const active = activeRef.current;
        if (!active) return;

        const p = toImage(e);
        const ctx = canvasRef.current?.getContext("2d");
        // Straight to the canvas — no state update, so this keeps up with the
        // pointer instead of waiting on a render.
        if (ctx) paint(ctx, active, lastPointRef.current, p);

        active.points.push(p);
        lastPointRef.current = p;
    };

    /** Commit on release, which is the only point undo needs to know about. */
    const end = () => {
        const active = activeRef.current;
        activeRef.current = null;
        lastPointRef.current = null;
        if (active) setStrokes((prev) => [...prev, active]);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setSaving(true);
        try {
            onSave(canvas.toDataURL("image/png"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-2 sm:p-6">
            <div className="flex max-h-full w-full max-w-3xl flex-col gap-3 overflow-hidden rounded-xl bg-white p-4 shadow-xl">
                <div>
                    <h2 className="text-sm font-semibold text-zinc-900">Touch up</h2>
                    <p className="text-[11px] text-zinc-500">
                        Erase paints over anything that should not be there. Restore brings the
                        original back, including anything cleaning removed by mistake.
                    </p>
                </div>

                {/* Checkerboard so white brushwork is visible against white paper. */}
                <div
                    className="flex-1 min-h-0 overflow-auto rounded-lg border border-zinc-200 p-2"
                    style={{
                        backgroundImage:
                            "linear-gradient(45deg,#f4f4f5 25%,transparent 25%,transparent 75%,#f4f4f5 75%)," +
                            "linear-gradient(45deg,#f4f4f5 25%,transparent 25%,transparent 75%,#f4f4f5 75%)",
                        backgroundSize: "16px 16px",
                        backgroundPosition: "0 0, 8px 8px",
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        onPointerDown={start}
                        onPointerMove={move}
                        onPointerUp={end}
                        onPointerLeave={end}
                        className="mx-auto block max-w-full touch-none"
                        style={{ cursor: "crosshair" }}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2">
                    <div className="flex rounded-md border border-zinc-200 bg-white p-0.5">
                        <button
                            type="button"
                            onClick={() => setMode("erase")}
                            className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                                mode === "erase" ? "bg-zinc-900 text-white" : "text-zinc-600"
                            }`}
                        >
                            <Eraser className="mr-1 inline size-3" />
                            Erase
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("restore")}
                            className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                                mode === "restore" ? "bg-zinc-900 text-white" : "text-zinc-600"
                            }`}
                        >
                            <RotateCcw className="mr-1 inline size-3" />
                            Restore
                        </button>
                    </div>

                    <label className="flex items-center gap-2 text-[11px] text-zinc-600">
                        Brush
                        <input
                            type="range"
                            min={4}
                            max={60}
                            value={brush}
                            onChange={(e) => setBrush(Number(e.target.value))}
                            className="w-28"
                        />
                        <span className="w-6 tabular-nums">{brush}</span>
                    </label>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStrokes((s) => s.slice(0, -1))}
                        disabled={!strokes.length}
                    >
                        <Undo2 className="size-3.5" />
                        <span className="text-[11px]">Undo</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStrokes([])}
                        disabled={!strokes.length}
                    >
                        <span className="text-[11px]">Clear</span>
                    </Button>

                    <span className="text-[11px] text-zinc-400">
                        {strokes.length} edit{strokes.length === 1 ? "" : "s"}
                    </span>

                    <div className="ml-auto flex gap-2">
                        <Button size="sm" variant="secondary" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={!ready || saving}>
                            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                            <span className="text-[11px]">Save</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
