"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { AuthError, requireOrgContext } from "@/lib/auth/session";
import { normalizeRollNumber, normalizeStudentName } from "@/lib/examination/studentRoster";
import type { ImportRow, ImportPreview, ImportResult, RosterResult } from "./types";

/**
 * Bulk roster import.
 *
 * Two-phase on purpose: `previewRosterImport` validates and reports without
 * writing, and `commitRosterImport` applies. A teacher pasting in 200 children
 * should see what will happen before it happens — and a half-applied import of
 * 200 rows is materially worse than one that refused to start.
 *
 * Matching mirrors addStudentToClass: admission number first (the school's own
 * permanent id), then name within the org. So importing a class that was
 * previously scanned via OMR — or enrolled last year — reuses those students
 * and keeps their marks, rather than creating duplicates alongside them.
 */

function fail(error: unknown, fallback: string) {
    if (error instanceof AuthError) return { success: false as const, error: error.message };
    console.error(fallback, error);
    return { success: false as const, error: fallback };
}

async function ownedClass(classId: string, organizationId: string) {
    const cls = await prisma.class.findFirst({
        where: { id: classId, organizationId },
        select: { id: true, name: true, section: true },
    });
    if (!cls) throw new AuthError("That class isn't in your organization.", 403);
    return cls;
}

/** Normalises and validates rows without touching the database. */
async function analyse(classId: string, organizationId: string, rows: ImportRow[]) {
    const existing = await prisma.enrollment.findMany({
        where: { classId, status: "active" },
        select: { rollNumber: true, student: { select: { id: true, name: true, admissionNumber: true } } },
    });
    const byRoll = new Map(existing.map((e) => [normalizeRollNumber(e.rollNumber), e.student]));

    const seenRolls = new Map<string, number>();
    const analysed = rows.map((raw, index) => {
        const name = normalizeStudentName(raw.name ?? "");
        const rollNumber = normalizeRollNumber(raw.rollNumber ?? "");
        const admissionNumber = raw.admissionNumber?.trim() || null;

        let status: ImportPreview["rows"][number]["status"] = "create";
        let note = "";

        if (!name) { status = "skip"; note = "No name"; }
        else if (!rollNumber) { status = "skip"; note = "No roll number"; }
        else if (seenRolls.has(rollNumber)) {
            status = "skip";
            note = `Duplicate of row ${(seenRolls.get(rollNumber) ?? 0) + 1} in this file`;
        } else {
            seenRolls.set(rollNumber, index);
            const already = byRoll.get(rollNumber);
            if (already) {
                status = "update";
                note = already.name === name ? "Already on the roster" : `Renames "${already.name}"`;
            }
        }

        return { index, name, rollNumber, admissionNumber, status, note };
    });

    return analysed;
}

export async function previewRosterImport(
    classId: string,
    rows: ImportRow[]
): Promise<RosterResult<ImportPreview>> {
    try {
        const ctx = await requireOrgContext();
        const cls = await ownedClass(classId, ctx.organizationId);
        if (!Array.isArray(rows) || rows.length === 0) {
            return { success: false, error: "That file has no rows." };
        }
        if (rows.length > 1000) {
            return { success: false, error: "That's more than 1,000 rows. Split the file and import in parts." };
        }

        const analysed = await analyse(classId, ctx.organizationId, rows);
        return {
            success: true,
            data: {
                classLabel: cls.section ? `${cls.name} ${cls.section}` : cls.name,
                rows: analysed,
                counts: {
                    create: analysed.filter((r) => r.status === "create").length,
                    update: analysed.filter((r) => r.status === "update").length,
                    skip: analysed.filter((r) => r.status === "skip").length,
                },
            },
        };
    } catch (error) {
        return fail(error, "Could not read that file");
    }
}

export async function commitRosterImport(
    classId: string,
    rows: ImportRow[]
): Promise<RosterResult<ImportResult>> {
    try {
        const ctx = await requireOrgContext();
        const cls = await ownedClass(classId, ctx.organizationId);
        const analysed = await analyse(classId, ctx.organizationId, rows);

        let created = 0, updated = 0, skipped = 0;
        const failures: { row: number; name: string; reason: string }[] = [];

        // Applied row by row rather than in one transaction: a 200-row import
        // that fails at row 190 should keep the 189 that worked and tell you
        // which one broke, not silently discard the lot. Every row is
        // idempotent, so re-running the same file changes nothing.
        for (const row of analysed) {
            if (row.status === "skip") { skipped++; continue; }

            try {
                let student = row.admissionNumber
                    ? await prisma.student.findFirst({
                          where: { organizationId: ctx.organizationId, admissionNumber: row.admissionNumber },
                          select: { id: true },
                      })
                    : null;

                if (!student) {
                    student = await prisma.student.findFirst({
                        where: { organizationId: ctx.organizationId, name: row.name },
                        select: { id: true },
                    });
                }

                if (student) {
                    await prisma.student.update({
                        where: { id: student.id },
                        data: {
                            name: row.name,
                            ...(row.admissionNumber ? { admissionNumber: row.admissionNumber } : {}),
                        },
                    });
                } else {
                    student = await prisma.student.create({
                        data: {
                            organizationId: ctx.organizationId,
                            name: row.name,
                            admissionNumber: row.admissionNumber,
                            // Legacy denormalised cache of the current enrollment.
                            // Enrollment is the source of truth; these columns go
                            // once analytics move off them (T-10 remainder).
                            className: `${cls.name}${cls.section ?? ""}`,
                            rollNumber: row.rollNumber,
                        },
                        select: { id: true },
                    });
                }

                await prisma.enrollment.upsert({
                    where: { classId_studentId: { classId: cls.id, studentId: student.id } },
                    update: { rollNumber: row.rollNumber, status: "active" },
                    create: { classId: cls.id, studentId: student.id, rollNumber: row.rollNumber, status: "active" },
                });

                if (row.status === "update") updated++; else created++;
            } catch (err) {
                failures.push({
                    row: row.index + 1,
                    name: row.name,
                    reason: err instanceof Error ? err.message : "Unknown error",
                });
            }
        }

        revalidatePath(`/classes/${cls.id}`);
        return { success: true, data: { created, updated, skipped, failures } };
    } catch (error) {
        return fail(error, "Import failed");
    }
}
