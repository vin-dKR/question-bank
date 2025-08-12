import EmptyState from "@/components/question/EmptyState";
import FilterControls from "@/components/question/FilterControls"
import FoldersControls from "@/components/question/FoldersControls"
import PaginationControls from "@/components/question/PaginationControls";
import QuestionList from "@/components/question/QuestionList";
import SearchBar from "@/components/question/SearchBar"
import SelectedQuestionsActions from "@/components/question/SelectedQuestionsActions";
import { useQuestionBankContext } from "@/lib/context/QuestionBankContext";

const QuestionBankViewerContent = () => {
    const { questions, loading, error, totalCount, selectedQuestionIds } = useQuestionBankContext();

    return (
        <div className="relative">
            <div className="w-full mx-auto pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6">
                    {/* Sidebar */}
                    <aside className="col-span-1 lg:col-span-2 xl:col-span-2 lg:sticky lg:top-1 self-start h-fit">
                        <div className="space-y-4 sm:space-y-6">
                            <FilterControls />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="col-span-1 lg:col-span-4 xl:col-span-6 space-y-4 pt-1">
                        <FoldersControls />
                        <SearchBar />
                        {selectedQuestionIds.size > 0 && <SelectedQuestionsActions />}
                        {error && (
                            <div className="p-3 sm:p-4 bg-rose-50 text-rose-700 rounded-lg shadow-sm text-sm sm:text-base">
                                {error}
                            </div>
                        )}
                        {loading && (
                            <div className="p-3 sm:p-4 bg-indigo-50 text-indigo-700 rounded-xl shadow-sm flex items-center justify-center text-sm sm:text-base font-semibold border border-black/5">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700 mr-2"></div>
                                Loading questions...
                            </div>
                        )}
                        {!loading && questions.length > 0 && <QuestionList />}
                        {totalCount > 0 && !loading && <PaginationControls />}
                        {!loading && questions.length === 0 && <EmptyState />}
                    </main>
                </div>
            </div>
        </div>
    );
};


export default QuestionBankViewerContent
