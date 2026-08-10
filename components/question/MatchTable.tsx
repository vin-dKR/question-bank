import { memo } from 'react';
import { renderMixedLatex } from '@/lib/render-tex';

/**
 * Read-only render of a match-the-column question: its columns (2 or 3) side by side, each a card of
 * labelled entries, followed by the correct matching (first-column label → the labels it matches).
 * Published by the ingest pipeline as `match_columns` + `match_key`; the flat `answer` still mirrors
 * the key, so this is purely the richer presentation of the same data.
 */
const MatchTable = memo(({ columns, matchKey }: { columns: MatchColumn[]; matchKey?: Record<string, string[]> | null }) => {
    const first = columns[0];
    const key = matchKey ?? {};
    const hasKey = Object.keys(key).length > 0;

    return (
        <div className="space-y-3 mb-2">
            {/* Columns scroll horizontally in their own track so 3 wide columns never break the card. */}
            <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-full">
                    {columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="flex-1 min-w-[180px] rounded-md border border-black/5 bg-zinc-50/40">
                            <div className="px-3 py-2 text-xs font-semibold text-zinc-700 border-b border-black/5">
                                {column.title || `Column ${columnIndex + 1}`}
                            </div>
                            <div className="divide-y divide-black/5">
                                {column.entries.map((entry, entryIndex) => (
                                    <div key={entryIndex} className="flex items-start gap-2 px-3 py-2">
                                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-white border border-black/5 font-mono text-[11px] font-medium text-zinc-500">
                                            {entry.label}
                                        </span>
                                        <span className="text-sm text-zinc-800 leading-relaxed flex-1 min-w-0">
                                            {renderMixedLatex(entry.body)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {hasKey && first && (
                <div className="flex flex-wrap gap-2">
                    {first.entries
                        .filter((entry) => (key[entry.label]?.length ?? 0) > 0)
                        .map((entry) => (
                            <span
                                key={entry.label}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700"
                            >
                                <span className="font-semibold">{entry.label}</span>
                                <span aria-hidden>→</span>
                                <span className="font-medium">{(key[entry.label] ?? []).join(', ')}</span>
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
});
MatchTable.displayName = 'MatchTable';

export default MatchTable;
