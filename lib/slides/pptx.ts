/**
 * Renders a generated deck to a real .pptx.
 *
 * Units: the canvas is 1280x720 px at 96 px/in, which is exactly PowerPoint's
 * 13.333 x 7.5in widescreen, so positions convert by a plain divide. Font sizes do
 * NOT — PowerPoint measures type in points (1/72in) while the canvas uses px
 * (1/96in), so every size is scaled by 0.75 on the way out.
 *
 * LaTeX cannot be laid out as PowerPoint text. Pass `rasterizeLatex` to turn those
 * fields into images; without it they degrade to their raw `$...$` source rather
 * than failing the export.
 */
import PptxGenJS from "pptxgenjs";
import type { ImageElement, LineElement, Slide, TextElement } from "@/types/slides";
import { CANVAS_H, CANVAS_W, FONTS, PX_PER_IN } from "@/types/slides";
import { hasLatex } from "./generate";

/** px -> inches */
const inch = (px: number) => px / PX_PER_IN;
/** px -> points, for type only */
const pt = (px: number) => px * 0.75;

/** pptxgenjs wants bare hex, no leading #. */
function hex(color: string, fallback = "000000"): string {
    if (!color) return fallback;
    const c = color.replace("#", "").trim();
    if (/^[0-9a-fA-F]{6}$/.test(c)) return c.toUpperCase();
    if (/^[0-9a-fA-F]{3}$/.test(c)) {
        return c
            .split("")
            .map((ch) => ch + ch)
            .join("")
            .toUpperCase();
    }
    return fallback;
}

const isTransparent = (c: string) => !c || c === "transparent" || c === "none";

/** Element opacity as pptx transparency (percent). */
const alpha = (opacity: number) => Math.round((1 - opacity) * 100);

/**
 * Shapes carry transparency on the fill/line objects, not on the shape itself,
 * so opacity has to be pushed down into both.
 */
function shapeFill(fill: string, opacity: number) {
    return isTransparent(fill)
        ? { fill: { type: "none" as const } }
        : { fill: { color: hex(fill), transparency: alpha(opacity) } };
}

function shapeLine(stroke: string, strokeWidth: number, opacity: number) {
    return strokeWidth > 0 && !isTransparent(stroke)
        ? { line: { color: hex(stroke), width: pt(strokeWidth), transparency: alpha(opacity) } }
        : {};
}

export interface RasterizeLatex {
    /**
     * Render a LaTeX-bearing string to a PNG data URL sized for the given box.
     * Implemented against the existing jax/puppeteer pipeline; injected so this
     * module stays free of a browser dependency and remains unit-testable.
     */
    (input: {
        text: string;
        widthPx: number;
        heightPx: number;
        color: string;
        fontSizePx: number;
    }): Promise<string>;
}

export interface PptxOptions {
    title?: string;
    subject?: string;
    author?: string;
    rasterizeLatex?: RasterizeLatex;
}

type OutputKind = "nodebuffer" | "blob";

const VALIGN: Record<string, "top" | "middle" | "bottom"> = {
    top: "top",
    center: "middle",
    bottom: "bottom",
};

async function addText(
    slide: PptxGenJS.Slide,
    el: TextElement,
    opts: PptxOptions
): Promise<void> {
    if (!el.text) return;

    // LaTeX has to become an image — PowerPoint has no way to typeset it, and it
    // cannot reflow inside a fixed box.
    if (hasLatex(el.text) && opts.rasterizeLatex) {
        try {
            const data = await opts.rasterizeLatex({
                text: el.text,
                widthPx: el.w,
                heightPx: el.h,
                color: el.color,
                fontSizePx: el.fontSize,
            });
            if (data) {
                slide.addImage({
                    data,
                    x: inch(el.x),
                    y: inch(el.y),
                    w: inch(el.w),
                    h: inch(el.h),
                    sizing: { type: "contain", w: inch(el.w), h: inch(el.h) },
                    transparency: alpha(el.opacity),
                });
                return;
            }
        } catch {
            // Fall through to plain text rather than losing the slide entirely.
        }
    }

    slide.addText(el.text, {
        x: inch(el.x),
        y: inch(el.y),
        w: inch(el.w),
        h: inch(el.h),
        fontSize: pt(el.fontSize),
        fontFace: FONTS[el.font] ?? FONTS[0],
        color: hex(el.color, "FFFFFF"),
        bold: el.weight >= 600,
        italic: el.italic,
        align: el.align,
        valign: VALIGN[el.valign] ?? "top",
        charSpacing: pt(el.tracking),
        lineSpacingMultiple: el.lineHeight,
        transparency: alpha(el.opacity),
        // Long questions in a fixed box shrink rather than overflow.
        shrinkText: true,
        wrap: true,
        margin: 0,
    });
}

/** Remote images are fetched once per URL and reused across slides. */
const imageCache = new Map<string, string | null>();

/**
 * pptxgenjs resolves `path` against the filesystem when running under Node, so a
 * Supabase URL has to be fetched and embedded as a data URL instead.
 */
