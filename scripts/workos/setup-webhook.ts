/**
 * Creates (or reports) the WorkOS webhook endpoint this app expects.
 *
 *   npx tsx scripts/workos/setup-webhook.ts https://your-domain.com            # dry run
 *   npx tsx scripts/workos/setup-webhook.ts https://your-domain.com --commit   # create it
 *
 * Requires WORKOS_API_KEY in .env. Nothing else — this replaces clicking
 * through Dashboard -> Webhooks -> Create Endpoint and ticking eight boxes.
 *
 * The event list below is the SAME list `app/api/webhooks/workos/route.ts`
 * switches on. If you add a case there, add it here too; anything WorkOS sends
 * that the route doesn't handle is acknowledged and ignored, so an over-broad
 * subscription is harmless but noisy.
 *
 * Idempotent: if an endpoint already exists for the URL, it is reported and
 * left alone rather than duplicated. To change its event list, delete it in the
 * dashboard and re-run, or use `updateWebhookEndpoint`.
 *
 * NOTE: WorkOS requires an HTTPS URL, so this cannot point at localhost. For
 * local testing run a tunnel (`ngrok http 3000`) and pass the tunnel URL — or
 * skip webhooks entirely in dev, since provisioning is lazy and does not depend
 * on them (doc §7).
 */

// Unlike the other scripts here, this one imports no Prisma client — and it is
// Prisma that pulls in .env as a side effect. Without this the script cannot see
// WORKOS_API_KEY and exits claiming it is unset.
import * as dotenv from "dotenv";
dotenv.config({ quiet: true } as never);

import { WorkOS } from "@workos-inc/node";

/** Exactly what app/api/webhooks/workos/route.ts handles. */
const EVENTS = [
    "user.created",
    "user.updated",
    "user.deleted",
    "organization.updated",
    "organization.deleted",
    "organization_membership.created",
    "organization_membership.updated",
    "organization_membership.deleted",
] as const;

const COMMIT = process.argv.includes("--commit");
const baseUrl = process.argv.find((a) => a.startsWith("http"));

if (!baseUrl) {
    console.error("Usage: npx tsx scripts/workos/setup-webhook.ts <https://your-domain> [--commit]");
    process.exit(1);
}

const apiKey = process.env.WORKOS_API_KEY;
if (!apiKey) {
    console.error("WORKOS_API_KEY is not set. Add it to .env first.");
    process.exit(1);
}

const endpointUrl = `${baseUrl.replace(/\/$/, "")}/api/webhooks/workos`;

if (!endpointUrl.startsWith("https://")) {
    console.error(
        `WorkOS requires HTTPS. Got: ${endpointUrl}\n` +
        "For local testing use a tunnel (ngrok http 3000) and pass its https URL."
    );
    process.exit(1);
}

const workos = new WorkOS(apiKey);

async function main() {
    console.log(COMMIT ? "*** COMMIT MODE ***\n" : "DRY RUN — pass --commit to create.\n");
    console.log(`Endpoint URL : ${endpointUrl}`);
    console.log(`Events       : ${EVENTS.length}`);
    for (const e of EVENTS) console.log(`               - ${e}`);
    console.log();

    const existingList = await workos.webhooks.listWebhookEndpoints();
    const existing = existingList.data.find((e) => e.endpointUrl === endpointUrl);

    if (existing) {
        console.log(`Already exists: ${existing.id} (status: ${existing.status})`);
        console.log(`Subscribed to ${existing.events.length} event(s):`);
        for (const e of existing.events) console.log(`  - ${e}`);

        const missing = EVENTS.filter((e) => !existing.events.includes(e));
        if (missing.length) {
            console.log(`\nWARNING: this endpoint is NOT subscribed to ${missing.length} event(s) the app handles:`);
            for (const e of missing) console.log(`  - ${e}`);
            console.log("Update it in the dashboard, or delete and re-run this script.");
        }
        console.log("\nNothing to do. (The signing secret is only returned at creation time —");
        console.log("read it from Dashboard -> Webhooks if you no longer have it.)");
        return;
    }

    if (!COMMIT) {
        console.log("Would create this endpoint. Re-run with --commit.");
        return;
    }

    const created = await workos.webhooks.createWebhookEndpoint({
        endpointUrl,
        events: [...EVENTS],
    });

    console.log(`Created: ${created.id} (status: ${created.status})\n`);
    console.log("Add this to .env — it is shown ONCE and cannot be retrieved again via the API:\n");
    console.log(`WORKOS_WEBHOOK_SECRET=${created.secret}\n`);
}

main().catch((e) => {
    console.error("\nFAILED:", e);
    process.exit(1);
});
