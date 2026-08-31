/**
 * WorkOS migration — phase 2 backfill.
 *
 *   npx tsx scripts/workos/backfill-orgs.ts            # dry run, writes nothing
 *   npx tsx scripts/workos/backfill-orgs.ts --commit   # for real
 *
 * Flags:
 *   --local-only                ONLY the steps that never touch WorkOS (4c + 5)
 *   --skip-memberships          create orgs + stamp resources, no memberships
 *   --ambiguous-students=skip   (default) leave multi-org students unassigned
 *   --ambiguous-students=earliest  assign them to the earliest test's org
 *
 * What it does, in order:
 *   1. one personal WorkOS Organization per existing User
 *   2. a local Organization row mirroring it (linked by ownerUserId)
 *   3. a Membership (role=admin — you own your own personal org)
 *   4. stamps organizationId on Folder / Test / PaperHistory / TemplateForm /
 *      SchoolTestQuestion / Student, derived from the author
 *   4c. remaps TemplateForm.userId from Clerk ids to local User.id values
 *   5. normalises Question.organizationId to an explicit null (see below)
 *
 * ---------------------------------------------------------------------------
 * WHY THIS SCRIPT DOES NOT FILTER ON `organizationId: null`
 *
 * It used to, and it silently matched nothing. On MongoDB, Prisma's `null`
 * filter matches documents where the field is present and null — NOT documents
 * where the field is absent. Every pre-existing row is in the "absent" state
 * right after `db push` adds a new optional field, so the filter matched 0 rows
 * across all 8 collections while cheerfully reporting success.
 *
 * Verified on live data by scripts/workos/diagnose-backfill.ts:
 *
 *     Collection            total   prismaNull   rawMissing
 *     Folder                   14            0           14
 *     Question               5445            0         5445
 *     ...
 *
 * So: fetch rows unfiltered and test `!row.organizationId` in JS, which is true
 * for both absent and null. The collections are small (largest stamped set is
 * SchoolTestQuestion at ~338) so this costs nothing. The one big collection,
 * Question at 5445, is handled with a single raw bulk update instead.
 *
 * ---------------------------------------------------------------------------
 * WHY STEP 5 EXISTS
 *
 * Question rows deliberately keep organizationId = null, meaning "shared bank"
 * (doc §13). But because of the behaviour above, the field being *absent* means
 * a future read filter like
 *
 *     where: { OR: [{ organizationId: null }, { organizationId: myOrg }] }
 *
 * would match none of the 5445 shared questions. Writing an explicit null makes
 * "shared" queryable. Same reason for any other collection we choose not to
 * stamp.
 *
 * ---------------------------------------------------------------------------
 * OTHER NOTES
 *
 * - Idempotent. Personal orgs are found via Organization.ownerUserId, NOT via
 *   Membership — memberships can't exist until the WorkOS user import has run,
 *   and keying on them would create a duplicate org on every re-run.
 *   Run it twice; the second run should report zero writes.
 *
 * - It does NOT create WorkOS *users*. That's a separate step (WorkOS bulk
 *   import + a Clerk password-hash export). Until User.workosUserId is
 *   populated, membership creation is skipped and reported as such.
 *
 * - `User.workosUserId` is NOT @unique (see the schema comment and
 *   scripts/workos/create-sparse-indexes.ts for why). Look it up with
 *   findFirst, never findUnique.
 */

import prisma from "@/lib/prisma";

const COMMIT = process.argv.includes("--commit");
const SKIP_MEMBERSHIPS = process.argv.includes("--skip-memberships");

/**
 * Run ONLY the steps that never touch WorkOS: the TemplateForm.userId remap
 * (4c) and the Question.organizationId normalisation (5).
 *
 * Why this mode exists: creating orgs and memberships writes WorkOS ids into
 * our database, and those ids belong to whichever WorkOS ENVIRONMENT the API
 * key points at. Running the full backfill with a `sk_test_` key against the
 * production database would bake test-environment ids into real rows, and every
 * one of them dangles the moment you switch to live keys — a second cleanup
 * migration, not a re-run.
 *
 * The two local steps have no such coupling and fix a live bug (pre-existing
 * templates being invisible to their owners), so they can run safely ahead of
 * the WorkOS environment being finalised.
 */
