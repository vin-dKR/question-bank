"use client";

interface LocalFetchDraft {
    id: string;
    name: string;
    questions: { id: string; question_text: string; options: string[]; answer: string; subject?: string; exam_name?: string; chapter?: string; question_image?: string }[];
    userRole: "owner" | "editor" | "viewer";
    isCollaborated: boolean;
    collaboratorCount: number;
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
                    {draft.isCollaborated ? (
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-blue-600 font-medium">{draft.userRole === "editor" ? "Editor" : "Viewer"}</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Owner</span>
                        </div>
                    )}
                </div>
                {draft.collaboratorCount > 0 && (
                    <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        <span className="text-xs text-slate-500">{draft.collaboratorCount}</span>
                    </div>
                )}
            </div>
            <h3 className="text-sm font-medium text-slate-800 sm:text-base">{draft.name}</h3>
            <p className="text-xs text-slate-600 mt-1 sm:text-sm">
                {draft.questions.length} question{draft.questions.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {draft.userRole === "owner" ? "Full access" : draft.userRole === "editor" ? "Can edit" : "View only"}
                </span>
                {draft.isCollaborated && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Shared</span>
                )}
            </div>
        </div>
    );
}
