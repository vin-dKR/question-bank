"use client";

/**
 * Properties for the selected box: what it holds, and how it looks.
 *
 * "Holds" is the important one — it rewrites the element's `bind`, which is what
 * decides whether a box shows the question, the options, or is left blank.
 */
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
import { Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
    FONTS,
    type Align,
    type BindKey,
    type BindWhen,
    type FontIndex,
    type FontWeight,
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
    if (!element) {
        return (
            <div className="text-xs text-zinc-500 p-4 border border-dashed border-zinc-200 rounded-lg">
                Select a box on the slide to change what it holds and how it looks.
            </div>
        );
    }

    const isText = element.type === "text";
    const t = element as TextElement;

    const setBindKey = (v: string) => {
        if (v === STATIC) {
            // Static text keeps whatever literal is typed and repeats untouched.
            onChange({ bind: undefined, template: true } as Partial<SlideElement>);
        } else {
            onChange({
                bind: { key: v as BindKey, when: element.bind?.when ?? "always" },
                template: false,
            } as Partial<SlideElement>);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {element.type} box
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

            {/* What it holds */}
            {(isText || element.type === "image") && (
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

            {/* Position */}
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
                <div className="space-y-3">
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

                    <div className="space-y-1">
                        <Label className="text-[11px] text-zinc-500">Colour</Label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={t.color}
                                onChange={(e) => onChange({ color: e.target.value } as Partial<SlideElement>)}
                                className="h-8 w-12 rounded border border-zinc-200 cursor-pointer bg-transparent"
                            />
                            <Input
                                value={t.color}
                                onChange={(e) => onChange({ color: e.target.value } as Partial<SlideElement>)}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Shape styling */}
            {(element.type === "rect" || element.type === "ellipse") && (
                <div className="space-y-2">
                    <Label className="text-[11px] text-zinc-500">Fill</Label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="color"
                            value={element.fill === "transparent" ? "#000000" : element.fill}
                            onChange={(e) => onChange({ fill: e.target.value } as Partial<SlideElement>)}
                            className="h-8 w-12 rounded border border-zinc-200 cursor-pointer bg-transparent"
                        />
                        <Input
                            value={element.fill}
                            onChange={(e) => onChange({ fill: e.target.value } as Partial<SlideElement>)}
                            className="h-8 text-xs"
                            placeholder="transparent"
                        />
                    </div>
                    <Label className="text-[11px] text-zinc-500">Border</Label>
                    <div className="flex gap-2 items-center">
                        <Input
                            value={element.stroke}
                            onChange={(e) => onChange({ stroke: e.target.value } as Partial<SlideElement>)}
                            className="h-8 text-xs"
                            placeholder="#ffffff"
                        />
                        <Input
                            type="number"
                            value={element.strokeWidth}
                            onChange={(e) =>
                                onChange({ strokeWidth: Number(e.target.value) || 0 } as Partial<SlideElement>)
                            }
                            className="h-8 text-xs w-20"
                        />
                    </div>
                </div>
            )}

            {element.type === "line" && (
                <div className="space-y-2">
                    <Label className="text-[11px] text-zinc-500">Colour & thickness</Label>
                    <div className="flex gap-2 items-center">
                        <Input
                            value={element.stroke}
                            onChange={(e) => onChange({ stroke: e.target.value } as Partial<SlideElement>)}
                            className="h-8 text-xs"
                        />
                        <Input
                            type="number"
                            value={element.strokeWidth}
                            onChange={(e) =>
                                onChange({
                                    strokeWidth: Number(e.target.value) || 1,
                                    h: Number(e.target.value) || 1,
                                } as Partial<SlideElement>)
                            }
                            className="h-8 text-xs w-20"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
