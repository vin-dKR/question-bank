"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileUp } from "lucide-react";
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
                "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 sm:py-16 text-center transition-all",
                dragging
                    ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
                    : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30",
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
            <div
                className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-all",
                    dragging
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
                )}
            >
                {dragging ? <FileUp className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
            </div>
            <p className="mt-5 text-sm sm:text-base font-medium text-zinc-900">
                {dragging ? "Drop to upload" : "Drop question papers here"}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                or click to choose — one PDF or multiple images, up to 20 MB each
            </p>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono">PDF</span>
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono">PNG</span>
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono">JPG</span>
            </div>
        </label>
    );
}
