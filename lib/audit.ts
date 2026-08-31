import "server-only";

/**
 * Audit logging (docs/API_SECURITY.md, Layer 7).
 *
 * "No data on the internet is 100% safe" — so beyond auth + caps + rate limits,
 * the last line of defense is DETECTION and ATTRIBUTION: every bulk read and
 * every question mutation is logged with who, from where, and how much. A
 * scraper can be slowed and rate-limited; this is how you also SEE them and tie
 * the activity to a real account/IP.
 *
 * Records are emitted as single-line structured JSON so a log drain (Vercel,
 * Netlify, Cloudflare Logpush, Datadog, …) can index and alert on them. Bulk
 * reads are elevated to console.warn so an alert rule can trigger on level=warn
 * + event=question.bulk_read.
 *
 * UPGRADE PATH (durable, queryable in-app): add an `AccessLog` Mongo model and
 * also write there. The ready-to-use schema is in the doc. Kept as console-only
 * here to avoid a production DB migration as part of this change.
 */

export type AuditEvent =
    | "question.read"
    | "question.bulk_read"
    | "question.create"
    | "question.update"
    | "question.delete"
    | "pdf.render"
    | "auth.denied";

export type ActorType = "user" | "service" | "anonymous";

export interface AuditRecord {
    event: AuditEvent;
    actorType: ActorType;
    actorId?: string | null;
    organizationId?: string | null;
    ip?: string;
    endpoint?: string;
    /** Rows returned (reads) or affected (writes). */
    count?: number;
    meta?: Record<string, unknown>;
}

/** A single read returning at least this many rows is treated as a bulk pull. */
export const BULK_READ_THRESHOLD = 50;

export function audit(record: AuditRecord): void {
    const isBulk =
        record.event === "question.bulk_read" ||
        (record.count ?? 0) >= BULK_READ_THRESHOLD;

    const line = JSON.stringify({
        level: "audit",
        ts: new Date().toISOString(),
        ...record,
        ...(isBulk && record.event === "question.read" ? { event: "question.bulk_read" } : {}),
    });

    // Bulk reads → warn (alert-able); everything else → info.
    if (isBulk) console.warn(line);
    else console.info(line);
}
