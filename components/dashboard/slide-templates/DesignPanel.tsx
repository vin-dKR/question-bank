"use client";

/**
 * The Design tab — how the slide's background looks.
 *
 * Three mutually exclusive background styles: a solid colour, a two-stop gradient,
 * or an uploaded picture. A gradient is stored twice: `bgGradient` drives the live
 * CSS preview and keeps it editable, while a rasterised copy is written to `bgImage`
 * so the exported .pptx — which can't draw a gradient natively — shows the same thing.
 */
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import BackgroundPicker from "./BackgroundPicker";
import { ColorField, SliderField } from "./controls";
import { gradientCss, gradientToDataUrl } from "@/lib/slides/shapes";
import type { Gradient, Slide } from "@/types/slides";
import type { Theme } from "@/lib/slides/presets";

const GRADIENT_PRESETS: Gradient[] = [
    { angle: 90, from: "#4F46E5", to: "#06B6D4" },
    { angle: 90, from: "#7C3AED", to: "#EC4899" },
    { angle: 90, from: "#0EA5E9", to: "#22D3EE" },
    { angle: 90, from: "#F59E0B", to: "#EF4444" },
    { angle: 90, from: "#10B981", to: "#3B82F6" },
    { angle: 45, from: "#111827", to: "#374151" },
    { angle: 90, from: "#FDE68A", to: "#FCA5A5" },
    { angle: 135, from: "#1E3A8A", to: "#9333EA" },
];

type Mode = "solid" | "gradient" | "image";

interface Props {
    slide: Slide;
    onPatch: (patch: Partial<Slide>) => void;
    onApplyAll: (patch: Partial<Slide>) => void;
    themes: Theme[];
    themeId: string;
    onChangeTheme: (id: string) => void;
}

export default function DesignPanel({
    slide,
    onPatch,
    onApplyAll,
    themes,
    themeId,
    onChangeTheme,
}: Props) {
    const initialMode: Mode = slide.bgGradient ? "gradient" : slide.bgImage ? "image" : "solid";
    const [mode, setMode] = useState<Mode>(initialMode);

    // A working gradient so the custom controls have something to edit.
    const grad: Gradient = slide.bgGradient ?? GRADIENT_PRESETS[0];

    const applyGradient = (g: Gradient) =>
        onPatch({ bgGradient: g, bgImage: gradientToDataUrl(g), bg: g.from });

    const applySolid = (color: string) =>
        onPatch({ bg: color, bgGradient: undefined, bgImage: undefined });

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Background</Label>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
                    {(["solid", "gradient", "image"] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`rounded-md py-1 text-[11px] capitalize cursor-pointer transition-colors ${
                                mode === m ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {mode === "solid" && (
                <ColorField label="Slide colour" value={slide.bg} onChange={applySolid} />
            )}

            {mode === "gradient" && (
                <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-1.5">
                        {GRADIENT_PRESETS.map((g, i) => (
                            <button
                                key={i}
                                onClick={() => applyGradient(g)}
                                title={`${g.from} → ${g.to}`}
                                className="h-8 rounded-md border border-zinc-200 hover:border-indigo-400 cursor-pointer"
                                style={{ background: gradientCss(g) }}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ColorField
                            label="From"
                            value={grad.from}
                            onChange={(v) => applyGradient({ ...grad, from: v })}
                        />
                        <ColorField
                            label="To"
                            value={grad.to}
                            onChange={(v) => applyGradient({ ...grad, to: v })}
                        />
                    </div>
                    <SliderField
                        label="Angle"
                        value={grad.angle}
                        min={0}
                        max={360}
                        suffix="°"
                        onChange={(v) => applyGradient({ ...grad, angle: v })}
                    />
                    <div className="h-10 rounded-md border border-zinc-200" style={{ background: gradientCss(grad) }} />
                </div>
            )}

            {mode === "image" && (
                <BackgroundPicker
                    value={slide.bgImage}
                    onChange={(url) => onPatch({ bgImage: url, bgGradient: undefined })}
                    onApplyAll={(url) => onApplyAll({ bgImage: url, bgGradient: undefined })}
                />
            )}

            <Button
                size="sm"
                variant="outline"
                className="w-full text-[11px]"
                onClick={() =>
                    onApplyAll({ bg: slide.bg, bgGradient: slide.bgGradient, bgImage: slide.bgImage })
                }
            >
                Apply background to all slides
            </Button>

            <div className="space-y-2 border-t border-zinc-200 pt-3">
                <Label className="text-xs text-zinc-500">Theme</Label>
                <div className="flex gap-1.5">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => onChangeTheme(t.id)}
                            title={t.name}
                            className={`size-8 rounded-md border-2 cursor-pointer ${
                                t.id === themeId ? "border-indigo-500" : "border-transparent"
                            }`}
                            style={{ background: t.bg }}
                        >
                            <span className="block size-2 rounded-full mx-auto" style={{ background: t.accent }} />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
