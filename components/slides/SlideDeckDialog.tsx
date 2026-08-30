"use client";

/**
 * "Make slides" flow: pick a layout and theme, choose which question field lands
 * in which box, then download a .pptx.
 *
 * Geometry is fixed by the chosen layout — the user assigns fields to boxes rather
 * than drawing them. That keeps generated decks presentable while still answering
 * "where does the question go".
 *
 * Only client-safe modules are imported here; the exporter (pptxgenjs) stays on
 * the server behind the generateDeck action.
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PRESETS, THEMES, getTheme, applySlotMapping } from "@/lib/slides/presets";
import { slideCount, templateToSlides } from "@/lib/slides/generate";
import SlideCanvas from "@/components/dashboard/slide-templates/SlideCanvas";
import { useSlideDeck } from "@/hooks/slides/useSlideDeck";
import { listSlideTemplates, type StoredSlideTemplate } from "@/actions/slides/slideTemplates";
import { slideCount as countSlides } from "@/lib/slides/generate";
import type { BindKey } from "@/types/slides";
import { cn } from "@/lib/utils";

/** Human labels for the bind keys shown in the slot dropdowns. */
const KEY_LABELS: Record<BindKey, string> = {
    index: "Question number",
    exam: "Exam name",
    subject: "Subject",
    topic: "Topic / chapter",
    question: "Question text",
    options: "Options",
    answer: "Answer",
    solution: "Blank space",
    diagram: "Question image",
};

const NONE = "__none__";

/** How many preview thumbnails to mount before falling back to a count. */
const THUMB_LIMIT = 24;

interface Props {
    selectedQuestions: Question[];
    /** Used for the download filename. */
    deckName?: string;
    disabled?: boolean;
    triggerClassName?: string;
}

