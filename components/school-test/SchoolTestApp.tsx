"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { PageResult, ProcessEvent, Provider } from "@/lib/school-test/types";
import { cn } from "@/lib/utils";
import { UploadZone } from "./UploadZone";
import { ProcessingPanel, type PageStatus } from "./ProcessingPanel";
import { Verifier } from "./Verifier";

type Phase = "idle" | "processing" | "verify";

export default function SchoolTestApp() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [fileName, setFileName] = useState<string | null>(null);
    const [pageStatuses, setPageStatuses] = useState<PageStatus[]>([]);
    const [results, setResults] = useState<PageResult[]>([]);
    const [provider, setProvider] = useState<Provider>("openai");
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setPhase("idle");
        setFileName(null);
        setPageStatuses([]);
        setResults([]);
    }, []);

    const start = useCallback(async (file: File, selectedProvider: Provider) => {
        setFileName(file.name);
        setPageStatuses([]);
        setResults([]);
        setPhase("processing");

        const controller = new AbortController();
        abortRef.current = controller;

        const body = new FormData();
        body.append("file", file);
        body.append("provider", selectedProvider);

        let response: Response;
        try {
            response = await fetch("/api/school-test/process", {
                method: "POST",
                body,
                signal: controller.signal,
            });
        } catch (e) {
            if ((e as Error).name === "AbortError") return;
            toast.error(`Upload failed: ${(e as Error).message}`);
            setPhase("idle");
            return;
        }

        if (!response.ok || !response.body) {
            const msg = await response.text().catch(() => "Request failed");
            toast.error(msg || `Request failed (${response.status})`);
            setPhase("idle");
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";
        const collected: PageResult[] = [];

        const handleEvent = (event: ProcessEvent) => {
            switch (event.type) {
                case "page-count": {
                    setPageStatuses(
                        Array.from({ length: event.total }, (_, i) => ({
                            page: i + 1,
                            stage: "pending",
                            detections: 0,
                            questions: 0,
                        })),
                    );
                    return;
                }
                case "page-start": {
                    setPageStatuses((prev) =>
                        prev.map((p) => (p.page === event.page ? { ...p, stage: "detecting" } : p)),
                    );
                    return;
                }
                case "page-detected": {
                    setPageStatuses((prev) =>
                        prev.map((p) =>
                            p.page === event.page
                                ? { ...p, stage: "extracting", detections: event.detectionCount }
                                : p,
                        ),
                    );
                    return;
                }
                case "page-extracted": {
                    setPageStatuses((prev) =>
                        prev.map((p) =>
                            p.page === event.page
                                ? { ...p, stage: "cropping", questions: event.questionCount }
                                : p,
                        ),
                    );
                    return;
                }
                case "page-done": {
                    collected.push(event.result);
                    setPageStatuses((prev) =>
                        prev.map((p) => (p.page === event.page ? { ...p, stage: "done" } : p)),
                    );
                    setResults([...collected].sort((a, b) => a.pageNumber - b.pageNumber));
                    return;
                }
                case "error": {
                    if (event.page) {
                        setPageStatuses((prev) =>
                            prev.map((p) =>
                                p.page === event.page ? { ...p, stage: "error", error: event.message } : p,
                            ),
                        );
                    } else {
                        toast.error(event.message);
                    }
                    return;
                }
                case "complete":
                    return;
            }
        };

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffered += decoder.decode(value, { stream: true });
                let newlineAt: number;
                while ((newlineAt = buffered.indexOf("\n")) !== -1) {
                    const line = buffered.slice(0, newlineAt).trim();
                    buffered = buffered.slice(newlineAt + 1);
                    if (!line) continue;
                    try {
                        handleEvent(JSON.parse(line) as ProcessEvent);
                    } catch {
                        // ignore malformed line; server controls output
                    }
                }
            }
        } catch (e) {
            if ((e as Error).name !== "AbortError") {
                toast.error(`Stream error: ${(e as Error).message}`);
            }
            setPhase("idle");
            return;
        }

        if (collected.length === 0) {
            // Don't bounce back to idle — we'd lose the per-page error badges the
            // user needs to actually diagnose the failure. Stay on the processing
            // view and surface the first real error in the toast.
            setPageStatuses((current) => {
                const firstError = current.find((p) => p.stage === "error");
                if (firstError?.error) {
                    toast.error(firstError.error);
                } else {
                    toast.error("Processing finished but no pages were returned. Check the server logs.");
                }
                return current;
            });
            return;
        }

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
                        <IdleView
                            provider={provider}
                            onProviderChange={setProvider}
                            onFile={(file) => start(file, provider)}
                        />
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

function IdleView({
    provider,
    onProviderChange,
    onFile,
}: {
    provider: Provider;
    onProviderChange: (p: Provider) => void;
    onFile: (file: File) => void;
}) {
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
                <UploadZone onFile={onFile} />
                <ProviderSelect value={provider} onChange={onProviderChange} />
                <p className="mt-6 text-xs text-neutral-400">
                    Nothing is saved to the database in this step &mdash; you&rsquo;ll review the result on
                    the next screen.
                </p>
            </div>
        </div>
    );
}

function ProviderSelect({
    value,
    onChange,
}: {
    value: Provider;
    onChange: (p: Provider) => void;
}) {
    const options: { id: Provider; label: string; hint: string }[] = [
        { id: "openai", label: "GPT-5.4", hint: "OpenAI" },
        { id: "gemini", label: "Gemini 2.0 Flash", hint: "Google" },
    ];
    return (
        <div className="mt-5 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
                Detection model
            </span>
            <div className="inline-flex rounded-full border border-neutral-200 bg-white p-0.5">
                {options.map((opt) => {
                    const active = value === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChange(opt.id)}
                            className={cn(
                                "relative rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                                active
                                    ? "bg-neutral-900 text-white"
                                    : "text-neutral-500 hover:text-neutral-900",
                            )}
                        >
                            {opt.label}
                            <span className="ml-1.5 text-[10px] opacity-60">{opt.hint}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
