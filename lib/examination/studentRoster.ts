import prisma from "@/lib/prisma";
import type { Student } from "@/generated/prisma";

/**
 * Resolving a scanned OMR sheet to a roster row.
 *
 * THE BUG THIS EXISTS TO FIX: both OMR paths used to match a student with
 *
 *     findFirst({ where: { name, rollNumber, className } })
 *
 * — identity INCLUDING the name. The name comes from OCR or from a teacher
 * typing it again for every sheet, so "Suraj Kumar", "suraj kumar" and
 * "Suraj  Kumar" produced three different Student rows for one child, each
 * holding a slice of that child's marks. That is the duplicate-generation
 * mechanism docs/WORKOS_MIGRATION_APPROACH.md §2 warns about; it simply hadn't
 * bitten yet at 12 rows.
 *
 * The durable identity is (organizationId, className, rollNumber) — which is
 * exactly what the `@@unique` in the schema declares. The NAME IS AN ATTRIBUTE,
 * not part of identity: when a later scan reads it more accurately, we update
 * the row rather than forking it.
 */

/**
 * Class labels are typed by hand on every sheet. Without this, "10A", "10 A",
 * "10-a" and " 10a " are four different classes holding four different rosters.
 */
export function normalizeClassName(raw: string): string {
    return raw.trim().replace(/[\s\-_]+/g, "").toUpperCase();
}

/**
 * Roll numbers arrive from OCR with padding and stray separators. "007", "7"
 * and " 7 " are the same child; leading zeros are dropped only when the value
 * is entirely numeric, so an alphanumeric roll like "A007" survives intact.
 */
export function normalizeRollNumber(raw: string): string {
    const trimmed = raw.trim().replace(/\s+/g, "");
    return /^\d+$/.test(trimmed) ? String(parseInt(trimmed, 10)) : trimmed.toUpperCase();
}

/** Collapse internal whitespace; keep the teacher's capitalisation. */
export function normalizeStudentName(raw: string): string {
    return raw.trim().replace(/\s+/g, " ");
}

export type ResolveStudentArgs = {
    /** The org that owns this roster. Required — see the tenancy note below. */
    organizationId: string | null;
    name: string;
    className: string;
    rollNumber: string;
    /**
     * The class this test was set for, when the test is linked to one.
     *
     * WHEN PRESENT, IDENTITY RESOLVES THROUGH `Enrollment`, which is the whole
     * point of the roster model: a roll number belongs to a class in a year, not
     * to a person. Matching on the denormalised `Student.className` cache breaks
     * the moment a student is promoted — the cache moves to their new class, so
     * re-scanning an old test would resolve to the wrong record, or fork a new one.
     *
     * WHEN ABSENT (a test with no class linked, which is every pre-existing
     * test), the original string-matching path runs unchanged.
     */
    classId?: string | null;
};

/**
 * Finds the roster row for this (org, class, roll), or creates it.
 *
 * TENANCY: `organizationId` is part of the key. Without it, roll "12" in class
 * "10A" is the same key at every school on the platform — two different
 * children would collapse into one row and their marks would mix across
 * tenants. It is nullable only because the phase-2 backfill hasn't run yet.
 *
 * LEGACY ADOPTION: rows created before org scoping have no organizationId. If
 * we ignored them we would create a second row for a student who already has
 * marks. So an unstamped row matching (class, roll) is ADOPTED — stamped with
 * the caller's org — rather than duplicated. Same "adopt, don't duplicate"
 * seam the user-email matching uses at sign-in.
 */
export async function resolveOrCreateStudent(args: ResolveStudentArgs): Promise<Student> {
    const name = normalizeStudentName(args.name);
    const className = normalizeClassName(args.className);
    const rollNumber = normalizeRollNumber(args.rollNumber);

    if (!className) throw new Error("Class is required.");
    if (!rollNumber) throw new Error("Roll number is required.");
    if (!name) throw new Error("Student name is required.");

    // ---- Enrollment-based resolution (preferred) --------------------------
    if (args.classId) {
        const enrolled = await prisma.enrollment.findFirst({
            where: { classId: args.classId, rollNumber, status: "active" },
            select: { student: true },
        });

        if (enrolled) {
            // The roster is authoritative for who this is. Only correct the name
            // if a clearer read disagrees — never fork the row.
            if (enrolled.student.name !== name) {
                return prisma.student.update({
                    where: { id: enrolled.student.id },
                    data: { name },
                });
            }
            return enrolled.student;
        }

        // This roll is not on the roster. The UI warns before reaching here, so
        // getting this far is the teacher saying "add them anyway". Adopt an
        // existing Student for that (org, class, roll) if one exists — typically
        // someone scanned before the class was created — rather than creating a
        // second row and colliding with the uniqueness constraint.
        let student = await prisma.student.findFirst({
            where: { organizationId: args.organizationId, className, rollNumber },
        });

        if (student) {
            if (student.name !== name) {
                student = await prisma.student.update({ where: { id: student.id }, data: { name } });
            }
        } else {
            student = await prisma.student.create({
                data: { name, className, rollNumber, organizationId: args.organizationId },
            });
        }

        await prisma.enrollment.upsert({
            where: { classId_studentId: { classId: args.classId, studentId: student.id } },
            update: { rollNumber, status: "active" },
            create: { classId: args.classId, studentId: student.id, rollNumber, status: "active" },
        });

        return student;
    }

    // ---- Legacy string-based resolution -----------------------------------
    // Runs for any test with no class linked. Unchanged behaviour.

    // 1. Exact match within this org.
    const existing = await prisma.student.findFirst({
        where: { organizationId: args.organizationId, className, rollNumber },
    });

    if (existing) {
        // Keep the name fresh without forking the row: a later, clearer scan
        // (or a teacher fixing a typo) should correct the roster, not add to it.
        if (existing.name !== name) {
            return prisma.student.update({
                where: { id: existing.id },
                data: { name },
            });
        }
        return existing;
    }

    // 2. Legacy row from before org scoping — adopt it.
    if (args.organizationId) {
        const orphan = await prisma.student.findFirst({
            where: { organizationId: null, className, rollNumber },
        });
        if (orphan) {
            return prisma.student.update({
                where: { id: orphan.id },
                data: { organizationId: args.organizationId, name },
            });
        }
    }

    return prisma.student.create({
        data: { name, className, rollNumber, organizationId: args.organizationId },
    });
}
