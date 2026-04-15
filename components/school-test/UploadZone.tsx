"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/*,application/pdf";

export function UploadZone({ onFile }: { onFile: (file: File) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handle = useCallback(
        (file: File | undefined | null) => {
            if (!file) return;
            const ok = file.type === "application/pdf" || file.type.startsWith("image/");
            if (!ok) return;
            onFile(file);
        },
        [onFile],
    );

    return (
        <label
            htmlFor="school-test-file"
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handle(e.dataTransfer.files?.[0]);
            }}
            className={cn(
                "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-16 text-center transition-colors",
                dragging
                    ? "border-neutral-900 bg-neutral-100"
                    : "border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50",
            )}
        >
            <input
                ref={inputRef}
                id="school-test-file"
                type="file"
                accept={ACCEPTED}
                className="sr-only"
                onChange={(e) => handle(e.target.files?.[0])}
            />
            <div className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-500 transition-colors group-hover:border-neutral-400 group-hover:text-neutral-800">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 3v12" />
                    <path d="m7 8 5-5 5 5" />
                    <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                </svg>
            </div>
            <p className="mt-5 text-[15px] font-medium text-neutral-900">
                Drop a question paper here
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
                or click to choose &mdash; image or PDF, up to 20 MB
            </p>
        </label>
    );
}
