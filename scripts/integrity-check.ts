/**
 * Row-count integrity check — READ ONLY except for its own snapshot file.
 *
 *   npx tsx scripts/integrity-check.ts            # compare against last run
 *   npx tsx scripts/integrity-check.ts --baseline # accept current counts as the new baseline
 *
 * WHY THIS EXISTS. On 26 Aug 2026, 122 questions left the database with no
 * delete and no drop recorded in the oplog, and nothing noticed for two days.
 * Application-level protections — auth, ownership checks, audit logging on the
 * delete path — would ALL have missed it, because the application never deleted
 * anything. Whatever happened was below it.
 *
 * So the check that catches that class of event cannot be inside the request
 * path. It has to be an outside observer that knows only one thing: these
 * collections should not shrink. Run it on a schedule (cron, a scheduled
 * function, CI) and alert on a non-zero exit.
 *
 * A drop is not always wrong — a teacher deleting their own question is a real
 * shrink. The point is not that a drop is a bug; it is that a drop should never
 * be a SURPRISE. Investigate it, then `--baseline` to accept it.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { MongoClient } from "mongodb";

const BASELINE_FILE = ".integrity-baseline.json";
const SET_BASELINE = process.argv.includes("--baseline");

/**
 * Collections that hold work someone would notice losing. Ordered by how
 * expensive the loss is: marks and rosters cannot be regenerated at all, a
 * question bank can be re-extracted from the source PDF at a cost.
 */
const WATCHED = [
    "StudentResponse",
    "TestAnswer",
    "Student",
    "Test",
    "Question",
    "SchoolTestQuestion",
    "PaperHistory",
    "Folder",
    "TemplateForm",
];

function dbUrl(): string {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    const m = readFileSync(".env", "utf8").match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (!m) throw new Error("DATABASE_URL not found in .env");
    return m[1];
}

type Baseline = { takenAt: string; counts: Record<string, number> };

async function main() {
    const client = new MongoClient(dbUrl());
    await client.connect();
    const db = client.db();

    const counts: Record<string, number> = {};
    for (const name of WATCHED) {
        counts[name] = await db.collection(name).countDocuments();
    }
    await client.close();

    if (SET_BASELINE || !existsSync(BASELINE_FILE)) {
        const next: Baseline = { takenAt: new Date().toISOString(), counts };
        writeFileSync(BASELINE_FILE, JSON.stringify(next, null, 2) + "\n");
        console.log(existsSync(BASELINE_FILE) ? "Baseline updated.\n" : "Baseline created.\n");
        for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(20)} ${v}`);
        return;
    }

    const prev = JSON.parse(readFileSync(BASELINE_FILE, "utf8")) as Baseline;
    console.log(`baseline taken ${prev.takenAt}\n`);
    console.log("Collection              baseline      now     delta");
    console.log("-".repeat(54));

    const shrunk: string[] = [];

    for (const name of WATCHED) {
        const before = prev.counts[name] ?? 0;
        const now = counts[name];
        const delta = now - before;
        const flag = delta < 0 ? "  <-- SHRANK" : "";
        console.log(
            `${name.padEnd(20)} ${String(before).padStart(9)} ${String(now).padStart(8)} ${String(delta > 0 ? `+${delta}` : delta).padStart(9)}${flag}`
        );
        if (delta < 0) shrunk.push(`${name}: ${before} -> ${now} (${delta})`);
    }

    console.log("");
    if (shrunk.length === 0) {
        console.log("OK — nothing shrank.");
        return;
    }

    console.log("SHRINKAGE DETECTED:\n");
    for (const s of shrunk) console.log(`  ! ${s}`);
    console.log(
        "\nIf this was not deliberate, act NOW rather than later: recovery depends\n" +
            "on the oplog window, which is capped and measured in days.\n" +
            "  npx tsx scripts/find-lost-rows.ts <Collection>\n" +
            "  npx tsx scripts/restore-questions-from-oplog.ts\n" +
            "\nIf it WAS deliberate, re-run with --baseline to accept the new counts."
    );
    process.exitCode = 1;
}

main().catch((e) => {
    console.error(String(e).slice(0, 400));
    process.exitCode = 1;
});
