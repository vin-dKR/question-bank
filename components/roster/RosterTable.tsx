"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Pencil, Check } from "lucide-react";
import { addStudentToClass, updateEnrollment, removeFromClass } from "@/actions/roster/enrollment";
import type { ClassDetail, RosterEntry } from "@/actions/roster/types";

export function RosterTable({ detail }: { detail: ClassDetail }) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [busy, setBusy] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [draft, setDraft] = useState({ name: "", rollNumber: "", admissionNumber: "" });
    const [adding, setAdding] = useState({ name: "", rollNumber: "", admissionNumber: "" });

    const refresh = () => startTransition(() => router.refresh());

    async function onAdd(e: React.FormEvent) {
        e.preventDefault();
        setBusy("add");
        const res = await addStudentToClass({
            classId: detail.id,
            name: adding.name,
            rollNumber: adding.rollNumber,
            admissionNumber: adding.admissionNumber || null,
        });
        setBusy(null);
        if (res.success) {
            toast.success(`${res.data.name} added`);
            setAdding({ name: "", rollNumber: "", admissionNumber: "" });
            refresh();
        } else {
            toast.error("Couldn't add the student", { description: res.error });
        }
    }

    async function onSaveEdit(entry: RosterEntry) {
        setBusy(entry.enrollmentId);
        const res = await updateEnrollment({
            enrollmentId: entry.enrollmentId,
            name: draft.name,
            rollNumber: draft.rollNumber,
            admissionNumber: draft.admissionNumber || null,
        });
        setBusy(null);
        if (res.success) {
            toast.success("Updated");
            setEditing(null);
            refresh();
        } else {
            toast.error("Couldn't update", { description: res.error });
        }
    }

    async function onRemove(entry: RosterEntry) {
        if (!confirm(`Remove ${entry.name} from ${detail.label}? Their past results are kept.`)) return;
        setBusy(entry.enrollmentId);
        const res = await removeFromClass(entry.enrollmentId);
        setBusy(null);
        if (res.success) {
            toast.success(`${entry.name} removed`);
            refresh();
        } else {
            toast.error("Couldn't remove", { description: res.error });
        }
    }

    return (
        <div className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
                {detail.roster.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-zinc-500">
                        No students in {detail.label} yet. Add them below.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-black/5 text-left text-[11px] uppercase tracking-wide text-zinc-500">
                                    <th className="px-5 py-2.5 font-medium">Roll</th>
                                    <th className="px-3 py-2.5 font-medium">Name</th>
                                    <th className="px-3 py-2.5 font-medium">Admission no.</th>
                                    <th className="px-5 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                                {detail.roster.map((s) => {
                                    const isEditing = editing === s.enrollmentId;
                                    const isBusy = busy === s.enrollmentId;
                                    return (
                                        <tr key={s.enrollmentId} className="hover:bg-zinc-50/60">
                                            <td className="px-5 py-2.5 font-mono text-xs tabular-nums text-zinc-700">
                                                {isEditing ? (
                                                    <Input
                                                        value={draft.rollNumber}
                                                        onChange={(e) => setDraft({ ...draft, rollNumber: e.target.value })}
                                                        className="h-8 w-20"
                                                    />
                                                ) : (
                                                    s.rollNumber
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-zinc-900">
                                                {isEditing ? (
                                                    <Input
                                                        value={draft.name}
                                                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                                        className="h-8"
                                                    />
                                                ) : (
                                                    s.name
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-zinc-500">
                                                {isEditing ? (
                                                    <Input
                                                        value={draft.admissionNumber}
                                                        onChange={(e) => setDraft({ ...draft, admissionNumber: e.target.value })}
                                                        className="h-8 w-32"
                                                        placeholder="—"
                                                    />
                                                ) : (
                                                    s.admissionNumber || "—"
                                                )}
                                            </td>
                                            <td className="px-5 py-2.5 text-right whitespace-nowrap">
                                                {isEditing ? (
                                                    <>
                                                        <Button size="sm" variant="ghost" disabled={isBusy}
                                                            onClick={() => onSaveEdit(s)}>
                                                            <Check className="h-4 w-4 text-emerald-600" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                                                            <X className="h-4 w-4 text-zinc-400" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="ghost" disabled={isBusy}
                                                            onClick={() => {
                                                                setEditing(s.enrollmentId);
                                                                setDraft({
                                                                    name: s.name,
                                                                    rollNumber: s.rollNumber,
                                                                    admissionNumber: s.admissionNumber ?? "",
                                                                });
                                                            }}>
                                                            <Pencil className="h-3.5 w-3.5 text-zinc-400" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" disabled={isBusy}
                                                            onClick={() => onRemove(s)}>
                                                            <X className="h-4 w-4 text-zinc-400 hover:text-rose-600" />
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <form onSubmit={onAdd} className="rounded-xl border border-black/5 bg-white p-5">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Add a student</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="w-full space-y-1.5 sm:w-24">
                        <Label htmlFor="roll" className="text-xs font-medium text-zinc-600">Roll</Label>
                        <Input id="roll" value={adding.rollNumber}
                            onChange={(e) => setAdding({ ...adding, rollNumber: e.target.value })} placeholder="1" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <Label htmlFor="sname" className="text-xs font-medium text-zinc-600">Full name</Label>
                        <Input id="sname" value={adding.name}
                            onChange={(e) => setAdding({ ...adding, name: e.target.value })} placeholder="Priya Sharma" />
                    </div>
                    <div className="w-full space-y-1.5 sm:w-40">
                        <Label htmlFor="adm" className="text-xs font-medium text-zinc-600">
                            Admission no. <span className="text-zinc-400">(optional)</span>
                        </Label>
                        <Input id="adm" value={adding.admissionNumber}
                            onChange={(e) => setAdding({ ...adding, admissionNumber: e.target.value })} placeholder="2026/114" />
                    </div>
                    <Button type="submit" size="sm"
                        disabled={!adding.name.trim() || !adding.rollNumber.trim() || busy === "add"}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        {busy === "add" ? "Adding…" : "Add"}
                    </Button>
                </div>
                <p className="mt-2.5 text-xs text-zinc-500">
                    The admission number is the school&apos;s permanent id. Setting it means a student
                    keeps the same record — and the same results — when they move up a class.
                </p>
            </form>
        </div>
    );
}
