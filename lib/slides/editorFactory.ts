/**
 * Element and slide constructors for the PPT template maker.
 *
 * Each "block" in the palette is a normal element with a `bind` already set, so
 * dropping a "Question" block onto the canvas creates a box that will be filled
 * with question_text at generation time. Shapes and static text carry no bind and
 * are marked `template: true` — page furniture that repeats untouched.
 */
import type {
    Bind,
    BindKey,
    ImageElement,
    LineElement,
    RectElement,
    ShapeElement,
    ShapeKind,
    Slide,
    SlideElement,
    TextElement,
} from "@/types/slides";
import { CANVAS_H, CANVAS_W } from "@/types/slides";
import type { Theme } from "./presets";

let seq = 0;
/** Unique within a session; the timestamp keeps ids distinct across reloads. */
export function newId(prefix: string): string {
    seq += 1;
    return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export interface PaletteBlock {
    key: string;
    label: string;
    hint: string;
    /** Grouping in the palette UI. */
    group: "content" | "static";
    make: (theme: Theme) => SlideElement;
}

function text(
    id: string,
    box: { x: number; y: number; w: number; h: number },
    o: Partial<TextElement> & { color: string; fontSize: number }
): TextElement {
    return {
        id,
        type: "text",
        ...box,
        opacity: 1,
        template: false,
        text: "",
        font: 0,
        weight: 400,
        italic: false,
        align: "left",
        valign: "top",
        lineHeight: 1.4,
        tracking: 0,
        ...o,
    };
}

/** Centre a new element so it lands somewhere visible regardless of slide state. */
const centred = (w: number, h: number) => ({
    x: Math.round((CANVAS_W - w) / 2),
    y: Math.round((CANVAS_H - h) / 2),
    w,
    h,
});

const bind = (key: BindKey, when: Bind["when"] = "always"): Bind => ({ key, when });

export const PALETTE: PaletteBlock[] = [
    {
        key: "question",
        label: "Question",
        hint: "The question text. Give it the most room.",
        group: "content",
        make: (t) =>
            text(newId("question"), { x: 96, y: 132, w: 1088, h: 220 }, {
                color: t.ink,
                fontSize: 34,
                weight: 500,
                lineHeight: 1.35,
                bind: bind("question"),
            }),
    },
    {
        key: "options",
        label: "Options",
        hint: "Disappears on questions that have none.",
        group: "content",
        make: (t) =>
            text(newId("options"), { x: 96, y: 380, w: 1088, h: 230 }, {
                color: t.body,
                fontSize: 26,
                lineHeight: 1.6,
                bind: bind("options", "ifPresent"),
            }),
    },
    {
        key: "answer",
        label: "Answer",
        hint: "The correct answer, shown large.",
        group: "content",
        make: (t) =>
            text(newId("answer"), { x: 96, y: 200, w: 1088, h: 120 }, {
                color: t.accent,
                fontSize: 60,
                font: 2,
                weight: 700,
                valign: "center",
                lineHeight: 1.2,
                bind: bind("answer"),
            }),
    },
    {
        key: "blank",
        label: "Blank space",
        hint: "Reserved empty area to work the solution into.",
        group: "content",
        make: (t) =>
            text(newId("blank"), { x: 96, y: 184, w: 1088, h: 430 }, {
                color: t.body,
                fontSize: 24,
                lineHeight: 1.5,
                bind: bind("solution", "reserve"),
            }),
    },
    {
        key: "index",
        label: "Question number",
        hint: "Q1., Q2., … numbered by position.",
        group: "content",
        make: (t) =>
            text(newId("index"), { x: 96, y: 52, w: 300, h: 40 }, {
                color: t.accent,
                fontSize: 24,
                font: 4,
                weight: 600,
                valign: "center",
                tracking: 1,
                bind: bind("index"),
            }),
    },
    {
        key: "topic",
        label: "Topic / chapter",
        hint: "Hidden when the question has no topic.",
        group: "content",
        make: (t) =>
            text(newId("topic"), { x: 700, y: 52, w: 484, h: 40 }, {
                color: t.muted,
                fontSize: 16,
                weight: 600,
                align: "right",
                valign: "center",
                tracking: 2,
                bind: bind("topic", "ifPresent"),
            }),
    },
    {
        key: "subject",
        label: "Subject",
        hint: "The question's subject.",
        group: "content",
        make: (t) =>
            text(newId("subject"), { x: 96, y: 96, w: 400, h: 34 }, {
                color: t.muted,
                fontSize: 15,
                weight: 600,
                valign: "center",
                tracking: 2,
                bind: bind("subject", "ifPresent"),
            }),
    },
    {
        key: "diagram",
        label: "Question image",
        hint: "The question's figure. Hidden when absent.",
        group: "content",
        make: () => {
            const el: ImageElement = {
                id: newId("diagram"),
                type: "image",
                ...centred(460, 280),
                opacity: 1,
                template: false,
                src: "",
                fit: "contain",
                radius: 4,
                bind: bind("diagram", "ifPresent"),
            };
            return el;
        },
    },
    {
        key: "title",
        label: "Title / label",
        hint: "Fixed text — a heading that repeats on every slide.",
        group: "static",
        make: (t) =>
            text(newId("title"), { x: 96, y: 132, w: 700, h: 60 }, {
                color: t.ink,
                fontSize: 40,
                font: 1,
                weight: 700,
                valign: "center",
                text: "Title",
                template: true,
            }),
    },
    {
        key: "rect",
        label: "Box / bar",
        hint: "A filled or outlined rectangle.",
        group: "static",
        make: (t) => {
            const el: RectElement = {
                id: newId("rect"),
                type: "rect",
                ...centred(400, 200),
                opacity: 1,
                template: true,
                fill: t.accent,
                radius: 8,
                stroke: "",
                strokeWidth: 0,
            };
            return el;
        },
    },
    {
        key: "line",
        label: "Divider",
        hint: "A horizontal rule.",
        group: "static",
        make: (t) => {
            const el: LineElement = {
                id: newId("line"),
                type: "line",
                x: 96,
                y: 360,
                w: 1088,
                h: 2,
                opacity: 1,
                template: true,
                stroke: t.faint,
                strokeWidth: 2,
            };
            return el;
        },
    },
];

/** A blank, unbound text box for the Insert menu. */
export function makeTextBox(theme: Theme): TextElement {
    return text(newId("text"), centred(520, 120), {
        color: theme.ink,
        fontSize: 28,
        weight: 500,
        text: "Text",
        template: true,
    });
}

/** A blank image placeholder the user fills from their own device. */
export function makeImageBox(): ImageElement {
    return {
        id: newId("image"),
        type: "image",
        ...centred(420, 300),
        opacity: 1,
        template: true,
        src: "",
        fit: "contain",
        radius: 4,
    };
}

/** A shape from the extended library, filled with the theme accent. */
export function makeShape(kind: ShapeKind, theme: Theme): ShapeElement {
    return {
        id: newId("shape"),
        type: "shape",
        shape: kind,
        ...centred(300, 220),
        opacity: 1,
        template: true,
        fill: theme.accent,
        stroke: "",
        strokeWidth: 0,
    };
}

/** A slide with just the accent bar, as a starting point. */
export function newSlide(theme: Theme, repeat = true): Slide {
    const bar: RectElement = {
        id: newId("bar"),
        type: "rect",
        x: 0,
        y: 0,
        w: CANVAS_W,
        h: 10,
        opacity: 1,
        template: true,
        fill: theme.accent,
        radius: 0,
        stroke: "",
        strokeWidth: 0,
    };
    return { id: newId("slide"), bg: theme.bg, repeat, elements: [bar] };
}

/** Duplicate an element, offset slightly so the copy is visible. */
export function duplicateElement(el: SlideElement): SlideElement {
    return {
        ...el,
        id: newId(el.type),
        x: Math.min(el.x + 24, CANVAS_W - el.w),
        y: Math.min(el.y + 24, CANVAS_H - el.h),
    };
}

/** Re-colour a whole deck when the theme changes, leaving geometry alone. */
export function recolourForTheme(slides: Slide[], from: Theme, to: Theme): Slide[] {
    const map: Record<string, string> = {
        [from.bg.toLowerCase()]: to.bg,
        [from.accent.toLowerCase()]: to.accent,
        [from.ink.toLowerCase()]: to.ink,
        [from.body.toLowerCase()]: to.body,
        [from.muted.toLowerCase()]: to.muted,
        [from.faint.toLowerCase()]: to.faint,
    };
    const swap = (c: string) => map[c?.toLowerCase()] ?? c;

    return slides.map((s) => ({
        ...s,
        bg: swap(s.bg),
        elements: s.elements.map((el) => {
            const next = { ...el } as SlideElement;
            if (next.type === "text") next.color = swap(next.color);
            if (next.type === "rect" || next.type === "ellipse" || next.type === "shape") {
                next.fill = swap(next.fill);
                next.stroke = swap(next.stroke);
            }
            if (next.type === "line") next.stroke = swap(next.stroke);
            return next;
        }),
    }));
}
