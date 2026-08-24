"use client";

/**
 * The editable slide surface.
 *
 * The deck's coordinate space is a fixed 1280x720. Rather than being handed a
 * pixel width and scaling to it, the canvas fills whatever box it is placed in and
 * expresses every position as a percentage of that box, with type sized in `cqw`
 * against a container query. Nothing here depends on measuring the viewport, so
 * the slide cannot overflow its parent — the earlier measure-then-size approach
 * raced with dialog layout and spilled out of the preview.
 *
 * Geometry stored in a template is always in real slide pixels regardless.
 *
 * Bound boxes render a placeholder label rather than data — in the editor the
 * useful thing to show is *which field* lands in each box. Once binds are resolved
 * (preview, export) the concrete text and images are shown instead.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { renderMixedLatex } from "@/lib/render-tex";
import { hasLatex } from "@/lib/slides/generate";
import {
    CANVAS_H,
    CANVAS_W,
    FONTS,
    type Slide,
    type SlideElement,
    type TextElement,
} from "@/types/slides";

/** Movements snap to this grid, so hand-placed boxes still line up. */
const GRID = 8;

/**
 * Auto-shrink floor. Below this a question is unreadable on a projector, so the
 * text is clipped instead — a visible truncation beats silently overlapping the
 * box below, and it tells the author the box needs to be bigger.
 */
const MIN_FIT = 0.5;

const PLACEHOLDER: Record<string, string> = {
    index: "Q1.",
    exam: "Exam name",
    subject: "Subject",
    topic: "Topic / chapter",
    question: "The question text appears here, at whatever length the record happens to be.",
    options: "(a) First option\n(b) Second option\n(c) Third option\n(d) Fourth option",
    answer: "Answer",
    solution: "",
    diagram: "Figure",
};

/** Slide px as a percentage of the canvas. */
const pctX = (v: number) => `${(v / CANVAS_W) * 100}%`;
const pctY = (v: number) => `${(v / CANVAS_H) * 100}%`;
/** Slide px as container-query width units, so type scales with the canvas. */
const cqw = (v: number) => `${(v / CANVAS_W) * 100}cqw`;

type DragMode = {
    kind: "move" | "resize";
    id: string;
    startX: number;
    startY: number;
    orig: SlideElement;
};

/**
 * A text box that shrinks its type until the content fits, mirroring the
 * `shrinkText` behaviour applied on export. Without it the preview renders at full
 * size and long questions spill over whatever sits below them, which is both ugly
 * and a lie about what the .pptx will look like.
 *
 * The scale is applied through a `--fit` custom property so the base size can stay
 * in `cqw` and keep scaling with the canvas.
 */
function FitText({
    el,
    children,
    style,
}: {
    el: TextElement;
    children: React.ReactNode;
    style: React.CSSProperties;
}) {
    const boxRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const box = boxRef.current;
        const inner = innerRef.current;
        if (!box || !inner) return;

        const fit = () => {
            let f = 1;
            box.style.setProperty("--fit", "1");
            // Reading scrollHeight forces a synchronous reflow each pass, so the
            // loop converges on the largest size that still fits.
            let guard = 0;
            while (inner.scrollHeight > box.clientHeight + 1 && f > MIN_FIT && guard < 40) {
                f -= 0.04;
                guard += 1;
                box.style.setProperty("--fit", f.toFixed(3));
            }
        };

        fit();

        // The canvas is fluid, so a container resize changes how much fits.
        const ro = new ResizeObserver(fit);
        ro.observe(box);
        return () => ro.disconnect();
    }, [el.text, el.fontSize, el.w, el.h, el.lineHeight, el.tracking, el.font, el.weight]);

    return (
        <div ref={boxRef} className="w-full h-full overflow-hidden pointer-events-none" style={style}>
            <div ref={innerRef}>{children}</div>
        </div>
    );
}

