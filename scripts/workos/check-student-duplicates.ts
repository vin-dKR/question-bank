/**
 * WorkOS migration — pre-flight check (READ ONLY).
 *
 *   npx tsx scripts/workos/check-student-duplicates.ts
 *
 * Run this BEFORE enabling the @@unique([organizationId, className, rollNumber])
 * constraint on Student. Repeated OMR uploads of the same answer sheet almost
 * certainly created duplicate roster rows; turning the index on with duplicates
 * present will make `prisma db push` fail, and merging them afterwards is worse
 * than merging them now.
 *
 * Writes nothing. Safe to run against production.
 */

import prisma from "@/lib/prisma";

type Dup = {
    key: string;
    className: string;
    rollNumber: string;
    students: { id: string; name: string; responseCount: number; createdAt: Date }[];
};

async function main() {
    console.log("Scanning Student roster…\n");

    const students = await prisma.student.findMany({
        select: {
            id: true,
            name: true,
            rollNumber: true,
            className: true,
            createdAt: true,
            _count: { select: { responses: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    console.log(`Total Student rows: ${students.length}`);

    // --- 1. Duplicates on (className, rollNumber) --------------------------
    // Note: no organizationId in the key yet — it isn't backfilled at this
    // point. That makes this check STRICTER than the eventual constraint, which
    // is what we want: it also surfaces same-roll collisions across schools that
    // will resolve themselves once orgs land.
    const byKey = new Map<string, typeof students>();
    for (const s of students) {
        const key = `${s.className.trim().toLowerCase()}::${s.rollNumber.trim().toLowerCase()}`;
        const list = byKey.get(key) ?? [];
        list.push(s);
        byKey.set(key, list);
    }

    const dups: Dup[] = [];
    for (const [key, list] of byKey) {
        if (list.length > 1) {
            dups.push({
                key,
                className: list[0].className,
                rollNumber: list[0].rollNumber,
                students: list.map((s) => ({
                    id: s.id,
                    name: s.name,
                    responseCount: s._count.responses,
                    createdAt: s.createdAt,
                })),
            });
        }
    }

    console.log(`Duplicate (class, roll) keys: ${dups.length}`);
    console.log(
        `Student rows involved in a duplicate: ${dups.reduce((n, d) => n + d.students.length, 0)}\n`
    );

    if (dups.length) {
        console.log("--- DUPLICATES ---");
        for (const d of dups.slice(0, 50)) {
            console.log(`\n  ${d.className} / roll ${d.rollNumber}`);
            for (const s of d.students) {
                console.log(
                    `    ${s.id}  ${s.responseCount} response(s)  "${s.name}"  ${s.createdAt.toISOString().slice(0, 10)}`
                );
            }
            // The interesting/ugly case: marks split across two rows for one
            // human. A merge has to reassign StudentResponse rows, and if BOTH
            // rows have a response for the SAME testId the (testId, studentId)
            // unique index will reject the move — a human has to pick a winner.
            const withResponses = d.students.filter((s) => s.responseCount > 0);
            if (withResponses.length > 1) {
                console.log(`    ^^ NEEDS MANUAL REVIEW: marks exist on ${withResponses.length} rows`);
            }
        }
        if (dups.length > 50) console.log(`\n  …and ${dups.length - 50} more`);
    }

    // --- 2. Name spelling variance within a class --------------------------
    // Same roll number is the reliable key; differing names on the same roll
    // usually means an OCR misread on the OMR sheet rather than two people.
    const nameVariance = dups.filter(
        (d) => new Set(d.students.map((s) => s.name.trim().toLowerCase())).size > 1
    );
    console.log(`\nDuplicate keys where the NAME also differs: ${nameVariance.length}`);
    console.log("  (likely OCR misreads — worth eyeballing before merging)");

    // --- 3. Orphans: roster rows with no marks at all ----------------------
    const orphans = students.filter((s) => s._count.responses === 0);
    console.log(`\nStudent rows with zero responses: ${orphans.length}`);
    console.log("  (safe to delete, or to merge away without touching marks)");

    // --- 4. Students whose org cannot be inferred --------------------------
    // The backfill derives Student.organizationId from the tests they answered.
    // A student with no responses has no signal, and will be left null.
    console.log(`\nStudents whose organizationId CANNOT be inferred: ${orphans.length}`);
    if (orphans.length) {
        console.log("  These need a manual org assignment, or deletion, before");
        console.log("  organizationId can be made required in phase 5.");
    }

    console.log("\nDone. Nothing was modified.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