const LOCAL_ONLY = process.argv.includes("--local-only");

/**
 * What to do with a Student whose marks span more than one org.
 *
 *   skip     (default) leave organizationId null and report them. Correct while
 *            every teacher has a PERSONAL org — a student sitting tests from two
 *            teachers at the same school genuinely spans two personal orgs, and
 *            that resolves by itself once the real school org exists.
 *   earliest assign to the org of whoever set the EARLIEST test they sat.
 *            Deterministic and defensible. Note that on this dataset every
 *            ambiguous student is a 1-vs-1 tie, so a "majority" rule would be a
 *            coin flip — which is why there isn't one.
 */
const AMBIGUOUS_STRATEGY =
    (process.argv.find((a) => a.startsWith("--ambiguous-students="))?.split("=")[1] as
        | "skip"
        | "earliest"
        | undefined) ?? "skip";

if (!["skip", "earliest"].includes(AMBIGUOUS_STRATEGY)) {
    console.error(`Unknown --ambiguous-students=${AMBIGUOUS_STRATEGY}. Use skip or earliest.`);
    process.exit(1);
}

const WORKOS_API_KEY = process.env.WORKOS_API_KEY;
const WORKOS_API = "https://api.workos.com";

const stats: Record<string, number> = {};
const bump = (k: string, n = 1) => (stats[k] = (stats[k] ?? 0) + n);

function log(...args: unknown[]) {
    console.log(COMMIT ? "" : "[dry-run]", ...args);
}

/** True when the field is absent OR explicitly null. */
function unstamped(row: { organizationId?: string | null }): boolean {
    return !row.organizationId;
}