interface Props {
    slide: Slide;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onChange: (elements: SlideElement[]) => void;
    /** Optional fixed width in CSS px. Omit to fill the parent. */
    width?: number;
    /**
     * Size from the parent's height instead of its width, deriving width from the
     * aspect ratio. Use inside a height-constrained flex row so the slide fits
     * without scrolling; width-driven sizing overflows vertically there.
     */
    fitHeight?: boolean;
    readOnly?: boolean;
}

export default function SlideCanvas({
    slide,
    selectedId,
    onSelect,
    onChange,
    width,
    fitHeight,
    readOnly,
}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<DragMode | null>(null);

    const clampSnap = useCallback((v: number, max: number) => {
        const snapped = Math.round(v / GRID) * GRID;
        return Math.max(0, Math.min(snapped, max));
    }, []);

    // Pointer move/up live on the window so a fast drag that leaves the canvas
    // keeps tracking instead of stranding the element mid-move.
    useEffect(() => {
        if (!drag) return;

        const onMove = (e: PointerEvent) => {
            // Read the live width: the canvas is fluid, so the pixel-to-slide ratio
            // is only known at the moment of the drag.
            const rendered = ref.current?.clientWidth ?? CANVAS_W;
            const scale = rendered / CANVAS_W || 1;

            const dx = (e.clientX - drag.startX) / scale;
            const dy = (e.clientY - drag.startY) / scale;
            const o = drag.orig;

            const next = slide.elements.map((el) => {
                if (el.id !== drag.id) return el;
                if (drag.kind === "move") {
                    return {
                        ...el,
                        x: clampSnap(o.x + dx, CANVAS_W - o.w),
                        y: clampSnap(o.y + dy, CANVAS_H - o.h),
                    };
                }
                const w = clampSnap(Math.max(GRID * 2, o.w + dx), CANVAS_W - o.x);
                const h = clampSnap(Math.max(GRID * 2, o.h + dy), CANVAS_H - o.y);
                return { ...el, w: Math.max(GRID * 2, w), h: Math.max(GRID * 2, h) };
            });
            onChange(next);
        };

        const onUp = () => setDrag(null);

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
    }, [drag, slide.elements, onChange, clampSnap]);

    const start = (e: React.PointerEvent, el: SlideElement, kind: "move" | "resize") => {
        if (readOnly) return;
        e.stopPropagation();
        e.preventDefault();
        onSelect(el.id);
        setDrag({ kind, id: el.id, startX: e.clientX, startY: e.clientY, orig: { ...el } });
    };

    const renderContent = (el: SlideElement) => {
        if (el.type === "text") {
            const label = el.bind ? PLACEHOLDER[el.bind.key] ?? "" : el.text;
            const isReserved = el.bind?.when === "reserve";
            return (
                <FitText
                    el={el}
                    style={{
                        color: el.color,
                        // The --fit multiplier is set by FitText's shrink pass.
                        fontSize: `calc(${cqw(el.fontSize)} * var(--fit, 1))`,
                        fontFamily: FONTS[el.font],
                        fontWeight: el.weight,
                        fontStyle: el.italic ? "italic" : "normal",
                        textAlign: el.align,
                        lineHeight: el.lineHeight,
                        letterSpacing: cqw(el.tracking),
                        whiteSpace: "pre-wrap",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent:
                            el.valign === "center"
                                ? "center"
                                : el.valign === "bottom"
                                  ? "flex-end"
                                  : "flex-start",
                        opacity: el.opacity,
                    }}
                >
                    {isReserved ? (
                        <span className="opacity-40 italic">(left blank)</span>
                    ) : hasLatex(label) ? (
                        // Mirrors the exporter, which rasterises LaTeX with the same
                        // KaTeX build — so the preview matches the .pptx.
                        <span>{renderMixedLatex(label)}</span>
                    ) : (
                        label
                    )}
                </FitText>
            );
        }

        if (el.type === "image") {
            // A resolved src means this is a preview of real data; in the editor the
            // src is empty and the box is drawn as a placeholder instead.
            if (el.src) {
                return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={el.src}
                        alt=""
                        className="w-full h-full pointer-events-none"
                        style={{
                            objectFit: el.fit === "cover" ? "cover" : "contain",
                            borderRadius: cqw(el.radius),
                            opacity: el.opacity,
                        }}
                    />
                );
            }
            return (
                <div
                    className="w-full h-full flex items-center justify-center pointer-events-none border border-dashed"
                    style={{ borderColor: "rgba(255,255,255,.35)", borderRadius: cqw(el.radius) }}
                >
                    <span
                        className="uppercase tracking-widest text-white/60"
                        style={{ fontSize: cqw(16) }}
                    >
                        {el.bind ? PLACEHOLDER[el.bind.key] : "Image"}
                    </span>
                </div>
            );
        }

        if (el.type === "rect") {
            return (
                <div
                    className="w-full h-full pointer-events-none"
                    style={{
                        background: el.fill === "transparent" ? "transparent" : el.fill,
                        borderRadius: cqw(el.radius),
                        border:
                            el.strokeWidth > 0 && el.stroke
                                ? `${cqw(el.strokeWidth)} solid ${el.stroke}`
                                : undefined,
                        opacity: el.opacity,
                    }}
                />
            );
        }

        if (el.type === "ellipse") {
            return (
                <div
                    className="w-full h-full rounded-full pointer-events-none"
                    style={{
                        background: el.fill === "transparent" ? "transparent" : el.fill,
                        border:
                            el.strokeWidth > 0 && el.stroke
                                ? `${cqw(el.strokeWidth)} solid ${el.stroke}`
                                : undefined,
                        opacity: el.opacity,
                    }}
                />
            );
        }

        // line
        return (
            <div
                className="w-full pointer-events-none"
                style={{
                    height: cqw(Math.max(1, el.strokeWidth)),
                    background: el.stroke,
                    opacity: el.opacity,
                }}
            />
        );
    };

    return (
        <div
            ref={ref}
            onPointerDown={() => !readOnly && onSelect(null)}
            className="relative overflow-hidden rounded-lg shadow-sm select-none max-w-full"
            style={{
                // Height-driven when asked, so the slide fits a constrained row;
                // otherwise it fills the available width.
                ...(fitHeight
                    ? { height: "100%", width: "auto", maxHeight: "100%" }
                    : { width: width ? `${width}px` : "100%" }),
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                containerType: "inline-size",
                background: slide.bg,
                cursor: drag ? "grabbing" : "default",
            }}
        >
            {/* Painted under everything, and never interactive — the background is
                template artwork, not an element the user can select or move. */}
            {slide.bgImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={slide.bgImage}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 w-full h-full pointer-events-none select-none"
                    style={{ objectFit: "cover" }}
                    draggable={false}
                />
            )}

            {slide.elements.map((el) => {
                const isSelected = el.id === selectedId;
                return (
                    <div
                        key={el.id}
                        onPointerDown={(e) => start(e, el, "move")}
                        className="absolute"
                        style={{
                            left: pctX(el.x),
                            top: pctY(el.y),
                            width: pctX(el.w),
                            height: pctY(el.h),
                            cursor: readOnly ? "default" : "move",
                            outline: isSelected
                                ? "2px solid #6366f1"
                                : !readOnly && el.bind
                                  ? "1px dashed rgba(99,102,241,.45)"
                                  : "none",
                            outlineOffset: 0,
                        }}
                    >
                        {renderContent(el)}

                        {isSelected && !readOnly && (
                            <>
                                <span className="absolute -top-5 left-0 text-[10px] px-1 rounded bg-indigo-500 text-white whitespace-nowrap">
                                    {el.bind ? el.bind.key : el.type}
                                </span>
                                <span
                                    onPointerDown={(e) => start(e, el, "resize")}
                                    className="absolute -right-1.5 -bottom-1.5 size-3 rounded-sm bg-indigo-500 border border-white"
                                    style={{ cursor: "nwse-resize" }}
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
