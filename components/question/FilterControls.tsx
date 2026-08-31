'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Select, { StylesConfig } from 'react-select';
import { Check, Funnel, LockKeyhole, X } from 'lucide-react';
import { useUserRole } from '@/hooks/auth/useUserRole';
import { useUserSubject } from '@/hooks/auth/useUserSubject';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import { useFilterOptions } from '@/hooks/queries/useFilterOptions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FILTER_OPTIONS: FilterOptions = {
    exams: [],
    subjects: [],
    chapters: [],
    section_names: [],
    question_type: [],
};

type FilterName = 'exam_name' | 'subject' | 'chapter' | 'section_name' | 'question_type';
type LocalFilters = Record<FilterName, string>;

const EMPTY_LOCAL_FILTERS: LocalFilters = {
    exam_name: '',
    subject: '',
    chapter: '',
    section_name: '',
    question_type: '',
};

const FILTER_LABELS: Record<FilterName, string> = {
    exam_name: 'Exam',
    subject: 'Subject',
    chapter: 'Chapter',
    section_name: 'Section',
    question_type: 'Question type',
};

const FILTER_ORDER: FilterName[] = [
    'exam_name',
    'subject',
    'chapter',
    'section_name',
    'question_type',
];

const toLocalFilters = (
    filters: Filters,
    isTeacher: boolean,
    teacherSubject?: string | null,
): LocalFilters => ({
    exam_name: filters.exam_name ?? '',
    subject: isTeacher && teacherSubject ? teacherSubject : filters.subject ?? '',
    chapter: filters.chapter ?? '',
    section_name: filters.section_name ?? '',
    question_type: filters.question_type ?? '',
});

const toFilterUpdate = (
    filters: LocalFilters,
    isTeacher: boolean,
    teacherSubject?: string | null,
): Partial<Filters> => ({
    exam_name: filters.exam_name || undefined,
    subject: isTeacher && teacherSubject ? teacherSubject : filters.subject || undefined,
    chapter: filters.chapter || undefined,
    section_name: filters.section_name || undefined,
    question_type: filters.question_type || undefined,
});

const getAppliedFilterEntries = (filters: Filters, isTeacher: boolean) =>
    FILTER_ORDER.flatMap((name) => {
        if (name === 'subject' && isTeacher) return [];
        const value = filters[name];
        return typeof value === 'string' && value ? [[name, value] as const] : [];
    });

const getFilterRemovalUpdate = (
    name: FilterName,
    isTeacher: boolean,
    teacherSubject?: string | null,
): Partial<Filters> => {
    const fixedSubject = isTeacher && teacherSubject ? teacherSubject : undefined;

    switch (name) {
        case 'exam_name':
            return {
                exam_name: undefined,
                subject: fixedSubject,
                chapter: undefined,
                section_name: undefined,
            };
        case 'subject':
            return { subject: fixedSubject, chapter: undefined, section_name: undefined };
        case 'chapter':
            return { chapter: undefined, section_name: undefined };
        case 'section_name':
            return { section_name: undefined };
        case 'question_type':
            return { question_type: undefined };
    }
};

const getClearedFilters = (
    isTeacher: boolean,
    teacherSubject?: string | null,
): Partial<Filters> => ({
    exam_name: undefined,
    subject: isTeacher && teacherSubject ? teacherSubject : undefined,
    chapter: undefined,
    section_name: undefined,
    question_type: undefined,
});

