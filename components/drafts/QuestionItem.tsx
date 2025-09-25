"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trash } from "lucide-react";
import { renderMixedLatex } from "@/lib/render-tex";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    answer: string;
    subject?: string;
    exam_name?: string;
    chapter?: string;
    question_image?: string;
}

interface QuestionItemProps {
    question: Question;
    index: number;
    userRole: "owner" | "editor" | "viewer";
    selectedFolderName: string;
    questionToRemove: string | null;
    setQuestionToRemove: (id: string | null) => void;
    onRemove: (questionId: string) => Promise<void>;
}

export function QuestionItem({
    question,
    index,
    userRole,
    selectedFolderName,
    questionToRemove,
    setQuestionToRemove,
    onRemove,
}: QuestionItemProps) {
    return (
        <li
            className="p-3 bg-slate-50 rounded-md border border-black/5 flex flex-col gap-2"
            draggable={userRole !== "viewer"}
            onDragStart={(e) => e.dataTransfer.setData("index", index.toString())}
        >
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-slate-800 sm:text-base">
                    Q: {renderMixedLatex(question.question_text)}
                </p>
                {userRole !== "viewer" && (
                    <Dialog
                        open={questionToRemove === question.id}
                        onOpenChange={(open) => setQuestionToRemove(open ? question.id : null)}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 rounded-full h-8 w-8"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white max-h-[100vh] !top-[50%] !left-[50%] !transform !-translate-x-1/2 !-translate-y-1/2">
                            <DialogHeader>
                                <DialogTitle>Remove Question</DialogTitle>
                            </DialogHeader>
                            <div className="text-sm text-slate-600">
                                Are you sure you want to remove this question from {selectedFolderName}?
                            </div>
                            <DialogFooter className="sm:justify-start">
                                <DialogClose asChild>
                                    <Button
                                        variant="outline"
                                        className="border-slate-500 text-slate-600 hover:bg-slate-100"
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    onClick={() => onRemove(question.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    Remove
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <span className="text-xs text-slate-600 sm:text-xs mt-2 px-2 py-1 rounded-md">
                {question.subject || "No subject"} • {question.exam_name || "No exam"} • {question.chapter || "No chapter"} •
                Answer: {question.answer}
            </span>
            {question.question_image && (
                <Image
                    src={question.question_image}
                    alt="Question"
                    className="mt-2 w-full max-w-[200px] sm:max-w-[300px] h-auto rounded-md"
                    width={300}
                    height={300}
                />
            )}
        </li>
    );
}
