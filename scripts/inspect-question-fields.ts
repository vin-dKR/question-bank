/**
 * Reports the fields that actually exist in the MongoDB documents, as opposed to
 * the ones declared in schema.prisma. Prisma does not enforce a schema on MongoDB,
 * so an ingest pipeline can write fields (e.g. `solution`) that the client never
 * returns and no code references. Uses $runCommandRaw to see the real documents.
 *
 *   bun run scripts/inspect-question-fields.ts
 */
import prisma from "@/lib/prisma";

const SAMPLE = 200;

// The slide-template binding keys we care about, mapped to the schema field we expect.
const BIND_KEYS: Record<string, string> = {
    index: "question_number",
    exam: "exam_name",
    subject: "subject",
    topic: "topic",
    question: "question_text",
    options: "options",
    answer: "answer",
    solution: "(undeclared)",
    diagram: "question_image",
};

async function sample(collection: string) {
    const res = (await prisma.$runCommandRaw({
        find: collection,
        limit: SAMPLE,
    })) as unknown as { cursor?: { firstBatch?: Record<string, unknown>[] } };

    return res?.cursor?.firstBatch ?? [];
}

function isFilled(v: unknown) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.length > 0;
    return true;
}

async function report(collection: string) {
    console.log(`\n${"=".repeat(60)}\n${collection}\n${"=".repeat(60)}`);

    const docs = await sample(collection);
    if (!docs.length) {
        console.log("  (no documents)");
        return;
    }
    console.log(`sampled ${docs.length} documents\n`);

    // Union of every key present, with how many docs have it non-empty.
    const counts = new Map<string, number>();
    for (const d of docs) {
        for (const [k, v] of Object.entries(d)) {
            if (!counts.has(k)) counts.set(k, 0);
            if (isFilled(v)) counts.set(k, counts.get(k)! + 1);
        }
    }

    console.log("--- every field present in the raw documents ---");
    for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1])) {
        const pct = ((n / docs.length) * 100).toFixed(0);
        console.log(`  ${k.padEnd(22)} ${String(n).padStart(4)}/${docs.length}  (${pct}% filled)`);
    }

    // Anything that smells like a worked solution but isn't declared in the schema.
    const suspicious = [...counts.keys()].filter((k) =>
        /sol|expl|hint|reason|working|steps|detail|desc/i.test(k)
    );
    console.log("\n--- solution-like fields found ---");
    console.log(suspicious.length ? suspicious.map((s) => "  " + s).join("\n") : "  none");

    console.log("\n--- slide-template bind key coverage ---");
    for (const [key, field] of Object.entries(BIND_KEYS)) {
        const direct = counts.get(key) ?? 0;
        const mapped = field !== "(undeclared)" ? counts.get(field) ?? 0 : 0;
        const n = Math.max(direct, mapped);
        const via = direct >= mapped && direct > 0 ? key : field;
        const mark = n > 0 ? "OK  " : "MISS";
        console.log(`  ${mark} ${key.padEnd(10)} <- ${via.padEnd(18)} ${n}/${docs.length}`);
    }

    // A full document, so we can eyeball LaTeX, option shape and image URLs.
    const richest = docs.reduce((a, b) =>
        Object.values(b).filter(isFilled).length > Object.values(a).filter(isFilled).length ? b : a
    );
    console.log("\n--- most complete sample document ---");
    console.log(
        JSON.stringify(richest, null, 2)
            .split("\n")
            .map((l) => (l.length > 160 ? l.slice(0, 160) + "…" : l))
            .join("\n")
    );
}

async function main() {
    for (const c of ["Question", "SchoolTestQuestion"]) {
        try {
            await report(c);
        } catch (e) {
            console.error(`\n${c}: failed —`, e instanceof Error ? e.message : e);
        }
    }

    // "the edents folder" — list folders so we can point at the right one.
    try {
        const folders = await prisma.folder.findMany({
            select: { id: true, name: true, _count: { select: { questionRelations: true } } },
            orderBy: { createdAt: "desc" },
            take: 40,
        });
        console.log(`\n${"=".repeat(60)}\nFolders\n${"=".repeat(60)}`);
        for (const f of folders) {
            console.log(`  ${f.name.padEnd(34)} ${String(f._count.questionRelations).padStart(4)} questions   ${f.id}`);
        }
    } catch (e) {
        console.error("\nFolders: failed —", e instanceof Error ? e.message : e);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
