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
        <div className="bg-white rounded-xl shadow-md border border-black/5">
            <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className='text-black/50' />
                    <span className='ml-1 text-black/40 text-sm text-center'>|</span>
                </div>
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search questions by keyword..."
                    className="w-full p-3 pl-14 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search questions"
                />
                {keyword && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-[25px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
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