export function ActiveFiltersSummary() {
    const { filters, setFilters } = useQuestionBankContext();
    const { isTeacher } = useUserRole();
    const { subject } = useUserSubject();
    const appliedFilters = getAppliedFilterEntries(filters, isTeacher);

    if (appliedFilters.length === 0) return null;

    return (
        <div className="flex min-w-0 items-center gap-2" aria-label="Applied filters">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 lg:flex-wrap lg:overflow-visible">
                {appliedFilters.map(([name, value]) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => setFilters(getFilterRemovalUpdate(name, isTeacher, subject))}
                        className="group inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 text-xs font-medium text-indigo-800 transition-colors hover:border-indigo-200 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                        aria-label={`Remove ${FILTER_LABELS[name]} filter: ${value}`}
                    >
                        <span className="text-indigo-500">{FILTER_LABELS[name]}:</span>
                        <span className="max-w-40 truncate">{value}</span>
                        <X className="h-3 w-3 text-indigo-500 transition-colors group-hover:text-indigo-800" aria-hidden="true" />
                    </button>
                ))}
            </div>
            <button
                type="button"
                onClick={() => setFilters(getClearedFilters(isTeacher, subject))}
                className="shrink-0 text-xs font-semibold text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
                Clear all
            </button>
        </div>
    );
}

