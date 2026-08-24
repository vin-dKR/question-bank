/**
 * WorkOS migration — investigate the two odd results from the phase-2 dry run.
 * READ ONLY.
 *
 *   npx tsx scripts/workos/inspect-oddities.ts
 *
 *   1. TemplateForm: all 38 rows reported "orphaned (author missing)".
 *      38/38 is not a data problem, it's a key-shape problem. TemplateForm.userId
 *      is declared `String` — NOT `@db.ObjectId` like every other userId in the
 *      schema — so it may be holding Clerk ids rather than local User ids.
 *
 *   2. Student: 5 of 12 have marks in two different orgs. With personal orgs,
 *      that just means two teachers tested the same class. This prints who, so
 *      the right owner can be chosen deliberately.
 */

import prisma from "@/lib/prisma";

async function main() {
    // ---------------------------------------------------------------- 1 ----
    console.log("=".repeat(72));
    console.log("1. TemplateForm.userId — what shape are these values?");
    console.log("=".repeat(72));

    const templates = await prisma.templateForm.findMany({
        select: { id: true, userId: true, templateName: true },
    });

    const users = await prisma.user.findMany({
        select: { id: true, clerkUserId: true, email: true },
    });
    const byLocalId = new Set(users.map((u) => u.id));
    const byClerkId = new Map(users.map((u) => [u.clerkUserId, u]));

    let matchesLocal = 0;
    let matchesClerk = 0;
    let matchesNothing = 0;
    const samples: string[] = [];

    for (const t of templates) {
        if (byLocalId.has(t.userId)) matchesLocal++;
        else if (byClerkId.has(t.userId)) matchesClerk++;
        else {
            matchesNothing++;
            if (samples.length < 5) samples.push(`${t.userId}  (${t.templateName})`);
        }
    }

    console.log(`  total rows:                  ${templates.length}`);
    console.log(`  userId matches User.id:      ${matchesLocal}`);
    console.log(`  userId matches clerkUserId:  ${matchesClerk}   <-- if this is high, that's the bug`);
    console.log(`  matches neither:             ${matchesNothing}`);

    if (samples.length) {
        console.log("\n  unmatched samples:");
        samples.forEach((s) => console.log(`    ${s}`));
    }

    const shapes = new Map<string, number>();
    for (const t of templates) {
        const shape = /^[0-9a-f]{24}$/i.test(t.userId)
            ? "24-hex (ObjectId)"
            : t.userId.startsWith("user_")
                ? "user_… (Clerk)"
                : `other (len ${t.userId.length})`;
        shapes.set(shape, (shapes.get(shape) ?? 0) + 1);
    }
    console.log("\n  value shapes:");
    for (const [k, v] of shapes) console.log(`    ${k}: ${v}`);

    // ---------------------------------------------------------------- 2 ----
    console.log("\n" + "=".repeat(72));
    console.log("2. Students with marks spanning more than one teacher");
    console.log("=".repeat(72));

    const students = await prisma.student.findMany({
        select: {
            id: true,
            name: true,
            className: true,
            rollNumber: true,
            responses: {
                select: {
                    submittedAt: true,
                    test: {
                        select: {
                            id: true,
                            title: true,
                            createdBy: true,
                            creator: { select: { email: true, name: true } },
                        },
                    },
                },
            },
        },
    });

    for (const s of students) {
        const byTeacher = new Map<string, { email: string; name: string | null; count: number; latest: Date }>();
        for (const r of s.responses) {
            const key = r.test.createdBy;
            const cur = byTeacher.get(key);
            if (cur) {
                cur.count++;
                if (r.submittedAt > cur.latest) cur.latest = r.submittedAt;
            } else {
                byTeacher.set(key, {
                    email: r.test.creator.email,
                    name: r.test.creator.name,
                    count: 1,
                    latest: r.submittedAt,
                });
            }
        }

        if (byTeacher.size <= 1) continue;

        console.log(`\n  ${s.className} / ${s.rollNumber} — "${s.name}"  (${s.responses.length} response(s))`);
        const ranked = [...byTeacher.entries()].sort((a, b) => b[1].count - a[1].count);
        for (const [, t] of ranked) {
            console.log(
                `    ${String(t.count).padStart(2)} response(s)  ${t.email}${t.name ? ` (${t.name})` : ""}` +
                `  latest ${t.latest.toISOString().slice(0, 10)}`
            );
        }
        console.log(`    -> majority owner would be: ${ranked[0][1].email}`);
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
