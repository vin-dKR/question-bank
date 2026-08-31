"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, X, AlertTriangle, Check } from "lucide-react";
import { decodeCsvBytes, parseCsv, guessColumnRoles, type ColumnRole } from "@/lib/roster/csv";
import { previewRosterImport, commitRosterImport } from "@/actions/roster/import";
import type { ImportPreview, ImportRow } from "@/actions/roster/types";

const ROLES: { value: ColumnRole; label: string }[] = [
    { value: "rollNumber", label: "Roll number" },
    { value: "name", label: "Name" },
    { value: "admissionNumber", label: "Admission no." },
    { value: "ignore", label: "Ignore" },
];

export function RosterImport({ classId }: { classId: string }) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [header, setHeader] = useState<string[]>([]);
    const [body, setBody] = useState<string[][]>([]);
    const [roles, setRoles] = useState<ColumnRole[]>([]);
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [busy, setBusy] = useState(false);

    function reset() {
        setHeader([]); setBody([]); setRoles([]); setPreview(null); setOpen(false);
    }

    async function onFile(file: File) {
        // Read as bytes, not text: Excel exports are often windows-1252 and
        // decoding them as UTF-8 mangles every accented name.
        const rows = parseCsv(decodeCsvBytes(await file.arrayBuffer()));
        if (rows.length < 2) {
            toast.error("That file needs a header row and at least one student.");
            return;
        }
        setHeader(rows[0]);
        setBody(rows.slice(1));
        setRoles(guessColumnRoles(rows[0]));
        setPreview(null);
    }

    function toRows(): ImportRow[] {
        const col = (role: ColumnRole) => roles.indexOf(role);
        const n = col("name"), r = col("rollNumber"), a = col("admissionNumber");
        return body.map((cells) => ({
            name: n >= 0 ? cells[n] : "",
            rollNumber: r >= 0 ? cells[r] : "",
            admissionNumber: a >= 0 ? cells[a] || null : null,
        }));
    }

    async function onPreview() {
        if (!roles.includes("name") || !roles.includes("rollNumber")) {
            toast.error("Map a Name column and a Roll number column first.");
            return;
        }
        setBusy(true);
        const res = await previewRosterImport(classId, toRows());
        setBusy(false);
        if (res.success) setPreview(res.data);
        else toast.error("Couldn't read that file", { description: res.error });
    }

    async function onCommit() {
        setBusy(true);
        const res = await commitRosterImport(classId, toRows());
        setBusy(false);
        if (!res.success) { toast.error("Import failed", { description: res.error }); return; }

        const { created, updated, skipped, failures } = res.data;
        toast.success(
            `${created} added, ${updated} updated` + (skipped ? `, ${skipped} skipped` : ""),
            failures.length ? { description: `${failures.length} row(s) failed — see the list.` } : undefined
        );
        if (failures.length === 0) reset();
        startTransition(() => router.refresh());
    }

    if (!open) {
        return (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Import from CSV
            </Button>
        );
    }

    return (
        <div className="rounded-xl border border-black/5 bg-white p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-zinc-900">Import students from a spreadsheet</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                        Export your roster as CSV. Nothing is saved until you review the preview.
                    </p>
                </div>
                <Button size="sm" variant="ghost" onClick={reset}><X className="h-4 w-4" /></Button>
            </div>

            {header.length === 0 ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-black/15 px-6 py-10 text-center hover:bg-zinc-50">
                    <Upload className="h-5 w-5 text-zinc-400" />
                    <span className="mt-2 text-sm text-zinc-700">Choose a CSV file</span>
                    <span className="mt-0.5 text-xs text-zinc-500">Up to 1,000 rows</span>
                    <input type="file" accept=".csv,text/csv" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
                </label>
            ) : (
                <>
                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Which column is which?
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {header.map((h, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="min-w-0 flex-1 truncate text-xs text-zinc-600" title={h}>
                                        {h || <em className="text-zinc-400">column {i + 1}</em>}
                                    </span>
                                    <select
                                        className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs"
                                        value={roles[i] ?? "ignore"}
                                        onChange={(e) => {
                                            const next = [...roles];
                                            next[i] = e.target.value as ColumnRole;
                                            setRoles(next);
                                            setPreview(null);
                                        }}
                                    >
                                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">
                            {body.length} row{body.length === 1 ? "" : "s"} found. Admission number is optional,
                            but setting it means a student keeps their results when they move up a class.
                        </p>
                    </div>

                    {preview && (
                        <div className="rounded-lg border border-black/5 bg-zinc-50/60 p-3">
                            <div className="flex flex-wrap gap-3 text-xs">
                                <span className="text-emerald-700">{preview.counts.create} to add</span>
                                <span className="text-blue-700">{preview.counts.update} already enrolled</span>
                                {preview.counts.skip > 0 && (
                                    <span className="text-amber-700">{preview.counts.skip} skipped</span>
                                )}
                            </div>
                            {preview.rows.some((r) => r.status === "skip") && (
                                <ul className="mt-2 space-y-0.5 text-xs text-amber-800">
                                    {preview.rows.filter((r) => r.status === "skip").slice(0, 6).map((r) => (
                                        <li key={r.index} className="flex items-start gap-1.5">
                                            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                            Row {r.index + 1}: {r.note}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-3 max-h-48 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <tbody className="divide-y divide-black/5">
                                        {preview.rows.filter((r) => r.status !== "skip").slice(0, 50).map((r) => (
                                            <tr key={r.index}>
                                                <td className="py-1 pr-3 font-mono tabular-nums text-zinc-500">{r.rollNumber}</td>
                                                <td className="py-1 pr-3 text-zinc-900">{r.name}</td>
                                                <td className="py-1 text-zinc-500">{r.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {preview ? (
                            <>
                                <Button size="sm" onClick={onCommit} disabled={busy || preview.counts.create + preview.counts.update === 0}>
                                    <Check className="mr-1.5 h-3.5 w-3.5" />
                                    {busy ? "Importing…" : `Import ${preview.counts.create + preview.counts.update} students`}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Back</Button>
                            </>
                        ) : (
                            <Button size="sm" onClick={onPreview} disabled={busy}>
                                {busy ? "Checking…" : "Preview"}
                            </Button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
