"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionItem } from "@/components/drafts/QuestionItem";
import { useMyQuestions } from "@/hooks/queries/useMyQuestions";

export function MyQuestionsSection() {
    const query = useMyQuestions();
    const questions = query.data?.pages.flatMap((page) => page.items) ?? [];

    return (
        <section aria-labelledby="my-questions-heading" className="rounded-xl border border-black/5 bg-white p-4 shadow-xs sm:p-5">
            <div>
                <h2 id="my-questions-heading" className="text-lg font-semibold text-zinc-900">
                    My Questions
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                    Questions you created manually. They stay separate from every Draft Paper until you add them.
                </p>
            </div>

            {query.isPending && (
                <div role="status" className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading your questions…
                </div>
            )}

            {query.isError && (
                <div role="alert" className="mt-4 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{query.error instanceof Error ? query.error.message : "Your questions could not be loaded."}</span>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void query.refetch()}>
                        Retry
                    </Button>
                </div>
            )}

            {query.isSuccess && questions.length === 0 && (
                <p className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">
                    No manually created questions yet. New questions you add will appear here.
                </p>
            )}

            {questions.length > 0 && (
                <ul className="mt-4 space-y-3">
                    {questions.map((question, index) => (
                        <QuestionItem
                            key={question.id}
                            question={{
                                ...question,
                                answer: question.answer ?? "Not set",
                                exam_name: question.exam_name ?? undefined,
                                subject: question.subject ?? undefined,
                                chapter: question.chapter ?? undefined,
                                question_image: question.question_image ?? undefined,
                            }}
                            index={index}
                            userRole="viewer"
                            selectedFolderName="My Questions"
                            questionToRemove={null}
                            setQuestionToRemove={() => undefined}
                            onRemove={async () => undefined}
                        />
                    ))}
                </ul>
            )}

            {query.hasNextPage && (
                <div className="mt-4 flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={query.isFetchingNextPage}
                        onClick={() => void query.fetchNextPage()}
                    >
                        {query.isFetchingNextPage ? "Loading…" : "Load more"}
                    </Button>
                </div>
            )}
        </section>
    );
}
