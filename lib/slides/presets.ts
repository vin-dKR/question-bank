/**
 * Default slide layouts offered at the "what goes where" step.
 *
 * A preset is an ordinary SlideTemplate plus a `slots` descriptor naming the boxes
 * a user is allowed to reassign. The geometry stays fixed — the user chooses which
 * field lands in which box, not where the boxes are. That keeps a generated deck
 * hard to make ugly while still answering "where does the question go".
 */
import type {
    Align,
    Bind,
    BindKey,
    FontIndex,
    FontWeight,
    ImageElement,
    RectElement,
    Slide,
    SlideTemplate,
    TextElement,
    VAlign,
} from "@/types/slides";

export interface Theme {
    id: string;
    name: string;
    bg: string;
    accent: string;
    /** Question text and other primary copy. */
    ink: string;
    /** Options, solutions — secondary copy. */
    body: string;
    /** Labels and identity strip. */
    muted: string;
    /** Footers, rules — barely there. */
    faint: string;
}

export const THEMES: Theme[] = [
    {
        id: "midnight",
        name: "Midnight",
        bg: "#0E1116",
        accent: "#E0A83E",
        ink: "#FFFFFF",
        body: "#D7DCE3",
        muted: "#8A929E",
        faint: "#5B6472",
    },
    {
        id: "paper",
        name: "Paper",
        bg: "#FFFFFF",
        accent: "#1D4ED8",
        ink: "#0B1220",
        body: "#243244",
        muted: "#5B6472",
        faint: "#AEB6C2",
    },
];

/** A box the user may reassign at the "what goes where" step. */
export interface LayoutSlot {
    /** The element this slot controls. */
    elementId: string;
    label: string;
    hint: string;
    /** Keys that make sense in this box, for the dropdown. */
    allowed: BindKey[];
}

export interface LayoutPreset {
    id: string;
    name: string;
    description: string;
    /** Slides per question, in order. */
    slides: SlideTemplate;
    slots: LayoutSlot[];
}

// ---------------------------------------------------------------------------
// builders — keep the layouts below readable
// ---------------------------------------------------------------------------

interface TextOpts {
    size: number;
    color: string;
    font?: FontIndex;
    weight?: FontWeight;
    align?: Align;
    valign?: VAlign;
    lineHeight?: number;
    tracking?: number;
    text?: string;
    bind?: Bind;
    shell?: boolean;
    italic?: boolean;
}

function text(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    o: TextOpts
): TextElement {
    return {
        id,
        type: "text",
        x,
        y,
        w,
        h,
        opacity: 1,
        template: o.shell ?? false,
        text: o.text ?? "",
        fontSize: o.size,
        font: o.font ?? 0,
        weight: o.weight ?? 400,
        italic: o.italic ?? false,
        color: o.color,
        align: o.align ?? "left",
        valign: o.valign ?? "top",
        lineHeight: o.lineHeight ?? 1.4,
        tracking: o.tracking ?? 0,
        ...(o.bind ? { bind: o.bind } : {}),
    };
}

function rect(
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    opts: { radius?: number; stroke?: string; strokeWidth?: number; opacity?: number } = {}
): RectElement {
    return {
        id,
        type: "rect",
        x,
        y,
        w,
        h,
        opacity: opts.opacity ?? 1,
        template: true,
        fill,
        radius: opts.radius ?? 0,
        stroke: opts.stroke ?? "",
        strokeWidth: opts.strokeWidth ?? 0,
    };
}

function image(id: string, x: number, y: number, w: number, h: number, bind: Bind): ImageElement {
    return {
        id,
        type: "image",
        x,
        y,
        w,
        h,
        opacity: 1,
        template: false,
        src: "",
        fit: "contain",
        radius: 4,
        bind,
    };
}