export default function SlideDeckDialog({ selectedQuestions, deckName, disabled, triggerClassName }: Props) {
    const [open, setOpen] = useState(false);
    const [themeId, setThemeId] = useState("midnight");
    const [presetId, setPresetId] = useState("practice");
    const [savedId, setSavedId] = useState<string | null>(null);
    const [saved, setSaved] = useState<StoredSlideTemplate[]>([]);
    const [mapping, setMapping] = useState<Record<string, BindKey | null>>({});
    const [step, setStep] = useState<"choose" | "preview">("choose");
    const [slideIndex, setSlideIndex] = useState(0);

    const { generate, isGenerating } = useSlideDeck();

    // Templates built in the PPT template maker, offered alongside the built-ins.
    useEffect(() => {
        if (!open) return;
        listSlideTemplates().then((res) => {
            if (res.success) setSaved(res.data);
        });
    }, [open]);

    const presets = useMemo(() => PRESETS(getTheme(themeId)), [themeId]);
    const preset = presets.find((p) => p.id === presetId) ?? presets[0];
    const savedTemplate = saved.find((t) => t.id === savedId) ?? null;

    const count = selectedQuestions.length;
    const slides = savedTemplate
        ? countSlides(savedTemplate.slides, count)
        : preset
          ? slideCount(preset.slides, count)
          : 0;

    /**
     * The deck exactly as it will be exported. templateToSlides is pure, so the
     * preview is built on the client from the same code the server uses — no
     * round trip, and no risk of preview and output drifting apart.
     */
    const previewSlides = useMemo(() => {
        if (step !== "preview") return [];
        const template = savedTemplate
            ? savedTemplate.slides
            : preset
              ? applySlotMapping(preset.slides, mapping)
              : null;
        if (!template) return [];
        return templateToSlides(template, selectedQuestions);
    }, [step, savedTemplate, preset, mapping, selectedQuestions]);

    const openPreview = () => {
        setSlideIndex(0);
        setStep("preview");
    };

    // Switching layout invalidates slot ids, so mappings start fresh.
    const choosePreset = (id: string) => {
        setPresetId(id);
        setSavedId(null);
        setMapping({});
    };

    /** A saved template already encodes its own layout, so slot mapping is moot. */
    const chooseSaved = (id: string) => {
        setSavedId(id);
        setMapping({});
    };

    /** What a slot is currently bound to — the user's choice, else the default. */
    const slotValue = (elementId: string): string => {
        if (elementId in mapping) return mapping[elementId] ?? NONE;
        for (const slide of preset.slides) {
            const el = slide.elements.find((e) => e.id === elementId);
            if (el?.bind) return el.bind.key;
        }
        return NONE;
    };

    const onGenerate = async () => {
        const ok = await generate({
            questions: selectedQuestions,
            presetId,
            themeId,
            mapping: savedId ? undefined : mapping,
            deckName,
            savedTemplateId: savedId ?? undefined,
        });
        if (ok) {
            setOpen(false);
            setStep("choose");
        }
    };

    // Reset to the chooser whenever the dialog is dismissed, so reopening does not
    // land the user back in a stale preview.
    const onOpenChange = (v: boolean) => {
        setOpen(v);
        if (!v) setStep("choose");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled || count === 0}
                    className={cn("w-full md:w-auto", triggerClassName)}
                >
                    <Presentation className="size-4" />
                    <span className="text-xs sm:text-sm text-nowrap">Make Slides</span>
                </Button>
            </DialogTrigger>

            <DialogContent
                className={`w-[calc(100vw-2rem)] overflow-x-hidden ${
                    step === "preview"
                        ? // Fixed height + flex column: the slide flexes to whatever
                          // is left, so the whole step fits without scrolling.
                          // Tighter padding/gap than the base grid, to buy the slide room.
                          "sm:max-w-5xl h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden gap-3 p-4"
                        : "sm:max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain"
                }`}
            >
                <DialogHeader className="shrink-0">
                    <DialogTitle>{step === "preview" ? "Preview" : "Make slides"}</DialogTitle>
                    <DialogDescription>
                        {step === "preview"
                            ? "Exactly what the .pptx will contain. Go back to change the layout."
                            : "Pick a layout, then choose what goes in each box. One group of slides is created per question."}
                    </DialogDescription>
                </DialogHeader>

                <div className={`space-y-5 ${step === "preview" ? "hidden" : ""}`}>
                    {/* Templates built in the PPT template maker */}
                    {saved.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Your templates</Label>
                            <div className="grid gap-2">
                                {saved.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => chooseSaved(t.id)}
                                        className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                                            t.id === savedId
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-zinc-200 hover:border-zinc-300"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-sm font-medium text-zinc-800">
                                                {t.name}
                                            </span>
                                            <span className="text-[11px] text-zinc-500 text-nowrap">
                                                {t.slides.filter((s) => s.repeat).length} slide
                                                {t.slides.filter((s) => s.repeat).length > 1 ? "s" : ""} per question
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Layout */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            {saved.length > 0 ? "Or a built-in layout" : "Layout"}
                        </Label>
                        <div className="grid gap-2">
                            {presets.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => choosePreset(p.id)}
                                    className={`text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                                        p.id === presetId && !savedId
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-zinc-200 hover:border-zinc-300"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-zinc-800">
                                            {p.name}
                                        </span>
                                        <span className="text-[11px] text-zinc-500 text-nowrap">
                                            {p.slides.length} slide{p.slides.length > 1 ? "s" : ""} per question
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme — a saved template carries its own colours. */}
                    <div className={`space-y-2 ${savedId ? "hidden" : ""}`}>
                        <Label className="text-sm font-medium">Theme</Label>
                        <div className="flex gap-2">
                            {THEMES.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setThemeId(t.id)}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                                        t.id === themeId
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-zinc-200 hover:border-zinc-300"
                                    }`}
                                >
                                    <span
                                        className="size-4 rounded-full border border-black/10"
                                        style={{ background: t.bg }}
                                    />
                                    <span
                                        className="size-4 rounded-full border border-black/10"
                                        style={{ background: t.accent }}
                                    />
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* What goes where — a saved template already defines this. */}
                    <div className={`space-y-2 ${savedId ? "hidden" : ""}`}>
                        <Label className="text-sm font-medium">What goes where</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {preset.slots.map((slot) => (
                                <div key={slot.elementId} className="space-y-1">
                                    <div className="text-xs font-medium text-zinc-700">
                                        {slot.label}
                                    </div>
                                    <Select
                                        value={slotValue(slot.elementId)}
                                        onValueChange={(v) =>
                                            setMapping((m) => ({
                                                ...m,
                                                [slot.elementId]: v === NONE ? null : (v as BindKey),
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {slot.allowed.map((k) => (
                                                <SelectItem key={k} value={k}>
                                                    {KEY_LABELS[k]}
                                                </SelectItem>
                                            ))}
                                            <SelectItem value={NONE}>Leave empty</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-zinc-500">{slot.hint}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                {step === "preview" && (
                    <div className="flex-1 min-h-0 flex flex-col gap-2">
                        {/* min-h-0 lets this shrink below its content, which is what
                            allows the canvas to be bounded by the row instead of
                            pushing the dialog taller. */}
                        <div className="flex-1 min-h-0 rounded-lg bg-zinc-100 p-2 flex items-center justify-center">
                            {previewSlides[slideIndex] && (
                                <SlideCanvas
                                    slide={previewSlides[slideIndex]}
                                    selectedId={null}
                                    onSelect={() => {}}
                                    onChange={() => {}}
                                    fitHeight
                                    readOnly
                                />
                            )}
                        </div>

                        <div className="shrink-0 flex items-center justify-center gap-3">
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                                disabled={slideIndex === 0}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-xs text-zinc-600 tabular-nums">
                                Slide {slideIndex + 1} of {previewSlides.length}
                            </span>
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                    setSlideIndex((i) => Math.min(previewSlides.length - 1, i + 1))
                                }
                                disabled={slideIndex >= previewSlides.length - 1}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>

                        {/* Thumbnail strip — jump straight to any slide. Capped, because
                            a 200-question deck would otherwise mount hundreds of canvases. */}
                        <div className="shrink-0 flex gap-2 overflow-x-auto pb-1">
                            {previewSlides.slice(0, THUMB_LIMIT).map((s, i) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSlideIndex(i)}
                                    className={`shrink-0 rounded border-2 cursor-pointer ${
                                        i === slideIndex ? "border-indigo-500" : "border-transparent"
                                    }`}
                                >
                                    <div className="pointer-events-none">
                                        <SlideCanvas
                                            slide={s}
                                            selectedId={null}
                                            onSelect={() => {}}
                                            onChange={() => {}}
                                            width={96}
                                            readOnly
                                        />
                                    </div>
                                </button>
                            ))}
                            {previewSlides.length > THUMB_LIMIT && (
                                <span className="shrink-0 self-center text-[11px] text-zinc-500 px-2">
                                    +{previewSlides.length - THUMB_LIMIT} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter className="shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-zinc-500">
                        {count} question{count === 1 ? "" : "s"} → <strong>{slides} slides</strong>
                    </span>

                    {step === "choose" ? (
                        <Button onClick={openPreview} disabled={count === 0}>
                            Preview slides
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setStep("choose")}>
                                Back
                            </Button>
                            <Button onClick={onGenerate} disabled={isGenerating || count === 0}>
                                {isGenerating ? "Generating…" : "Download .pptx"}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
