"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PageStage = "pending" | "detecting" | "extracting" | "cropping" | "done" | "error";

export type PageStatus = {
    page: number;
    stage: PageStage;
    detections: number;
    questions: number;
    error?: string;
};

const STAGE_LABEL: Record<PageStage, string> = {
    pending: "Waiting",
    detecting: "Detecting diagrams",
    extracting: "Extracting questions",
    cropping: "Cropping",
    done: "Ready",
    error: "Failed",
};

export function ProcessingPanel({
    fileName,
    pages,
    onCancel,
}: {
    fileName: string | null;
    pages: PageStatus[];
    onCancel: () => void;
}) {
    const total = pages.length;
    const completed = pages.filter((p) => p.stage === "done").length;
    const progress = total > 0 ? completed / total : 0;

    return (
        <div className="flex h-full items-center justify-center px-6 py-12">
            <div className="w-full max-w-xl">
                <div className="mb-8 space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                        Processing
                    </p>
                    <h1 className="truncate text-[20px] font-semibold tracking-tight text-neutral-900">
                        {fileName ?? "Untitled"}
                    </h1>
                </div>

                <div className="relative mb-6 h-[2px] w-full overflow-hidden rounded-full bg-neutral-200">
                    <motion.div
                        className="absolute inset-y-0 left-0 bg-neutral-900"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                </div>

                <div className="space-y-1">
                    {total === 0 ? (
                        <SkeletonRow />
                    ) : (
                        pages.map((p) => <PageRow key={p.page} status={p} />)
                    )}
                </div>

                <div className="mt-10 flex items-center justify-between">
                    <p className="text-xs text-neutral-400">
                        {total === 0
                            ? "Reading the file…"
                            : `${completed} of ${total} ${total === 1 ? "page" : "pages"} ready`}
                    </p>
                    <button
                        onClick={onCancel}
                        className="text-xs font-medium text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function SkeletonRow() {
    return (
        <div className="flex items-center justify-between py-3">
            <motion.div
                className="h-3 w-24 rounded bg-neutral-200"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="h-3 w-16 rounded bg-neutral-200"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
        </div>
    );
}

function PageRow({ status }: { status: PageStatus }) {
    const active = status.stage !== "pending" && status.stage !== "done" && status.stage !== "error";
    return (
        <div className="flex items-center justify-between border-b border-neutral-200/70 py-3 last:border-0">
            <div className="flex items-center gap-3">
                <StageDot stage={status.stage} />
                <div>
                    <p className="text-[13px] font-medium text-neutral-900">Page {status.page}</p>
                    {status.error ? (
                        <p className="text-[11px] text-red-500">{status.error}</p>
                    ) : (
                        <p
                            className={cn(
                                "text-[11px] transition-colors",
                                active ? "text-neutral-600" : "text-neutral-400",
                            )}
                        >
                            {STAGE_LABEL[status.stage]}
                        </p>
                    )}
                </div>
            </div>
            <p className="text-[11px] tabular-nums text-neutral-400">
                {status.stage === "done" || status.stage === "cropping" || status.stage === "extracting"
                    ? `${status.questions} q${status.questions === 1 ? "" : "s"}`
                    : ""}
            </p>
        </div>
    );
}

function StageDot({ stage }: { stage: PageStage }) {
    if (stage === "done") {
        return (
            <span className="flex size-4 items-center justify-center rounded-full bg-neutral-900 text-white">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </span>
        );
    }
    if (stage === "error") {
        return <span className="size-4 rounded-full border border-red-300 bg-red-50" />;
    }
    if (stage === "pending") {
        return <span className="size-4 rounded-full border border-neutral-200" />;
    }
    return (
        <motion.span
            className="size-4 rounded-full border border-neutral-900"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
    );
}