/** The identity strip every slide carries: accent bar, question number, topic. */
function header(t: Theme, suffix: string): (RectElement | TextElement)[] {
    return [
        rect(`bar-${suffix}`, 0, 0, 1280, 10, t.accent),
        text(`idx-${suffix}`, 96, 52, 300, 40, {
            size: 24,
            font: 4,
            weight: 600,
            color: t.accent,
            valign: "center",
            tracking: 1,
            bind: { key: "index", when: "always" },
        }),
        text(`topic-${suffix}`, 700, 52, 484, 40, {
            size: 16,
            weight: 600,
            color: t.muted,
            align: "right",
            valign: "center",
            tracking: 2,
            bind: { key: "topic", when: "ifPresent" },
        }),
    ];
}

function footer(t: Theme, suffix: string, label: string): TextElement {
    return text(`foot-${suffix}`, 96, 654, 600, 30, {
        size: 13,
        font: 4,
        weight: 600,
        color: t.faint,
        valign: "center",
        tracking: 3,
        text: label,
        shell: true,
    });
}

// ---------------------------------------------------------------------------
// slide shapes
// ---------------------------------------------------------------------------

/**
 * Question on top, options lower-left, figure lower-right.
 *
 * The figure box is `ifPresent`, so it vanishes on text-only questions — which
 * leaves the options using the left half only. That is the deliberate trade of a
 * fixed-geometry deck: boxes cannot reflow, and silently having nowhere to put a
 * diagram is worse than a half-width options column. Most of the bank carries
 * figures, so this is the layout that suits it.
 */
function questionSlide(t: Theme, footerLabel: string): Slide {
    return {
        id: "s-question",
        bg: t.bg,
        repeat: true,
        elements: [
            ...header(t, "q"),
            text("body", 96, 132, 1088, 190, {
                size: 32,
                weight: 500,
                color: t.ink,
                lineHeight: 1.35,
                bind: { key: "question", when: "always" },
            }),
            text("opts", 96, 346, 592, 270, {
                size: 24,
                color: t.body,
                lineHeight: 1.6,
                bind: { key: "options", when: "ifPresent" },
            }),
            image("diagram", 720, 346, 464, 270, { key: "diagram", when: "ifPresent" }),
            footer(t, "q", footerLabel),
        ],
    };
}

/** Question + options across the full width, no figure. For text-only banks. */
function questionWideSlide(t: Theme, footerLabel: string): Slide {
    return {
        id: "s-question",
        bg: t.bg,
        repeat: true,
        elements: [
            ...header(t, "q"),
            text("body", 96, 132, 1088, 210, {
                size: 34,
                weight: 500,
                color: t.ink,
                lineHeight: 1.35,
                bind: { key: "question", when: "always" },
            }),
            text("opts", 96, 366, 1088, 250, {
                size: 26,
                color: t.body,
                lineHeight: 1.6,
                bind: { key: "options", when: "ifPresent" },
            }),
            footer(t, "q", footerLabel),
        ],
    };
}

/** Answer revealed large, with room beneath for talking through it. */
function answerSlide(t: Theme): Slide {
    return {
        id: "s-answer",
        bg: t.bg,
        repeat: true,
        elements: [
            ...header(t, "a"),
            text("alabel", 96, 132, 400, 36, {
                size: 15,
                font: 4,
                weight: 600,
                color: t.muted,
                valign: "center",
                tracking: 3,
                text: "ANSWER",
                shell: true,
            }),
            text("ans", 96, 184, 1088, 130, {
                size: 64,
                font: 2,
                weight: 700,
                color: t.accent,
                valign: "center",
                lineHeight: 1.2,
                bind: { key: "answer", when: "always" },
            }),
            rect("arule", 96, 348, 1088, 2, t.faint, { opacity: 0.5 }),
            text("awork", 96, 382, 1088, 234, {
                size: 24,
                color: t.body,
                lineHeight: 1.5,
                bind: { key: "solution", when: "reserve" },
            }),
            footer(t, "a", "ANSWER"),
        ],
    };
}

/**
 * A deliberately empty slide. Carries the question number so it stays anchored to
 * its question, and an outlined region to write the working into. The bound box
 * uses `reserve`, so it renders nothing but keeps its geometry.
 */
