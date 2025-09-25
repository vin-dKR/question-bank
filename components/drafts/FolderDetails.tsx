"use client";

import { CollaborationPanel } from "../collaboration/CollaborationPanel";
import { FolderHeader } from "./FolderHeader";
import { QuestionList } from "./QuestionList";

interface FolderDetailsProps {
    selectedFolder: LocalFetchDraft;
    userRole: "owner" | "editor" | "viewer";
    editMode: string | null;
    newName: string;
    questionToRemove: string | null;
    previewLimit?: number;
    setEditMode: (id: string | null) => void;
    setNewName: (name: string) => void;
    setQuestionToRemove: (id: string | null) => void;
    setSelectedFolder: (folder: LocalFetchDraft | null) => void;
    onBack: () => void;
    onRename: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onRemoveQuestion: (questionId: string) => Promise<void>;
    onCreateTest: () => void;
    institution: string;
    options: any; // Replace with specific type if available
    sendMessage: (message: any) => void;
}

export function FolderDetails({
    selectedFolder,
    userRole,
    editMode,
    newName,
    questionToRemove,
    previewLimit,
    setEditMode,
    setNewName,
    setQuestionToRemove,
    setSelectedFolder,
    onBack,
    onRename,
    onDelete,
    onRemoveQuestion,
    onCreateTest,
    institution,
    options,
    sendMessage,
}: FolderDetailsProps) {
    return (
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md border border-slate-200 transition-all duration-200">
            <FolderHeader
                selectedFolder={selectedFolder}
                userRole={userRole}
                editMode={editMode}
                newName={newName}
                setEditMode={setEditMode}
                setNewName={setNewName}
                onBack={onBack}
                onRename={onRename}
                onDelete={onDelete}
                onCreateTest={onCreateTest}
                institution={institution}
                options={options}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className={previewLimit ? "lg:col-span-3" : "lg:col-span-2"}>
                    <div className="flex items-center justify-between mb-3 border-t border-black/10 pt-2">
                        <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-slate-800 sm:text-xl">{selectedFolder.name}</h3>
                            {selectedFolder.isCollaborated && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Opened via link</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {selectedFolder.isCollaborated ? (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-xs text-blue-600 font-medium">
                                            {selectedFolder.userRole === "editor" ? "Editor Access" : "View Only"}
                                        </span>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Shared Folder</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 font-medium">Owner</span>
                                    </div>
                                    {selectedFolder.collaboratorCount > 0 && (
                                        <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-full">
                                            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                                            </svg>
                                            <span className="text-xs text-gray-600">
                                                {selectedFolder.collaboratorCount} collaborator{selectedFolder.collaboratorCount !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <QuestionList
                        selectedFolder={selectedFolder}
                        userRole={userRole}
                        questionToRemove={questionToRemove}
                        setQuestionToRemove={setQuestionToRemove}
                        setSelectedFolder={setSelectedFolder}
                        onRemove={onRemoveQuestion}
                        sendMessage={sendMessage}
                    />
                </div>
                {!previewLimit && (
                    <div className="lg:col-span-1">
                        <CollaborationPanel
                            folderId={selectedFolder.id}
                            folderName={selectedFolder.name}
                            userRole={userRole}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
