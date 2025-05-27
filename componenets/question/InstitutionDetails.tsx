'use client';

import { usePDFGeneratorContext } from '@/lib/context/PDFGeneratorContext';
import LogoUploader from '@/componenets/question/LogoUploader';
import { Input } from '@/components/ui/input';

export default function InstitutionDetails() {
    const { setLogo, institution, setInstitution } = usePDFGeneratorContext();

    const handleInstitutionName = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInstitution(e.target.value);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-700 sm:text-xl">Institution Details</h2>
            <LogoUploader onUpload={setLogo} />
            <div className="space-y-2 mt-4">
                <div className="relative">
                    <label
                        htmlFor="institution"
                        className="block text-sm font-medium text-slate-600 mb-1 sm:mb-2"
                    >
                        Institution Name
                    </label>
                    <div className="relative">
                        <Input
                            id="institution"
                            type="text"
                            onChange={handleInstitutionName}
                            className="w-full h-10 sm:p-4 border border-slate-200 rounded-md text-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
