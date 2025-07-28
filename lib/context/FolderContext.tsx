'use client';

import { createContext, useContext, useMemo } from 'react';
import { useFolders } from '@/hooks/drafts/draft';

type FolderContextType = ReturnType<typeof useFolders>;

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const FolderProvider = ({ children }: { children: React.ReactNode }) => {
    const folders = useFolders();
    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(
        () => ({
            err: folders.err,
            loading: folders.loading,
            drafts: folders.drafts,
            addFolder: folders.addFolder,
            getAllFolders: folders.getAllFolders,
            delFolder: folders.delFolder,
            renameDrafts: folders.renameDrafts,
            updateQuestionsInFolder: folders.updateQuestionsInFolder,
            removeQuestionFromFolder: folders.removeQuestionFromFolder,
        }),
        [
            folders.err,
            folders.loading,
            folders.drafts,
            folders.addFolder,
            folders.getAllFolders,
            folders.delFolder,
            folders.renameDrafts,
            folders.updateQuestionsInFolder,
            folders.removeQuestionFromFolder,
        ]
    );
    return <FolderContext.Provider value={value}>{children}</FolderContext.Provider>;
};

export const useFolderContext = () => {
    const context = useContext(FolderContext);
    if (!context) {
        throw new Error('useFolderContext must be used within a FolderProvider');
    }
    return context;
};