async function createWorkosOrg(name: string, idempotencyKey: string): Promise<string> {
    if (!COMMIT) return `org_DRYRUN_${idempotencyKey.slice(0, 12)}`;
    if (!WORKOS_API_KEY) throw new Error("WORKOS_API_KEY is not set");

    const res = await fetch(`${WORKOS_API}/organizations`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${WORKOS_API_KEY}`,
            "Content-Type": "application/json",
            // Makes a re-run safe: WorkOS returns the SAME org rather than
            // creating a second one.
            "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ name }),
    });

    if (!res.ok) throw new Error(`WorkOS org create failed (${res.status}): ${await res.text()}`);
    return ((await res.json()) as { id: string }).id;
}

async function createWorkosMembership(
    workosUserId: string,
    workosOrgId: string,
    roleSlug: string,
    idempotencyKey: string
): Promise<string> {
    if (!COMMIT) return `om_DRYRUN_${idempotencyKey.slice(0, 12)}`;
    if (!WORKOS_API_KEY) throw new Error("WORKOS_API_KEY is not set");

    const res = await fetch(`${WORKOS_API}/user_management/organization_memberships`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${WORKOS_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
            user_id: workosUserId,
            organization_id: workosOrgId,
            role_slug: roleSlug,
        }),
    });

    if (!res.ok) throw new Error(`WorkOS membership create failed (${res.status}): ${await res.text()}`);
    return ((await res.json()) as { id: string }).id;
}

// ---------------------------------------------------------------------------

async function main() {
    console.log(
        COMMIT
            ? LOCAL_ONLY
                ? "*** COMMIT MODE (--local-only) — writes to MongoDB only, never WorkOS ***\n"
                : "*** COMMIT MODE — this writes to WorkOS and MongoDB ***\n"
            : LOCAL_ONLY
                ? "DRY RUN (--local-only) — no writes. Re-run with --commit to apply.\n"
                : "DRY RUN — no writes. Re-run with --commit to apply.\n"
    );

    if (LOCAL_ONLY) {
        console.log(
            "--local-only: running ONLY the TemplateForm.userId remap and the\n" +
            "Question.organizationId normalisation. No orgs, memberships or org\n" +
            "stamping — re-run without this flag once WorkOS live keys are set.\n"
        );
    }

    const users = await prisma.user.findMany({
        select: { id: true, clerkUserId: true, email: true, name: true, workosUserId: true },
        orderBy: { createdAt: "asc" },
    });
    console.log(`Users to process: ${users.length}\n`);

    // TemplateForm.userId stores CLERK ids, not local User.id values — it is the
    // one userId column in the schema declared as plain `String` rather than
    // `@db.ObjectId`, and the data followed the type. Confirmed against prod:
    // 38/38 rows matched clerkUserId and 0/38 matched User.id.
    // This map lets that one collection resolve its author like the others.
    const localIdByClerkId = new Map(users.map((u) => [u.clerkUserId, u.id]));

    // Pre-load existing personal orgs in one query, keyed by ownerUserId.
    const existingOrgs = await prisma.organization.findMany({
        where: { type: "personal" },
        select: { id: true, workosOrgId: true, ownerUserId: true },
    });
    const orgByOwner = new Map(
        existingOrgs.filter((o) => o.ownerUserId).map((o) => [o.ownerUserId as string, o])
    );

    /** local User.id -> local Organization.id */
    const orgOf = new Map<string, string>();
    /** local User.id -> WorkOS org id (needed when creating the membership) */
    const workosOrgOf = new Map<string, string>();

    // --- 1-3. personal org + membership per user ---------------------------
    // Skipped under --local-only: this is the WorkOS-coupled part.
    for (const user of LOCAL_ONLY ? [] : users) {
        const orgName = user.name?.trim() || user.email;

        const existing = orgByOwner.get(user.id);
        if (existing) {
            orgOf.set(user.id, existing.id);
            workosOrgOf.set(user.id, existing.workosOrgId);
            bump("orgs.alreadyExisted");
        } else {
            // Idempotency key must be STABLE across runs — derived from the
            // user id, never a timestamp or random value.
            const workosOrgId = await createWorkosOrg(orgName, `personal-org-${user.id}`);

            let orgId: string;
            if (COMMIT) {
                const org = await prisma.organization.create({
                    data: {
                        workosOrgId,
                        name: orgName,
                        type: "personal",
                        ownerUserId: user.id,
                        contactEmail: user.email,
                    },
                    select: { id: true },
                });
                orgId = org.id;
            } else {
                orgId = `local_DRYRUN_${user.id}`;
            }
            orgOf.set(user.id, orgId);
            workosOrgOf.set(user.id, workosOrgId);
            bump("orgs.created");
        }

        if (SKIP_MEMBERSHIPS) continue;

        if (!user.workosUserId) {
            // Expected until the WorkOS user import has run. Not fatal — orgs
            // exist and resources can be stamped; re-run afterwards to fill
            // memberships in.
            bump("memberships.skipped.noWorkosUserId");
            continue;
        }

        const alreadyMember = await prisma.membership.findFirst({
            where: { userId: user.id, organizationId: orgOf.get(user.id) },
            select: { id: true },
        });
        if (alreadyMember) {
            bump("memberships.alreadyExisted");
            continue;
        }

        const workosMembershipId = await createWorkosMembership(
            user.workosUserId,
            workosOrgOf.get(user.id)!,
            "admin",
            `personal-membership-${user.id}`
        );

        if (COMMIT) {
            await prisma.membership.create({
                data: {
                    workosMembershipId,
                    userId: user.id,
                    organizationId: orgOf.get(user.id)!,
                    role: "admin",
                    status: "active",
                },
            });
        }
        bump("memberships.created");
    }

    log(
        `orgs: ${stats["orgs.created"] ?? 0} created, ${stats["orgs.alreadyExisted"] ?? 0} pre-existing`
    );

    // --- 4. stamp org on author-owned resources ----------------------------
    // No `where` clause: see the header. Rows are fetched whole and filtered in
    // JS so that both "field absent" and "field null" count as unstamped.

    async function stampByAuthor(
        label: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: any,
        authorField: "userId" | "createdBy",
        /** Maps the stored author value to a local User.id. Identity by default. */
        resolveAuthor: (raw: string) => string | undefined = (raw) => raw
    ) {
        const rows = (await model.findMany({
            select: { id: true, organizationId: true, [authorField]: true },
        })) as Array<Record<string, string | null>>;

        let stamped = 0;
        let orphaned = 0;
        let skipped = 0;

        for (const row of rows) {
            if (!unstamped(row)) {
                skipped++;
                continue;
            }
            const localUserId = resolveAuthor(row[authorField] as string);
            const orgId = localUserId ? orgOf.get(localUserId) : undefined;
            if (!orgId) {
                // Author was deleted but their content survived. Do NOT guess —
                // surface it and let a human decide.
                orphaned++;
                continue;
            }
            if (COMMIT) {
                await model.update({ where: { id: row.id }, data: { organizationId: orgId } });
            }
            stamped++;
        }

        log(
            `${label}: ${rows.length} total, ${stamped} to stamp, ${skipped} already done, ${orphaned} orphaned (author missing)`
        );
        bump(`${label}.stamped`, stamped);
        if (orphaned) bump(`${label}.orphaned`, orphaned);
    }

    // Stamping needs orgs to exist, so it is part of the WorkOS-coupled path.
    if (!LOCAL_ONLY) {
    await stampByAuthor("Folder", prisma.folder, "userId");
    await stampByAuthor("Test", prisma.test, "createdBy");
    await stampByAuthor("PaperHistory", prisma.paperHistory, "userId");
    // TemplateForm.userId may hold EITHER a Clerk id or a local User.id,
    // depending on whether step 4c has already run against this database.
    // Resolving only as a Clerk id silently orphans every row once 4c has run
    // (which is how all 38 rows reported orphaned after the --local-only pass).
    // Detect the shape instead of assuming an order.
    await stampByAuthor("TemplateForm", prisma.templateForm, "userId", (raw) =>
        /^[0-9a-f]{24}$/.test(raw) ? raw : localIdByClerkId.get(raw)
    );
    // SchoolTestQuestion has its own createdBy, so stamp it directly rather
    // than inferring the org from a referencing Test — that way extraction
    // leftovers not attached to any test still get an owner.
    await stampByAuthor("SchoolTestQuestion", prisma.schoolTestQuestion, "createdBy");
    }

    // --- 4b. Student.organizationId, derived from answered tests ------------
    // Student has no author column; the only signal is which tests they sat.
    if (!LOCAL_ONLY) {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                name: true,
                className: true,
                rollNumber: true,
                organizationId: true,
                responses: {
                    select: {
                        submittedAt: true,
                        test: { select: { organizationId: true, createdBy: true } },
                    },
                    orderBy: { submittedAt: "asc" },
                },
            },
        });

        let stamped = 0;
        let noSignal = 0;
        let ambiguous = 0;
        let skipped = 0;

        for (const s of students) {
            if (!unstamped(s)) {
                skipped++;
                continue;
            }

            const orgIds = new Set(
                s.responses
                    .map((r) => r.test.organizationId ?? orgOf.get(r.test.createdBy))
                    .filter((x): x is string => Boolean(x))
            );

            if (orgIds.size === 0) {
                noSignal++;
                console.log(`  NO SIGNAL: ${s.className}/${s.rollNumber} "${s.name}" — no marks to infer an org from`);
                continue;
            }
            if (orgIds.size > 1) {
                // Same roster row has marks from tests set by two different
                // teachers. With personal orgs that is expected, not corrupt.
                if (AMBIGUOUS_STRATEGY === "skip") {
                    console.log(
                        `  AMBIGUOUS (left null): ${s.className}/${s.rollNumber} "${s.name}" — marks in ${orgIds.size} orgs`
                    );
                    ambiguous++;
                    continue;
                }

                // 'earliest': responses are ordered by submittedAt asc, so the
                // first resolvable org wins.
                const earliest = s.responses
                    .map((r) => r.test.organizationId ?? orgOf.get(r.test.createdBy))
                    .find((x): x is string => Boolean(x))!;

                console.log(
                    `  AMBIGUOUS (assigned earliest): ${s.className}/${s.rollNumber} "${s.name}" — ${orgIds.size} orgs`
                );
                if (COMMIT) {
                    await prisma.student.update({
                        where: { id: s.id },
                        data: { organizationId: earliest },
                    });
                }
                stamped++;
                bump("Student.ambiguousResolved");
                continue;
            }

            if (COMMIT) {
                await prisma.student.update({
                    where: { id: s.id },
                    data: { organizationId: [...orgIds][0] },
                });
            }
            stamped++;
        }

        log(
            `Student: ${students.length} total, ${stamped} to stamp, ${skipped} already done, ${noSignal} no-signal, ${ambiguous} ambiguous`
        );
        bump("Student.stamped", stamped);
        if (noSignal) bump("Student.noSignal", noSignal);
        if (ambiguous) bump("Student.ambiguous", ambiguous);
    }

    // --- 4c. remap TemplateForm.userId from Clerk id -> local User.id -------
    // This column is declared as a relation to User.id but has always held a
    // CLERK id, because actions/templates/pdfTemplateForm.ts wrote auth().userId
    // straight into it. The relation has therefore never resolved for any row.
    //
    // That action now writes the local User.id (it has to — there is no Clerk id
    // any more). Until these rows are remapped, `where: { userId }` will not
    // match them and every pre-existing template is invisible to its owner. So
    // this step is NOT optional: run it as part of the cutover.
    {
        const rows = await prisma.templateForm.findMany({
            select: { id: true, userId: true },
        });

        let remapped = 0;
        let alreadyLocal = 0;
        let orphaned = 0;

        for (const row of rows) {
            // Local ids are 24-char hex ObjectIds; Clerk ids look like `user_…`.
            if (/^[0-9a-f]{24}$/.test(row.userId)) {
                alreadyLocal++;
                continue;
            }

            const localId = localIdByClerkId.get(row.userId);
            if (!localId) {
                orphaned++;
                console.log(`  ORPHANED TemplateForm ${row.id}: no User with clerkUserId=${row.userId}`);
                continue;
            }

            if (COMMIT) {
                await prisma.templateForm.update({
                    where: { id: row.id },
                    data: { userId: localId },
                });
            }
            remapped++;
        }

        log(
            `TemplateForm.userId: ${rows.length} total, ${remapped} to remap, ${alreadyLocal} already local, ${orphaned} orphaned`
        );
        bump("TemplateForm.userIdRemapped", remapped);
        if (orphaned) bump("TemplateForm.userIdOrphaned", orphaned);
    }

    // --- 5. normalise Question.organizationId to an explicit null -----------
    // Questions stay in the shared bank (doc §13) — but the field must EXIST
    // and be null, otherwise `where: { organizationId: null }` can never find
    // them. One bulk raw update rather than 5000+ round trips.
    {
        const total = await prisma.question.count();
        const missing = (
            (await prisma.$runCommandRaw({
                count: "Question",
                query: { organizationId: { $exists: false } },
            })) as { n?: number }
        ).n ?? 0;

        if (missing > 0 && COMMIT) {
            const res = (await prisma.$runCommandRaw({
                update: "Question",
                updates: [
                    {
                        q: { organizationId: { $exists: false } },
                        u: { $set: { organizationId: null } },
                        multi: true,
                    },
                ],
            })) as { nModified?: number };
            log(`Question: normalised ${res.nModified ?? 0} of ${total} to explicit null (shared bank)`);
            bump("Question.normalised", res.nModified ?? 0);
        } else {
            log(`Question: ${total} total, ${missing} need normalising to explicit null (shared bank)`);
            bump("Question.normalised", missing);
        }
    }

    console.log("\n--- SUMMARY ---");
    for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k}: ${v}`);

    if (!COMMIT) {
        console.log("\nDry run complete. Nothing was written.");
        console.log("Review the orphaned / ambiguous / no-signal counts above BEFORE committing.");
    } else {
        console.log("\nBackfill complete. Re-run WITHOUT --commit; it should report zero new work.");
    }
}

main()
    .catch((e) => {
        console.error("\nBACKFILL FAILED:", e);
        console.error("The script is idempotent — fix the cause and re-run.");
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
