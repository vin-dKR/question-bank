/**
 * Org-scoping pre-flight — READ ONLY.
 *
 *   npx tsx scripts/workos/verify-org-scoping.ts
 *
 * Run this BEFORE deploying the org-scoped reads (T-25, T-30). Writes nothing.
 *
 * WHY IT EXISTS. Three separate changes now filter on `organizationId`, and they
 * all fail the same silent way: a row the phase-2 backfill missed is invisible
 * to the person who owns it. Nothing errors, nothing logs — a teacher's folders
 * simply aren't there any more. That is the single most expensive way this work
 * can go wrong, and it is entirely preventable by counting first.
 *
 * The count that matters is the one Prisma cannot express. On MongoDB a field
 * that is ABSENT is not the same as a field that is NULL, and Prisma's
 * `where: { organizationId: null }` matches only the second (doc §11a). So the
 * absent rows are counted with a raw command that bypasses Prisma entirely.
 *
 * WHAT EACH COLLECTION SHOULD LOOK LIKE
 *
 *   Question            absent = 0. `null` is the SHARED BANK and is expected
 *                       to be almost every row — that is the product rule
 *                       (doc §13), not a gap. Absent rows are the problem:
 *                       they belong to the shared bank but no filter can see
 *                       them, so they have vanished for everyone.
 *
 *   Folder, Test,       absent = 0 AND null = 0. Every row must name an org.
 *   PaperHistory,       Anything else is invisible to its owner.
 *   TemplateForm,
 *   SchoolTestQuestion
 *
 *   Student             absent/null are tolerated: T-02 deliberately left five
 *                       students unstamped because they hold marks in two orgs.
 *                       Listed for completeness, not as a failure.
 */

import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

type Expectation = "org-required" | "shared-bank" | "known-gaps";

const TARGETS: {
    label: string;
    collection: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delegate: () => any;
    expect: Expectation;
}[] = [
    { label: "Question", collection: "Question", delegate: () => prisma.question, expect: "shared-bank" },
    { label: "Folder", collection: "Folder", delegate: () => prisma.folder, expect: "org-required" },
    { label: "Test", collection: "Test", delegate: () => prisma.test, expect: "org-required" },
    { label: "PaperHistory", collection: "PaperHistory", delegate: () => prisma.paperHistory, expect: "org-required" },
    { label: "TemplateForm", collection: "TemplateForm", delegate: () => prisma.templateForm, expect: "org-required" },
    { label: "SchoolTestQuestion", collection: "SchoolTestQuestion", delegate: () => prisma.schoolTestQuestion, expect: "org-required" },
    { label: "Student", collection: "Student", delegate: () => prisma.student, expect: "known-gaps" },
];

async function rawCount(collection: string, filter: Record<string, unknown>): Promise<number> {
    // `$runCommandRaw` is typed as Prisma.InputJsonObject, whose index signature
    // is narrower than Record<string, unknown>. The cast is the documented way
    // to pass a plain Mongo query document through it.
    const res = (await prisma.$runCommandRaw({
        count: collection,
        query: filter as Prisma.InputJsonObject,
    })) as { n?: number };
    return res.n ?? 0;
}

function pad(v: string | number, w: number) {
    return String(v).padStart(w);
}

async function main() {
    console.log("\nOrg-scoping pre-flight (read only)\n");
    console.log("Collection             total    absent      null     orgs");
    console.log("-".repeat(60));

    const problems: string[] = [];

    for (const t of TARGETS) {
        const delegate = t.delegate();

        const total = await delegate.count();
        const absent = await rawCount(t.collection, { organizationId: { $exists: false } });
        const explicitNull = await rawCount(t.collection, {
            organizationId: { $exists: true, $eq: null },
        });
        const stamped = total - absent - explicitNull;

        console.log(
            `${t.label.padEnd(20)} ${pad(total, 6)} ${pad(absent, 9)} ${pad(explicitNull, 9)} ${pad(stamped, 8)}`
        );

        if (absent > 0) {
            problems.push(
                `${t.label}: ${absent} row(s) have NO organizationId field at all. ` +
                    `These are invisible to every scoped read — including to whoever owns them. ` +
                    `Re-run scripts/workos/backfill-orgs.ts before deploying.`
            );
        }

        if (t.expect === "org-required" && explicitNull > 0) {
            problems.push(
                `${t.label}: ${explicitNull} row(s) have an explicitly null organizationId. ` +
                    `This collection has no shared tier, so those rows belong to nobody and ` +
                    `will not appear for any user.`
            );
        }
    }

    // The shared bank is the headline number: if it is zero, every teacher opens
    // the question bank to an empty screen.
    const sharedBank = await rawCount("Question", {
        organizationId: { $exists: true, $eq: null },
    });
    console.log("\n" + "-".repeat(60));
    console.log(`Shared question bank readable after the change: ${sharedBank}`);
    if (sharedBank === 0) {
        problems.push(
            "The shared question bank is EMPTY as far as the new filter is concerned. " +
                "Do not deploy: every teacher would open the question bank to nothing."
        );
    }

    // Orgs with more than one member are where org-scoping actually changes what
    // people see — worth knowing before, not after.
    const shared = await prisma.organization.findMany({
        select: { name: true, type: true, _count: { select: { memberships: true } } },
    });
    const multi = shared.filter((o) => o._count.memberships > 1);
    console.log(
        `\nOrganizations: ${shared.length} total, ${multi.length} with more than one member.`
    );
    if (multi.length > 0) {
        console.log(
            "In these, colleagues will now see each other's papers, templates and tests\n" +
                "(drafts stay author-private). Expected — but tell them before they notice:"
        );
        for (const o of multi) {
            console.log(`  - ${o.name} (${o.type}): ${o._count.memberships} members`);
        }
    }

    console.log("");
    if (problems.length === 0) {
        console.log("PASS — nothing blocking. Deploy.");
    } else {
        console.log(`FAIL — ${problems.length} problem(s):\n`);
        for (const p of problems) console.log(`  ! ${p}\n`);
        process.exitCode = 1;
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
