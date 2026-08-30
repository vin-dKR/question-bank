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
import { useFilterOptions } from '@/hooks/queries/useFilterOptions';
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, Funnel } from 'lucide-react';

const EMPTY_FILTER_OPTIONS: FilterOptions = {
    exams: [],
    subjects: [],
    chapters: [],
    section_names: [],
    question_type: [],
};

interface FilterUpdate {
    [key: string]: string | boolean | undefined;
    subject?: string;
    chapter?: string;
    section_name?: string;
    question_type?: string;
}

const FILTER_LABELS: Record<string, string> = {
    exam_name: 'Exam',
    subject: 'Subject',
    chapter: 'Chapter',
    section_name: 'Section',
    question_type: 'Type',
};

export default function FilterControls() {
    const { setFilters, filters: activeFilters } = useQuestionBankContext();
    const [localFilters, setLocalFilters] = useState({
        exam_name: '',
        subject: '',
        chapter: '',
        section_name: '',
        question_type: ''
    });

    const { role, isTeacher, isLoading: roleLoading } = useUserRole();
    const { subject, isLoading: subjectLoading } = useUserSubject();
    const hasSetTeacherSubject = useRef(false);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // TanStack-Query-backed filter options: replaces the old 5-parallel-query
    // useFetchFilterOptions hook. Cached by active filters + role + subject,
    // so rapid filter clicks hit the cache (15 min staleTime).
    const {
        data: filterOptionsData,
        isLoading: filterOptionsLoading,
    } = useFilterOptions({
        filters: activeFilters,
        userRole: role ?? 'student',
        userSubject: isTeacher ? subject : undefined,
        // Avoid populating a provisional student/no-subject cache entry while
        // the server-derived teacher restriction is still loading.
        enabled: Boolean(role) && !roleLoading && !subjectLoading,
    });

    const filterOptions = filterOptionsData ?? EMPTY_FILTER_OPTIONS;
    const optionsLoading = filterOptionsLoading;

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
        } else if (name === "section_name" || name === "question_type") {
            // Apply leaf filters immediately.
            const filterUpdate: FilterUpdate = {
                exam_name: localFilters.exam_name || undefined, // Include current exam_name
                subject: isTeacher && subject ? subject : (localFilters.subject || undefined), // Include subject
                chapter: localFilters.chapter || undefined, // Include chapter
            };

            if (name === "section_name") {
                filterUpdate.section_name = value || undefined;
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
            question_type: localFilters.question_type || undefined,
        });
    }, [localFilters, setFilters, isTeacher, subject]);

    const clearFilters = useCallback(() => {
        const clearedFilters = { exam_name: '', subject: '', chapter: '', section_name: '', question_type: '' };

        // For teachers, preserve their assigned subject
        if (isTeacher && subject) {
            clearedFilters.subject = subject;
        }

        setLocalFilters(clearedFilters);
        setFilters({
            exam_name: undefined,
            subject: isTeacher && subject ? subject : undefined,
            chapter: undefined,
            section_name: undefined,
            question_type: undefined,
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

    const activeFilterEntries = Object.entries(activeFilters).filter(
        ([key, value]) => key in FILTER_LABELS && value !== undefined && value !== '',
    );

    // Update selectStyles to use correct types
    const selectStyles = useMemo<StylesConfig<{ value: string; label: string }, false>>(() => ({
        control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? '#6366f1' : '#e4e4e7',
            '&:hover': { borderColor: '#a1a1aa' },
            boxShadow: state.isFocused ? '0 0 0 3px rgb(99 102 241 / 0.15)' : 'none',
            borderRadius: '8px',
            minHeight: '34px',
        }),
        menu: (base) => ({
            ...base,
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: '0 10px 24px -4px rgb(0 0 0 / 0.08)',
        }),
        menuList: (base) => ({
            ...base,
            borderRadius: "8px",
            padding: 4,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#eef2ff' : 'white',
            color: state.isSelected ? 'white' : '#18181b',
            borderRadius: '6px',
            fontSize: '14px',
        }),
    }), []);

    // Show loading state while fetching role and subject
    if (roleLoading || subjectLoading) {
        return (
            <div className="rounded-xl border border-black/5 bg-white p-3 shadow-xs">
                <div className="animate-pulse">
                    <div className="h-5 w-28 bg-zinc-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-10 bg-zinc-100 rounded-lg"></div>
                        <div className="h-10 bg-zinc-100 rounded-lg"></div>
                        <div className="h-10 bg-zinc-100 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    const renderFilterHeaderContent = (showChevron: boolean) => (
        <>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Filter Questions</span>
            <span className="flex items-center gap-2">
                {activeFilterEntries.length > 0 && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {activeFilterEntries.length} active
                    </span>
                )}
                {showChevron && (
                    <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                )}
            </span>
        </>
    );

    const renderFilterControls = (collapsible: boolean) => (
        <div className="rounded-xl border border-black/5 bg-white p-3 shadow-xs">
            {collapsible ? (
                <button
                    type="button"
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
                    aria-expanded={isExpanded}
                >
                    {renderFilterHeaderContent(true)}
                </button>
            ) : (
                <div className="flex w-full items-center justify-between gap-3">
                    {renderFilterHeaderContent(false)}
                </div>
            )}

            {activeFilterEntries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1" aria-label="Active filters">
                    {activeFilterEntries.map(([key, value]) => (
                        <span key={key} className="max-w-full truncate rounded-md bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600">
                            <span className="font-medium text-zinc-700">{FILTER_LABELS[key]}:</span> {String(value)}
                        </span>
                    ))}
                </div>
            )}

            {(!collapsible || isExpanded) && <div className="mt-3">
            <div className="mb-3 space-y-2.5">
                <div>
                    <label htmlFor={`${collapsible ? 'desktop' : 'mobile'}-question-filter-exam`} className="mb-1 block text-xs font-medium text-zinc-600">Exam</label>
                    <Select
                        inputId={`${collapsible ? 'desktop' : 'mobile'}-question-filter-exam`}
                        name="exam_name"
                        options={examOptions}
                        value={examOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.exam_name) || null}
                        onChange={(selected) => handleFilterChange('exam_name', selected?.value || null)}
                        placeholder="Select Exam..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label htmlFor={`${collapsible ? 'desktop' : 'mobile'}-question-filter-subject`} className="mb-1 block text-xs font-medium text-zinc-600">Subject</label>
                    <Select
                        inputId={`${collapsible ? 'desktop' : 'mobile'}-question-filter-subject`}
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
                        className="text-sm"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label htmlFor={`${collapsible ? 'desktop' : 'mobile'}-question-filter-chapter`} className="mb-1 block text-xs font-medium text-zinc-600">Chapter</label>
                    <Select
                        inputId={`${collapsible ? 'desktop' : 'mobile'}-question-filter-chapter`}
                        name="chapter"
                        options={chapterOptions}
                        value={chapterOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.chapter) || null}
                        onChange={(selected) => handleFilterChange('chapter', selected?.value || null)}
                        placeholder="Select chapter..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label htmlFor={`${collapsible ? 'desktop' : 'mobile'}-question-filter-section`} className="mb-1 block text-xs font-medium text-zinc-600">Section</label>
                    <Select
                        inputId={`${collapsible ? 'desktop' : 'mobile'}-question-filter-section`}
                        name="section_name"
                        options={sectionNameOptions}
                        value={sectionNameOptions.find((opt: { value: string; label: string }) => opt.value === localFilters.section_name) || null}
                        onChange={(selected) => handleFilterChange('section_name', selected?.value || null)}
                        placeholder="Select section..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm"
                        styles={selectStyles}
                    />
                </div>
                <div>
                    <label htmlFor={`${collapsible ? 'desktop' : 'mobile'}-question-filter-type`} className="mb-1 block text-xs font-medium text-zinc-600">Question Type</label>
                    <Select
                        inputId={`${collapsible ? 'desktop' : 'mobile'}-question-filter-type`}
                        name="question_type"
                        options={questionTypeOptions}
                        value={questionTypeOptions.find((opt) => opt.value === localFilters.question_type) || null}
                        onChange={(selected) => handleFilterChange('question_type', selected?.value || null)}
                        placeholder="Select Question Type..."
                        isClearable
                        isLoading={optionsLoading}
                        className="text-sm"
                        styles={selectStyles}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={applyFilters}
                    className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                    Apply Filters
                </button>
                <button
                    type="button"
                    onClick={clearFilters}
                    className="h-8 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
                >
                    Clear Filters
                </button>
            </div>
            </div>}
        </div>
    );

    return (
        <>
            {/* Desktop/Tablet inline panel */}
            <div className="hidden sm:block">
                {renderFilterControls(true)}
            </div>

            {/* Mobile filter trigger sits beside keyword search in the page rail. */}
            <button
                type="button"
                aria-label="Open filters"
                onClick={() => setIsMobileModalOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 shadow-xs transition-colors hover:bg-indigo-100 sm:hidden"
            >
                <Funnel className="h-4 w-4" />
            </button>

            {/* Mobile modal with same controls (state is shared) */}
            <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
                <DialogContent className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col bg-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Filter Questions</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {renderFilterControls(false)}
                    </DialogBody>
                </DialogContent>
            </Dialog>
        </>
    );
}
