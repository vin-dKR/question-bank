"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Users, ChevronRight } from "lucide-react";
import { createClass } from "@/actions/roster/classes";
import type { ClassSummary, YearSummary } from "@/actions/roster/types";

export function ClassList({
    classes,
    years,
    activeYearId,
}: {
    classes: ClassSummary[];
    years: YearSummary[];
    activeYearId: string;
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [section, setSection] = useState("");
    const [saving, setSaving] = useState(false);

    const activeYear = years.find((y) => y.id === activeYearId);
    const isPastYear = activeYear ? !activeYear.isCurrent : false;

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const res = await createClass({ name, section, academicYearId: activeYearId });
        setSaving(false);
        if (res.success) {
            toast.success(`${res.data.label} created`);
            setName("");
            setSection("");
            setAdding(false);
            startTransition(() => router.refresh());
        } else {
            toast.error("Couldn't create the class", { description: res.error });
        }
    }

    return (
        <div className="space-y-5">
            {years.length > 1 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {years.map((y) => (
                        <Link
                            key={y.id}
                            href={`/classes?year=${y.id}`}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                y.id === activeYearId
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                        >
                            {y.name}
                            {y.isCurrent && <span className="ml-1.5 opacity-60">current</span>}
                        </Link>
                    ))}
                </div>
            )}

            {isPastYear && (
                <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                    You&apos;re viewing a past session. Classes here are kept for their results —
                    add new students to the current year instead.
                </p>
            )}

            {classes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-black/10 px-6 py-12 text-center">
                    <Users className="mx-auto h-6 w-6 text-zinc-300" />
                    <p className="mt-3 text-sm font-medium text-zinc-900">No classes yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500">
                        Create a class, then add your students to it. Once a class has a roster,
                        scanning OMR sheets fills in names for you instead of typing them per sheet.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-black/5 bg-white">
                    <div className="divide-y divide-black/5">
                        {classes.map((c) => (
                            <Link
                                key={c.id}
                                href={`/classes/${c.id}`}
                                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50"
                            >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                                    {c.name}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-zinc-900">{c.label}</p>
                                    <p className="text-xs text-zinc-500">
                                        {c.studentCount} student{c.studentCount === 1 ? "" : "s"}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-300" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {adding ? (
                <form onSubmit={onCreate} className="rounded-xl border border-black/5 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="cls-name" className="text-xs font-medium text-zinc-600">
                                Class
                            </Label>
                            <Input
                                id="cls-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="10"
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 space-y-1.5">
                            <Label htmlFor="cls-section" className="text-xs font-medium text-zinc-600">
                                Section <span className="text-zinc-400">(optional)</span>
                            </Label>
                            <Input
                                id="cls-section"
                                value={section}
                                onChange={(e) => setSection(e.target.value)}
                                placeholder="A"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" disabled={!name.trim() || saving}>
                                {saving ? "Creating…" : "Create"}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <Button size="sm" variant="outline" onClick={() => setAdding(true)} disabled={pending}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New class
                </Button>
            )}
        </div>
    );
}
