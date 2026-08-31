/**
 * WorkOS migration — diagnostic (READ ONLY).
 *
 *   npx tsx scripts/workos/diagnose-backfill.ts
 *
 * The phase-2 dry run reported 0 rows to stamp for every collection. There are
 * exactly two explanations and they need very different responses:
 *
 *   (a) the collections really are empty  -> nothing to back-fill, all good
 *   (b) `where: { organizationId: null }` is not matching documents that LACK
 *       the field -> the backfill would silently do nothing and report success
 *
 * This compares three numbers per collection:
 *
 *   total        - every document
 *   prismaNull   - what the backfill's filter actually matches
 *   rawMissing   - documents where the field is genuinely absent, counted with
 *                  a raw MongoDB query that bypasses Prisma entirely
 *
 * If total > 0 and prismaNull === 0 while rawMissing > 0, we have case (b).
 * Writes nothing. Safe against production.
 */

import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

// Prisma model delegate -> MongoDB collection name. The collection names are
// the Prisma model names unless @@map says otherwise, which it doesn't here.
const TARGETS = [
    { label: "User", collection: "User", delegate: () => prisma.user, field: "workosUserId" },
    { label: "Folder", collection: "Folder", delegate: () => prisma.folder, field: "organizationId" },
    { label: "Test", collection: "Test", delegate: () => prisma.test, field: "organizationId" },
    { label: "PaperHistory", collection: "PaperHistory", delegate: () => prisma.paperHistory, field: "organizationId" },
    { label: "TemplateForm", collection: "TemplateForm", delegate: () => prisma.templateForm, field: "organizationId" },
    { label: "Student", collection: "Student", delegate: () => prisma.student, field: "organizationId" },
    { label: "Question", collection: "Question", delegate: () => prisma.question, field: "organizationId" },
    { label: "SchoolTestQuestion", collection: "SchoolTestQuestion", delegate: () => prisma.schoolTestQuestion, field: "organizationId" },
    { label: "TestQuestion", collection: "TestQuestion", delegate: () => prisma.testQuestion, field: null },
    { label: "StudentResponse", collection: "StudentResponse", delegate: () => prisma.studentResponse, field: null },
    { label: "FolderQuestion", collection: "FolderQuestion", delegate: () => prisma.folderQuestion, field: null },
];

async function rawCount(collection: string, filter: Record<string, unknown>): Promise<number> {
    // `$runCommandRaw` is typed as accepting Prisma.InputJsonObject, whose index
    // signature is narrower than Record<string, unknown>. The cast is the
    // documented way to pass a plain Mongo query document through it.
    const res = (await prisma.$runCommandRaw({
        count: collection,
        query: filter as Prisma.InputJsonObject,
    })) as { n?: number };
    return res.n ?? 0;
}

async function main() {
    console.log("Collection            total   prismaNull   rawMissing   rawNull");
    console.log("-".repeat(70));

    let suspicious = false;

    for (const t of TARGETS) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delegate = t.delegate() as any;

        const total = await delegate.count();

        let prismaNull = "-";
        let rawMissing = "-";
        let rawNull = "-";

        if (t.field) {
            const p = await delegate.count({ where: { [t.field]: null } });
            prismaNull = String(p);

            // $exists:false -> the key is absent from the document entirely.
            // This is the state every pre-existing row is in right after
            // `db push` adds a new optional field.
            const missing = await rawCount(t.collection, { [t.field]: { $exists: false } });
            rawMissing = String(missing);

            // Key present and explicitly null.
            const nulls = await rawCount(t.collection, { [t.field]: { $type: "null" } });
            rawNull = String(nulls);

            if (total > 0 && p === 0 && missing > 0) suspicious = true;
        }

        console.log(
            t.label.padEnd(20) +
            String(total).padStart(6) +
            prismaNull.padStart(13) +
            rawMissing.padStart(13) +
            rawNull.padStart(10)
        );
    }

    console.log("\n" + "=".repeat(70));

    if (suspicious) {
        console.log("CASE (b): the backfill filter is NOT matching documents that lack the");
        console.log("field. DO NOT run backfill-orgs.ts --commit — it would report success");
        console.log("while stamping nothing. The filter needs to be $exists-based instead.");
    } else {
        const anyData = true;
        console.log("CASE (a): the filter behaves correctly.");
        console.log("Where total is 0, those collections are genuinely empty and there is");
        console.log("simply nothing to back-fill.");
        void anyData;
    }

    // Extra context: are folders/tests actually reachable at all? If the app has
    // real usage, at least one of these should be non-zero.
    const users = await prisma.user.count();
    const withRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
    console.log(`\nUsers: ${users}`);
    console.log("By role: " + withRole.map((r) => `${r.role || "(empty)"}=${r._count._all}`).join(", "));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
