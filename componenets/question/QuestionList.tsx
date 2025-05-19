'use client';

import { useState, Suspense } from 'react';
import PDFGenerator from '../pdf/pdfPreview';
import LogoUploader from '@/componenets/question/LogoUploader';
import DraftManager from './DraftManager';
import { DialogCloseButton } from '../DialogCloseButton';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { exams, subjects } from '@/constant/filter';
import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import { Input } from '@/components/ui/input';
import AnswerPDFGenerator from '../pdf/AnswerPdfGenerator';
import renderMixedLatex from '@/lib/render-tex';

function QuestionBankViewerContent() {
    const {
        questions,
        loading,
        error,
        count,
        pagination,
        selectedQuestions,
        setPagination,
        updateFilters,
        toggleQuestionSelection,
    } = useQuestionBankContext();

    const { options, setOptions, setLogo, institution, setInstitution } = usePDFGeneratorContext()

    const handleInstitutionName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInstitution(e.target.value)
    }

    const handleIncludeAnswers = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOptions((prev) => ({ ...prev, includeAnswers: e.target.checked }));
    };

    const [localFilters, setLocalFilters] = useState({
        exam_name: '',
        subject: '',
        chapter: '',
    });

    const handleFilterChange = (
        e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setLocalFilters((prev) => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        updateFilters({
            exam_name: localFilters.exam_name || undefined,
            subject: localFilters.subject || undefined,
            chapter: localFilters.chapter || undefined,
        });
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <h1 className="text-3xl font-bold py-6 text-center text-slate-800 tracking-tight md:text-4xl">
                Educator's Question Bank
            </h1>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Left Sidebar - Fixed on large screens */}
                    <aside className="lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Logo Uploader */}
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
                                <h2 className="text-lg font-semibold text-slate-700 sm:text-xl">Institution Details</h2>
                                <LogoUploader onUpload={setLogo} />

                                <div className="space-y-2 mt-4">
                                    <div className="relative">
                                        <label
                                            htmlFor="institution"
                                            className="block text-sm font-medium text-slate-600 mb-1 sm:mb-2"
                                        >
                                            Institution Name
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="institution"
                                                type="text"
                                                onChange={handleInstitutionName}
                                                className="w-full h-full sm:p-3 border border-slate-200 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PDF Options */}
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
                                <h2 className="text-lg font-semibold mb-3 text-slate-700 sm:text-xl">PDF Options</h2>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={options.includeAnswers}
                                        onChange={handleIncludeAnswers}
                                        className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-slate-600 text-xs sm:text-base">Include Answers</span>
                                </label>
                            </div>

                            {/* Filter Controls */}
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
                                <h2 className="text-lg font-semibold mb-3 text-slate-700 sm:text-xl">Filter Questions</h2>
                                <div className="space-y-4 mb-4 sm:mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Exam</label>
                                        <select
                                            name="exam_name"
                                            value={localFilters.exam_name}
                                            onChange={handleFilterChange}
                                            className="w-full p-2 sm:p-3 border border-slate-200 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base"
                                        >
                                            {exams.map((sub) => (
                                                <option key={sub.value} value={sub.value}>
                                                    {sub.option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Subject</label>
                                        <select
                                            name="subject"
                                            value={localFilters.subject}
                                            onChange={handleFilterChange}
                                            className="w-full p-2 sm:p-3 border border-slate-200 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base"
                                        >
                                            {subjects.map((sub) => (
                                                <option key={sub.value} value={sub.value}>
                                                    {sub.option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Chapter</label>
                                        <input
                                            type="text"
                                            name="chapter"
                                            value={localFilters.chapter}
                                            onChange={handleFilterChange}
                                            placeholder="Enter chapter name"
                                            className="w-full p-2 sm:p-3 border border-slate-200 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <button
                                        onClick={applyFilters}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition shadow-sm text-sm sm:text-base"
                                    >
                                        Apply Filters
                                    </button>
                                    <button
                                        onClick={() => {
                                            setLocalFilters({ exam_name: '', subject: '', chapter: '' });
                                            updateFilters({});
                                        }}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition shadow-sm text-sm sm:text-base"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content - Scrollable on large screens */}
                    <main className="flex-1 space-y-4 sm:space-y-6">
                        {/* Folders Controls */}
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
                            <h2 className="text-lg font-semibold mb-3 text-slate-700 sm:text-xl">Folders</h2>
                            <DraftManager />
                        </div>

                        {/* Selected Questions Actions */}
                        {selectedQuestions.length > 0 && (
                            <div className="flex gap-3 bg-white p-3 sm:p-4 rounded-lg shadow-md border border-slate-200">
                                <PDFGenerator
                                    institution={institution}
                                    selectedQuestions={selectedQuestions}
                                    options={options}
                                />
                                <AnswerPDFGenerator
                                    institution={institution}
                                    selectedQuestions={selectedQuestions}
                                    options={options}
                                />
                                <DialogCloseButton selectedQuestions={selectedQuestions} />
                            </div>
                        )}

                        {/* Status Messages */}
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

                        {/* Questions List */}
                        {!loading && (
                            <div className="space-y-4 sm:space-y-6">
                                {questions.map((question) => (
                                    <div
                                        key={question.id}
                                        className={`p-3 sm:p-4 bg-white rounded-lg shadow-md border transition-all duration-200 ${selectedQuestions.some((q) => q.id === question.id)
                                            ? 'border-amber-500 bg-amber-50'
                                            : 'border-slate-200 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-start">
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestions.some((q) => q.id === question.id)}
                                                onChange={() => toggleQuestionSelection(question.id)}
                                                className="mt-1 mr-2 sm:mr-3 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            <div className="flex-1 w-full text-wrap">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                                                        {question.exam_name}
                                                    </span>
                                                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                                                        {question.subject}
                                                    </span>
                                                    {question.chapter && (
                                                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                                                            {question.chapter}
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-base font-semibold mb-2 text-slate-800 sm:text-lg">
                                                    Q{question.question_number}: {renderMixedLatex(question.question_text)}
                                                </h3>

                                                <div className="space-y-2 mb-2">
                                                    {question.options.map((option, index) => {
                                                        const optionLetter = String.fromCharCode(65 + index);
                                                        const optionNumber = String(index + 1);
                                                        const answers = (question.answer || '').toString().split(',').map(a => a.trim().toUpperCase());

                                                        const isCorrect = answers.includes(optionLetter) || answers.includes(optionNumber);

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`pl-3 border-l-4 py-1 rounded-r-md ${isCorrect
                                                                    ? 'border-emerald-500 bg-emerald-50'
                                                                    : 'border-slate-200'
                                                                    }`}
                                                            >
                                                                <span className="font-medium text-slate-700 text-sm sm:text-base">
                                                                </span>{' '}
                                                                <span className="text-sm sm:text-base">{renderMixedLatex(option)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>


                                                <div className="text-sm text-green-600">
                                                    <span className="font-medium">Answer:</span> {question.answer}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {count > 0 && !loading && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 sm:p-6 rounded-lg shadow-md border border-slate-200">
                                <div className="text-sm text-slate-600">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                    {Math.min(pagination.page * pagination.limit, count)} of {count} questions
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className={`px-4 py-2 border border-slate-200 rounded-md text-slate-700 text-sm sm:text-base ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100'
                                            } transition`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page * pagination.limit >= count}
                                        className={`px-4 py-2 border border-slate-200 rounded-md text-slate-700 text-sm sm:text-base ${pagination.page * pagination.limit >= count
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-slate-100'
                                            } transition`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loading && questions.length === 0 && (
                            <div className="p-6 sm:p-8 text-center bg-white rounded-lg shadow-md border border-slate-200">
                                <p className="text-slate-500 text-base sm:text-lg font-medium">
                                    No questions found matching your criteria
                                </p>
                                <button
                                    onClick={() => {
                                        setLocalFilters({ exam_name: '', subject: '', chapter: '' });
                                        updateFilters({});
                                    }}
                                    className="mt-3 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium rounded-md transition text-sm sm:text-base"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

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
