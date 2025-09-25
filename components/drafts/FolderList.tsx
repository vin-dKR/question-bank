"use client";

import Link from "next/link";
import { FolderCard } from "./FolderCard";

interface FolderListProps {
    drafts: LocalFetchDraft[];
    previewLimit?: number;
    onFolderClick: (draft: LocalFetchDraft) => void;
}

export function FolderList({ drafts, previewLimit, onFolderClick }: FolderListProps) {
    return (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {drafts?.length ? (
                (previewLimit ? drafts.slice(0, previewLimit) : drafts).map((draft) => (
                    <FolderCard key={draft.id} draft={draft} onClick={onFolderClick} />
                ))
            ) : (
                <p className="text-slate-500 text-sm sm:text-base col-span-full">No folders available</p>
            )}
            {previewLimit && drafts?.length > previewLimit && (
                <div className="col-span-full flex justify-end mt-2">
                    <Link href="/drafts" className="text-indigo-600 hover:underline text-sm">View all</Link>
                </div>
            )}
        </div>
    );
}
