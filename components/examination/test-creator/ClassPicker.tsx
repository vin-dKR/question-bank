"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { listClassOptions } from "@/actions/roster/testRoster";
import type { ClassOption } from "@/actions/roster/testRoster";

/**
 * Choosing the class a test is for, at creation time.
 *
 * This used to live on the OMR scanning screen, which was the wrong place: by
 * then the teacher is holding a stack of answer sheets and just wants to pick
 * the test they already made. A paper is set FOR a class, so the class belongs
 * with the rest of the paper's details.
 *
 * It also removes a double entry. "Standard/Class" below is free text printed in
 * the PDF header; this is the roster relation. A teacher was typing the class
 * once for the paper and choosing it again later for scanning. Selecting here
 * fills the printed field too, so the two can't disagree.
 */
export function ClassPicker({
    value,
    onChange,
    onClassLabel,
}: {
    value: string | null | undefined;
    onChange: (classId: string | null) => void;
    /** Lets the caller mirror the label into the printed "Standard/Class" field. */
    onClassLabel?: (label: string) => void;
}) {
    const [options, setOptions] = useState<ClassOption[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        listClassOptions().then((res) => {
            if (res.success) setOptions(res.data);
            setLoaded(true);
        });
    }, []);

    return (
        <div className="space-y-2">
            <Label htmlFor="test-class">Class</Label>
            <select
                id="test-class"
                className="h-9 w-full rounded-md border border-black/10 bg-white px-2 text-sm"
                value={value ?? ""}
                onChange={(e) => {
                    const id = e.target.value || null;
                    onChange(id);
                    const label = options.find((o) => o.id === id)?.label;
                    if (label && onClassLabel) onClassLabel(label);
                }}
                disabled={!loaded || options.length === 0}
            >
                <option value="">
                    {!loaded ? "Loading…" : options.length === 0 ? "No classes yet" : "Not tied to a class"}
                </option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                ))}
            </select>
            {loaded && options.length === 0 ? (
                <p className="text-xs text-zinc-500">
                    <Link href="/classes" className="underline">Create a class</Link> to have roll numbers
                    fill in student names automatically when you scan.
                </p>
            ) : (
                <p className="text-xs text-zinc-500">
                    Optional. Picking a class means scanning resolves roll numbers to students,
                    and you get a scanned/pending count as you work.
                </p>
            )}
        </div>
    );
}
