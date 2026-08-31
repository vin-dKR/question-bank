"use client";

/**
 * Applies an institute's own artwork as the slide background.
 *
 * Accepts either an image or a .pptx. For a .pptx the pictures inside it are
 * extracted and offered as choices, because the file can hold a logo, a footer
 * strip and the actual background, and only a human can say which is which.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    extractPptxBackgrounds,
    uploadBackgroundImage,
    type PptxArtwork,
} from "@/actions/slides/uploadBackground";

/** Mirrors the server cap so the user is told before a pointless round trip. */
const MAX_BYTES = 8 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read that file."));
        reader.readAsDataURL(file);
    });
}

interface Props {
    /** Current background on the active slide, if any. */
    value?: string;
    onChange: (url: string | undefined) => void;
    /** Apply the chosen artwork to every slide in the template. */
    onApplyAll: (url: string | undefined) => void;
}

export default function BackgroundPicker({ value, onChange, onApplyAll }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [choices, setChoices] = useState<PptxArtwork[]>([]);

    const handleFile = async (file: File) => {
        if (file.size > MAX_BYTES) {
            toast.error(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 8MB.`);
            return;
        }

        setBusy(true);
        setChoices([]);
        const toastId = toast.loading("Uploading…");

        try {
            const dataUrl = await readAsDataUrl(file);
            const isPptx =
                file.name.toLowerCase().endsWith(".pptx") ||
                file.type.includes("presentationml");

            if (isPptx) {
                const res = await extractPptxBackgrounds(dataUrl);
                if (!res.success) {
                    toast.error(res.error, { id: toastId, duration: 8000 });
                    return;
                }
                // One picture means no ambiguity — apply it and skip the picker.
                if (res.data.length === 1) {
                    onChange(res.data[0].url);
                    toast.success("Background applied from your template.", { id: toastId });
                } else {
                    setChoices(res.data);
                    toast.success(`Found ${res.data.length} images — pick one.`, { id: toastId });
                }
                return;
            }

            const res = await uploadBackgroundImage(dataUrl, file.name);
            if (!res.success) {
                toast.error(res.error, { id: toastId });
                return;
            }
            onChange(res.data);
            toast.success("Background applied.", { id: toastId });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed.", { id: toastId });
        } finally {
            setBusy(false);
            // Reset so re-picking the same file still fires onChange.
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Background</Label>

            <input
                ref={inputRef}
                type="file"
                accept="image/*,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                }}
            />

            {value ? (
                <div className="space-y-2">
                    <div className="relative rounded-md overflow-hidden border border-zinc-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={value} alt="Slide background" className="w-full h-20 object-cover" />
                    </div>
                    <div className="flex gap-1.5">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-[11px]"
                            onClick={() => onApplyAll(value)}
                        >
                            Use on all slides
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Remove background"
                            onClick={() => onChange(undefined)}
                        >
                            <Trash2 className="size-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                >
                    {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <ImagePlus className="size-4" />
                    )}
                    <span className="text-[11px]">
                        {busy ? "Uploading…" : "Upload image or .pptx"}
                    </span>
                </Button>
            )}

            {choices.length > 0 && (
                <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] text-zinc-500">
                        Images found in your template — pick the background:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                        {choices.map((c) => (
                            <button
                                key={c.url}
                                title={`${c.name} — ${(c.bytes / 1024).toFixed(0)}KB`}
                                onClick={() => {
                                    onChange(c.url);
                                    setChoices([]);
                                }}
                                className="rounded border border-zinc-200 overflow-hidden hover:border-indigo-400 cursor-pointer"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.url} alt={c.name} className="w-full h-12 object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <p className="text-[11px] text-zinc-400 leading-snug">
                A .pptx works when its design is a background picture. If the design is
                drawn with shapes, export a slide as an image and upload that.
            </p>
        </div>
    );
}
