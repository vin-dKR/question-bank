'use client';

import { createContext, useContext } from 'react';
import { useFolders } from '@/hooks/drafts/draft';

type FolderContextType = ReturnType<typeof useFolders>;

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: React.ReactNode }) => {
    const folders = useFolders();
    return <FolderContext.Provider value={folders}>{children}</FolderContext.Provider>;
};

export const useFolderContext = () => {
    const context = useContext(FolderContext);
    if (!context) {
        throw new Error('useFolderContext must be used within a FolderProvider');
    }
    return context;
};
