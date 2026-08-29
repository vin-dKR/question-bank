"use client";

/**
 * The contextual format bar — PowerPoint's mini-toolbar, pinned above the canvas.
 *
 * It shows quick controls for whatever is selected: font/size/B-I-U-S/colour/align
 * for text, fill and border for shapes and images, plus the common layer/duplicate/
 * delete actions. The full set of properties lives in the right-hand inspector; this
 * is the fast path for the things you reach for constantly.
 */
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Highlighter,
    FlipHorizontal2,
    FlipVertical2,
    Copy,
    Trash2,
    BringToFront,
    SendToBack,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    FONTS,
    type Align,
    type FontIndex,
    type SlideElement,
    type TextElement,
    type ImageElement,
} from "@/types/slides";
import { ToggleButton, BarDivider } from "./controls";

interface Props {
    element: SlideElement;
    onChange: (patch: Partial<SlideElement>) => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
}

/** A compact colour well that opens the native picker; used for text/fill/highlight. */
function ColorWell({
    value,
    onChange,
    title,
    icon,
}: {
    value: string;
    onChange: (v: string) => void;
    title: string;
    icon?: React.ReactNode;
}) {
    const swatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
    return (
        <label
            title={title}
            className="relative grid place-items-center size-8 rounded-md hover:bg-zinc-100 cursor-pointer text-zinc-600"
        >
            {icon ?? (
                <span
                    className="size-4 rounded-sm border border-black/10"
                    style={{ background: value && value !== "transparent" ? value : "#fff" }}
                />
            )}
            <input
                type="color"
                value={swatch}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
        </label>
    );
}

export default function FormatBar({
    element,
    onChange,
    onDuplicate,
    onDelete,
    onBringForward,
    onSendBackward,
}: Props) {
    const patch = (p: Partial<SlideElement>) => onChange(p);

    return (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
            {element.type === "text" && (
                <TextControls el={element} patch={patch} />
            )}

            {(element.type === "rect" ||
                element.type === "ellipse" ||
                element.type === "shape") && (
                <>
                    <ColorWell
                        value={element.fill}
                        onChange={(v) => patch({ fill: v } as Partial<SlideElement>)}
                        title="Fill colour"
                    />
                    <ColorWell
                        value={element.stroke || "#000000"}
                        onChange={(v) => patch({ stroke: v } as Partial<SlideElement>)}
                        title="Border colour"
                        icon={<span className="size-4 rounded-sm border-2" style={{ borderColor: element.stroke || "#94a3b8" }} />}
                    />
                    <BarDivider />
                </>
            )}

            {element.type === "line" && (
                <>
                    <ColorWell
                        value={element.stroke}
                        onChange={(v) => patch({ stroke: v } as Partial<SlideElement>)}
                        title="Line colour"
                    />
                    <BarDivider />
                </>
            )}

            {element.type === "image" && <ImageControls el={element} patch={patch} />}

            {/* Common actions */}
            <ToggleButton onClick={onBringForward} title="Bring forward">
                <BringToFront className="size-4" />
            </ToggleButton>
            <ToggleButton onClick={onSendBackward} title="Send backward">
                <SendToBack className="size-4" />
            </ToggleButton>
            <ToggleButton onClick={onDuplicate} title="Duplicate">
                <Copy className="size-4" />
            </ToggleButton>
            <ToggleButton onClick={onDelete} title="Delete">
                <Trash2 className="size-4 text-red-500" />
            </ToggleButton>
        </div>
    );
}

function TextControls({
    el,
    patch,
}: {
    el: TextElement;
    patch: (p: Partial<SlideElement>) => void;
}) {
    return (
        <>
            <select
                value={el.font}
                onChange={(e) => patch({ font: Number(e.target.value) as FontIndex } as Partial<SlideElement>)}
                title="Font"
                className="h-8 rounded-md border border-zinc-200 bg-white px-1.5 text-xs cursor-pointer max-w-[9rem]"
                style={{ fontFamily: FONTS[el.font] }}
            >
                {FONTS.map((f, i) => (
                    <option key={f} value={i} style={{ fontFamily: f }}>
                        {f}
                    </option>
                ))}
            </select>
            <Input
                type="number"
                value={el.fontSize}
                onChange={(e) => patch({ fontSize: Number(e.target.value) || 12 } as Partial<SlideElement>)}
                title="Font size"
                className="h-8 w-14 text-xs"
            />
            <BarDivider />
            <ToggleButton
                active={el.weight >= 600}
                onClick={() => patch({ weight: el.weight >= 600 ? 400 : 700 } as Partial<SlideElement>)}
                title="Bold"
            >
                <Bold className="size-4" />
            </ToggleButton>
            <ToggleButton
                active={el.italic}
                onClick={() => patch({ italic: !el.italic } as Partial<SlideElement>)}
                title="Italic"
            >
                <Italic className="size-4" />
            </ToggleButton>
            <ToggleButton
                active={!!el.underline}
                onClick={() => patch({ underline: !el.underline } as Partial<SlideElement>)}
                title="Underline"
            >
                <Underline className="size-4" />
            </ToggleButton>
            <ToggleButton
                active={!!el.strike}
                onClick={() => patch({ strike: !el.strike } as Partial<SlideElement>)}
                title="Strikethrough"
            >
                <Strikethrough className="size-4" />
            </ToggleButton>
            <ColorWell
                value={el.color}
                onChange={(v) => patch({ color: v } as Partial<SlideElement>)}
                title="Text colour"
                icon={
                    <span className="grid place-items-center">
                        <span className="text-[13px] font-semibold leading-none" style={{ color: el.color }}>
                            A
                        </span>
                    </span>
                }
            />
            <ColorWell
                value={el.highlight || "#ffe066"}
                onChange={(v) => patch({ highlight: v } as Partial<SlideElement>)}
                title="Highlight"
                icon={<Highlighter className="size-4" style={{ color: el.highlight || undefined }} />}
            />
            <BarDivider />
            {(["left", "center", "right"] as Align[]).map((a) => (
                <ToggleButton
                    key={a}
                    active={el.align === a}
                    onClick={() => patch({ align: a } as Partial<SlideElement>)}
                    title={`Align ${a}`}
                >
                    {a === "left" ? (
                        <AlignLeft className="size-4" />
                    ) : a === "center" ? (
                        <AlignCenter className="size-4" />
                    ) : (
                        <AlignRight className="size-4" />
                    )}
                </ToggleButton>
            ))}
            <BarDivider />
        </>
    );
}

function ImageControls({
    el,
    patch,
}: {
    el: ImageElement;
    patch: (p: Partial<SlideElement>) => void;
}) {
    return (
        <>
            <ToggleButton
                active={el.fit === "cover"}
                onClick={() => patch({ fit: el.fit === "cover" ? "contain" : "cover" } as Partial<SlideElement>)}
                title={el.fit === "cover" ? "Fit: fill (crop)" : "Fit: contain"}
            >
                <span className="text-[10px] font-semibold">{el.fit === "cover" ? "FILL" : "FIT"}</span>
            </ToggleButton>
            <ToggleButton
                active={!!el.flipH}
                onClick={() => patch({ flipH: !el.flipH } as Partial<SlideElement>)}
                title="Flip horizontal"
            >
                <FlipHorizontal2 className="size-4" />
            </ToggleButton>
            <ToggleButton
                active={!!el.flipV}
                onClick={() => patch({ flipV: !el.flipV } as Partial<SlideElement>)}
                title="Flip vertical"
            >
                <FlipVertical2 className="size-4" />
            </ToggleButton>
            <BarDivider />
        </>
    );
}
