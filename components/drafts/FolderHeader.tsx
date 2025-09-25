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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Left side - Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="flex items-center gap-1 whitespace-nowrap text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-black/5 self-start sm:self-auto"
            >
                <StepBack className="h-4 w-4" />
                <span>Back to folders</span>
            </Button>

            {/* Right side - Action buttons */}
            <div className="flex flex-col sm:flex-row xs:flex-row gap-2 items-stretch xs:items-center justify-end w-full sm:w-auto flex-nowrap">
                <div className="flex flex-row xs:flex-row gap-2 flex-nowrap">
                    {userRole !== "viewer" && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500 w-full text-blue-600 hover:bg-blue-50 whitespace-nowrap"
                            >
                                <Link href="/questions" className="font-bold text-xs">Add Questions</Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditMode(selectedFolder.id);
                                    setNewName(selectedFolder.name);
                                }}
                                className="border-amber-500 font-bold text-xs w-full text-amber-600 hover:bg-amber-50 whitespace-nowrap"
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
                            className="bg-red-500 w-full font-bold text-xs hover:bg-red-600 whitespace-nowrap"
                        >
                            Delete
                        </Button>
                    )}
                </div>

                <div className="flex flex-row xs:flex-row gap-2 flex-nowrap">
                    <Button
                        size="sm"
                        onClick={onCreateTest}
                        disabled={selectedFolder.questions.length === 0}
                        className="bg-green-600 w-full text-white hover:bg-green-700 transition border border-black/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        Create Test
                    </Button>
                    {selectedFolder.questions.length > 0 && (
                        <PDFGenerator
                            saveToHistory={false}
                            institution={institution}
                            selectedQuestions={selectedFolder.questions}
                            options={options}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
