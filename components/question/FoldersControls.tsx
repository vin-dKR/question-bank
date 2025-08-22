'use client';

import DraftManager from './DraftManager';

export default function FoldersControls() {
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-slate-200">
            <h2 className="text-lg font-semibold mb-3 text-slate-700 sm:text-xl tracking-3">Folders</h2>
            <DraftManager previewLimit={3} />
        </div>
    );
}
