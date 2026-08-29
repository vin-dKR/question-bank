'use client';

import SearchBar from "@/components/question/SearchBar"
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/question/EmptyState";
import QuestionList from "@/components/question/QuestionList";
import FilterControls from "@/components/question/FilterControls"
import SelectedQuestionsActions from "@/components/question/SelectedQuestionsActions";
import { useQuestionBankContext, useQuestionsCount, useQuestionsList } from "@/lib/context/QuestionBankContext";

const QuestionBankViewerContent = () => {
    const { selectedQuestions } = useQuestionBankContext();
    const { questions, loading, error, initialFetchDone } = useQuestionsList();
    const { total, isSearching } = useQuestionsCount();

    // "Showing X of N published questions" while browsing; during a keyword
    // search the list is the whole result set, so show its size instead.
    const shown = questions.length;
    const countLabel = isSearching
        ? `${shown} result${shown === 1 ? "" : "s"}`
        : `Showing ${shown} of ${total.toLocaleString()} published question${total === 1 ? "" : "s"}`;

    return (
        <div className="relative">
            <div className="w-full mx-auto pb-6 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
                    {/* Sidebar */}
                    <aside className="col-span-1 lg:col-span-2 xl:col-span-2 lg:sticky lg:top-0 self-start h-fit">
                        <div className="space-y-4">
                            <FilterControls />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="col-span-1 lg:col-span-4 xl:col-span-6 space-y-4">
                        <SearchBar />
                        {!loading && !error && (isSearching || total > 0) && (
                            <p className="m-0 text-xs text-zinc-500">{countLabel}</p>
                        )}
                        {selectedQuestions.length > 0 && <SelectedQuestionsActions showPrintBtn={true} />}
                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-rose-100 bg-rose-50/50 text-sm text-rose-700">
                                {error}
                            </div>
                        )}
                        {loading && (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="rounded-xl border border-black/5 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                                        <div className="flex gap-1.5">
                                            <Skeleton className="h-4 w-14" />
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-5/6" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {!loading && questions.length > 0 && <QuestionList />}
                        {!loading && initialFetchDone && questions.length === 0 && <EmptyState />}
                    </main>
                </div>
            </div>
        </div>
    );
};


export default QuestionBankViewerContent
