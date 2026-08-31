/**
 * Stamps a slide template over the selected questions.
 *
 * Slides marked `repeat` form the per-question group and are emitted once per
 * question, in order. Non-repeating slides before the group are covers; those
 * after it are end-cards. Both are emitted once.
 *
 * The output is an ordinary deck: every `bind` has been resolved to literal text
 * or an image src and then stripped, so downstream renderers never see bindings.
 */
import type { BindKey, ImageElement, Slide, SlideElement, SlideTemplate, TextElement } from "@/types/slides";
import { resolveQuestionImage } from "@/lib/images";

export interface GenerateOptions {
    /**
     * How the `index` tag reads. Position is 1-based within the selection, which
     * is what a teacher expects on screen; question_number is the number carried
     * over from the source paper and is often not contiguous.
     */
    indexSource?: "position" | "question_number";
    /** Format for the index tag. `{n}` is replaced. */
    indexFormat?: string;
}

const DEFAULTS: Required<GenerateOptions> = {
    indexSource: "position",
    indexFormat: "Q{n}.",
};

/** Options already carrying their own (a) / (A) / A. / 1) style marker. */
const PREFIXED = /^\s*[([]?[a-dA-D1-4][).\]]\s*/;

/**
 * Detects LaTeX in a field. The delimiters mirror the MathJax config in
 * lib/jax/jaxUtils.ts — the bank's own records use \( \) far more often than
 * $ $, so matching only the dollar form misses nearly everything.
 */
export function hasLatex(s: string): boolean {
    return (
        /\\\([\s\S]+?\\\)/.test(s) || // \( ... \)  inline  — the common case here
        /\\\[[\s\S]+?\\\]/.test(s) || // \[ ... \]  display
        /\$\$[\s\S]+?\$\$/.test(s) || // $$ ... $$  display
        /\$[^$\n]+\$/.test(s) //        $ ... $     inline
    );
}

/**
 * Resolve a diagram reference to a fetchable URL. Bare object names from the older
 * ingest are rebuilt against the Supabase bucket, the same as everywhere else in
 * the app — see lib/images.ts.
 */
export function resolveImage(src: string | null | undefined): string {
    return resolveQuestionImage(src) ?? "";
}

function formatOptions(q: Question): string {
    // `isOptionImage` means images exist, not that the text is unusable — records
    // routinely carry both, so prefer the text and fall back to dropping the box
    // only when there is genuinely nothing to typeset. Rendering the images
    // themselves is not supported yet.
    const opts = q.options ?? [];
    if (!opts.length) return "";

    return opts
        .map((opt, i) => {
            const clean = (opt ?? "").trim();
            if (!clean) return "";
            return PREFIXED.test(clean)
                ? clean
                : `(${String.fromCharCode(97 + i)}) ${clean}`;
        })
        .filter(Boolean)
        .join("\n");
}

function resolve(
    key: BindKey,
    q: Question,
    position: number,
    opts: Required<GenerateOptions>
): string {
    switch (key) {
        case "index": {
            const n = opts.indexSource === "position" ? position : q.question_number;
            return opts.indexFormat.replace("{n}", String(n ?? position));
        }
        case "exam":
            return q.exam_name ?? "";
        case "subject":
            return q.subject ?? "";
        case "topic":
            return q.topic ?? q.chapter ?? "";
        case "question":
            return q.question_text ?? "";
        case "options":
            return formatOptions(q);
        case "answer":
            return q.answer ?? "";
        case "diagram":
            return resolveImage(q.question_image);
        // No column backs this — it exists so a box can be reserved as blank space.
        case "solution":
            return "";
        default:
            return "";
    }
}

/** Fill one element from a question, or return null to drop it. */
function stampElement(
    el: SlideElement,
    q: Question,
    position: number,
    opts: Required<GenerateOptions>
): SlideElement | null {
    // Shell furniture repeats untouched.
    if (!el.bind) return { ...el };

    const { key, when } = el.bind;
    const value = resolve(key, q, position, opts);

    if (when === "ifPresent" && !value.trim()) return null;

    const next = { ...el } as SlideElement;
    delete next.bind;

    if (when === "reserve") {
        // Keep the box and its styling, render nothing into it.
        if (next.type === "text") (next as TextElement).text = "";
        if (next.type === "image") (next as ImageElement).src = "";
        return next;
    }

    if (next.type === "text") (next as TextElement).text = value;
    else if (next.type === "image") (next as ImageElement).src = value;

    return next;
}

function stampSlide(
    slide: Slide,
    q: Question,
    position: number,
    opts: Required<GenerateOptions>
): Slide {
    return {
        // Spread first so slide-level presentation (bgImage, and anything added
        // later) carries through; only the fields below are recomputed. Listing
        // fields explicitly silently dropped the background.
        ...slide,
        // Unique per stamped copy so ids stay unique across the whole deck.
        id: `${slide.id}-${position}`,
        repeat: undefined,
        elements: slide.elements
            .map((el) => stampElement(el, q, position, opts))
            .filter((el): el is SlideElement => el !== null)
            .map((el, i) => ({ ...el, id: `${el.id}-${position}-${i}` })),
    };
}

/** Strip bindings from a slide that is emitted once (covers, end-cards). */
function staticSlide(slide: Slide): Slide {
    return {
        // Spread first, for the same reason as stampSlide.
        ...slide,
        repeat: undefined,
        elements: slide.elements.map((el) => {
            const next = { ...el };
            delete next.bind;
            return next;
        }),
    };
}

export function templateToSlides(
    template: SlideTemplate,
    questions: Question[],
    options: GenerateOptions = {}
): Slide[] {
    const opts = { ...DEFAULTS, ...options };

    const firstRepeat = template.findIndex((s) => s.repeat);
    if (firstRepeat === -1) {
        // Nothing to stamp — emit the template as a plain deck rather than nothing.
        return template.map(staticSlide);
    }

    const group = template.filter((s) => s.repeat);
    const before = template.filter((s, i) => !s.repeat && i < firstRepeat);
    const after = template.filter((s, i) => !s.repeat && i > firstRepeat);

    const out: Slide[] = before.map(staticSlide);

    questions.forEach((q, i) => {
        for (const slide of group) out.push(stampSlide(slide, q, i + 1, opts));
    });

    out.push(...after.map(staticSlide));
    return out;
}

/**
 * How many slides a given selection will produce — for the "this will generate N
 * slides" line in the confirm step, without building the deck.
 */
export function slideCount(template: SlideTemplate, questionCount: number): number {
    const repeats = template.filter((s) => s.repeat).length;
    const statics = template.length - repeats;
    return statics + repeats * questionCount;
}
