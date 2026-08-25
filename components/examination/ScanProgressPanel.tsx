"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, Clock, UserX, Undo2 } from "lucide-react";
import { getScanProgress, markAbsent, unmarkAbsent } from "@/actions/roster/attendance";
import type { ScanProgress } from "@/actions/roster/types";

/**
 * Roster-aware progress for the scanning screen.
 *
 * The point is to answer "am I finished?", which was previously unanswerable:
 * an absent student looked exactly like one whose sheet hadn't been scanned.
 *
 * `refreshKey` should change whenever a sheet is saved, so the panel re-reads.
 */
export function ScanProgressPanel({
    testId,
    refreshKey,
    onPickRoll,
}: {
    testId: string;
    refreshKey: number;
    /** Lets a teacher click a pending student to load their roll number. */
    onPickRoll?: (rollNumber: string) => void;
}) {
    const [progress, setProgress] = useState<ScanProgress | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!testId) { setProgress(null); return; }
        const res = await getScanProgress(testId);
        setProgress(res.success ? res.data : null);
    }, [testId]);

    useEffect(() => { load(); }, [load, refreshKey]);

    // Only meaningful with a class roster behind it — without one there is no
    // denominator, so the panel stays out of the way entirely.
    if (!progress || progress.expected === null) return null;

    const done = progress.scanned + progress.absent;
    const pct = progress.expected > 0 ? Math.round((done / progress.expected) * 100) : 0;

    async function onAbsent(studentId: string, name: string) {
        setBusy(studentId);
        const res = await markAbsent(testId, studentId);
        setBusy(null);
        if (res.success) { toast.success(`${name} marked absent`); load(); }
        else toast.error("Couldn't mark absent", { description: res.error });
    }

    async function onUndo(studentId: string, name: string) {
        setBusy(studentId);
        const res = await unmarkAbsent(testId, studentId);
        setBusy(null);
        if (res.success) { toast.success(`${name} back to pending`); load(); }
        else toast.error("Couldn't undo", { description: res.error });
    }

    return (
        <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-zinc-900">
                    {progress.scanned} of {progress.expected} scanned
                </p>
                <p className="text-xs text-zinc-500">{progress.classLabel}</p>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="text-emerald-700">{progress.scanned} scanned</span>
                {progress.absent > 0 && <span className="text-zinc-500">{progress.absent} absent</span>}
                <span className={progress.pending ? "text-amber-700" : "text-zinc-400"}>
                    {progress.pending} pending
                </span>
            </div>

            {progress.pending === 0 && (
                <p className="mt-2 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                    Everyone is accounted for.
                </p>
            )}

            <div className="mt-3 max-h-72 space-y-0.5 overflow-y-auto">
                {progress.students.map((s) => (
                    <div key={s.studentId}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-zinc-50">
                        <span className="w-8 flex-shrink-0 font-mono tabular-nums text-zinc-400">{s.rollNumber}</span>

                        {s.state === "scanned" && <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />}
                        {s.state === "absent" && <UserX className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />}
                        {s.state === "pending" && <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />}

                        <button
                            type="button"
                            onClick={() => s.state === "pending" && onPickRoll?.(s.rollNumber)}
                            className={`min-w-0 flex-1 truncate text-left ${
                                s.state === "pending" ? "text-zinc-900 hover:underline" : "text-zinc-500"
                            }`}
                            title={s.state === "pending" ? "Use this roll number" : undefined}
                        >
                            {s.name}
                        </button>

                        {s.percentage !== null && (
                            <span className="flex-shrink-0 tabular-nums text-zinc-500">
                                {Math.round(s.percentage)}%
                            </span>
                        )}

                        {s.state === "pending" && (
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[11px] text-zinc-400 hover:text-zinc-700"
                                disabled={busy === s.studentId} onClick={() => onAbsent(s.studentId, s.name)}>
                                Absent
                            </Button>
                        )}
                        {s.state === "absent" && (
                            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-zinc-400 hover:text-zinc-700"
                                disabled={busy === s.studentId} onClick={() => onUndo(s.studentId, s.name)}>
                                <Undo2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
