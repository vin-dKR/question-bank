"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import { normalizeRollNumber } from "@/lib/examination/studentRoster";
import type { RosterResult } from "./types";

/**
 * The roster behind a test, for OMR scanning.
 *
 * When a test is linked to a class, the scanner can resolve a detected roll
 * number to a real student instead of asking the teacher to retype a name for
 * every sheet. When it isn't linked, everything falls back to manual entry
 * exactly as before — `classId` is nullable and always will be.
 */

export type TestRosterEntry = {
    rollNumber: string;
    name: string;
    studentId: string;
};

export type TestRoster = {
    testId: string;
    testTitle: string;
    /** Null when the test isn't linked to a class — the manual-entry path. */
    classId: string | null;
    classLabel: string | null;
    className: string | null;
    academicYearName: string | null;
    students: TestRosterEntry[];
};

export type ClassOption = { id: string; label: string };

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) return { success: false as const, error: error.message };
    console.error(fallback, error);
    return { success: false as const, error: fallback };
}

export async function getTestRoster(testId: string): Promise<RosterResult<TestRoster>> {
    try {
        const ctx = await requireOrgContext();

        const test = await prisma.test.findFirst({
            where: { id: testId, organizationId: ctx.organizationId },
            select: {
                id: true,
                title: true,
                classId: true,
                class: {
                    select: {
                        id: true, name: true, section: true,
                        academicYear: { select: { name: true } },
                        enrollments: {
                            where: { status: "active" },
                            select: {
                                rollNumber: true,
                                student: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!test) throw new AuthError("That test isn't in your organization.", 403);

        const cls = test.class;
        return {
            success: true,
            data: {
                testId: test.id,
                testTitle: test.title,
                classId: cls?.id ?? null,
                classLabel: cls ? (cls.section ? `${cls.name} ${cls.section}` : cls.name) : null,
                // What the scanner writes into Student.className — must match the
                // normalizer the OMR path uses, or the roster and the scan would
                // resolve to different records.
                className: cls ? `${cls.name}${cls.section ?? ""}` : null,
                academicYearName: cls?.academicYear.name ?? null,
                students: (cls?.enrollments ?? []).map((e) => ({
                    rollNumber: normalizeRollNumber(e.rollNumber),
                    name: e.student.name,
                    studentId: e.student.id,
                })),
            },
        };
    } catch (error) {
        return fail(error, "Failed to load the roster");
    }
}

/** Classes in the current year, for the picker on the scanning screen. */
export async function listClassOptions(): Promise<RosterResult<ClassOption[]>> {
    try {
        const ctx = await requireOrgContext();
        const classes = await prisma.class.findMany({
            where: { organizationId: ctx.organizationId, academicYear: { isCurrent: true } },
            orderBy: [{ name: "asc" }, { section: "asc" }],
            select: { id: true, name: true, section: true },
        });
        return {
            success: true,
            data: classes.map((c) => ({
                id: c.id,
                label: c.section ? `${c.name} ${c.section}` : c.name,
            })),
        };
    } catch (error) {
        return fail(error, "Failed to load classes");
    }
}

/** Links a test to a class so its roster drives scanning. */
export async function setTestClass(testId: string, classId: string | null): Promise<RosterResult<null>> {
    try {
        const ctx = await requireOrgContext();

        const test = await prisma.test.findFirst({
            where: { id: testId, organizationId: ctx.organizationId },
            select: { id: true },
        });
        if (!test) throw new AuthError("That test isn't in your organization.", 403);

        if (classId) {
            const cls = await prisma.class.findFirst({
                where: { id: classId, organizationId: ctx.organizationId },
                select: { id: true },
            });
            if (!cls) throw new AuthError("That class isn't in your organization.", 403);
        }

        await prisma.test.update({ where: { id: test.id }, data: { classId } });

        revalidatePath("/examination/omr");
        return { success: true, data: null };
    } catch (error) {
        return fail(error, "Failed to link the class");
    }
}
