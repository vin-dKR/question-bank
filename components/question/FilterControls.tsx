'use client';

import {
    useState,
    useMemo,
    useEffect,
    useRef,
    useCallback
} from 'react';
import Select, { StylesConfig } from 'react-select';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Funnel } from 'lucide-react';

interface FilterUpdate {
    [key: string]: string | boolean | undefined;
    subject?: string;
    chapter?: string;
    section_name?: string;
    flagged?: boolean;
    question_type?: string;
}

export default function FilterControls() {
    const { setFilters, filterOptions, optionsLoading } = useQuestionBankContext();
    // console.log("FILTEROPTION: =-------------------", filterOptions)
    const [localFilters, setLocalFilters] = useState({
        exam_name: '',
        subject: '',
        chapter: '',
        section_name: '',
        flagged: '',
        question_type: ''
    });

    const { isTeacher, isLoading: roleLoading } = useUserRole();
    const { subject, isLoading: subjectLoading } = useUserSubject();
    const hasSetTeacherSubject = useRef(false);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    useEffect(() => {
        if (isTeacher && subject && !hasSetTeacherSubject.current) {
            hasSetTeacherSubject.current = true;
            setLocalFilters((prev) => ({
                ...prev,
                subject: subject,
            }));
        }
    }, [isTeacher, subject]);

    const handleFilterChange = useCallback((name: string, value: string | null) => {
        const newLocalFilters = { ...localFilters, [name]: value || '' };
        setLocalFilters(newLocalFilters);

        // Immediately update filters for cascading parent filters
        if (["exam_name", "subject", "chapter"].includes(name)) {
            const filterUpdate: FilterUpdate = {
                exam_name: localFilters.exam_name || undefined, // Always include current exam_name
                subject: isTeacher && subject ? subject : (localFilters.subject || undefined), // Include subject (teacher or selected)
                chapter: localFilters.chapter || undefined, // Include chapter if selected
            };

            // Update the changed filter
            filterUpdate[name] = value || undefined;

            // Reset dependent filters
            if (name === "exam_name") {
                // For teachers, preserve their assigned subject
                if (isTeacher && subject) {
                    filterUpdate.subject = subject;
                    newLocalFilters.subject = subject;
                } else {
                    filterUpdate.subject = undefined;
                    newLocalFilters.subject = '';
                }
                filterUpdate.chapter = undefined;
                filterUpdate.section_name = undefined;
                newLocalFilters.chapter = '';
                newLocalFilters.section_name = '';
            } else if (name === "subject") {
                filterUpdate.chapter = undefined;
                filterUpdate.section_name = undefined;
                newLocalFilters.chapter = '';
                newLocalFilters.section_name = '';
            } else if (name === "chapter") {
                filterUpdate.section_name = undefined;
                newLocalFilters.section_name = '';
            }

            // console.log('Applying filter update:', filterUpdate);
            setFilters(filterUpdate);
            setLocalFilters(newLocalFilters); // Update local state to reflect reset
        } else if (name === "section_name" || name === "flagged" || name === "question_type") {
            // Apply section, flagged, and question_type filters immediately
            const filterUpdate: FilterUpdate = {
                exam_name: localFilters.exam_name || undefined, // Include current exam_name
                subject: isTeacher && subject ? subject : (localFilters.subject || undefined), // Include subject
                chapter: localFilters.chapter || undefined, // Include chapter
            };

            if (name === "section_name") {
                filterUpdate.section_name = value || undefined;
            }
            if (name === "flagged") {
                filterUpdate.flagged = value ? value === 'true' : undefined;
            }
            if (name === "question_type") {
                filterUpdate.question_type = value || undefined;
            }

            // console.log('Applying section/flagged/question_type filter:', filterUpdate);
            setFilters(filterUpdate);
        }
    }, [localFilters, setFilters, isTeacher, subject]);

    const applyFilters = useCallback(() => {
        setFilters({
            exam_name: localFilters.exam_name || undefined,
            subject: isTeacher && subject ? subject : (localFilters.subject || undefined),
            chapter: localFilters.chapter || undefined,
            section_name: localFilters.section_name || undefined,
            flagged: localFilters.flagged ? localFilters.flagged === 'true' : undefined,
            question_type: localFilters.question_type || undefined,
        });
    }, [localFilters, setFilters, isTeacher, subject]);

    const clearFilters = useCallback(() => {
        const clearedFilters = { exam_name: '', subject: '', chapter: '', section_name: '', flagged: '', question_type: '' };

        // For teachers, preserve their assigned subject
        if (isTeacher && subject) {
            clearedFilters.subject = subject;
        }

        setLocalFilters(clearedFilters);
        setFilters({
            subject: isTeacher && subject ? subject : undefined
        });
    }, [setFilters, isTeacher, subject]);

    const examOptions = useMemo(
        () => filterOptions.exams.map((exam: string) => ({ value: exam, label: exam })),
        [filterOptions.exams]
    );

    const subjectOptions = useMemo(() => {
        let options = filterOptions.subjects.map((subject: string) => ({ value: subject, label: subject }));

        // For teachers, ensure their assigned subject is always included
        if (isTeacher && subject) {
            const hasTeacherSubject = options.some((opt: { value: string; label: string }) => opt.value === subject);
            if (!hasTeacherSubject) {
                options = [{ value: subject, label: subject }, ...options];
            }
        }

        return options;
    }, [filterOptions.subjects, isTeacher, subject]);

    const chapterOptions = useMemo(
        () => filterOptions.chapters.map((chapter: string) => ({ value: chapter, label: chapter })),
        [filterOptions.chapters]
    );

    const sectionNameOptions = useMemo(
        () => filterOptions.section_names.map((name: string) => ({ value: name, label: name })),
        [filterOptions.section_names]
    );

    const questionTypeOptions = useMemo(
        () => (Array.isArray(filterOptions.question_type) ? filterOptions.question_type.map((type: string) => ({ value: type, label: type })) : []),
        [filterOptions.question_type]
    );

    const flaggedOptions = useMemo(() => [
        { value: 'true', label: 'Flagged' },
        { value: 'false', label: 'Unflagged' },
    ], []);

    // Update selectStyles to use correct types
    const selectStyles = useMemo<StylesConfig<{ value: string; label: string }, false>>(() => ({
        control: (base) => ({
            ...base,
            borderColor: '#e2e8f0',
            '&:hover': { borderColor: '#f59e0b' },
            boxShadow: 'none',
            borderRadius: '10px',
        }),
        menu: (base) => ({
            ...base,
            borderRadius: "10px",
            overflow: "hidden",
        }),
        menuList: (base) => ({
            ...base,
            borderRadius: "10px",
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#f59e0b' : state.isFocused ? '#fef3c7' : 'white',
            color: state.isSelected ? 'white' : '#1e293b',
        }),
    }), []);

    // Show loading state while fetching role and subject
    if (roleLoading || subjectLoading) {
        return (
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-10 bg-slate-200 rounded"></div>
                        <div className="h-10 bg-slate-200 rounded"></div>
                        <div className="h-10 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    const renderFilterControls = () => (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200 tracking-3">
            <h2 className="text-lg font-semibold mb-3 text-slate-700 sm:text-xl">Filter Questions</h2>
            <div className="space-y-4 mb-4 sm:mb-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Exam</label>
                    <Select
                        name="exam_name"
                        options={examOptions}
                        value={examOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.exam_name) || null}
                        onChange={(selected) => handleFilterChange('exam_name', selected?.value || null)}
                        placeholder="Select Exam..."
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
                        value={
                            subjectOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.subject) || null
                        }
                        onChange={(selected) =>
                            handleFilterChange('subject', selected?.value || null)
                        }
                        placeholder="Select subject..."
                        isClearable={!isTeacher}
                        isDisabled={isTeacher}
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
                        value={chapterOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.chapter) || null}
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
                        value={sectionNameOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.section_name) || null}
                        onChange={(selected) => handleFilterChange('section_name', selected?.value || null)}
                        placeholder="Select section..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm sm:text-base"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Question Type</label>
                    <Select
                        name="question_type"
                        options={questionTypeOptions}
                        value={questionTypeOptions.find((opt) => opt.value === localFilters.question_type) || null}
                        onChange={(selected) => handleFilterChange('question_type', selected?.value || null)}
                        placeholder="Select Question Type..."
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-sm text-sm sm:text-base border border-black/20 font-semibold"
                >
                    Apply Filters
                </button>
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition shadow-sm text-sm sm:text-base border border-black/4 font-semibold"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop/Tablet inline panel */}
            <div className="hidden sm:block">
                {renderFilterControls()}
            </div>

            {/* Mobile floating action button */}
            <button
                type="button"
                aria-label="Open filters"
                onClick={() => setIsMobileModalOpen(true)}
                className="sm:hidden fixed bottom-4 right-4 z-40 rounded-full bg-indigo-600 text-white shadow-lg p-3 font-semibold border border-black/20"
            >
                <Funnel className="h-8 w-8 text-white" />
            </button>

            {/* Mobile modal with same controls (state is shared) */}
            <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
                <DialogContent className="sm:max-w-lg h-[90vh] bg-white">
                    <DialogHeader>
                        <DialogTitle>Filter Questions</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[90vh] overflow-y-auto">
                        {renderFilterControls()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
