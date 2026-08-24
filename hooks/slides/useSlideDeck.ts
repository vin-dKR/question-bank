"use client";

/**
 * Drives .pptx generation for the selected questions and hands the file to the
 * browser. The action returns base64 because a server action cannot return a
 * Buffer, so it is decoded here before being wrapped in a Blob.
 */
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { generateDeck, type DeckQuestion, type GenerateDeckInput } from "@/actions/slides/generateDeck";
import type { BindKey } from "@/types/slides";

const PPTX_MIME =
    "application/vnd.openxmlformats-officedocument.presentationml.presentation";

function base64ToBlob(base64: string, mime: string): Blob {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

/** Strip the selection down to the fields the binder needs. */
export function toDeckQuestions(questions: Question[]): DeckQuestion[] {
    return questions.map((q) => ({
        id: q.id,
        question_number: q.question_number,
        question_text: q.question_text,
        options: q.options,
        answer: q.answer,
        subject: q.subject,
        topic: q.topic,
        chapter: q.chapter,
        exam_name: q.exam_name,
        question_image: q.question_image,
        isOptionImage: q.isOptionImage,
    }));
}

export function useSlideDeck() {
    const [isGenerating, setIsGenerating] = useState(false);

    const generate = useCallback(
        async (opts: {
            questions: Question[];
            presetId: string;
            themeId: string;
            mapping?: Record<string, BindKey | null>;
            deckName?: string;
            savedTemplateId?: string;
        }) => {
            if (!opts.questions.length) {
                toast.error("Select at least one question first.");
                return false;
            }

            setIsGenerating(true);
            const toastId = toast.loading("Building your slides…");

            try {
                const payload: GenerateDeckInput = {
                    questions: toDeckQuestions(opts.questions),
                    presetId: opts.presetId,
                    themeId: opts.themeId,
                    mapping: opts.mapping,
                    deckName: opts.deckName,
                    savedTemplateId: opts.savedTemplateId,
                };

                const res = await generateDeck(payload);

                if (!res.success) {
                    toast.error(res.error, { id: toastId });
                    return false;
                }

                const blob = base64ToBlob(res.data, PPTX_MIME);
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = res.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                // Revoke on the next tick — Safari cancels the download if the
                // object URL disappears synchronously after click().
                setTimeout(() => URL.revokeObjectURL(url), 1000);

                toast.success(`${res.slideCount} slides downloaded.`, { id: toastId });
                return true;
            } catch (err) {
                console.error("[useSlideDeck] generate failed:", err);
                toast.error(
                    err instanceof Error ? err.message : "Could not generate the slides.",
                    { id: toastId }
                );
                return false;
            } finally {
                setIsGenerating(false);
            }
        },
        []
    );

    return { generate, isGenerating };
}