export default function FilterControls() {
    const { setFilters, filters: activeFilters } = useQuestionBankContext();
    const { role, isTeacher, isLoading: roleLoading } = useUserRole();
    const { subject, isLoading: subjectLoading } = useUserSubject();
    const [localFilters, setLocalFilters] = useState<LocalFilters>(EMPTY_LOCAL_FILTERS);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

    useEffect(() => {
        if (!isMobileModalOpen) {
            setLocalFilters(toLocalFilters(activeFilters, isTeacher, subject));
        }
    }, [activeFilters, isMobileModalOpen, isTeacher, subject]);

    const optionFilters = useMemo(
        () => isMobileModalOpen
            ? toFilterUpdate(localFilters, isTeacher, subject)
            : activeFilters,
        [activeFilters, isMobileModalOpen, isTeacher, localFilters, subject],
    );

    const { data: filterOptionsData, isLoading: filterOptionsLoading } = useFilterOptions({
        filters: optionFilters,
        userRole: role ?? 'student',
        userSubject: isTeacher ? subject ?? undefined : undefined,
        // Avoid populating a provisional student/no-subject cache entry while
        // the server-derived teacher restriction is still loading.
        enabled: Boolean(role) && !roleLoading && !subjectLoading,
    });

    const filterOptions = filterOptionsData ?? EMPTY_FILTER_OPTIONS;
    const appliedFilters = getAppliedFilterEntries(activeFilters, isTeacher);
    const pendingAppliedFilters = getAppliedFilterEntries(
        toFilterUpdate(localFilters, isTeacher, subject),
        isTeacher,
    );

    const handleFilterChange = useCallback((
        name: FilterName,
        value: string | null,
        commitImmediately: boolean,
    ) => {
        const nextFilters = { ...localFilters, [name]: value ?? '' };

        if (name === 'exam_name') {
            nextFilters.subject = isTeacher && subject ? subject : '';
            nextFilters.chapter = '';
            nextFilters.section_name = '';
        } else if (name === 'subject') {
            nextFilters.chapter = '';
            nextFilters.section_name = '';
        } else if (name === 'chapter') {
            nextFilters.section_name = '';
        }

        setLocalFilters(nextFilters);

        if (commitImmediately) {
            setFilters(toFilterUpdate(nextFilters, isTeacher, subject));
        }
    }, [isTeacher, localFilters, setFilters, subject]);

    const clearDesktopFilters = useCallback(() => {
        setLocalFilters(toLocalFilters({}, isTeacher, subject));
        setFilters(getClearedFilters(isTeacher, subject));
    }, [isTeacher, setFilters, subject]);

    const clearMobileFilters = useCallback(() => {
        setLocalFilters(toLocalFilters({}, isTeacher, subject));
    }, [isTeacher, subject]);

    const applyMobileFilters = useCallback(() => {
        setFilters(toFilterUpdate(localFilters, isTeacher, subject));
        setIsMobileModalOpen(false);
    }, [isTeacher, localFilters, setFilters, subject]);

    const handleMobileOpenChange = useCallback((open: boolean) => {
        setLocalFilters(toLocalFilters(activeFilters, isTeacher, subject));
        setIsMobileModalOpen(open);
    }, [activeFilters, isTeacher, subject]);

    const examOptions = useMemo(
        () => filterOptions.exams.map((exam: string) => ({ value: exam, label: exam })),
        [filterOptions.exams],
    );

    const subjectOptions = useMemo(() => {
        const options = filterOptions.subjects.map((item: string) => ({ value: item, label: item }));

        if (isTeacher && subject && !options.some((option) => option.value === subject)) {
            return [{ value: subject, label: subject }, ...options];
        }

        return options;
    }, [filterOptions.subjects, isTeacher, subject]);

    const chapterOptions = useMemo(
        () => filterOptions.chapters.map((chapter: string) => ({ value: chapter, label: chapter })),
        [filterOptions.chapters],
    );

    const sectionNameOptions = useMemo(
        () => filterOptions.section_names.map((name: string) => ({ value: name, label: name })),
        [filterOptions.section_names],
    );

    const questionTypeOptions = useMemo(
        () => filterOptions.question_type.map((type: string) => ({ value: type, label: type })),
        [filterOptions.question_type],
    );

    const selectStyles = useMemo<StylesConfig<{ value: string; label: string }, false>>(() => ({
        control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? '#6366f1' : '#e4e4e7',
            '&:hover': { borderColor: '#a1a1aa' },
            boxShadow: state.isFocused ? '0 0 0 3px rgb(99 102 241 / 0.13)' : 'none',
            borderRadius: '9px',
            minHeight: '38px',
            backgroundColor: '#fff',
        }),
        valueContainer: (base) => ({ ...base, paddingLeft: 10, paddingRight: 6 }),
        placeholder: (base) => ({ ...base, color: '#a1a1aa' }),
        indicatorSeparator: (base) => ({ ...base, backgroundColor: '#e4e4e7' }),
        dropdownIndicator: (base) => ({ ...base, color: '#71717a', padding: 7 }),
        clearIndicator: (base) => ({ ...base, color: '#a1a1aa', padding: 7 }),
        menu: (base) => ({
            ...base,
            zIndex: 60,
            borderRadius: '9px',
            overflow: 'hidden',
            boxShadow: '0 12px 30px -8px rgb(0 0 0 / 0.18)',
        }),
        menuList: (base) => ({ ...base, borderRadius: '9px', padding: 4 }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#eef2ff' : 'white',
            color: state.isSelected ? 'white' : '#18181b',
            borderRadius: '6px',
            fontSize: '14px',
        }),
    }), []);

    if (roleLoading || subjectLoading) {
        return (
            <div className="hidden border-t border-zinc-200 pt-3 lg:block" aria-label="Loading question filters">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 w-24 rounded bg-zinc-200" />
                    <div className="h-9 rounded-lg bg-zinc-100" />
                    <div className="h-9 rounded-lg bg-zinc-100" />
                    <div className="h-9 rounded-lg bg-zinc-100" />
                </div>
            </div>
        );
    }

    const renderSelect = (
        name: FilterName,
        label: string,
        options: { value: string; label: string }[],
        placeholder: string,
        commitImmediately: boolean,
    ) => (
        <div>
            <label
                htmlFor={`${commitImmediately ? 'desktop' : 'mobile'}-question-filter-${name}`}
                className="mb-1 block text-xs font-medium text-zinc-600"
            >
                {label}
            </label>
            <Select
                inputId={`${commitImmediately ? 'desktop' : 'mobile'}-question-filter-${name}`}
                name={name}
                options={options}
                value={options.find((option) => option.value === localFilters[name]) ?? null}
                onChange={(selected) => handleFilterChange(name, selected?.value ?? null, commitImmediately)}
                placeholder={placeholder}
                isClearable
                isLoading={filterOptionsLoading}
                className="text-sm"
                styles={selectStyles}
            />
        </div>
    );

    const renderSubjectControl = (commitImmediately: boolean) => {
        if (isTeacher && subject) {
            return (
                <div>
                    <span className="mb-1 block text-xs font-medium text-zinc-600">Subject</span>
                    <div className="flex h-[38px] items-center justify-between rounded-[9px] border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700">
                        <span className="truncate">{subject}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                            Assigned
                        </span>
                    </div>
                </div>
            );
        }

        return renderSelect('subject', 'Subject', subjectOptions, 'All subjects', commitImmediately);
    };

    const renderFilterFields = (commitImmediately: boolean) => (
        <div className="space-y-5">
            <fieldset className="space-y-2.5">
                <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Curriculum
                </legend>
                {renderSelect('exam_name', 'Exam', examOptions, 'All exams', commitImmediately)}
                {renderSubjectControl(commitImmediately)}
                {renderSelect('chapter', 'Chapter', chapterOptions, 'All chapters', commitImmediately)}
                {renderSelect('section_name', 'Section', sectionNameOptions, 'All sections', commitImmediately)}
            </fieldset>
            <fieldset className="space-y-2.5 border-t border-zinc-100 pt-4">
                <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Question
                </legend>
                {renderSelect('question_type', 'Question type', questionTypeOptions, 'All question types', commitImmediately)}
            </fieldset>
        </div>
    );

    return (
        <>
            <section className="hidden border-t border-zinc-200 pt-3 @5xl/page:block" aria-labelledby="desktop-filter-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h2 id="desktop-filter-heading" className="text-sm font-semibold text-zinc-900">Filters</h2>
                        {appliedFilters.length > 0 ? (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                {appliedFilters.length} applied
                            </span>
                        ) : null}
                    </div>
                    {appliedFilters.length > 0 ? (
                        <button
                            type="button"
                            onClick={clearDesktopFilters}
                            className="text-xs font-semibold text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                            Clear all
                        </button>
                    ) : null}
                </div>
                {renderFilterFields(true)}
            </section>

            <button
                type="button"
                aria-label={appliedFilters.length > 0 ? `Open filters, ${appliedFilters.length} applied` : 'Open filters'}
                onClick={() => handleMobileOpenChange(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 shadow-xs transition-colors hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 @5xl/page:hidden"
            >
                <Funnel className="h-4 w-4" aria-hidden="true" />
                <span className="hidden min-[360px]:inline">Filters</span>
                {appliedFilters.length > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-[11px] leading-none text-white">
                        {appliedFilters.length}
                    </span>
                ) : null}
            </button>

            <Dialog open={isMobileModalOpen} onOpenChange={handleMobileOpenChange}>
                <DialogContent className="bottom-0 left-0 top-auto h-[min(92dvh,48rem)] w-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 rounded-b-none rounded-t-3xl border-x-0 border-b-0 bg-white p-0 shadow-2xl sm:max-w-none">
                    <DialogHeader className="border-b border-zinc-100 px-5 py-4 pr-14 text-left">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-lg font-semibold text-zinc-950">Filters</DialogTitle>
                            {pendingAppliedFilters.length > 0 ? (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                                    {pendingAppliedFilters.length} selected
                                </span>
                            ) : null}
                        </div>
                        <DialogDescription className="sr-only">
                            Narrow the question list by curriculum and question type.
                        </DialogDescription>
                        {pendingAppliedFilters.length > 0 ? (
                            <button
                                type="button"
                                onClick={clearMobileFilters}
                                className="absolute right-14 top-[18px] text-xs font-semibold text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                Clear all
                            </button>
                        ) : null}
                    </DialogHeader>

                    <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5">
                        {renderFilterFields(false)}
                    </div>

                    <div className="border-t border-zinc-200 bg-white/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
                        <button
                            type="button"
                            onClick={applyMobileFilters}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                        >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Show questions
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
