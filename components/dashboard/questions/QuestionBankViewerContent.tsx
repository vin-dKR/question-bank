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
            <div className="mx-auto w-full space-y-5 pb-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 @5xl/page:grid-cols-6 @7xl/page:grid-cols-8">
                    {/* Sidebar */}
                    <aside className="col-span-1 h-fit self-start @5xl/page:sticky @5xl/page:top-0 @5xl/page:col-span-2 @7xl/page:col-span-2">
                        <div className="flex items-start gap-2 sm:block sm:space-y-3">
                            <div className="min-w-0 flex-1 sm:w-full">
                                <SearchBar />
                            </div>
                            <FilterControls />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="col-span-1 min-w-0 space-y-3 @5xl/page:col-span-4 @7xl/page:col-span-6">
                        {!loading && !error && (isSearching || total > 0) && (
                            <p className="m-0 px-1 text-xs font-medium text-zinc-500">{countLabel}</p>
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
                                    <div key={i} className="space-y-3 rounded-xl border border-black/5 bg-white p-3 shadow-xs sm:p-4">
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
