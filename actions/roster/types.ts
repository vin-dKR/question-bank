/**
 * Shared types for class and roster management.
 *
 * Kept out of the `"use server"` modules: those may only export async
 * functions, and a stray `export const` breaks `next build` with an opaque
 * "Failed to collect page data" error.
 */

export const ENROLLMENT_STATUSES = ["active", "promoted", "transferred", "left"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export type ClassSummary = {
    id: string;
    name: string;
    section: string | null;
    /** Display label, e.g. "10 A" or just "10" when there is no section. */
    label: string;
    academicYearId: string;
    academicYearName: string;
    studentCount: number;
};

export type RosterEntry = {
    enrollmentId: string;
    studentId: string;
    name: string;
    rollNumber: string;
    admissionNumber: string | null;
    status: EnrollmentStatus;
};

export type ClassDetail = ClassSummary & {
    roster: RosterEntry[];
};

export type YearSummary = {
    id: string;
    name: string;
    isCurrent: boolean;
    classCount: number;
};

export type RosterResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

// ---- CSV roster import ----------------------------------------------------

export type ImportRow = {
    name?: string;
    rollNumber?: string;
    admissionNumber?: string | null;
};

export type ImportPreview = {
    classLabel: string;
    rows: {
        index: number;
        name: string;
        rollNumber: string;
        admissionNumber: string | null;
        /** create = new to this class · update = already enrolled · skip = unusable */
        status: "create" | "update" | "skip";
        note: string;
    }[];
    counts: { create: number; update: number; skip: number };
};

export type ImportResult = {
    created: number;
    updated: number;
    skipped: number;
    failures: { row: number; name: string; reason: string }[];
};
