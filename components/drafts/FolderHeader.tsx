"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepBack } from "lucide-react";
import PDFGenerator from "../pdf/pdfPreview";

interface LocalFetchDraft {
    id: string;
    name: string;
    questions: Question[] | QuestionForCreateTestData[]
    userRole: "owner" | "editor" | "viewer";
    isCollaborated: boolean;
    collaboratorCount: number;
}

interface FolderHeaderProps {
    selectedFolder: LocalFetchDraft;
    userRole: "owner" | "editor" | "viewer";
    editMode: string | null;
    newName: string;
    setEditMode: (id: string | null) => void;
    setNewName: (name: string) => void;
    onBack: () => void;
    onRename: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onCreateTest: () => void;
    institution: string;
    options: PDFGenerationOptions
}

export function FolderHeader({
    selectedFolder,
    userRole,
    editMode,
    newName,
    setEditMode,
    setNewName,
    onBack,
    onRename,
    onDelete,
    onCreateTest,
    institution,
    options,
}: FolderHeaderProps) {
    return (
        <div className="flex flex-col gap-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-wrap">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-1 whitespace-nowrap text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-black/5 self-start sm:self-auto"
                >
                    <StepBack className="h-4 w-4" />
                    <span>Back to folders</span>
                </Button>
                <div className="flex flex-wrap gap-2 items-center justify-end w-full sm:w-auto">
                    {userRole !== "viewer" && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                                <Link href="/questions">Add Questions</Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditMode(selectedFolder.id);
                                    setNewName(selectedFolder.name);
                                }}
                                className="border-amber-500 text-amber-600 hover:bg-amber-50"
                            >
                                Rename
                            </Button>
                        </>
                    )}
                    {userRole === "owner" && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(selectedFolder.id)}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={onCreateTest}
                        disabled={selectedFolder.questions.length === 0}
                        className="bg-green-600 text-white hover:bg-green-700 transition text-md border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Create Test
                    </Button>
                    {selectedFolder.questions.length > 0 && (
                        <PDFGenerator
                            saveToHistory={false}
                            institution={institution}
                            selectedQuestions={selectedFolder.questions}
                            options={options}
                            className=""
                        />
                    )}
                </div>
            </div>
            {editMode === selectedFolder.id && (
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 border-slate-200 focus:ring-amber-500 focus:border-amber-500 text-sm sm:text-base"
                        autoFocus
                    />
                    <Button
                        onClick={() => onRename(selectedFolder.id, newName)}
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        Save
                    </Button>
                    <Button
                        onClick={() => setEditMode(null)}
                        size="sm"
                        variant="outline"
                        className="border-slate-500 text-slate-600 hover:bg-slate-100"
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </div>
    );
}
