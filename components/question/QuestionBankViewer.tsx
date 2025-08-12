'use client';

import { Suspense, memo } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import FilterControls from './FilterControls';
import FoldersControls from './FoldersControls';
import SelectedQuestionsActions from './SelectedQuestionsActions';
import QuestionList from './QuestionList';
import PaginationControls from './PaginationControls';
import EmptyState from './EmptyState';
import SearchBar from './SearchBar';

const QuestionBankViewerContent = memo(() => {
    const { questions, loading, error, totalCount, selectedQuestionIds } = useQuestionBankContext();

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    <aside className="lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] ">
                        <div className="space-y-4 sm:space-y-6">
                            {/*
                            <PDFOptions />
                            */}
                            <FilterControls />
                        </div>
                    </aside>

                    <main className="flex-1 space-y-4 sm:space-y-6">
                        <FoldersControls />
                        <SearchBar />
                        {selectedQuestionIds.size > 0 && (
                            <SelectedQuestionsActions />
                        )}
                        {error && (
                            <div className="p-3 sm:p-4 bg-rose-50 text-rose-700 rounded-lg shadow-sm text-sm sm:text-base">
                                {error}
                            </div>
                        )}
                        {loading && (
                            <div className="p-3 sm:p-4 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm flex items-center justify-center text-sm sm:text-base">
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
});

QuestionBankViewerContent.displayName = 'QuestionBankViewerContent';

export default function QuestionBankViewer() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                    <div className="p-3 sm:p-4 bg-indigo-50 text-indigo-700 rounded-lg shadow-sm flex items-center justify-center text-sm sm:text-base">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-700 mr-2"></div>
                        Loading questions...
                    </div>
                </div>
            }
        >
            <QuestionBankViewerContent />
        </Suspense>
    );
}
