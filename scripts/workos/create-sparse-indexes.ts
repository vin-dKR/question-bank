/**
 * OPTIONAL. Adds a DB-level uniqueness guarantee for User.workosUserId.
 *
 *   npx tsx scripts/workos/create-sparse-indexes.ts          # report only
 *   npx tsx scripts/workos/create-sparse-indexes.ts --commit
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * `User.workosUserId` is intentionally NOT `@unique` in the Prisma schema. On
 * MongoDB, Prisma creates optional unique fields as a plain `{ unique: true }`
 * index with no `sparse` flag. MongoDB indexes a *missing* field as null, and a
 * unique index permits only ONE document with a null value — so `prisma db push`
 * would fail immediately, because every existing user lacks the field.
 *
 * That is prisma/prisma#23870, closed as not planned. It is not a bug that will
 * be fixed in a later version.
 *
 * A partial index expresses what we actually want: unique across documents where
 * workosUserId is a string, and no constraint at all on documents where it is
 * missing or null.
 *
 * ---------------------------------------------------------------------------
 * WARNING — READ BEFORE RUNNING
 *
 * `prisma db push` manages indexes and can DROP indexes it does not know about.
 * This index is invisible to Prisma, so:
 *
 *   - run this AFTER `db push`, not before
 *   - re-run it after every subsequent `db push`
 *   - verify with: db.User.getIndexes()
 *
 * If that upkeep isn't worth it, skip this script entirely. Uniqueness is
 * already guaranteed in practice by WorkOS (its user ids are unique by
 * construction) and by upserting on the field in our provisioning code. This is
 * belt-and-braces, not load-bearing.
 */

import prisma from "@/lib/prisma";

const COMMIT = process.argv.includes("--commit");

const INDEX_NAME = "workosUserId_unique_partial";

async function main() {
    // A partial index rather than a sparse one. Sparse skips documents where the
    // field is ABSENT, but an explicit `null` is still a value and still gets
    // indexed — so two documents with workosUserId: null would collide under a
    // sparse unique index. `$type: "string"` excludes both cases.
    const spec = {
        key: { workosUserId: 1 },
        name: INDEX_NAME,
        unique: true,
        partialFilterExpression: { workosUserId: { $type: "string" } },
    };

    // Check for pre-existing duplicates first: index creation fails loudly on a
    // populated collection, and the error message is not especially helpful.
    const dupes = await prisma.user.groupBy({
        by: ["workosUserId"],
        where: { workosUserId: { not: null } },
        _count: { _all: true },
        having: { workosUserId: { _count: { gt: 1 } } },
    });

    if (dupes.length) {
        console.error(`Refusing to build the index — ${dupes.length} duplicate workosUserId value(s):`);
        for (const d of dupes) console.error(`  ${d.workosUserId} x${d._count._all}`);
        console.error("\nResolve these first. Duplicates here mean the user import ran twice.");
        process.exit(1);
    }

    const existing = (await prisma.$runCommandRaw({ listIndexes: "User" })) as {
        cursor?: { firstBatch?: { name: string }[] };
    };
    const names = existing.cursor?.firstBatch?.map((i) => i.name) ?? [];
    console.log("Existing User indexes:", names.join(", ") || "(none)");

    if (names.includes(INDEX_NAME)) {
        console.log(`\n${INDEX_NAME} already present — nothing to do.`);
        return;
    }

    if (!COMMIT) {
        console.log("\n[dry-run] Would create:");
        console.log(JSON.stringify(spec, null, 2));
        console.log("\nRe-run with --commit to apply.");
        return;
    }

    await prisma.$runCommandRaw({ createIndexes: "User", indexes: [spec] });
    console.log(`\nCreated ${INDEX_NAME}.`);
    console.log("Remember: re-run this after any future `prisma db push`.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
