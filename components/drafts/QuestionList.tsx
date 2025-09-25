"use client";

import { Button } from "@/components/ui/button";
import { QuestionItem } from "./QuestionItem";
import { toast } from "sonner";
import { updateFolderQuestionsWithOrder } from "@/actions/collaboration/folder";
import { useState, type Dispatch, type SetStateAction } from "react";

interface QuestionListProps {
    selectedFolder: LocalFetchDraft;
    userRole: "owner" | "editor" | "viewer";
    questionToRemove: string | null;
    setQuestionToRemove: Dispatch<SetStateAction<string | null>>;
    setSelectedFolder: Dispatch<SetStateAction<LocalFetchDraft | null>>;
    onRemove: (questionId: string) => Promise<void>;
    sendMessage: (message: CollaborationMessage) => void;
}

export function QuestionList({
    selectedFolder,
    userRole,
    questionToRemove,
    setQuestionToRemove,
    setSelectedFolder,
    onRemove,
    sendMessage,
}: QuestionListProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [orderLoading, setOrderLoading] = useState<boolean>(false);

    const handleDrop = (index: number) => {
        if (dragIndex === null || dragIndex === index || userRole === "viewer") return;
        setSelectedFolder((prev: LocalFetchDraft | null) => {
            if (!prev) return prev;
            const newQuestions = [...prev.questions];
            const [moved] = newQuestions.splice(dragIndex, 1);
            newQuestions.splice(index, 0, moved);
            return { ...prev, questions: newQuestions };
        });
        setDragIndex(null);
    };

    const handleSaveOrder = async () => {
        if (!selectedFolder) return;
        try {
            setOrderLoading(true);
            const success = await updateFolderQuestionsWithOrder(
                selectedFolder.id,
                selectedFolder.questions.map((q) => q.id)
            );
            if (success.success) {
                toast.success("Question order saved successfully");
                sendMessage({
                    type: "update",
                    folderId: selectedFolder.id,
                    userId: "current",
                    userName: "You",
                    data: { action: "reorder", questionCount: selectedFolder.questions.length },
                });
            } else {
                toast.error(success.error || "Failed to save order");
            }
        } catch (error) {
            console.error("Failed to save order:", error);
            toast.error("Failed to save question order");
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <div className="mt-4">
            {selectedFolder.questions.length > 0 ? (
                <div>
                    <div className="flex w-full justify-between items-center mb-2">
                        <span className="text-black/50 text-sm">Drag to order the questions</span>
                        {userRole !== "viewer" && (
                            <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600 whitespace-nowrap"
                                onClick={handleSaveOrder}
                                disabled={orderLoading}
                            >
                                Save Order
                            </Button>
                        )}
                    </div>
                    <ul className="space-y-3">
                        {selectedFolder.questions.map((question, index) => (
                            <div
                                key={question.id}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(index)}
                            >
                                <QuestionItem
                                    question={question}
                                    index={index}
                                    userRole={userRole}
                                    selectedFolderName={selectedFolder.name}
                                    questionToRemove={questionToRemove}
                                    setQuestionToRemove={setQuestionToRemove}
                                    onRemove={onRemove}
                                />
                            </div>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-slate-500 text-sm sm:text-base">No questions in this folder</p>
            )}
        </div>
    );
}
