/**
 * Recover deleted Question rows from the replica-set oplog.
 *
 *   npx tsx scripts/restore-questions-from-oplog.ts            # dry run
 *   npx tsx scripts/restore-questions-from-oplog.ts --commit   # writes
 *
 * WHY THIS WORKS, AND WHEN IT DOESN'T. An oplog delete entry carries only the
 * `_id` — the document itself is not in it — so a delete alone is unrecoverable.
 * What makes recovery possible is the INSERT entry, which carries the whole
 * document. Both have to still be inside the capped oplog's window.
 *
 * WRITTEN FOR A SPECIFIC INCIDENT. On 26 Aug 2026 at 06:45Z, 122 questions from
 * "Animal Kingdom-question.pdf" were inserted, and by 27 Aug they were gone from
 * the collection — with NO delete and NO drop recorded in the oplog for that
 * namespace. Whatever removed them did not go through a normal write path; a
 * restore or rollback to a point just before the insert fits the evidence
 * (5,445 older rows untouched, 332 later rows kept, an intervening update
 * silently undone) but is not proven. Check the Atlas Activity Feed.
 *
 * The window is the constraint: the oplog is capped, and as writes accumulate
 * the target period ages out and this stops being possible.
 *
 * Idempotent: rows that already exist are skipped, so a re-run is safe.
 */

import { readFileSync } from "fs";
import { MongoClient, Timestamp, type Document } from "mongodb";

const COMMIT = process.argv.includes("--commit");

/** The batch to recover. Narrow on purpose — never sweep a whole day. */
const WINDOW_START = "2026-08-26T06:40:00Z";
const WINDOW_END = "2026-08-26T06:50:00Z";
const COLLECTION = "Question";

function dbUrl(): string {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    // The raw driver gets no automatic dotenv loading the way Prisma does.
    // Read, never print.
    const m = readFileSync(".env", "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (!m) throw new Error("DATABASE_URL not found in .env");
    return m[1];
}

const tsAt = (iso: string) => new Timestamp({ t: Math.floor(Date.parse(iso) / 1000), i: 0 });

async function main() {
    const client = new MongoClient(dbUrl());
    await client.connect();

    const db = client.db();
    const ns = `${db.databaseName}.${COLLECTION}`;
    const target = db.collection(COLLECTION);

    console.log(
        COMMIT
            ? "*** COMMIT MODE — inserts into MongoDB ***\n"
            : "DRY RUN — no writes. Re-run with --commit to apply.\n"
    );
    console.log(`namespace: ${ns}`);
    console.log(`window:    ${WINDOW_START} .. ${WINDOW_END}\n`);

    const entries = await client
        .db("local")
        .collection("oplog.rs")
        .find({ ts: { $gte: tsAt(WINDOW_START), $lt: tsAt(WINDOW_END) }, op: "i", ns })
        .toArray();

    if (entries.length === 0) {
        console.log("No insert entries in that window — the oplog has rolled past it.");
        await client.close();
        return;
    }

    const docs = entries.map((e) => e.o as Document);
    console.log(`insert entries found: ${docs.length}`);

    // Skip anything already present, so a re-run is a no-op rather than a
    // duplicate-key error.
    const ids = docs.map((d) => d._id);
    const present = await target.find({ _id: { $in: ids } }).project({ _id: 1 }).toArray();
    const presentIds = new Set(present.map((p) => String(p._id)));
    const missing = docs.filter((d) => !presentIds.has(String(d._id)));

    console.log(`already present:      ${presentIds.size}`);
    console.log(`to restore:           ${missing.length}`);

    if (missing.length === 0) {
        console.log("\nNothing to do.");
        await client.close();
        return;
    }

    const files = new Map<string, number>();
    for (const d of missing) {
        const f = (d.file_name as string) ?? "(none)";
        files.set(f, (files.get(f) ?? 0) + 1);
    }
    console.log("\nby file_name:");
    for (const [k, v] of [...files].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(v).padStart(4)}  ${k}`);
    }

    /**
     * Restored EXACTLY as inserted, with one deliberate change:
     * `organizationId` is written as an explicit null.
     *
     * These rows originally had the field ABSENT, which is not the same thing on
     * MongoDB — Prisma's `{ organizationId: null }` matches only documents where
     * it exists and is null, so an absent field makes a row invisible to every
     * scoped read in the product, including its author's. Restoring them the way
     * they were would restore them straight back into that hole.
     *
     * Explicit null puts them in the shared bank, which is where they were
     * effectively living and what was chosen for the rest of that batch.
     */
    const toInsert = missing.map((d) => ({ ...d, organizationId: null }));

    if (!COMMIT) {
        console.log(`\nWould insert ${toInsert.length} document(s) with organizationId: null.`);
        console.log("Dry run complete. Nothing was written.");
        await client.close();
        return;
    }

    // `ordered: false` so one bad document can't abandon the rest.
    const res = await target.insertMany(toInsert, { ordered: false });
    console.log(`\nrestored: ${res.insertedCount}`);

    const nowPresent = await target.countDocuments({ _id: { $in: ids } });
    console.log(`verified present now: ${nowPresent} of ${docs.length}`);
    console.log(`collection total:     ${await target.countDocuments()}`);

    await client.close();
}

main().catch((e) => {
    console.error(String(e).slice(0, 400));
    process.exitCode = 1;
});
