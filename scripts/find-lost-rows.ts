/**
 * Find Question rows that were inserted and are no longer there — READ ONLY.
 *
 *   npx tsx scripts/find-lost-rows.ts
 *
 * Diffs every Question insert still in the oplog against what the collection
 * holds now. Anything inserted-but-missing is a row that left, WHETHER OR NOT a
 * delete was recorded — which is the case that matters here: the 26 Aug loss of
 * 122 questions produced no delete entry at all.
 *
 * Bounded by the oplog's window (capped, days). Answers "what have we lost
 * recently", never "what have we ever lost".
 *
 * PERFORMANCE, LEARNED THE HARD WAY. The oplog is only efficiently searchable
 * by `ts`, its natural order. An unbounded `find({ns, op})` table-scans it, and
 * so does a ts-bounded query whose `ns` is an `$in` over many namespaces — both
 * ran for twenty minutes without finishing. One exact `ns`, one day at a time,
 * returns in seconds.
 */
import { readFileSync } from "fs";
import { MongoClient, Timestamp, type ObjectId } from "mongodb";

function dbUrl(): string {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    const m = readFileSync(".env", "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (!m) throw new Error("DATABASE_URL not found in .env");
    return m[1];
}

const COLLECTION = process.argv[2] ?? "Question";
const tsAt = (ms: number) => new Timestamp({ t: Math.floor(ms / 1000), i: 0 });
const DAY = 24 * 60 * 60 * 1000;

async function main() {
    const client = new MongoClient(dbUrl());
    await client.connect();
    const db = client.db();
    const oplog = client.db("local").collection("oplog.rs");
    const ns = `${db.databaseName}.${COLLECTION}`;

    const first = await oplog.find({}).sort({ $natural: 1 }).limit(1).toArray();
    const last = await oplog.find({}).sort({ $natural: -1 }).limit(1).toArray();
    const start = new Date(first[0].wall).getTime();
    const end = new Date(last[0].wall).getTime() + 60_000;

    console.log(`collection:   ${ns}`);
    console.log(`oplog window: ${new Date(start).toISOString()} .. ${new Date(end).toISOString()}\n`);

    const ids: ObjectId[] = [];
    let deletes = 0;

    for (let t = start; t < end; t += DAY) {
        const hi = Math.min(t + DAY, end);
        const rows = await oplog
            .find({ ts: { $gte: tsAt(t), $lt: tsAt(hi) }, ns })
            .project({ op: 1, "o._id": 1 })
            .toArray();
        let ins = 0;
        for (const r of rows) {
            if (r.op === "i") { ids.push(r.o._id); ins++; }
            else if (r.op === "d") deletes++;
        }
        console.log(`  ${new Date(t).toISOString().slice(0, 10)}   ${String(ins).padStart(5)} inserts`);
    }

    console.log(`\ninserts in window: ${ids.length}`);
    console.log(`deletes logged:    ${deletes}`);

    if (ids.length === 0) { await client.close(); return; }

    const present = await db.collection(COLLECTION).find({ _id: { $in: ids } })
        .project({ _id: 1 }).toArray();
    const have = new Set(present.map((p) => String(p._id)));
    const missing = ids.filter((id) => !have.has(String(id)));

    console.log(`still present:     ${have.size}`);
    console.log(`MISSING:           ${missing.length}`);

    if (missing.length === 0) {
        console.log("\nNothing inserted inside the oplog window is missing.");
        await client.close();
        return;
    }

    const entries = await oplog.find({ ns, op: "i", "o._id": { $in: missing } })
        .project({ "o.file_name": 1, wall: 1 }).toArray();
    const labels = new Map<string, number>();
    let earliest = Infinity, latest = 0;
    for (const e of entries) {
        const l = (e.o?.file_name as string) ?? "(no file_name)";
        labels.set(l, (labels.get(l) ?? 0) + 1);
        const w = new Date(e.wall).getTime();
        earliest = Math.min(earliest, w); latest = Math.max(latest, w);
    }
    console.log(`\ninserted between ${new Date(earliest).toISOString()} and ${new Date(latest).toISOString()}`);
    for (const [k, v] of [...labels].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(v).padStart(5)}  ${k}`);
    }

    await client.close();
}

main().catch((e) => { console.error(String(e).slice(0, 400)); process.exitCode = 1; });
