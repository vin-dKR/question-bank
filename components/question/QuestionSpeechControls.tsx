"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LANGUAGE_NAMES = typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

/** A conservative, honest approximation for speaking stored LaTeX as words. */
function mathAwareSpeechText(value: string) {
    const replacements: Array<[RegExp, string]> = [
        [/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1 over $2"],
        [/\\sqrt\s*\{([^{}]+)\}/g, "square root of $1"],
        [/\\times\b/g, " times "],
        [/\\div\b/g, " divided by "],
        [/\\pm\b/g, " plus or minus "],
        [/\\leq?\b/g, " less than or equal to "],
        [/\\geq?\b/g, " greater than or equal to "],
        [/\\neq\b/g, " not equal to "],
        [/\\alpha\b/g, " alpha "],
        [/\\beta\b/g, " beta "],
        [/\\gamma\b/g, " gamma "],
        [/\\theta\b/g, " theta "],
        [/\\pi\b/g, " pi "],
        [/\^\s*\{?([^\s{}]+)\}?/g, " to the power of $1"],
        [/_\s*\{?([^\s{}]+)\}?/g, " subscript $1"],
    ];

    let text = value.replace(/\$\$?|\\\(|\\\)|\\\[|\\\]/g, " ");
    for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
    return text
        .replace(/\\(?:text|mathrm|mathbf|operatorname)\s*\{([^{}]+)\}/g, "$1")
        .replace(/\\[a-zA-Z]+/g, " ")
        .replace(/[{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function chunkSpeech(text: string, maxLength = 220) {
    const chunks: string[] = [];
    const sentences = text.match(/[^.!?]+[.!?]*|.+$/g) ?? [text];
    let current = "";

    const pushWords = (sentence: string) => {
        for (const word of sentence.trim().split(/\s+/)) {
            if (!word) continue;
            if (current && `${current} ${word}`.length > maxLength) {
                chunks.push(current);
                current = word;
            } else {
                current = current ? `${current} ${word}` : word;
            }
        }
    };

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        if (current && `${current} ${trimmed}`.length > maxLength) {
            chunks.push(current);
            current = "";
        }
        if (trimmed.length > maxLength) pushWords(trimmed);
        else current = current ? `${current} ${trimmed}` : trimmed;
    }
    if (current) chunks.push(current);
    return chunks;
}

export function QuestionSpeechControls({ text }: { text: string }) {
    const [supported, setSupported] = useState<boolean | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [language, setLanguage] = useState("en-US");
    const [status, setStatus] = useState<"idle" | "speaking" | "paused" | "error">("idle");
    const [message, setMessage] = useState("Ready to listen.");
    const generationRef = useRef(0);
    const languageInitializedRef = useRef(false);

    const cancelSpeech = useCallback(() => {
        generationRef.current += 1;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        setStatus("idle");
        setMessage("Stopped.");
    }, []);

    useEffect(() => {
        if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
            setSupported(false);
            setMessage("Listening is not supported in this browser.");
            return;
        }

        setSupported(true);
        const loadVoices = () => {
            const nextVoices = window.speechSynthesis.getVoices();
            setVoices(nextVoices);
            if (nextVoices.length > 0) {
                const browserLanguage = navigator.language || "en-US";
                const preferred = nextVoices.find((voice) => voice.lang === browserLanguage)
                    ?? nextVoices.find((voice) => voice.lang.startsWith(browserLanguage.split("-")[0]));
                if (preferred && !languageInitializedRef.current) {
                    setLanguage(preferred.lang);
                    languageInitializedRef.current = true;
                }
            }
        };
        loadVoices();
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
        return () => {
            window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
            generationRef.current += 1;
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        generationRef.current += 1;
        if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
        setStatus("idle");
        setMessage("Ready to listen.");
    }, [text]);

    const languages = useMemo(() => {
        const values = new Set(voices.map((voice) => voice.lang).filter(Boolean));
        values.add(language);
        return [...values].sort((a, b) => a.localeCompare(b));
    }, [language, voices]);

    const start = () => {
        if (!supported) return;
        const speechText = mathAwareSpeechText(text);
        if (!speechText) {
            setStatus("error");
            setMessage("Enter question text before listening.");
            return;
        }

        const chunks = chunkSpeech(speechText);
        const synthesis = window.speechSynthesis;
        const token = generationRef.current + 1;
        generationRef.current = token;
        synthesis.cancel();
        setStatus("speaking");
        setMessage("Reading question aloud.");

        const voice = voices.find((candidate) => candidate.lang === language)
            ?? voices.find((candidate) => candidate.lang.startsWith(language.split("-")[0]))
            ?? voices.find((candidate) => candidate.default)
            ?? voices[0];

        const speakAt = (index: number) => {
            if (generationRef.current !== token) return;
            if (index >= chunks.length) {
                setStatus("idle");
                setMessage("Finished reading.");
                return;
            }
            const utterance = new SpeechSynthesisUtterance(chunks[index]);
            utterance.lang = voice?.lang ?? language;
            if (voice) utterance.voice = voice;
            utterance.onend = () => speakAt(index + 1);
            utterance.onerror = (event) => {
                if (generationRef.current !== token || event.error === "canceled" || event.error === "interrupted") return;
                setStatus("error");
                setMessage("The browser could not finish reading this question. Try again or choose another language.");
            };
            synthesis.speak(utterance);
        };
        speakAt(0);
    };

    const pause = () => {
        window.speechSynthesis.pause();
        setStatus("paused");
        setMessage("Paused.");
    };

    const resume = () => {
        window.speechSynthesis.resume();
        setStatus("speaking");
        setMessage("Reading question aloud.");
    };

    if (supported === false) {
        return <p className="mt-2 text-xs text-zinc-500" role="status">Listening is not supported in this browser.</p>;
    }

    return (
        <div className="mt-2 rounded-lg border border-black/5 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={supported !== true || !text.trim()} onClick={start}>
                    <Volume2 className="h-4 w-4" aria-hidden="true" /> Listen
                </Button>
                {status === "speaking" ? (
                    <Button type="button" size="sm" variant="outline" onClick={pause}>
                        <Pause className="h-4 w-4" aria-hidden="true" /> Pause
                    </Button>
                ) : status === "paused" ? (
                    <Button type="button" size="sm" variant="outline" onClick={resume}>
                        <Play className="h-4 w-4" aria-hidden="true" /> Resume
                    </Button>
                ) : null}
                <Button type="button" size="sm" variant="outline" disabled={status !== "speaking" && status !== "paused"} onClick={cancelSpeech}>
                    <Square className="h-3.5 w-3.5" aria-hidden="true" /> Stop
                </Button>
                <label className="ml-auto flex items-center gap-2 text-xs text-zinc-600">
                    Language
                    <select
                        className="h-8 max-w-44 rounded-md border border-black/10 bg-white px-2"
                        value={language}
                        onChange={(event) => {
                            if (status === "speaking" || status === "paused") cancelSpeech();
                            setLanguage(event.target.value);
                        }}
                        disabled={supported !== true}
                    >
                        {languages.map((value) => (
                            <option key={value} value={value}>
                                {LANGUAGE_NAMES?.of(value.split("-")[0]) ?? value} ({value})
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <p className={`mt-2 text-xs ${status === "error" ? "text-rose-600" : "text-zinc-500"}`} aria-live="polite">{message}</p>
            <p className="mt-1 text-[11px] leading-4 text-zinc-400">
                Uses your browser&apos;s on-device speech voices. Mathematical notation is translated approximately; review complex formulas visually.
            </p>
        </div>
    );
}