function blankSlide(t: Theme, label: string): Slide {
    return {
        id: "s-blank",
        bg: t.bg,
        repeat: true,
        elements: [
            ...header(t, "b"),
            text("blabel", 96, 132, 600, 36, {
                size: 15,
                font: 4,
                weight: 600,
                color: t.muted,
                valign: "center",
                tracking: 3,
                text: label,
                shell: true,
            }),
            rect("bbox", 96, 184, 1088, 432, "transparent", {
                radius: 10,
                stroke: t.faint,
                strokeWidth: 2,
                opacity: 0.55,
            }),
            text("bwork", 128, 212, 1024, 376, {
                size: 24,
                color: t.body,
                lineHeight: 1.5,
                bind: { key: "solution", when: "reserve" },
            }),
            footer(t, "b", label),
        ],
    };
}

// ---------------------------------------------------------------------------
// presets
// ---------------------------------------------------------------------------

const QUESTION_SLOTS: LayoutSlot[] = [
    {
        elementId: "body",
        label: "Main body",
        hint: "The largest box, upper-middle of the slide",
        allowed: ["question", "answer", "solution"],
    },
    {
        elementId: "opts",
        label: "Lower block",
        hint: "Beneath the body — disappears when the question has none",
        allowed: ["options", "answer", "solution"],
    },
    {
        elementId: "idx-q",
        label: "Top-left tag",
        hint: "Small identity tag in the header",
        allowed: ["index", "subject", "exam"],
    },
    {
        elementId: "topic-q",
        label: "Top-right tag",
        hint: "Right side of the header — hidden when empty",
        allowed: ["topic", "subject", "exam", "index"],
    },
];

/** The figure-aware layouts expose the image box as a slot too. */
const DIAGRAM_SLOTS: LayoutSlot[] = [
    ...QUESTION_SLOTS,
    {
        elementId: "diagram",
        label: "Right panel image",
        hint: "Figure area — hidden when the question has no image",
        allowed: ["diagram"],
    },
];

export const PRESETS: (theme: Theme) => LayoutPreset[] = (t) => [
    {
        id: "practice",
        name: "Question + blank",
        description:
            "Question on top, options left, the figure on the right — then an empty slide to work the solution out on.",
        slides: [questionSlide(t, "PRACTICE SET"), blankSlide(t, "SOLUTION")],
        slots: DIAGRAM_SLOTS,
    },
    {
        id: "practice-answer",
        name: "Question → answer → blank",
        description:
            "Question with its figure, then the answer revealed on its own slide, then an empty slide for the working.",
        slides: [questionSlide(t, "PRACTICE SET"), answerSlide(t), blankSlide(t, "WORKING")],
        slots: DIAGRAM_SLOTS,
    },
    {
        id: "wide",
        name: "Wide text, no figure",
        description:
            "Full-width question and options with no image area. Best when the questions carry no diagrams.",
        slides: [questionWideSlide(t, "PRACTICE SET"), blankSlide(t, "SOLUTION")],
        slots: QUESTION_SLOTS,
    },
];

export function getTheme(id: string): Theme {
    return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * Apply the user's "what goes where" choices, returning a new template with the
 * chosen bind keys written in. `mapping` is elementId -> key; a null value drops
 * the binding and leaves the box empty.
 */
export function applySlotMapping(
    tpl: SlideTemplate,
    mapping: Record<string, BindKey | null>
): SlideTemplate {
    return tpl.map((slide) => ({
        ...slide,
        elements: slide.elements.map((el) => {
            if (!(el.id in mapping)) return el;
            const key = mapping[el.id];
            if (key === null) {
                const next = { ...el };
                delete next.bind;
                return next;
            }
            // Preserve the box's existing `when` — that is layout intent, not a
            // field choice (an options box stays ifPresent whatever fills it).
            return { ...el, bind: { key, when: el.bind?.when ?? "always" } };
        }),
    }));
}
