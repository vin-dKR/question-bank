'use client';

import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';

export default function PDFOptions() {
    const { options, setOptions } = usePDFGeneratorContext();

    const handleIncludeAnswers = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOptions((prev) => ({ ...prev, includeAnswers: e.target.checked }));
    };

    return (
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
    );
}
