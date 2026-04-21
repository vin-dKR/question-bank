'use client';

import DraftManager from './DraftManager';

export default function FoldersControls() {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-xs border border-black/5">
            <h2 className="text-sm font-medium mb-3 text-zinc-500 uppercase tracking-wide">Folders</h2>
            <DraftManager previewLimit={3} />
        </div>
    );
}
