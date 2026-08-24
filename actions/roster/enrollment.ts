"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import { normalizeRollNumber, normalizeStudentName } from "@/lib/examination/studentRoster";
import type { RosterEntry, RosterResult } from "./types";

/**
 * Adding and removing students from a class.
 *
 * The important invariant: a `Student` is the durable person. Enrolling creates
 * an `Enrollment`; removing sets its `status`. Neither ever deletes a student,
 * because `StudentResponse` hangs off `Student` and deleting one would take a
 * child's entire mark history with it.
 */

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) return { success: false as const, error: error.message };
    console.error(fallback, error);
    return { success: false as const, error: fallback };
}

/** Confirms the class belongs to the caller's org, and returns what we need from it. */
async function ownedClass(classId: string, organizationId: string) {
    const cls = await prisma.class.findFirst({
        where: { id: classId, organizationId },
        select: { id: true, name: true, section: true },
    });
    if (!cls) throw new AuthError("That class isn't in your organization.", 403);
    return cls;
}

/**
 * Adds a student to a class.
 *
 * Matches an existing `Student` before creating one, so a child who was already
 * scanned via OMR — or enrolled in a previous year — keeps their identity and
 * their marks rather than being duplicated. Match order is admission number
 * first (the school's own permanent id), then name within the org.
 */
export async function addStudentToClass(input: {
    classId: string;
    name: string;
    rollNumber: string;
    admissionNumber?: string | null;
}): Promise<RosterResult<RosterEntry>> {
    try {
        const ctx = await requireOrgContext();
        const cls = await ownedClass(input.classId, ctx.organizationId);

        const name = normalizeStudentName(input.name);
        const rollNumber = normalizeRollNumber(input.rollNumber);
        const admissionNumber = input.admissionNumber?.trim() || null;

        if (!name) return { success: false, error: "Student name is required." };
        if (!rollNumber) return { success: false, error: "Roll number is required." };

        const clash = await prisma.enrollment.findFirst({
            where: { classId: cls.id, rollNumber, status: "active" },
            select: { student: { select: { name: true } } },
        });
        if (clash) {
            return { success: false, error: `Roll ${rollNumber} is already taken by ${clash.student.name}.` };
        }

        let student = admissionNumber
            ? await prisma.student.findFirst({
                  where: { organizationId: ctx.organizationId, admissionNumber },
                  select: { id: true },
              })
            : null;

        if (!student) {
            student = await prisma.student.findFirst({
                where: { organizationId: ctx.organizationId, name },
                select: { id: true },
            });
        }

        if (student) {
            if (admissionNumber) {
                await prisma.student.update({ where: { id: student.id }, data: { admissionNumber } });
            }
        } else {
            student = await prisma.student.create({
                data: {
                    organizationId: ctx.organizationId,
                    name,
                    admissionNumber,
                    // Legacy denormalised columns, still required by the schema
                    // and still written by the OMR path. They are a cache of the
                    // CURRENT enrollment; Enrollment is the source of truth.
                    className: `${cls.name}${cls.section ?? ""}`,
                    rollNumber,
                },
                select: { id: true },
            });
        }

        const already = await prisma.enrollment.findFirst({
            where: { classId: cls.id, studentId: student.id },
            select: { id: true, status: true },
        });

        const enrollment = already
            ? await prisma.enrollment.update({
                  where: { id: already.id },
                  data: { rollNumber, status: "active" },
                  select: { id: true, rollNumber: true, status: true },
              })
            : await prisma.enrollment.create({
                  data: { classId: cls.id, studentId: student.id, rollNumber, status: "active" },
                  select: { id: true, rollNumber: true, status: true },
              });

        revalidatePath(`/classes/${cls.id}`);
        return {
            success: true,
            data: {
                enrollmentId: enrollment.id,
                studentId: student.id,
                name,
                rollNumber: enrollment.rollNumber,
                admissionNumber,
                status: "active",
            },
        };
    } catch (error) {
        return fail(error, "Failed to add the student");
    }
}

export async function updateEnrollment(input: {
    enrollmentId: string;
    name?: string;
    rollNumber?: string;
    admissionNumber?: string | null;
}): Promise<RosterResult<null>> {
    try {
        const ctx = await requireOrgContext();

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: input.enrollmentId },
            select: {
                id: true, classId: true, studentId: true,
                class: { select: { organizationId: true } },
            },
        });
        if (!enrollment || enrollment.class.organizationId !== ctx.organizationId) {
            throw new AuthError("That student isn't in your organization.", 403);
        }

        if (input.rollNumber !== undefined) {
            const rollNumber = normalizeRollNumber(input.rollNumber);
            if (!rollNumber) return { success: false, error: "Roll number is required." };

            const clash = await prisma.enrollment.findFirst({
                where: {
                    classId: enrollment.classId,
                    rollNumber,
                    status: "active",
                    NOT: { id: enrollment.id },
                },
                select: { student: { select: { name: true } } },
            });
            if (clash) {
                return { success: false, error: `Roll ${rollNumber} is already taken by ${clash.student.name}.` };
            }
            await prisma.enrollment.update({ where: { id: enrollment.id }, data: { rollNumber } });
        }

        if (input.name !== undefined || input.admissionNumber !== undefined) {
            const name = input.name !== undefined ? normalizeStudentName(input.name) : undefined;
            if (name !== undefined && !name) return { success: false, error: "Student name is required." };
            await prisma.student.update({
                where: { id: enrollment.studentId },
                data: {
                    ...(name !== undefined ? { name } : {}),
                    ...(input.admissionNumber !== undefined
                        ? { admissionNumber: input.admissionNumber?.trim() || null }
                        : {}),
                },
            });
        }

        revalidatePath(`/classes/${enrollment.classId}`);
        return { success: true, data: null };
    } catch (error) {
        return fail(error, "Failed to update the student");
    }
}

/**
 * Removes a student from a class.
 *
 * Sets `status` rather than deleting: the enrollment is what explains which
 * class a mark was earned in, so deleting it would orphan their results.
 */
export async function removeFromClass(
    enrollmentId: string,
    status: "left" | "transferred" = "left"
): Promise<RosterResult<null>> {
    try {
        const ctx = await requireOrgContext();

        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: { id: true, classId: true, class: { select: { organizationId: true } } },
        });
        if (!enrollment || enrollment.class.organizationId !== ctx.organizationId) {
            throw new AuthError("That student isn't in your organization.", 403);
        }

        await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status } });

        revalidatePath(`/classes/${enrollment.classId}`);
        return { success: true, data: null };
    } catch (error) {
        return fail(error, "Failed to remove the student");
    }
}
