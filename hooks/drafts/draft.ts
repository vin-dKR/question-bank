"use client";

import { createFolder, deleteFolder, getFolders, getFolderById, renameFolder, updateFolderQuestions, type FolderWithMeta } from "@/actions/drafts/draft";
import { useCallback, useEffect, useState } from "react";
import { Question } from "@/generated/prisma";

interface FetchDraft {
    id: string;
    name: string;
    questions: Question[];
    userRole: 'owner';
}

interface Folder {
    id: string;
    name: string;
    questionRelations: Array<{
        question: Question;
    }>;
}

const mapFolderToDraft = (folder: Folder | FolderWithMeta): FetchDraft => ({
    id: folder.id,
    name: folder.name,
    questions: folder.questionRelations.map((relation) => relation.question),
    userRole: 'owner',
});

export const useFolders = () => {
    const [drafts, setDrafts] = useState<FetchDraft[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Fetch all folders with fallback behavior
    const getAllFolders = useCallback(async () => {
        try {
            setLoading(true);
            setErr(null);

            const folders = await getFolders();
            if (folders) {
                setDrafts(folders.map(mapFolderToDraft));
            } else {
                setDrafts([]);
            }
            return folders;
        } catch (e) {
            // Previously this swallowed anything mentioning collaboration/timeout/
            // network without calling setErr, so those failures rendered as an
            // empty folder list with no message. All errors surface now.
            setErr(e instanceof Error ? e.message : "Failed to fetch folders");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Add new folder
    const addFolder = async (name: string, questions: { id: string }[]) => {
        try {
            setLoading(true);
            setErr(null);
            const newFolder = await createFolder(name, questions);
            if (newFolder) {
                setDrafts((prev) => [mapFolderToDraft(newFolder), ...prev]);
                return true;
            }
            return false;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to create folder";
            setErr(errorMessage);
            // console.error("Error creating folder:", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Delete folder
    const delFolder = async (id: string) => {
        try {
            setLoading(true);
            setErr(null);
            await deleteFolder(id);
            setDrafts((prev) => prev.filter((draft) => draft.id !== id));
            return true;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to delete folder";
            setErr(errorMessage);
            // console.error("Error deleting folder:", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Rename folder
    const renameDrafts = async (id: string, name: string) => {
        try {
            setLoading(true);
            setErr(null);
            const updatedFolder = await renameFolder(id, name);

            setDrafts((prev) =>
                prev.map((draft) => {
                    if (draft.id === id) {
                        return {
                            ...draft,
                            name: updatedFolder.name,
                        };
                    }
                    return draft;
                })
            );
            return true;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to rename folder";
            setErr(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Update questions in folder
    const updateQuestionsInFolder = async (folderId: string, questions: { id: string }[]) => {
        try {
            setLoading(true);
            setErr(null);
            const updatedFolder = await updateFolderQuestions(
                folderId,
                questions.map((q) => q.id)
            );
            if (updatedFolder) {
                setDrafts((prev) =>
                    prev.map((draft) => {
                        if (draft.id === folderId) {
                            return {
                                ...draft,
                                questions: updatedFolder.questionRelations.map((relation) => relation.question),
                            };
                        }
                        return draft;
                    })
                );
                return true;
            }
            return false;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to update folder questions";
            setErr(errorMessage);
            // console.error("Error updating folder questions:", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Remove a question from a folder
    const removeQuestionFromFolder = async (folderId: string, questionId: string) => {
        try {
            setLoading(true);
            setErr(null);
            const folder = drafts.find((draft) => draft.id === folderId);

            if (!folder) {
                throw new Error("Folder not found");
            }

            const updatedQuestionIds = folder.questions
                .filter((q) => q.id !== questionId)
                .map((q) => q.id);
            const updatedFolder = await updateFolderQuestions(folderId, updatedQuestionIds);
            if (updatedFolder) {
                setDrafts((prev) =>
                    prev.map((draft) => {
                        if (draft.id === folderId) {
                            return {
                                ...draft,
                                questions: updatedFolder.questionRelations.map((relation) => relation.question),
                            };
                        }
                        return draft;
                    })
                );
                return true;
            }
            return false;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to remove question";
            setErr(errorMessage);
            // console.error("Error removing question:", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Get folder by ID for direct access (e.g. opening a folder link)
    const getFolderByIdMethod = async (folderId: string) => {
        try {
            setLoading(true);
            setErr(null);

            const response = await getFolderById(folderId);

            if (!response.success || !response.data) {
                setErr(response.error || "Failed to fetch folder");
                return null;
            }

            const mappedFolder = mapFolderToDraft(response.data);

            // Update the drafts list to include this folder if it's not already there
            setDrafts((prev) => {
                const existingIndex = prev.findIndex((draft) => draft.id === folderId);
                if (existingIndex >= 0) {
                    // Update existing folder
                    const updated = [...prev];
                    updated[existingIndex] = mappedFolder;
                    return updated;
                } else {
                    // Add new folder to the list
                    return [mappedFolder, ...prev];
                }
            });

            return mappedFolder;
        } catch (e) {
            console.error('Error fetching folder by id:', e);
            setErr(e instanceof Error ? e.message : "Failed to fetch folder");
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        getAllFolders();
    }, [getAllFolders]);

    return {
        err,
        loading,
        drafts,
        addFolder,
        getAllFolders,
        getFolderById: getFolderByIdMethod,
        delFolder,
        renameDrafts,
        updateQuestionsInFolder,
        removeQuestionFromFolder,
    };
};
