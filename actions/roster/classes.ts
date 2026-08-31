"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import { normalizeClassName, normalizeRollNumber, normalizeStudentName } from "@/lib/examination/studentRoster";
import type { ClassDetail, ClassSummary, RosterResult, YearSummary } from "./types";

/**
 * Class and roster management.
 *
 * The model this sits on (see docs/roster-problem.html): `Student` is the
 * durable person and never changes class. `Enrollment` records "this student,
 * in this class, in this year, at this roll number". Promotion writes a new
 * enrollment and never touches the student or their marks — which is why
 * removing someone from a class sets `status` rather than deleting the row.
 *
 * Every function is org-scoped through `requireOrgContext()`. Server actions are
 * public HTTP endpoints, so none of them trust an id from the browser without
 * confirming it belongs to the caller's organization first.
 */

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) return { success: false as const, error: error.message };
    console.error(fallback, error);
    return { success: false as const, error: fallback };
}

function classLabel(name: string, section: string | null): string {
    return section ? `${name} ${section}` : name;
}

/**
 * The org's current academic year, created on first use.
 *
 * A school shouldn't have to configure a year before it can make a class, so
 * this derives a sensible Indian session label (April–March) and marks it
 * current. They can rename it later.
 */
async function ensureCurrentYear(organizationId: string): Promise<{ id: string; name: string }> {
    const existing = await prisma.academicYear.findFirst({
        where: { organizationId, isCurrent: true },
        select: { id: true, name: true },
    });
    if (existing) return existing;

    // Indian academic sessions run April–March, so before April we are still in
    // the session that started the previous calendar year.
    const now = new Date();
    const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const name = `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

    return prisma.academicYear.upsert({
        where: { organizationId_name: { organizationId, name } },
        update: { isCurrent: true },
        create: { organizationId, name, isCurrent: true },
        select: { id: true, name: true },
    });
}

export async function listYears(): Promise<RosterResult<YearSummary[]>> {
    try {
        const ctx = await requireOrgContext();
        await ensureCurrentYear(ctx.organizationId);

        const years = await prisma.academicYear.findMany({
            where: { organizationId: ctx.organizationId },
            orderBy: { name: "desc" },
            select: { id: true, name: true, isCurrent: true, _count: { select: { classes: true } } },
        });

        return {
            success: true,
            data: years.map((y) => ({
                id: y.id,
                name: y.name,
                isCurrent: y.isCurrent,
                classCount: y._count.classes,
            })),
        };
    } catch (error) {
        return fail(error, "Failed to load academic years");
    }
}

/** Classes for a year, defaulting to the current one. */
export async function listClasses(academicYearId?: string): Promise<RosterResult<ClassSummary[]>> {
    try {
        const ctx = await requireOrgContext();
        const year = academicYearId
            ? await prisma.academicYear.findFirst({
                  where: { id: academicYearId, organizationId: ctx.organizationId },
                  select: { id: true, name: true },
              })
            : await ensureCurrentYear(ctx.organizationId);

        if (!year) throw new AuthError("That academic year isn't in your organization.", 403);

        const classes = await prisma.class.findMany({
            where: { organizationId: ctx.organizationId, academicYearId: year.id },
            orderBy: [{ name: "asc" }, { section: "asc" }],
            select: {
                id: true, name: true, section: true, academicYearId: true,
                _count: { select: { enrollments: true } },
            },
        });

        return {
            success: true,
            data: classes.map((c) => ({
                id: c.id,
                name: c.name,
                section: c.section,
                label: classLabel(c.name, c.section),
                academicYearId: c.academicYearId,
                academicYearName: year.name,
                studentCount: c._count.enrollments,
            })),
        };
    } catch (error) {
        return fail(error, "Failed to load classes");
    }
}

export async function createClass(input: {
    name: string;
    section?: string | null;
    academicYearId?: string;
}): Promise<RosterResult<ClassSummary>> {
    try {
        const ctx = await requireOrgContext();

        // Normalized so "10 A" and "10a" can't become two different classes —
        // the same collapse the OMR scanner applies to whatever a teacher types
        // on a sheet.
        const name = normalizeClassName(input.name);
        const section = input.section?.trim() ? normalizeClassName(input.section) : null;
        if (!name) return { success: false, error: "Class name is required." };

        const year = input.academicYearId
            ? await prisma.academicYear.findFirst({
                  where: { id: input.academicYearId, organizationId: ctx.organizationId },
                  select: { id: true, name: true },
              })
            : await ensureCurrentYear(ctx.organizationId);
        if (!year) throw new AuthError("That academic year isn't in your organization.", 403);

        const existing = await prisma.class.findFirst({
            where: { organizationId: ctx.organizationId, academicYearId: year.id, name, section },
            select: { id: true },
        });
        if (existing) {
            return { success: false, error: `${classLabel(name, section)} already exists for ${year.name}.` };
        }

        const created = await prisma.class.create({
            data: { organizationId: ctx.organizationId, academicYearId: year.id, name, section },
            select: { id: true, name: true, section: true, academicYearId: true },
        });

        revalidatePath("/classes");
        return {
            success: true,
            data: {
                ...created,
                label: classLabel(created.name, created.section),
                academicYearName: year.name,
                studentCount: 0,
            },
        };
    } catch (error) {
        return fail(error, "Failed to create the class");
    }
}

export async function getClass(classId: string): Promise<RosterResult<ClassDetail>> {
    try {
        const ctx = await requireOrgContext();

        const cls = await prisma.class.findFirst({
            where: { id: classId, organizationId: ctx.organizationId },
            select: {
                id: true, name: true, section: true, academicYearId: true,
                academicYear: { select: { name: true } },
                enrollments: {
                    where: { status: "active" },
                    select: {
                        id: true, rollNumber: true, status: true,
                        student: { select: { id: true, name: true, admissionNumber: true } },
                    },
                },
            },
        });
        if (!cls) throw new AuthError("That class isn't in your organization.", 403);

        // Roll numbers are strings (they can be alphanumeric), so sort them
        // numerically when they look numeric — otherwise "10" sorts before "2".
        const roster = cls.enrollments
            .map((e) => ({
                enrollmentId: e.id,
                studentId: e.student.id,
                name: e.student.name,
                rollNumber: e.rollNumber,
                admissionNumber: e.student.admissionNumber,
                status: e.status as ClassDetail["roster"][number]["status"],
            }))
            .sort((a, b) => {
                const na = Number(a.rollNumber), nb = Number(b.rollNumber);
                if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
                return a.rollNumber.localeCompare(b.rollNumber);
            });

        return {
            success: true,
            data: {
                id: cls.id,
                name: cls.name,
                section: cls.section,
                label: classLabel(cls.name, cls.section),
                academicYearId: cls.academicYearId,
                academicYearName: cls.academicYear.name,
                studentCount: roster.length,
                roster,
            },
        };
    } catch (error) {
        return fail(error, "Failed to load the class");
    }
}
