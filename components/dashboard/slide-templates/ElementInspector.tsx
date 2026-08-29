"use client";

/**
 * Properties for the selected box: what it holds, and how it looks.
 *
 * "Holds" is the important one — it rewrites the element's `bind`, which is what
 * decides whether a box shows the question, the options, or is left blank. Below it
 * sit the full appearance controls (the format bar carries the common ones; this is
 * the complete set), grouped by what they apply to.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Copy,
    Trash2,
    ArrowUp,
    ArrowDown,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    ImagePlus,
    Loader2,
    FlipHorizontal2,
    FlipVertical2,
} from "lucide-react";
import { uploadBackgroundImage } from "@/actions/slides/uploadBackground";
import { ColorField, SliderField, ToggleButton } from "./controls";
import {
    FONTS,
    type Align,
    type BindKey,
    type BindWhen,
    type FontIndex,
    type FontWeight,
    type ImageElement,
    type Shadow,
    type SlideElement,
    type TextElement,
    type VAlign,
} from "@/types/slides";

const CONTENT_KEYS: { key: BindKey; label: string }[] = [
    { key: "question", label: "Question text" },
    { key: "options", label: "Options" },
    { key: "answer", label: "Answer" },
    { key: "index", label: "Question number" },
    { key: "topic", label: "Topic / chapter" },
    { key: "subject", label: "Subject" },
    { key: "exam", label: "Exam name" },
    { key: "solution", label: "Blank space" },
];

const WHEN_LABELS: { value: BindWhen; label: string; hint: string }[] = [
    { value: "always", label: "Always show", hint: "Renders empty if the field is missing." },
    { value: "ifPresent", label: "Hide if empty", hint: "The box disappears when there is no value." },
    { value: "reserve", label: "Leave blank", hint: "Keeps the space but renders nothing." },
];

const STATIC = "__static__";

const DEFAULT_SHADOW: Shadow = { color: "#000000", blur: 8, offset: 6, angle: 90, opacity: 0.35 };

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

interface Props {
    element: SlideElement | null;
    onChange: (patch: Partial<SlideElement>) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
}

export default function ElementInspector({
    element,
    onChange,
    onDelete,
    onDuplicate,
    onBringForward,
    onSendBackward,
}: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    if (!element) {
        return (
            <div className="text-xs text-zinc-500 p-4 border border-dashed border-zinc-200 rounded-lg">
                Select a box on the slide to change what it holds and how it looks.
            </div>
        );
    }

    const isText = element.type === "text";
    const t = element as TextElement;
    const hasFill =
        element.type === "rect" || element.type === "ellipse" || element.type === "shape";

    const setBindKey = (v: string) => {
        if (v === STATIC) {
            onChange({ bind: undefined, template: true } as Partial<SlideElement>);
        } else {
            onChange({
                bind: { key: v as BindKey, when: element.bind?.when ?? "always" },
                template: false,
            } as Partial<SlideElement>);
        }
    };

    const uploadImage = async (file: File) => {
        if (file.size > MAX_IMAGE_BYTES) {
            toast.error(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 8MB.`);
            return;
        }
        setUploading(true);
        const toastId = toast.loading("Uploading picture…");
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result));
                r.onerror = () => reject(new Error("Could not read that file."));
                r.readAsDataURL(file);
            });
            const res = await uploadBackgroundImage(dataUrl, file.name);
            if (!res.success) {
                toast.error(res.error, { id: toastId });
                return;
            }
            onChange({ src: res.data } as Partial<SlideElement>);
            toast.success("Picture added.", { id: toastId });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed.", { id: toastId });
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const shadow = element.shadow;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {element.type === "shape" ? element.shape : element.type} box
                </span>
                <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={onSendBackward} title="Send backward">
                        <ArrowDown className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onBringForward} title="Bring forward">
                        <ArrowUp className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onDuplicate} title="Duplicate">
                        <Copy className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
                        <Trash2 className="size-4 text-red-500" />
                    </Button>
                </div>
            </div>

            {/* What it holds — text always; images only when they're the bound
                question diagram (a plain inserted picture has no field to bind). */}
            {(isText || (element.type === "image" && element.bind)) && (
                <div className="space-y-2">
                    <Label className="text-xs">This box holds</Label>
                    <Select
                        value={element.bind?.key ?? STATIC}
                        onValueChange={setBindKey}
                        disabled={element.type === "image"}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {element.type === "image" ? (
                                <SelectItem value="diagram">Question image</SelectItem>
                            ) : (
                                <>
                                    {CONTENT_KEYS.map((c) => (
                                        <SelectItem key={c.key} value={c.key}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value={STATIC}>Fixed text (same every slide)</SelectItem>
                                </>
                            )}
                        </SelectContent>
                    </Select>

                    {element.bind && (
                        <>
                            <Select
                                value={element.bind.when}
                                onValueChange={(v) =>
                                    onChange({
                                        bind: { key: element.bind!.key, when: v as BindWhen },
                                    } as Partial<SlideElement>)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {WHEN_LABELS.map((w) => (
                                        <SelectItem key={w.value} value={w.value}>
                                            {w.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[11px] text-zinc-500">
                                {WHEN_LABELS.find((w) => w.value === element.bind!.when)?.hint}
                            </p>
                        </>
                    )}

                    {isText && !element.bind && (
                        <Input
                            value={t.text}
                            onChange={(e) => onChange({ text: e.target.value } as Partial<SlideElement>)}
                            placeholder="Text shown on every slide"
                            className="text-sm"
                        />
                    )}
                </div>
            )}

            {/* Position & size */}
            <div className="grid grid-cols-4 gap-2">
                {(["x", "y", "w", "h"] as const).map((k) => (
                    <div key={k} className="space-y-1">
                        <Label className="text-[11px] uppercase text-zinc-500">{k}</Label>
                        <Input
                            type="number"
                            value={element[k]}
                            onChange={(e) =>
                                onChange({ [k]: Number(e.target.value) || 0 } as Partial<SlideElement>)
                            }
                            className="h-8 text-xs"
                        />
                    </div>
                ))}
            </div>

            {/* Text styling */}
            {isText && (
                <div className="space-y-3 border-t border-zinc-200 pt-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-zinc-500">Size</Label>
                            <Input
                                type="number"
                                value={t.fontSize}
                                onChange={(e) =>
                                    onChange({ fontSize: Number(e.target.value) || 12 } as Partial<SlideElement>)
                                }
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-zinc-500">Weight</Label>
                            <Select
                                value={String(t.weight)}
                                onValueChange={(v) =>
                                    onChange({ weight: Number(v) as FontWeight } as Partial<SlideElement>)
                                }
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[300, 400, 500, 600, 700, 800].map((w) => (
                                        <SelectItem key={w} value={String(w)}>
                                            {w}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-500">Font</Label>
                        <Select
                            value={String(t.font)}
                            onValueChange={(v) =>
                                onChange({ font: Number(v) as FontIndex } as Partial<SlideElement>)
                            }
                        >
                            <SelectTrigger className="h-8 text-xs w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FONTS.map((f, i) => (
                                    <SelectItem key={f} value={String(i)}>
                                        {f}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Style toggles */}
                    <div className="flex gap-1">
                        <ToggleButton
                            active={t.weight >= 600}
                            onClick={() => onChange({ weight: t.weight >= 600 ? 400 : 700 } as Partial<SlideElement>)}
                            title="Bold"
                        >
                            <Bold className="size-4" />
                        </ToggleButton>
                        <ToggleButton
                            active={t.italic}
                            onClick={() => onChange({ italic: !t.italic } as Partial<SlideElement>)}
                            title="Italic"
                        >
                            <Italic className="size-4" />
                        </ToggleButton>
                        <ToggleButton
                            active={!!t.underline}
                            onClick={() => onChange({ underline: !t.underline } as Partial<SlideElement>)}
                            title="Underline"
                        >
                            <Underline className="size-4" />
                        </ToggleButton>
                        <ToggleButton
                            active={!!t.strike}
                            onClick={() => onChange({ strike: !t.strike } as Partial<SlideElement>)}
                            title="Strikethrough"
                        >
                            <Strikethrough className="size-4" />
                        </ToggleButton>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-zinc-500">Align</Label>
                            <Select
                                value={t.align}
                                onValueChange={(v) => onChange({ align: v as Align } as Partial<SlideElement>)}
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["left", "center", "right"].map((a) => (
                                        <SelectItem key={a} value={a}>
                                            {a}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-zinc-500">Vertical</Label>
                            <Select
                                value={t.valign}
                                onValueChange={(v) => onChange({ valign: v as VAlign } as Partial<SlideElement>)}
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["top", "center", "bottom"].map((a) => (
                                        <SelectItem key={a} value={a}>
                                            {a}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <ColorField
                        label="Text colour"
                        value={t.color}
                        onChange={(v) => onChange({ color: v } as Partial<SlideElement>)}
                    />

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-[11px] text-zinc-500">Highlight</Label>
                            {t.highlight && (
                                <button
                                    className="text-[11px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                    onClick={() => onChange({ highlight: "" } as Partial<SlideElement>)}
                                >
                                    clear
                                </button>
                            )}
                        </div>
                        <ColorField
                            value={t.highlight || "#ffe066"}
                            onChange={(v) => onChange({ highlight: v } as Partial<SlideElement>)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <SliderField
                            label="Line height"
                            value={t.lineHeight}
                            min={0.8}
                            max={2.4}
                            step={0.05}
                            onChange={(v) => onChange({ lineHeight: v } as Partial<SlideElement>)}
                        />
                        <SliderField
                            label="Letter spacing"
                            value={t.tracking}
                            min={-2}
                            max={12}
                            step={0.5}
                            onChange={(v) => onChange({ tracking: v } as Partial<SlideElement>)}
                        />
                    </div>
                </div>
            )}

            {/* Fill + border for rect / ellipse / shape */}
            {hasFill && (
                <div className="space-y-2 border-t border-zinc-200 pt-3">
                    <ColorField
                        label="Fill"
                        value={element.fill}
                        onChange={(v) => onChange({ fill: v } as Partial<SlideElement>)}
                        placeholder="transparent"
                        allowNone
                    />
                    <ColorField
                        label="Border"
                        value={element.stroke || "#000000"}
                        onChange={(v) => onChange({ stroke: v } as Partial<SlideElement>)}
                    />
                    <SliderField
                        label="Border width"
                        value={element.strokeWidth}
                        min={0}
                        max={24}
                        onChange={(v) => onChange({ strokeWidth: v } as Partial<SlideElement>)}
                    />
                    {element.type === "rect" && (
                        <SliderField
                            label="Corner radius"
                            value={element.radius}
                            min={0}
                            max={120}
                            onChange={(v) => onChange({ radius: v } as Partial<SlideElement>)}
                        />
                    )}
                </div>
            )}

            {/* Image styling */}
            {element.type === "image" && (
                <div className="space-y-2 border-t border-zinc-200 pt-3">
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadImage(f);
                        }}
                    />
                    {!element.bind && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled={uploading}
                            onClick={() => fileRef.current?.click()}
                        >
                            {uploading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <ImagePlus className="size-4" />
                            )}
                            <span className="text-[11px]">
                                {element.src ? "Replace picture" : "Upload picture"}
                            </span>
                        </Button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-zinc-500">Fit</Label>
                            <Select
                                value={(element as ImageElement).fit}
                                onValueChange={(v) =>
                                    onChange({ fit: v as ImageElement["fit"] } as Partial<SlideElement>)
                                }
                            >
                                <SelectTrigger className="h-8 text-xs w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="contain">Contain</SelectItem>
                                    <SelectItem value="cover">Fill (crop)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-zinc-500">Flip</Label>
                            <div className="flex gap-1">
                                <ToggleButton
                                    active={!!element.flipH}
                                    onClick={() => onChange({ flipH: !element.flipH } as Partial<SlideElement>)}
                                    title="Flip horizontal"
                                >
                                    <FlipHorizontal2 className="size-4" />
                                </ToggleButton>
                                <ToggleButton
                                    active={!!element.flipV}
                                    onClick={() => onChange({ flipV: !element.flipV } as Partial<SlideElement>)}
                                    title="Flip vertical"
                                >
                                    <FlipVertical2 className="size-4" />
                                </ToggleButton>
                            </div>
                        </div>
                    </div>
                    <SliderField
                        label="Corner radius"
                        value={(element as ImageElement).radius}
                        min={0}
                        max={200}
                        onChange={(v) => onChange({ radius: v } as Partial<SlideElement>)}
                    />
                    <ColorField
                        label="Border"
                        value={element.stroke || "#000000"}
                        onChange={(v) => onChange({ stroke: v } as Partial<SlideElement>)}
                    />
                    <SliderField
                        label="Border width"
                        value={element.strokeWidth ?? 0}
                        min={0}
                        max={24}
                        onChange={(v) => onChange({ strokeWidth: v } as Partial<SlideElement>)}
                    />
                </div>
            )}

            {/* Line */}
            {element.type === "line" && (
                <div className="space-y-2 border-t border-zinc-200 pt-3">
                    <ColorField
                        label="Colour"
                        value={element.stroke}
                        onChange={(v) => onChange({ stroke: v } as Partial<SlideElement>)}
                    />
                    <SliderField
                        label="Thickness"
                        value={element.strokeWidth}
                        min={1}
                        max={40}
                        onChange={(v) =>
                            onChange({ strokeWidth: v, h: v } as Partial<SlideElement>)
                        }
                    />
                </div>
            )}

            {/* Appearance shared by every element */}
            <div className="space-y-3 border-t border-zinc-200 pt-3">
                <SliderField
                    label="Opacity"
                    value={Math.round(element.opacity * 100)}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(v) => onChange({ opacity: v / 100 } as Partial<SlideElement>)}
                />
                <SliderField
                    label="Rotation"
                    value={element.rotation ?? 0}
                    min={0}
                    max={360}
                    suffix="°"
                    onChange={(v) => onChange({ rotation: v } as Partial<SlideElement>)}
                />

                <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                        <Label className="text-[11px] text-zinc-500 cursor-pointer">Shadow</Label>
                        <input
                            type="checkbox"
                            checked={!!shadow}
                            onChange={(e) =>
                                onChange({
                                    shadow: e.target.checked ? DEFAULT_SHADOW : undefined,
                                } as Partial<SlideElement>)
                            }
                            className="accent-indigo-500 cursor-pointer"
                        />
                    </label>
                    {shadow && (
                        <div className="space-y-2 rounded-md bg-zinc-50 p-2">
                            <ColorField
                                value={shadow.color}
                                onChange={(v) =>
                                    onChange({ shadow: { ...shadow, color: v } } as Partial<SlideElement>)
                                }
                            />
                            <SliderField
                                label="Blur"
                                value={shadow.blur}
                                min={0}
                                max={40}
                                onChange={(v) =>
                                    onChange({ shadow: { ...shadow, blur: v } } as Partial<SlideElement>)
                                }
                            />
                            <SliderField
                                label="Distance"
                                value={shadow.offset}
                                min={0}
                                max={40}
                                onChange={(v) =>
                                    onChange({ shadow: { ...shadow, offset: v } } as Partial<SlideElement>)
                                }
                            />
                            <SliderField
                                label="Direction"
                                value={shadow.angle}
                                min={0}
                                max={360}
                                suffix="°"
                                onChange={(v) =>
                                    onChange({ shadow: { ...shadow, angle: v } } as Partial<SlideElement>)
                                }
                            />
                            <SliderField
                                label="Opacity"
                                value={Math.round(shadow.opacity * 100)}
                                min={0}
                                max={100}
                                suffix="%"
                                onChange={(v) =>
                                    onChange({ shadow: { ...shadow, opacity: v / 100 } } as Partial<SlideElement>)
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
