'use client';

import { useState } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { exams, subjects } from '@/constant/filter';

export default function FilterControls() {
    const { updateFilters } = useQuestionBankContext();
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
    );
}
