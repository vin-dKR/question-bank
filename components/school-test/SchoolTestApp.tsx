"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { PageResult, PreparedPage } from "@/lib/school-test/types";
import { UploadZone } from "./UploadZone";
import { ProcessingPanel, type PageStatus } from "./ProcessingPanel";
import { Verifier } from "./Verifier";

type Phase = "idle" | "processing" | "verify";

export default function SchoolTestApp() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [fileName, setFileName] = useState<string | null>(null);
    const [pageStatuses, setPageStatuses] = useState<PageStatus[]>([]);
    const [results, setResults] = useState<PageResult[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setPhase("idle");
        setFileName(null);
        setPageStatuses([]);
        setResults([]);
    }, []);

    const start = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        const label = files.length === 1
            ? files[0].name
            : `${files[0].name} + ${files.length - 1} more`;
        setFileName(label);
        setPageStatuses([]);
        setResults([]);
        setPhase("processing");

        const controller = new AbortController();
        abortRef.current = controller;

        // Step 1 — prepare: rasterize PDFs / normalize images on the server.
        // Stays well under Netlify's 30 s sync-function cap because no vision
        // calls happen here.
        const prepareBody = new FormData();
        for (const f of files) prepareBody.append("file", f);

        let prepared: PreparedPage[];
        try {
            const resp = await fetch("/api/school-test/prepare", {
                method: "POST",
                body: prepareBody,
                signal: controller.signal,
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                const detail = text.trim() || resp.statusText || "no response body";
                toast.error(`Prepare failed (HTTP ${resp.status}): ${detail}`);
                setPhase("idle");
                return;
            }
            const data = (await resp.json()) as { pages?: PreparedPage[] };
            if (!Array.isArray(data.pages) || data.pages.length === 0) {
                toast.error("Prepare returned no pages.");
                setPhase("idle");
                return;
            }
            prepared = data.pages;
        } catch (e) {
            const err = e as Error;
            if (err.name === "AbortError") return;
            const hint = err.name === "TypeError"
                ? "Network error — the request never reached the server. "
                : "";
            toast.error(`Prepare failed: ${hint}${err.name}: ${err.message}`);
            setPhase("idle");
            return;
        }

        setPageStatuses(
            prepared.map((p) => ({
                page: p.pageNumber,
                stage: "pending",
                detections: 0,
                questions: 0,
            })),
        );

        // Step 2 — process each page in its own request. One vision-pipeline
        // cycle per invocation fits comfortably in the 30 s cap.
        const collected: PageResult[] = [];
        let stoppedEarly = false;

        for (const page of prepared) {
            if (controller.signal.aborted) {
                stoppedEarly = true;
                break;
            }

            setPageStatuses((prev) =>
                prev.map((p) => (p.page === page.pageNumber ? { ...p, stage: "detecting" } : p)),
            );

            let resp: Response;
            try {
                resp = await fetch("/api/school-test/process-page", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(page),
                    signal: controller.signal,
                });
            } catch (e) {
                const err = e as Error;
                if (err.name === "AbortError") {
                    stoppedEarly = true;
                    break;
                }
                const hint = err.name === "TypeError"
                    ? "Network error — the request never reached the server."
                    : `${err.name}: ${err.message}`;
                setPageStatuses((prev) =>
                    prev.map((p) =>
                        p.page === page.pageNumber ? { ...p, stage: "error", error: hint } : p,
                    ),
                );
                continue;
            }

            if (!resp.ok) {
                const text = await resp.text().catch(() => "");
                const detail = text.trim() || resp.statusText || `HTTP ${resp.status}`;
                setPageStatuses((prev) =>
                    prev.map((p) =>
                        p.page === page.pageNumber ? { ...p, stage: "error", error: detail } : p,
                    ),
                );
                continue;
            }

            let result: PageResult;
            try {
                const data = (await resp.json()) as { result?: PageResult };
                if (!data.result) throw new Error("Missing result field in response");
                result = data.result;
            } catch (e) {
                const err = e as Error;
                setPageStatuses((prev) =>
                    prev.map((p) =>
                        p.page === page.pageNumber
                            ? { ...p, stage: "error", error: `Bad response: ${err.message}` }
                            : p,
                    ),
                );
                continue;
            }

            collected.push(result);
            setPageStatuses((prev) =>
                prev.map((p) =>
                    p.page === page.pageNumber
                        ? {
                              ...p,
                              stage: "done",
                              detections: result.crops.length,
                              questions: result.questions.length,
                          }
                        : p,
                ),
            );
            setResults([...collected].sort((a, b) => a.pageNumber - b.pageNumber));
        }

        // Final reconciliation — identical UX to before: if anything errored /
        // was skipped, surface it so it doesn't vanish when we jump to verify.
        setPageStatuses((current) => {
            const errored = current.filter((p) => p.stage === "error");

            if (collected.length === 0) {
                if (errored.length > 0 && errored[0].error) {
                    toast.error(errored[0].error);
                } else if (stoppedEarly) {
                    // Aborted before anything finished — silent, user clicked cancel.
                } else {
                    toast.error("No pages were processed. Check server logs.");
                }
                return current;
            }

            if (errored.length > 0) {
                toast.error(
                    `${errored.length} page${errored.length === 1 ? "" : "s"} failed: ${errored[0].error ?? "unknown"}${errored.length > 1 ? " (…)" : ""}`,
                );
            }
            return current;
        });

        if (collected.length === 0) return;
        setPhase("verify");
    }, []);

    return (
        <div className="h-full w-full bg-neutral-50 text-neutral-900">
            <AnimatePresence mode="wait">
                {phase === "idle" && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <IdleView onFiles={start} />
                    </motion.div>
                )}
                {phase === "processing" && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <ProcessingPanel fileName={fileName} pages={pageStatuses} onCancel={reset} />
                    </motion.div>
                )}
                {phase === "verify" && (
                    <motion.div
                        key="verify"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        <Verifier results={results} fileName={fileName} onReset={reset} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function IdleView({ onFiles }: { onFiles: (files: File[]) => void }) {
    return (
        <div className="flex h-full items-center justify-center px-6 py-12">
            <div className="w-full max-w-2xl">
                <div className="mb-10 space-y-2">
                    <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-neutral-900">
                        School Test
                    </h1>
                    <p className="text-[15px] leading-relaxed text-neutral-500">
                        Upload a question paper image or PDF. We&rsquo;ll auto-detect diagrams and extract
                        each question so you can review and edit them before saving.
                    </p>
                </div>
                <UploadZone onFiles={onFiles} />
                <p className="mt-6 text-xs text-neutral-400">
                    Nothing is saved to the database in this step &mdash; you&rsquo;ll review the result on
                    the next screen.
                </p>
            </div>
        </div>
    );
}
