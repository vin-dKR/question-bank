/**
 * Slide deck format for PPT generation.
 *
 * A *template* is an ordinary deck whose elements carry `bind` descriptors. Slides
 * marked `repeat` are stamped once per selected question, so a template of
 * [question, blank] over 20 questions yields 40 slides. Non-repeating slides are
 * emitted once and are how covers and end-cards work.
 *
 * Canvas is 1280x720 logical px. That is 13.333in x 7.5in at 96 px/in, which is
 * exactly PowerPoint's 16:9 widescreen, so every coordinate here maps 1:1 onto the
 * exported .pptx with no scaling.
 */

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
/** px per inch — the constant that makes the canvas map exactly onto a pptx slide. */
export const PX_PER_IN = 96;

/** Fields a bound element can pull from a question record. */
export type BindKey =
    | "index"
    | "exam"
    | "subject"
    | "topic"
    | "question"
    | "options"
    | "answer"
    /**
     * No column backs this in the Question model. It exists so a box can be
     * reserved as deliberate blank space for working a solution out live or by
     * hand later. Only meaningful with `when: "reserve"`.
     */
    | "solution"
    | "diagram";

/**
 * - `always`    fill it; render empty if the field is missing.
 * - `ifPresent` drop the element entirely when the field is empty, so an options
 *               box vanishes on numeric-answer questions instead of leaving a hole.
 * - `reserve`   keep the box and its styling but render no content. This is how
 *               blank space is expressed.
 */
export type BindWhen = "always" | "ifPresent" | "reserve";

export interface Bind {
    key: BindKey;
    when: BindWhen;
}

/**
 * Font stack by index — kept as indices so templates stay JSON-portable.
 *
 * IMPORTANT: only ever APPEND to this list. Saved templates store the numeric
 * index, so reordering would silently restyle every existing deck. The first five
 * are the original set; the rest are system/office fonts that both render in the
 * browser and exist in PowerPoint, so they round-trip cleanly to .pptx.
 */
export const FONTS = [
    "Inter",
    "Space Grotesk",
    "Playfair Display",
    "Georgia",
    "JetBrains Mono",
    "Arial",
    "Calibri",
    "Times New Roman",
    "Verdana",
    "Trebuchet MS",
    "Tahoma",
    "Courier New",
    "Comic Sans MS",
    "Garamond",
    "Segoe UI",
] as const;

/** An index into FONTS. Kept wide (number) so the list can grow without a retype. */
export type FontIndex = number;
/** 500 is included because medium reads better than regular for question bodies. */
export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800;
export type Align = "left" | "center" | "right";
export type VAlign = "top" | "center" | "bottom";
export type Fit = "cover" | "contain";

/**
 * Drop shadow, modelled on PowerPoint's own shadow so it maps 1:1 onto pptxgenjs
 * `ShadowProps`. `offset`/`blur` are px (converted to points on export), `angle` is
 * degrees (0 = right, 90 = down), `opacity` is 0..1.
 */
export interface Shadow {
    color: string;
    blur: number;
    offset: number;
    angle: number;
    opacity: number;
}

/** A two-stop linear gradient. `angle` is degrees, 0 = left→right. */
export interface Gradient {
    angle: number;
    from: string;
    to: string;
}

/**
 * Vector shapes beyond the primitive rect/ellipse/line. Every name here is a valid
 * pptxgenjs `ShapeType`, so export is a direct lookup; the editor draws each one as
 * an SVG (see lib/slides/shapes.ts).
 */
export const SHAPE_KINDS = [
    "triangle",
    "rtTriangle",
    "diamond",
    "parallelogram",
    "trapezoid",
    "pentagon",
    "hexagon",
    "octagon",
    "star4",
    "star5",
    "star6",
    "rightArrow",
    "leftArrow",
    "upArrow",
    "downArrow",
    "chevron",
    "homePlate",
    "plus",
    "heart",
    "cloud",
] as const;

export type ShapeKind = (typeof SHAPE_KINDS)[number];

interface ElementBase {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    opacity: number;
    /** Clockwise rotation in degrees. Purely visual; stored geometry is unrotated. */
    rotation?: number;
    /** Drop shadow, if any. */
    shadow?: Shadow;
    /**
     * Page furniture — frames, rules, accent bars, footers. Repeats untouched and
     * is never filled with data. Mutually exclusive with `bind`; see assertValid().
     */
    template: boolean;
    bind?: Bind;
}

