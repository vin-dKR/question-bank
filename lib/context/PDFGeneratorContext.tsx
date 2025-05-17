'use client';

import { createContext, useContext, useState } from 'react';

const PDFGeneratorContext = createContext<PDFGeneratorContextType | undefined>(undefined);

export function PDFGeneratorProvider({ children }: { children: React.ReactNode }) {
    const [options, setOptions] = useState<PDFGenerationOptions>({
        includeAnswers: true,
        watermarkOpacity: 0.1,
        logo: null,
    });
    const [institution, setInstitution] = useState<string>('XYZ institution');
    const [image, setImage] = useState<File | null>(null);
    const [customSettings, setCustomSettings] = useState<{
        fontSize?: number;
        pageLayout?: 'portrait' | 'landscape';
        // eslint-disable-next-line
        [key: string]: any;
    }>({
        fontSize: 12,
        pageLayout: 'portrait',
    });

    const setLogo = (logo: File | null) => {
        setOptions((prev) => ({ ...prev, logo }));
    };

    return (
        <PDFGeneratorContext.Provider
            value={{
                options,
                setOptions,
                setLogo,
                institution,
                setInstitution,
                image,
                setImage,
                customSettings,
                setCustomSettings,
            }}
        >
            {children}
        </PDFGeneratorContext.Provider>
    );
}

export function usePDFGeneratorContext() {
    const context = useContext(PDFGeneratorContext);
    if (!context) {
        throw new Error('usePDFGeneratorContext must be used within a PDFGeneratorProvider');
    }
    return context;
}
