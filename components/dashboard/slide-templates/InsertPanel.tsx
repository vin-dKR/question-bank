"use client";

/**
 * The Insert palette — everything you can drop onto a slide.
 *
 * Grouped like PowerPoint's Insert tab: a text box and picture up top, then the
 * shape library, then the domain-specific blocks (question fields and page
 * furniture) that make this a *template* rather than a blank deck.
 */
import { Type, ImagePlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PALETTE } from "@/lib/slides/editorFactory";
import { SHAPE_GEOMETRY, SHAPE_LIBRARY } from "@/lib/slides/shapes";
import type { ShapeKind } from "@/types/slides";

interface Props {
    onAddText: () => void;
    onAddImage: () => void;
    onAddShape: (kind: ShapeKind) => void;
    onAddBlock: (key: string) => void;
}

function ShapeGlyph({ kind }: { kind: ShapeKind }) {
    const geo = SHAPE_GEOMETRY[kind];
    return (
        <svg viewBox="0 0 100 100" className="size-6" aria-hidden>
            {geo.kind === "polygon" ? (
                <polygon points={geo.points} fill="currentColor" />
            ) : (
                <path d={geo.d} fill="currentColor" />
            )}
        </svg>
    );
}

export default function InsertPanel({ onAddText, onAddImage, onAddShape, onAddBlock }: Props) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Text &amp; media</Label>
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        onClick={onAddText}
                        className="flex items-center gap-1.5 text-[11px] rounded-md border border-zinc-200 px-2 py-2 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer"
                    >
                        <Type className="size-4" /> Text box
                    </button>
                    <button
                        onClick={onAddImage}
                        className="flex items-center gap-1.5 text-[11px] rounded-md border border-zinc-200 px-2 py-2 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer"
                    >
                        <ImagePlus className="size-4" /> Picture
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Shapes</Label>
                <div className="grid grid-cols-6 gap-1">
                    {SHAPE_LIBRARY.map((s) => (
                        <button
                            key={s.kind}
                            onClick={() => onAddShape(s.kind)}
                            title={s.label}
                            className="grid place-items-center aspect-square rounded-md border border-zinc-200 text-zinc-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                        >
                            <ShapeGlyph kind={s.kind} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Question fields</Label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PALETTE.filter((b) => b.group === "content").map((b) => (
                        <button
                            key={b.key}
                            onClick={() => onAddBlock(b.key)}
                            title={b.hint}
                            className="text-[11px] rounded-md border border-zinc-200 px-2 py-1.5 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer text-left"
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Page furniture</Label>
                <div className="grid grid-cols-2 gap-1.5">
                    {PALETTE.filter((b) => b.group === "static").map((b) => (
                        <button
                            key={b.key}
                            onClick={() => onAddBlock(b.key)}
                            title={b.hint}
                            className="text-[11px] rounded-md border border-dashed border-zinc-300 px-2 py-1.5 hover:border-indigo-400 cursor-pointer text-left text-zinc-600"
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
