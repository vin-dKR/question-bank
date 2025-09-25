"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFolderContext } from "@/lib/context/FolderContext";
import { usePDFGeneratorContext } from "@/lib/context/PDFGeneratorContext";
import { useCollaboration } from "@/lib/context/CollaborationContext";
import { checkFolderAccess } from "@/actions/collaboration/folder";
import { toast } from "sonner";
import { ErrorDisplay } from "../drafts/ErrorDisplay";
import { FolderList } from "../drafts/FolderList";
import { FolderDetails } from "../drafts/FolderDetails";

interface DraftManagerPropsLimit {
    previewLimit?: number;
}

export default function DraftManager({ previewLimit }: DraftManagerPropsLimit) {
    const {
        getAllFolders,
        delFolder,
        renameDrafts,
        removeQuestionFromFolder,
        getFolderById,
        drafts,
        loading,
        err,
    } = useFolderContext();
    const { options, institution } = usePDFGeneratorContext();
    const { joinFolder, leaveFolder, sendMessage, currentFolderId, isConnected } = useCollaboration();
    const [selectedFolder, setSelectedFolder] = useState<LocalFetchDraft | null>(null);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer">("viewer");
    const [questionToRemove, setQuestionToRemove] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const urlFolderId = searchParams.get("folder");
    const [urlFolderProcessed, setUrlFolderProcessed] = useState(false);
    const [urlFolderError, setUrlFolderError] = useState<string | null>(null);
    const [urlFolderLoading, setUrlFolderLoading] = useState(false);
    const router = useRouter();

    const refreshFolders = async () => {
        await getAllFolders();
    };

    useEffect(() => {
        const handleUrlFolder = async () => {
            if (urlFolderId && !urlFolderProcessed && !previewLimit && !selectedFolder) {
                setUrlFolderProcessed(true);
                setUrlFolderError(null);
                setUrlFolderLoading(true);
                try {
                    if (typeof urlFolderId !== "string" || urlFolderId.trim().length === 0) {
                        throw new Error("Invalid folder ID format");
                    }
                    toast.loading("Loading shared folder...", { id: "url-folder-loading" });
                    const folder = await getFolderById(urlFolderId.trim());
                    toast.dismiss("url-folder-loading");
                    if (folder) {
                        setSelectedFolder(folder);
                        const roleText =
                            folder.userRole === "owner" ? "as owner" : folder.userRole === "editor" ? "with edit access" : "with view access";
                        toast.success(`Opened shared folder "${folder.name}" ${roleText}`);
                    } else {
                        throw new Error("Unable to access the shared folder. It may not exist or you may not have permission to view it.");
                    }
                } catch (error) {
                    toast.dismiss("url-folder-loading");
                    const errorMessage = error instanceof Error ? error.message : "Failed to load shared folder";
                    setUrlFolderError(errorMessage);
                    toast.error(errorMessage);
                } finally {
                    setUrlFolderLoading(false);
                }
            }
        };
        handleUrlFolder();
    }, [urlFolderId, urlFolderProcessed, previewLimit, selectedFolder, getFolderById]);

    useEffect(() => {
        if (urlFolderId) {
            setUrlFolderProcessed(false);
            setUrlFolderError(null);
        }
    }, [urlFolderId]);

    useEffect(() => {
        if (selectedFolder && !previewLimit) {
            if (currentFolderId !== selectedFolder.id || !isConnected) {
                joinFolder(selectedFolder.id);
            }
            checkFolderAccess(selectedFolder.id).then((result) => {
                if (result.success && result.data?.role) {
                    setUserRole(result.data.role);
                }
            });
        } else if (selectedFolder && previewLimit) {
            checkFolderAccess(selectedFolder.id).then((result) => {
                if (result.success && result.data?.role) {
                    setUserRole(result.data.role);
                }
            });
        } else if (isConnected) {
            leaveFolder();
        }
    }, [selectedFolder, previewLimit, currentFolderId, isConnected, joinFolder, leaveFolder]);

    const handleFolderClick = (draft: LocalFetchDraft) => {
        setSelectedFolder({ ...draft });
        setEditMode(null);
    };

    const handleBackToList = () => {
        setSelectedFolder(null);
    };

    const handleRenameFolder = async (id: string, name: string) => {
        try {
            const success = await renameDrafts(id, name);
            if (success && selectedFolder?.id === id) {
                setSelectedFolder((prev) => (prev ? { ...prev, name } : null));
            }
            setEditMode(null);
            setNewName("");
        } catch (error) {
            console.error("Failed to rename folder:", error);
            toast.error("Failed to rename folder");
        }
    };

    const handleDeleteFolder = async (id: string) => {
        try {
            const success = await delFolder(id);
            if (success && selectedFolder?.id === id) {
                setSelectedFolder(null);
            }
        } catch (error) {
            console.error("Failed to delete folder:", error);
            toast.error("Failed to delete folder");
        }
    };

    const handleRemoveQuestion = async (questionId: string) => {
        if (!selectedFolder) return;
        const originalQuestions = [...selectedFolder.questions];
        try {
            setSelectedFolder((prev) => ({
                ...prev!,
                questions: prev!.questions.filter((q) => q.id !== questionId),
            }));
            const success = await removeQuestionFromFolder(selectedFolder.id, questionId);
            if (!success) {
                throw new Error("Failed to remove question");
            }
            setQuestionToRemove(null);
        } catch (error) {
            console.error("Failed to remove question:", error);
            setSelectedFolder((prev) => ({ ...prev!, questions: originalQuestions }));
            toast.error("Failed to remove question");
        }
    };

    const createTestFromSelected = () => {
        if (!selectedFolder || selectedFolder.questions.length === 0) {
            toast.error("Please select at least one question to create a test.");
            return;
        }
        const questionsData = selectedFolder.questions.map((q, index) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options,
            answer: q.answer || "",
            marks: 1,
            questionNumber: index + 1,
        }));
        sessionStorage.setItem("selectedQuestionsForTest", JSON.stringify(questionsData));
        router.push("/examination/create");
    };

    if (loading) {
        return <div className="text-center py-8 text-slate-600">Loading folders...</div>;
    }

    if (err) {
        return <div className="text-red-500 text-center py-8">Error: {err}</div>;
    }

    if (urlFolderLoading) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="text-slate-600">Loading shared folder...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-0 sm:px-2">
            {urlFolderError && !selectedFolder && (
                <ErrorDisplay
                    error={urlFolderError}
                    onRetry={() => {
                        setUrlFolderError(null);
                        setUrlFolderProcessed(false);
                        toast.info("Retrying folder access...");
                    }}
                    onBrowseFolders={() => {
                        setUrlFolderError(null);
                        refreshFolders();
                    }}
                />
            )}
            {selectedFolder ? (
                <FolderDetails
                    selectedFolder={selectedFolder}
                    userRole={userRole}
                    editMode={editMode}
                    newName={newName}
                    questionToRemove={questionToRemove}
                    previewLimit={previewLimit}
                    setEditMode={setEditMode}
                    setNewName={setNewName}
                    setQuestionToRemove={setQuestionToRemove}
                    setSelectedFolder={setSelectedFolder}
                    onBack={handleBackToList}
                    onRename={handleRenameFolder}
                    onDelete={handleDeleteFolder}
                    onRemoveQuestion={handleRemoveQuestion}
                    onCreateTest={createTestFromSelected}
                    institution={institution}
                    options={options}
                    sendMessage={sendMessage}
                />
            ) : (
                <FolderList drafts={drafts} previewLimit={previewLimit} onFolderClick={handleFolderClick} />
            )}
        </div>
    );
}
