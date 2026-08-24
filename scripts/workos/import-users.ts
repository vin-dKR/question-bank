/**
 * WorkOS migration — user import.
 *
 *   npx tsx scripts/workos/import-users.ts            # dry run, writes nothing
 *   npx tsx scripts/workos/import-users.ts --commit   # for real
 *
 * Creates a WorkOS user for every local User row that doesn't have one yet, and
 * stamps `User.workosUserId`. Run this BEFORE backfill-orgs.ts, so that script
 * can create memberships instead of reporting `memberships.skipped`.
 *
 * ---------------------------------------------------------------------------
 * THIS SCRIPT IS OPTIONAL, AND HERE IS WHY IT MIGHT BE WORTH SKIPPING.
 *
 * `getAuthContext()` matches an arriving WorkOS user to an existing local row
 * BY EMAIL and stamps `workosUserId` on it. So a user who simply signs in after
 * the cutover is adopted correctly with no import at all. What the import buys
 * you is determinism: every row is linked before anyone signs in, so the
 * backfill can create memberships up front and the first sign-in is a plain
 * read. Without it the system self-heals, but lazily and one user at a time.
 *
 * ---------------------------------------------------------------------------
 * PASSWORDS
 *
 * This creates users WITHOUT password hashes, because exporting them from Clerk
 * needs a support request. Consequences, and they are worth telling users about
 * before you cut over:
 *
 *   - Google / social sign-in users: seamless. They click "Continue with
 *     Google", WorkOS matches the verified email, and they are in.
 *   - Email + password users: their old password will NOT work. They must use
 *     "Forgot password" once. Send them a heads-up email BEFORE the cutover,
 *     not after.
 *
 * If you do get hashes out of Clerk, add `passwordHash` + `passwordHashType:
 * 'bcrypt'` to the create call below and both groups become seamless.
 *
 * ---------------------------------------------------------------------------
 * `emailVerified: true` is set deliberately. These are people who already had
 * working accounts; making them re-verify an address they have been signing in
 * with for months is friction with no security benefit.
 */

import { WorkOS } from "@workos-inc/node";
import prisma from "@/lib/prisma";

const COMMIT = process.argv.includes("--commit");

const apiKey = process.env.WORKOS_API_KEY;
if (!apiKey) {
    console.error("WORKOS_API_KEY is not set. Add it to .env before running.");
    process.exit(1);
}
const workos = new WorkOS(apiKey);

const stats: Record<string, number> = {};
const bump = (k: string, n = 1) => (stats[k] = (stats[k] ?? 0) + n);
const log = (...a: unknown[]) => console.log(COMMIT ? "" : "[dry-run]", ...a);

function splitName(name: string | null): { firstName?: string; lastName?: string } {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return {};
    if (parts.length === 1) return { firstName: parts[0] };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

async function main() {
    console.log(
        COMMIT
            ? "*** COMMIT MODE — this creates users in WorkOS and writes to MongoDB ***\n"
            : "DRY RUN — no writes. Re-run with --commit to apply.\n"
    );

    const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, workosUserId: true },
        orderBy: { createdAt: "asc" },
    });

    console.log(`Local users: ${users.length}\n`);

    for (const user of users) {
        if (user.workosUserId) {
            bump("skipped.alreadyLinked");
            continue;
        }

        // Placeholder rows created by the folder-invite flow for people who
        // never signed up. Importing them would send nothing and clutter the
        // WorkOS directory; they get created for real when they accept.
        if (!user.email || !user.email.includes("@")) {
            console.log(`  SKIP (no usable email): ${user.id}`);
            bump("skipped.noEmail");
            continue;
        }

        if (!COMMIT) {
            log(`would import ${user.email}`);
            bump("wouldImport");
            continue;
        }

        try {
            const created = await workos.userManagement.createUser({
                email: user.email,
                emailVerified: true,
                ...splitName(user.name),
            });

            await prisma.user.update({
                where: { id: user.id },
                data: { workosUserId: created.id },
            });

            console.log(`  imported ${user.email} -> ${created.id}`);
            bump("imported");
        } catch (err) {
            // The common case is a 409: the address already exists in WorkOS,
            // either from a previous run that died mid-way or because the person
            // already signed in. Adopt it rather than failing the whole run.
            const existing = await workos.userManagement
                .listUsers({ email: user.email, limit: 1 })
                .then((r) => r.data[0])
                .catch(() => undefined);

            if (existing) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { workosUserId: existing.id },
                });
                console.log(`  adopted existing ${user.email} -> ${existing.id}`);
                bump("adopted");
            } else {
                console.error(`  FAILED ${user.email}:`, err);
                bump("failed");
            }
        }
    }

    console.log("\n--- SUMMARY ---");
    for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k}: ${v}`);

    if (!COMMIT) {
        console.log("\nDry run complete. Nothing was written.");
    } else {
        console.log("\nImport complete. Now run: npx tsx scripts/workos/backfill-orgs.ts --commit");
        if (stats.failed) {
            console.log(`WARNING: ${stats.failed} user(s) failed. Re-run — the script is idempotent.`);
        }
    }
}

main()
    .catch((e) => {
        console.error("\nIMPORT FAILED:", e);
        console.error("The script is idempotent — fix the cause and re-run.");
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
