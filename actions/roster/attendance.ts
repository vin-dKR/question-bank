"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import type { RosterResult, ScanProgress } from "./types";

/**
 * Scan progress and attendance for a test.
 *
 * Before this, an absent student was indistinguishable from one whose sheet
 * simply hadn't been scanned yet — so a teacher had no way to know when they
 * were finished. Marking absent is explicit, and it writes a StudentResponse
 * with status = "absent" so the row exists (one per student per test, via the
 * existing @@unique([testId, studentId])) without contributing a score.
 *
 * ABSENT IS NOT ZERO — see the note on StudentResponse.status. Aggregates
 * filter to status = "graded".
 */

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) return { success: false as const, error: error.message };
    console.error(fallback, error);
    return { success: false as const, error: fallback };
}

async function ownedTest(testId: string, organizationId: string) {
    const test = await prisma.test.findFirst({
        where: { id: testId, organizationId },
        select: {
            id: true, title: true, classId: true,
            class: { select: { id: true, name: true, section: true } },
        },
    });
    if (!test) throw new AuthError("That test isn't in your organization.", 403);
    return test;
}

/**
 * Who was expected, who has been scanned, who is absent, who is outstanding.
 *
 * Only meaningful once a test is linked to a class — without a roster there is
 * no denominator, so `expected` is null and the UI falls back to a plain count
 * of what has been scanned.
 */
export async function getScanProgress(testId: string): Promise<RosterResult<ScanProgress>> {
    try {
        const ctx = await requireOrgContext();
        const test = await ownedTest(testId, ctx.organizationId);

        const responses = await prisma.studentResponse.findMany({
            where: { testId: test.id },
            select: { studentId: true, status: true, score: true, percentage: true },
        });
        const byStudent = new Map(responses.map((r) => [r.studentId, r]));

        if (!test.classId || !test.class) {
            return {
                success: true,
                data: {
                    testId: test.id,
                    testTitle: test.title,
                    classLabel: null,
                    expected: null,
                    scanned: responses.filter((r) => r.status === "graded").length,
                    absent: responses.filter((r) => r.status === "absent").length,
                    pending: null,
                    students: [],
                },
            };
        }

        const enrollments = await prisma.enrollment.findMany({
            where: { classId: test.classId, status: "active" },
            select: { rollNumber: true, student: { select: { id: true, name: true } } },
        });

        const students = enrollments
            .map((e) => {
                const r = byStudent.get(e.student.id);
                return {
                    studentId: e.student.id,
                    name: e.student.name,
                    rollNumber: e.rollNumber,
                    state: (r ? (r.status === "absent" ? "absent" : "scanned") : "pending") as
                        "scanned" | "absent" | "pending",
                    percentage: r && r.status === "graded" ? r.percentage : null,
                };
            })
            .sort((a, b) => {
                const na = Number(a.rollNumber), nb = Number(b.rollNumber);
                if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
                return a.rollNumber.localeCompare(b.rollNumber);
            });

        return {
            success: true,
            data: {
                testId: test.id,
                testTitle: test.title,
                classLabel: test.class.section ? `${test.class.name} ${test.class.section}` : test.class.name,
                expected: students.length,
                scanned: students.filter((s) => s.state === "scanned").length,
                absent: students.filter((s) => s.state === "absent").length,
                pending: students.filter((s) => s.state === "pending").length,
                students,
            },
        };
    } catch (error) {
        return fail(error, "Could not load scan progress");
    }
}

export async function markAbsent(testId: string, studentId: string): Promise<RosterResult<null>> {
    try {
        const ctx = await requireOrgContext();
        const test = await ownedTest(testId, ctx.organizationId);

        const existing = await prisma.studentResponse.findUnique({
            where: { testId_studentId: { testId: test.id, studentId } },
            select: { id: true, status: true },
        });

        // Refuse to overwrite a scanned sheet. Marking someone absent after
        // their marks are in would discard real data, and it is far more likely
        // to be a misclick than an intention.
        if (existing && existing.status === "graded") {
            return { success: false, error: "That student's sheet is already scanned. Rescan it to change the result." };
        }

        const totalMarks = await prisma.test.findUnique({
            where: { id: test.id }, select: { totalMarks: true },
        });

        await prisma.studentResponse.upsert({
            where: { testId_studentId: { testId: test.id, studentId } },
            update: { status: "absent" },
            create: {
                testId: test.id,
                studentId,
                status: "absent",
                score: 0,
                totalMarks: totalMarks?.totalMarks ?? 0,
                percentage: 0,
            },
        });

        revalidatePath("/examination/omr");
        return { success: true, data: null };
    } catch (error) {
        return fail(error, "Could not mark the student absent");
    }
}

export async function unmarkAbsent(testId: string, studentId: string): Promise<RosterResult<null>> {
    try {
        const ctx = await requireOrgContext();
        const test = await ownedTest(testId, ctx.organizationId);

        // Only ever removes an absence marker, never a graded response.
        await prisma.studentResponse.deleteMany({
            where: { testId: test.id, studentId, status: "absent" },
        });

        revalidatePath("/examination/omr");
        return { success: true, data: null };
    } catch (error) {
        return fail(error, "Could not undo that");
    }
}
