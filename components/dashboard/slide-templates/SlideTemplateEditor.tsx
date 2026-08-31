"use client";

/**
 * The PPT template maker.
 *
 * Left: the slides in this template. Middle: the editable canvas. Right: the
 * palette of boxes you can drop in, and the properties of whatever is selected.
 *
 * A slide marked "repeat per question" is stamped once for every selected question
 * at generation time; unmarked slides are emitted once and act as covers or
 * end-cards. At least one slide must repeat, which validateTemplate enforces.
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SlideCanvas from "./SlideCanvas";
import ElementInspector from "./ElementInspector";
import FormatBar from "./FormatBar";
import InsertPanel from "./InsertPanel";
import DesignPanel from "./DesignPanel";
import { THEMES, getTheme } from "@/lib/slides/presets";
import {
    PALETTE,
    duplicateElement,
    makeImageBox,
    makeShape,
    makeTextBox,
    newSlide,
    recolourForTheme,
} from "@/lib/slides/editorFactory";
import { saveSlideTemplate, type StoredSlideTemplate } from "@/actions/slides/slideTemplates";
import {
    validateTemplate,
    type ShapeKind,
    type Slide,
    type SlideElement,
    type SlideTemplate,
} from "@/types/slides";

interface Props {
    initial?: StoredSlideTemplate;
    onClose: () => void;
    onSaved: (t: StoredSlideTemplate) => void;
}

export default function SlideTemplateEditor({ initial, onClose, onSaved }: Props) {
    const [name, setName] = useState(initial?.name ?? "Untitled template");
    const [themeId, setThemeId] = useState(initial?.themeId ?? "midnight");
    const [slides, setSlides] = useState<SlideTemplate>(
        () => initial?.slides ?? [newSlide(getTheme(initial?.themeId ?? "midnight"))]
    );
    const [activeIndex, setActiveIndex] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    /** Right-hand panel: Insert boxes, Design the background, or Format the selection. */
    const [panelTab, setPanelTab] = useState<"insert" | "design" | "format">("insert");

    const theme = useMemo(() => getTheme(themeId), [themeId]);
    const slide: Slide | undefined = slides[activeIndex];
    const selected = slide?.elements.find((e) => e.id === selectedId) ?? null;
    const problems = useMemo(() => validateTemplate(slides), [slides]);

    const patchSlide = (index: number, patch: Partial<Slide>) =>
        setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

    const setElements = (elements: SlideElement[]) => patchSlide(activeIndex, { elements });

    const addElement = (el: SlideElement) => {
        if (!slide) return;
        setElements([...slide.elements, el]);
        setSelectedId(el.id);
        setPanelTab("format");
    };

    const addBlock = (blockKey: string) => {
        const block = PALETTE.find((b) => b.key === blockKey);
        if (!block) return;
        addElement(block.make(theme));
    };

    const addShape = (kind: ShapeKind) => addElement(makeShape(kind, theme));
    const addText = () => addElement(makeTextBox(theme));
    const addImage = () => addElement(makeImageBox());

    // Selecting a box jumps to its Format controls; deselecting frees the panel.
    const selectElement = (id: string | null) => {
        setSelectedId(id);
        if (id) setPanelTab("format");
    };

    const patchElement = (patch: Partial<SlideElement>) => {
        if (!slide || !selectedId) return;
        setElements(
            slide.elements.map((el) =>
                el.id === selectedId ? ({ ...el, ...patch } as SlideElement) : el
            )
        );
    };

    const removeElement = () => {
        if (!slide || !selectedId) return;
        setElements(slide.elements.filter((el) => el.id !== selectedId));
        setSelectedId(null);
    };

    const copyElement = () => {
        if (!slide || !selected) return;
        const copy = duplicateElement(selected);
        setElements([...slide.elements, copy]);
        setSelectedId(copy.id);
    };

    /** Paint order is array order, so z-changes are index swaps. */
    const reorder = (dir: 1 | -1) => {
        if (!slide || !selectedId) return;
        const i = slide.elements.findIndex((e) => e.id === selectedId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= slide.elements.length) return;
        const next = [...slide.elements];
        [next[i], next[j]] = [next[j], next[i]];
        setElements(next);
    };

    const addSlide = () => {
        setSlides((prev) => [...prev, newSlide(theme)]);
        setActiveIndex(slides.length);
        setSelectedId(null);
    };

    const duplicateSlide = (index: number) => {
        const src = slides[index];
        const copy: Slide = {
            ...src,
            id: `${src.id}-copy-${Date.now().toString(36)}`,
            elements: src.elements.map(duplicateElement).map((el, i) => ({
                ...el,
                // Undo the visual offset duplicateElement adds — a duplicated slide
                // should look identical, not nudged.
                x: src.elements[i].x,
                y: src.elements[i].y,
            })),
        };
        setSlides((prev) => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]);
        setActiveIndex(index + 1);
    };

    const removeSlide = (index: number) => {
        if (slides.length === 1) {
            toast.error("A template needs at least one slide.");
            return;
        }
        setSlides((prev) => prev.filter((_, i) => i !== index));
        setActiveIndex((prev) => Math.max(0, prev > index ? prev - 1 : Math.min(prev, slides.length - 2)));
        setSelectedId(null);
    };

    const changeTheme = (id: string) => {
        const next = getTheme(id);
        setSlides((prev) => recolourForTheme(prev, theme, next));
        setThemeId(id);
    };

    const onSave = async () => {
        if (problems.length) {
            toast.error(problems[0]);
            return;
        }
        setSaving(true);
        const res = await saveSlideTemplate({ id: initial?.id, name, themeId, slides });
        setSaving(false);

        if (!res.success) {
            toast.error(res.error);
            return;
        }
        toast.success("Template saved.");
        onSaved(res.data);
    };

    // Delete/Backspace removes the selection, unless a field has focus.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
                e.preventDefault();
                removeElement();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    });

    const repeatCount = slides.filter((s) => s.repeat).length;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <Button size="sm" variant="ghost" onClick={onClose}>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 w-56 font-medium"
                        placeholder="Template name"
                    />
                </div>

                <Button size="sm" onClick={onSave} disabled={saving}>
                    {saving ? "Saving…" : "Save template"}
                </Button>
            </div>

            {problems.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {problems[0]}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)_260px]">
                {/* Slide rail */}
                <div className="space-y-2 order-2 lg:order-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs text-zinc-500">Slides</Label>
                        <Button size="icon" variant="ghost" onClick={addSlide} title="Add slide">
                            <Plus className="size-4" />
                        </Button>
                    </div>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2">
                        {slides.map((s, i) => (
                            <div
                                key={s.id}
                                className={`shrink-0 rounded-lg border-2 p-1 cursor-pointer ${
                                    i === activeIndex ? "border-indigo-500" : "border-zinc-200"
                                }`}
                                onClick={() => {
                                    setActiveIndex(i);
                                    setSelectedId(null);
                                }}
                            >
                                <div className="pointer-events-none">
                                    <SlideCanvas
                                        slide={s}
                                        selectedId={null}
                                        onSelect={() => {}}
                                        onChange={() => {}}
                                        width={120}
                                        readOnly
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-1 px-0.5">
                                    <span className="text-[10px] text-zinc-500">
                                        {s.repeat ? "per question" : "once"}
                                    </span>
                                    <div className="flex">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                duplicateSlide(i);
                                            }}
                                            title="Duplicate slide"
                                            className="p-0.5 cursor-pointer"
                                        >
                                            <Copy className="size-3 text-zinc-400" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSlide(i);
                                            }}
                                            title="Delete slide"
                                            className="p-0.5 cursor-pointer"
                                        >
                                            <Trash2 className="size-3 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Canvas */}
                <div className="space-y-3 order-1 lg:order-2 min-w-0">
                    {/* Contextual format bar — PowerPoint's mini-toolbar. */}
                    <div className="min-h-[3rem]">
                        {selected && (
                            <FormatBar
                                element={selected}
                                onChange={patchElement}
                                onDuplicate={copyElement}
                                onDelete={removeElement}
                                onBringForward={() => reorder(1)}
                                onSendBackward={() => reorder(-1)}
                            />
                        )}
                    </div>

                    <div className="w-full min-w-0">
                        {slide && (
                            <SlideCanvas
                                slide={slide}
                                selectedId={selectedId}
                                onSelect={selectElement}
                                onChange={setElements}
                            />
                        )}
                    </div>

                    {slide && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={!!slide.repeat}
                                    onCheckedChange={(v) =>
                                        patchSlide(activeIndex, { repeat: v === true })
                                    }
                                />
                                Repeat this slide for every question
                            </label>
                            <span className="text-zinc-400">
                                {repeatCount} of {slides.length} slides repeat
                            </span>
                        </div>
                    )}
                </div>

                {/* Insert / Design / Format panel */}
                <div className="order-3">
                    <Tabs value={panelTab} onValueChange={(v) => setPanelTab(v as typeof panelTab)}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="insert">Insert</TabsTrigger>
                            <TabsTrigger value="design">Design</TabsTrigger>
                            <TabsTrigger value="format">Format</TabsTrigger>
                        </TabsList>

                        <TabsContent value="insert" className="pt-3">
                            <InsertPanel
                                onAddText={addText}
                                onAddImage={addImage}
                                onAddShape={addShape}
                                onAddBlock={addBlock}
                            />
                        </TabsContent>

                        <TabsContent value="design" className="pt-3">
                            {slide && (
                                <DesignPanel
                                    slide={slide}
                                    onPatch={(patch) => patchSlide(activeIndex, patch)}
                                    onApplyAll={(patch) =>
                                        setSlides((prev) => prev.map((s) => ({ ...s, ...patch })))
                                    }
                                    themes={THEMES}
                                    themeId={themeId}
                                    onChangeTheme={changeTheme}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="format" className="pt-3">
                            <ElementInspector
                                element={selected}
                                onChange={patchElement}
                                onDelete={removeElement}
                                onDuplicate={copyElement}
                                onBringForward={() => reorder(1)}
                                onSendBackward={() => reorder(-1)}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