async function fetchAsDataUrl(url: string): Promise<string | null> {
    const cached = imageCache.get(url);
    if (cached !== undefined) return cached;

    let result: string | null = null;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const type = res.headers.get("content-type") ?? "image/png";
            const buf = Buffer.from(await res.arrayBuffer());
            result = `data:${type};base64,${buf.toString("base64")}`;
        } else {
            console.warn(`[pptx] image ${res.status}: ${url}`);
        }
    } catch (err) {
        console.warn(`[pptx] image fetch failed: ${url}`, err instanceof Error ? err.message : err);
    }

    imageCache.set(url, result);
    return result;
}

async function addImage(slide: PptxGenJS.Slide, el: ImageElement): Promise<void> {
    if (!el.src) return;

    // A missing diagram should cost one image, not the whole deck.
    const data = el.src.startsWith("data:") ? el.src : await fetchAsDataUrl(el.src);
    if (!data) return;

    slide.addImage({
        data,
        x: inch(el.x),
        y: inch(el.y),
        w: inch(el.w),
        h: inch(el.h),
        sizing: { type: el.fit, w: inch(el.w), h: inch(el.h) },
        transparency: alpha(el.opacity),
    });
}

function addLine(pptx: PptxGenJS, slide: PptxGenJS.Slide, el: LineElement): void {
    slide.addShape(pptx.ShapeType.line, {
        x: inch(el.x),
        y: inch(el.y),
        w: inch(el.w),
        h: 0,
        line: {
            color: hex(el.stroke, "888888"),
            width: pt(el.strokeWidth),
            transparency: alpha(el.opacity),
        },
    });
}

async function buildDeck(slides: Slide[], opts: PptxOptions): Promise<PptxGenJS> {
    const pptx = new PptxGenJS();

    pptx.defineLayout({
        name: "CANVAS_16X9",
        width: CANVAS_W / PX_PER_IN,
        height: CANVAS_H / PX_PER_IN,
    });
    pptx.layout = "CANVAS_16X9";

    if (opts.title) pptx.title = opts.title;
    if (opts.subject) pptx.subject = opts.subject;
    if (opts.author) pptx.author = opts.author;

    for (const s of slides) {
        const slide = pptx.addSlide();
        slide.background = { color: hex(s.bg, "FFFFFF") };

        // Template artwork, painted first so every element sits on top of it.
        // pptxgenjs supports `background: { data }`, but going through addImage
        // reuses the fetch-and-cache path that remote URLs need anyway.
        if (s.bgImage) {
            const data = s.bgImage.startsWith("data:")
                ? s.bgImage
                : await fetchAsDataUrl(s.bgImage);
            if (data) {
                slide.addImage({
                    data,
                    x: 0,
                    y: 0,
                    w: CANVAS_W / PX_PER_IN,
                    h: CANVAS_H / PX_PER_IN,
                    sizing: { type: "cover", w: CANVAS_W / PX_PER_IN, h: CANVAS_H / PX_PER_IN },
                });
            }
        }

        // Array order is paint order, and pptxgenjs stacks in insertion order too.
        for (const el of s.elements) {
            switch (el.type) {
                case "text":
                    await addText(slide, el, opts);
                    break;
                case "image":
                    await addImage(slide, el);
                    break;
                case "line":
                    addLine(pptx, slide, el);
                    break;
                case "rect":
                    slide.addShape(pptx.ShapeType.roundRect, {
                        x: inch(el.x),
                        y: inch(el.y),
                        w: inch(el.w),
                        h: inch(el.h),
                        ...shapeFill(el.fill, el.opacity),
                        ...shapeLine(el.stroke, el.strokeWidth, el.opacity),
                        // pptx expresses corner radius as a fraction of the short side.
                        rectRadius: el.radius > 0 ? Math.min(0.5, el.radius / Math.min(el.w, el.h)) : 0,
                    });
                    break;
                case "ellipse":
                    slide.addShape(pptx.ShapeType.ellipse, {
                        x: inch(el.x),
                        y: inch(el.y),
                        w: inch(el.w),
                        h: inch(el.h),
                        ...shapeFill(el.fill, el.opacity),
                        ...shapeLine(el.stroke, el.strokeWidth, el.opacity),
                    });
                    break;
            }
        }
    }

    return pptx;
}

/** Server-side: returns a Buffer suitable for a download response. */
export async function slidesToPptxBuffer(
    slides: Slide[],
    opts: PptxOptions = {}
): Promise<Buffer> {
    const pptx = await buildDeck(slides, opts);
    return (await pptx.write({ outputType: "nodebuffer" as OutputKind })) as Buffer;
}

/** Browser-side: returns a Blob for a client download. */
export async function slidesToPptxBlob(
    slides: Slide[],
    opts: PptxOptions = {}
): Promise<Blob> {
    const pptx = await buildDeck(slides, opts);
    return (await pptx.write({ outputType: "blob" as OutputKind })) as Blob;
}
