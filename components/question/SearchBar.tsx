'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const { setSearchQuery } = useQuestionBankContext();

    const debouncedSearch = useMemo(
        () => debounce((searchTerm: string) => {
            if (searchTerm.trim().length < 2) {
                setSearchQuery("")
                return;
            }
            setSearchQuery(searchTerm);
        }, 300),
        [setSearchQuery],
    );

    useEffect(() => {
        debouncedSearch(keyword);
        return () => debouncedSearch.cancel();
    }, [keyword, debouncedSearch]);

    const handleClear = () => {
        setKeyword('');
        setSearchQuery("")
    };

    return (
        <div className="rounded-xl border border-black/5 bg-white shadow-xs">
            <label htmlFor="question-keyword-search" className="sr-only">Search questions by keyword</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                    id="question-keyword-search"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search by keyword..."
                    className="h-10 w-full rounded-xl bg-transparent pl-10 pr-10 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/40"
                    aria-label="Search questions"
                />
                {keyword && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer text-sm"
                        aria-label="Clear search"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
