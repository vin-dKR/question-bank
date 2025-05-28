"use client";

import { createFolder, deleteFolder, getFolders, renameFolder, updateFolderQuestions } from "@/actions/drafts/draft";
import { useCallback, useEffect, useState } from "react";
import { Question } from "@/generated/prisma";

interface FetchDraft {
    id: string;
    name: string;
    questions: Question[];
}

export const useFolders = () => {
    const [drafts, setDrafts] = useState<FetchDraft[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Map Prisma folder to FetchDraft
    const mapFolderToDraft = useCallback(
        (folder: any): FetchDraft => ({
            id: folder.id,
            name: folder.name,
            questions: folder.questionRelations.map((relation: any) => relation.question),
        }),
        []
    );

    // Fetch all folders
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
            const errorMessage = e instanceof Error ? e.message : "Failed to fetch folders";
            setErr(errorMessage);
            // console.error("Error fetching folders:", e);
            return null;
        } finally {
            setLoading(false);
        }
    }, [mapFolderToDraft]);

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
                prev.map((draft) => (draft.id === id ? mapFolderToDraft(updatedFolder) : draft))
            );
            return true;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Failed to rename folder";
            setErr(errorMessage);
            // console.error("Error renaming folder:", e);
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
                    prev.map((draft) => (draft.id === folderId ? mapFolderToDraft(updatedFolder) : draft))
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
                    prev.map((draft) => (draft.id === folderId ? mapFolderToDraft(updatedFolder) : draft))
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
        delFolder,
        renameDrafts,
        updateQuestionsInFolder,
        removeQuestionFromFolder,
    };
};
