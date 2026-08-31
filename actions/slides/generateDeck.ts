"use server";

/**
 * Builds a .pptx from the questions the user has selected.
 *
 * Runs on the server because the exporter fetches diagram images from Supabase and
 * pptxgenjs produces a Node Buffer. The buffer comes back base64-encoded — server
 * actions cannot return a Buffer directly.
 *
 * Questions are sent from the client rather than re-fetched by id: the selection
 * already lives in memory there, it may mix sources (bank, folder, drafts), and a
 * refetch would silently drop anything not in the Question collection.
 */
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guard";
import { AuthError } from "@/lib/auth/session";
import { PRESETS, getTheme, applySlotMapping } from "@/lib/slides/presets";
import { templateToSlides } from "@/lib/slides/generate";
import { slidesToPptxBuffer } from "@/lib/slides/pptx";
import { createLatexRasterizer, type LatexRasterizer } from "@/lib/slides/latexRaster";
import { validateTemplate, type BindKey, type SlideTemplate } from "@/types/slides";

/** The fields the binder reads. Kept narrow to keep the action payload small. */
export interface DeckQuestion {
    id: string;
    question_number?: number | null;
    question_text: string;
    options?: string[] | null;
    answer?: string | null;
    subject?: string | null;
    topic?: string | null;
    chapter?: string | null;
    exam_name?: string | null;
    question_image?: string | null;
    isOptionImage?: boolean | null;
}

export interface GenerateDeckInput {
    questions: DeckQuestion[];
    /** A built-in layout. Ignored when savedTemplateId is given. */
    presetId: string;
    themeId: string;
    /** elementId -> bind key, from the "what goes where" step. */
    mapping?: Record<string, BindKey | null>;
    /** Used for the download filename. */
    deckName?: string;
    /** A layout built in the PPT template maker; takes precedence over presetId. */
    savedTemplateId?: string;
}

export type GenerateDeckResult =
    | { success: true; data: string; filename: string; slideCount: number }
    | { success: false; error: string };

/** Guardrail: a huge selection would blow the action's time and memory budget. */
const MAX_QUESTIONS = 200;

export async function generateDeck(input: GenerateDeckInput): Promise<GenerateDeckResult> {
    try {
        const user = await requireUser();

        const { questions, presetId, themeId, mapping, deckName, savedTemplateId } = input;

        if (!questions?.length) {
            return { success: false, error: "Select at least one question." };
        }
        if (questions.length > MAX_QUESTIONS) {
            return {
                success: false,
                error: `Too many questions (${questions.length}). The limit is ${MAX_QUESTIONS} per deck.`,
            };
        }

        let template: SlideTemplate;
        let layoutId = presetId;

        if (savedTemplateId) {
            // Org-scoped so a template id from another tenant cannot be read.
            // Admins have no org and address their own rows by author instead.
            const scope = user.organizationId
                ? { organizationId: user.organizationId }
                : { organizationId: null, userId: user.userId };

            const saved = await prisma.slideTemplate.findFirst({
                where: { id: savedTemplateId, ...scope },
                select: { name: true, slides: true },
            });

            if (!saved) return { success: false, error: "That template no longer exists." };
            template = saved.slides as unknown as SlideTemplate;
            layoutId = saved.name.replace(/[^\w.-]+/g, "-").toLowerCase();
        } else {
            const theme = getTheme(themeId);
            const preset = PRESETS(theme).find((p) => p.id === presetId);
            if (!preset) return { success: false, error: `Unknown layout "${presetId}".` };
            template = mapping ? applySlotMapping(preset.slides, mapping) : preset.slides;
        }

        const problems = validateTemplate(template);
        if (problems.length) {
            console.error("[generateDeck] invalid template:", problems);
            return { success: false, error: `Layout is invalid: ${problems[0]}` };
        }

        const slides = templateToSlides(template, questions as unknown as Question[]);

        // Math is baked to images so PowerPoint shows equations rather than raw
        // \(...\). If the renderer cannot start (no Chromium, say), export still
        // succeeds with the LaTeX source visible rather than failing outright.
        let latex: LatexRasterizer | null = null;
        try {
            latex = await createLatexRasterizer();
        } catch (err) {
            console.warn("[generateDeck] LaTeX renderer unavailable:", err);
        }

        let buffer: Buffer;
        try {
            buffer = await slidesToPptxBuffer(slides, {
                title: deckName || "Question deck",
                subject: questions[0]?.subject ?? "Question bank",
                rasterizeLatex: latex?.rasterize,
            });
        } finally {
            await latex?.close();
        }

        const safe = (deckName || "questions").replace(/[^\w.-]+/g, "-").toLowerCase();

        return {
            success: true,
            data: buffer.toString("base64"),
            filename: `${safe}-${layoutId}.pptx`,
            slideCount: slides.length,
        };
    } catch (err) {
        console.error("[generateDeck] failed:", err);
        if (err instanceof AuthError) return { success: false, error: "Not signed in." };
        return {
            success: false,
            error: err instanceof Error ? err.message : "Could not generate the deck.",
        };
    }
}
