"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACCEPTED = "image/*,application/pdf";

export function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handle = useCallback(
        (list: FileList | undefined | null) => {
            if (!list || list.length === 0) return;
            const valid = Array.from(list).filter(
                (f) => f.type === "application/pdf" || f.type.startsWith("image/"),
            );
            if (valid.length === 0) return;
            onFiles(valid);
        },
        [onFiles],
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
                handle(e.dataTransfer.files);
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
                multiple
                className="sr-only"
                onChange={(e) => handle(e.target.files)}
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
                Drop question papers here
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
                or click to choose &mdash; one PDF or multiple images, up to 20 MB each
            </p>
        </label>
    );
}
