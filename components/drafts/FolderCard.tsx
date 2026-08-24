"use client";

interface LocalFetchDraft {
    id: string;
    name: string;
    questions: { id: string; question_text: string; options: string[]; answer: string; subject?: string; exam_name?: string; chapter?: string; question_image?: string }[];
    userRole: "owner" | "editor" | "viewer";
}

interface FolderCardProps {
    draft: LocalFetchDraft;
    onClick: (draft: LocalFetchDraft) => void;
}

export function FolderCard({ draft, onClick }: FolderCardProps) {
    return (
        <div
            className="bg-white p-3 sm:p-4 rounded-lg border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => onClick(draft)}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">Owner</span>
                    </div>
                </div>
            </div>
            <h3 className="text-sm font-medium text-slate-800 sm:text-base">{draft.name}</h3>
            <p className="text-xs text-slate-600 mt-1 sm:text-sm">
                {draft.questions.length} question{draft.questions.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">Full access</span>
            </div>
        </div>
    );
}
