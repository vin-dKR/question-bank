'use client';

import { useState, useMemo } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import Select from 'react-select';

export default function FilterControls() {
    const { updateFilters, filterOptions, optionsLoading } = useQuestionBankContext();
    const [localFilters, setLocalFilters] = useState({
        exam_name: '',
        subject: '',
        chapter: '',
        section_name: '',
        flagged: '',
    });

    const handleFilterChange = (name: string, value: string | null) => {
        const newLocalFilters = { ...localFilters, [name]: value || '' };
        setLocalFilters(newLocalFilters);

        // Immediately update filters for cascading, but only for parent filters
        if (['exam_name', 'subject', 'chapter'].includes(name)) {
            const filterUpdate: any = { [name]: value || undefined };
            // Reset dependent filters
            if (name === 'exam_name') {
                filterUpdate.subject = undefined;
                filterUpdate.chapter = undefined;
                filterUpdate.section_name = undefined;
                newLocalFilters.subject = '';
                newLocalFilters.chapter = '';
                newLocalFilters.section_name = '';
                setLocalFilters(newLocalFilters); // Update local state to reflect reset
            } else if (name === 'subject') {
                filterUpdate.chapter = undefined;
                filterUpdate.section_name = undefined;
                newLocalFilters.chapter = '';
                newLocalFilters.section_name = '';
                setLocalFilters(newLocalFilters);
            } else if (name === 'chapter') {
                filterUpdate.section_name = undefined;
                newLocalFilters.section_name = '';
                setLocalFilters(newLocalFilters);
            }
            updateFilters(filterUpdate);
        }
    };

    const applyFilters = () => {
        updateFilters({
            exam_name: localFilters.exam_name || undefined,
            subject: localFilters.subject || undefined,
            chapter: localFilters.chapter || undefined,
            section_name: localFilters.section_name || undefined,
            flagged: localFilters.flagged ? localFilters.flagged === 'true' : undefined,
        });
    };

    const examOptions = useMemo(
        () => filterOptions.exams.map((exam) => ({ value: exam, label: exam })),
        [filterOptions.exams]
    );

    const subjectOptions = useMemo(
        () => filterOptions.subjects.map((subject) => ({ value: subject, label: subject })),
        [filterOptions.subjects]
    );

    const chapterOptions = useMemo(
        () => filterOptions.chapters.map((chapter) => ({ value: chapter, label: chapter })),
        [filterOptions.chapters]
    );

    const sectionNameOptions = useMemo(
        () => filterOptions.section_names.map((name) => ({ value: name, label: name })),
        [filterOptions.section_names]
    );

    const flaggedOptions = [
        { value: 'true', label: 'Flagged' },
        { value: 'false', label: 'Unflagged' },
    ];

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            borderColor: '#e2e8f0',
            '&:hover': { borderColor: '#f59e0b' },
            boxShadow: 'none',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#f59e0b' : state.isFocused ? '#fef3c7' : 'white',
            color: state.isSelected ? 'white' : '#1e293b',
        }),
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
            <h2 className="text-lg font-semibold mb-3 text-slate-700 sm:text-xl">Filter Questions</h2>
            <div className="space-y-4 mb-4 sm:mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Exam</label>
                    <Select
                        name="exam_name"
                        options={examOptions}
                        value={examOptions.find((opt) => opt.value === localFilters.exam_name) || null}
                        onChange={(selected) => handleFilterChange('exam_name', selected?.value || null)}
                        placeholder="Select exam..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm sm:text-base"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Subject</label>
                    <Select
                        name="subject"
                        options={subjectOptions}
                        value={subjectOptions.find((opt) => opt.value === localFilters.subject) || null}
                        onChange={(selected) => handleFilterChange('subject', selected?.value || null)}
                        placeholder="Select subject..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm sm:text-base"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Chapter</label>
                    <Select
                        name="chapter"
                        options={chapterOptions}
                        value={chapterOptions.find((opt) => opt.value === localFilters.chapter) || null}
                        onChange={(selected) => handleFilterChange('chapter', selected?.value || null)}
                        placeholder="Select chapter..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm sm:text-base"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Section</label>
                    <Select
                        name="section_name"
                        options={sectionNameOptions}
                        value={sectionNameOptions.find((opt) => opt.value === localFilters.section_name) || null}
                        onChange={(selected) => handleFilterChange('section_name', selected?.value || null)}
                        placeholder="Select section..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm sm:text-base"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Flagged Status</label>
                    <Select
                        name="flagged"
                        options={flaggedOptions}
                        value={flaggedOptions.find((opt) => opt.value === localFilters.flagged) || null}
                        onChange={(selected) => handleFilterChange('flagged', selected?.value || null)}
                        placeholder="Select flagged status..."
                        isClearable
                        className="text-sm sm:text-base"
                        styles={selectStyles}
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
                        setLocalFilters({ exam_name: '', subject: '', chapter: '', section_name: '', flagged: '' });
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