export interface TextElement extends ElementBase {
    type: "text";
    text: string;
    fontSize: number;
    font: FontIndex;
    weight: FontWeight;
    italic: boolean;
    /** Underline the whole box. */
    underline?: boolean;
    /** Strike through the whole box. */
    strike?: boolean;
    /** Highlight colour behind the text, or "" / undefined for none. */
    highlight?: string;
    color: string;
    align: Align;
    valign: VAlign;
    lineHeight: number;
    tracking: number;
}

export interface RectElement extends ElementBase {
    type: "rect";
    fill: string;
    radius: number;
    stroke: string;
    strokeWidth: number;
}

export interface EllipseElement extends ElementBase {
    type: "ellipse";
    fill: string;
    stroke: string;
    strokeWidth: number;
}

export interface LineElement extends ElementBase {
    type: "line";
    stroke: string;
    /** `h` should equal this, so the hit box matches the drawn line. */
    strokeWidth: number;
}

export interface ImageElement extends ElementBase {
    type: "image";
    /** Data URL, or "" when the element is bound and filled at generation time. */
    src: string;
    fit: Fit;
    radius: number;
    /** Optional border. */
    stroke?: string;
    strokeWidth?: number;
    flipH?: boolean;
    flipV?: boolean;
}

/**
 * A vector shape from the extended library (triangle, star, arrow, …). rect and
 * ellipse stay as their own types for backward compatibility; everything else is a
 * ShapeElement keyed by `shape`.
 */
export interface ShapeElement extends ElementBase {
    type: "shape";
    shape: ShapeKind;
    fill: string;
    stroke: string;
    strokeWidth: number;
}

export type SlideElement =
    | TextElement
    | RectElement
    | EllipseElement
    | LineElement
    | ImageElement
    | ShapeElement;

export interface Slide {
    id: string;
    bg: string;
    /**
     * A gradient background. When set, the editor paints it as a live CSS gradient
     * and the export path uses `bgImage` (a rasterised copy of this gradient) so the
     * .pptx matches. Kept alongside `bgImage` purely so the gradient stays editable.
     */
    bgGradient?: Gradient;
    /**
     * Full-bleed background image, painted under every element. This is how a
     * coaching centre's own branded design is applied — either an uploaded image
     * or one lifted out of an uploaded .pptx. `bg` still shows through wherever
     * the image is absent or transparent.
     */
    bgImage?: string;
    /** Stamp this slide once per question. At least one slide must set it. */
    repeat?: boolean;
    /** Paint order — later elements sit on top. */
    elements: SlideElement[];
}

export type SlideTemplate = Slide[];

/** Only text and image elements can be bound. */
export function isBindable(el: SlideElement): el is TextElement | ImageElement {
    return el.type === "text" || el.type === "image";
}

/**
 * Structural checks that must hold for a template to generate sanely. Returns the
 * problems rather than throwing, so the editor can surface them inline.
 */
export function validateTemplate(tpl: SlideTemplate): string[] {
    const errors: string[] = [];

    if (!tpl.length) return ["template has no slides"];
    if (!tpl.some((s) => s.repeat)) {
        errors.push("no slide has repeat: true — nothing would be stamped per question");
    }

    const seen = new Set<string>();
    for (const slide of tpl) {
        if (seen.has(slide.id)) errors.push(`duplicate slide id "${slide.id}"`);
        seen.add(slide.id);

        for (const el of slide.elements) {
            const where = `${slide.id}/${el.id}`;
            if (seen.has(el.id)) errors.push(`duplicate element id "${where}"`);
            seen.add(el.id);

            if (el.template && el.bind) {
                errors.push(`${where}: an element cannot be both template shell and bound`);
            }
            if (el.bind && !isBindable(el)) {
                errors.push(`${where}: only text and image elements can be bound`);
            }
            if (el.bind?.key === "diagram" && el.type !== "image") {
                errors.push(`${where}: the diagram key needs an image element`);
            }
            if (el.w <= 0 || el.h <= 0) {
                errors.push(`${where}: zero or negative size`);
            }
            if (el.x < 0 || el.y < 0 || el.x + el.w > CANVAS_W || el.y + el.h > CANVAS_H) {
                errors.push(`${where}: extends outside the 1280x720 canvas`);
            }
        }
    }

    return errors;
}
