"use client";

/**
 * Small shared form controls for the slide editor's format panels, so the inspector
 * and the floating format bar read the same and stay short.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Colour swatch + hex field. `allowNone` adds a clear button for optional fills. */
export function ColorField({
    label,
    value,
    onChange,
    placeholder,
    allowNone,
}: {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    allowNone?: boolean;
}) {
    // The native picker needs a valid hex; fall back to black for "transparent"/"".
    const swatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
    return (
        <div className="space-y-1">
            {label && <Label className="text-[11px] text-zinc-500">{label}</Label>}
            <div className="flex gap-2 items-center">
                <input
                    type="color"
                    value={swatch}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 w-10 shrink-0 rounded border border-zinc-200 cursor-pointer bg-transparent"
                />
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 text-xs"
                    placeholder={placeholder}
                />
                {allowNone && (
                    <button
                        type="button"
                        onClick={() => onChange("transparent")}
                        title="No fill"
                        className="h-8 px-2 text-[11px] rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50 cursor-pointer shrink-0"
                    >
                        None
                    </button>
                )}
            </div>
        </div>
    );
}

/** A labelled range slider with a live numeric readout. */
export function SliderField({
    label,
    value,
    min,
    max,
    step = 1,
    suffix,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <Label className="text-[11px] text-zinc-500">{label}</Label>
                <span className="text-[11px] tabular-nums text-zinc-500">
                    {value}
                    {suffix}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
            />
        </div>
    );
}

/** An icon toggle button used across the format bar (bold, italic, align, …). */
export function ToggleButton({
    active,
    onClick,
    title,
    children,
}: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-pressed={active}
            className={`grid place-items-center size-8 rounded-md border cursor-pointer transition-colors ${
                active
                    ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                    : "border-transparent hover:bg-zinc-100 text-zinc-600"
            }`}
        >
            {children}
        </button>
    );
}

/** A thin vertical rule between format-bar groups. */
export function BarDivider() {
    return <span className="mx-0.5 h-6 w-px bg-zinc-200" />;
}
