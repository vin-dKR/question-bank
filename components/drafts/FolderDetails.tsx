"use client";

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
    setQuestionToRemove: React.Dispatch<React.SetStateAction<string | null>>;
    setSelectedFolder: React.Dispatch<React.SetStateAction<LocalFetchDraft | null>>;
    onBack: () => void;
    onRename: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onRemoveQuestion: (questionId: string) => Promise<void>;
    onCreateTest: () => void;
    institution: string;
    options: PDFGenerationOptions;
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
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-600 font-medium">Owner</span>
                            </div>
                        </div>
                    </div>
                    <QuestionList
                        selectedFolder={selectedFolder}
                        userRole={userRole}
                        questionToRemove={questionToRemove}
                        setQuestionToRemove={setQuestionToRemove}
                        setSelectedFolder={setSelectedFolder}
                        onRemove={onRemoveQuestion}
                    />
                </div>
            </div>
        </div>
    );
}
