'use client';

import { useState, useEffect } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';

const SearchBar: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const { setSearchQuery } = useQuestionBankContext();

    const debouncedSearch = debounce((searchTerm: string) => {
        if (searchTerm.trim().length < 2) {
            setSearchQuery("")
            return;
        }
        setSearchQuery(searchTerm);
    }, 300);

    useEffect(() => {
        debouncedSearch(keyword);
        return () => debouncedSearch.cancel();
    }, [keyword]);

    const handleClear = () => {
        setKeyword('');
        setSearchQuery("")
    };

    return (
        <div className="bg-white rounded-xl shadow-xs border border-black/5">
            <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search questions by keyword..."
                    className="w-full p-3 pl-10 pr-10 text-sm rounded-xl bg-transparent placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    aria-label="Search questions"
                />
                {keyword && (
                    <button
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
