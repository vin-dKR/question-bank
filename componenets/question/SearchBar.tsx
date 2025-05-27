'use client';

import { useState, useEffect } from 'react';
import { useQuestionBankContext } from '@/lib/context/QuestionBankContext';
import debounce from 'lodash.debounce';

const SearchBar: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const { searchQuestions, clearSearch } = useQuestionBankContext();

    const debouncedSearch = debounce((searchTerm: string) => {
        if (searchTerm.trim().length < 2) {
            clearSearch();
            return;
        }
        searchQuestions(searchTerm);
    }, 300);

    useEffect(() => {
        debouncedSearch(keyword);
        return () => debouncedSearch.cancel();
    }, [keyword]);

    const handleClear = () => {
        setKeyword('');
        clearSearch();
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 mb-0">
            <div className="relative bg-white rounded-lg">
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search questions by keyword..."
                    className="w-full p-3 pr-10 border border-black/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Search questions"
                />
                {keyword && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-[13px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
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
