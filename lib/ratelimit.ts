import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AuthError } from "@/lib/auth/session";

/**
 * Rate limiting (docs/API_SECURITY.md, Layer 3).
 *
 * Platform-agnostic: uses Upstash Redis over REST, so it works on Vercel,
 * Netlify, or behind Cloudflare without a persistent connection. If the two
 * env vars below are unset the limiter is a NO-OP (allows everything) so local
 * dev and preview builds keep working — but it logs a warning in production so
 * a missing config can't silently disable the control.
 *
 * The point of this layer, given the bank is browsable to any signed-in user,
 * is that no single login can pull the whole bank quickly: reads are throttled
 * and heavy endpoints (PDF render, paid vision extraction) are capped hard.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis && process.env.NODE_ENV === "production") {
    console.warn(
        "[ratelimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set — " +
            "API rate limiting is DISABLED. Set them to enforce limits in production."
    );
}

/** Named tiers. Tune here; the doc's runbook explains how. */
type Tier = "read" | "pdf" | "vision" | "service";

type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

const TIERS: Record<Tier, { tokens: number; window: Duration }> = {
    // Generous enough for infinite-scroll browsing, low enough that scraping
    // the whole bank takes an obvious, throttled, logged amount of time.
    read: { tokens: 240, window: "1 m" },
    // Puppeteer render — expensive; strict per-actor cap.
    pdf: { tokens: 20, window: "1 m" },
    // Paid OpenAI/Gemini vision extraction — cost-abuse guard.
    vision: { tokens: 100, window: "5 m" },
    // Our own tools (service key) get a higher ceiling.
    service: { tokens: 1200, window: "1 m" },
};

const limiters = new Map<Tier, Ratelimit>();

function limiter(tier: Tier): Ratelimit | null {
    if (!redis) return null;
    let l = limiters.get(tier);
    if (!l) {
        const t = TIERS[tier];
        l = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(t.tokens, t.window),
            prefix: `rl:${tier}`,
            analytics: false,
        });
        limiters.set(tier, l);
    }
    return l;
}

export type RateResult = {
    ok: boolean;
    limit: number;
    remaining: number;
    /** Epoch ms when the window resets. */
    reset: number;
};

/** Thrown when a rate limit is exceeded. Subclasses AuthError so every existing
 *  `catch (e) { if (e instanceof AuthError) ... }` handles it, returning 429. */
export class RateLimitError extends AuthError {
    readonly retryAfterSeconds: number;
    constructor(reset: number) {
        super("Too many requests. Please slow down.", 429);
        this.name = "RateLimitError";
        this.retryAfterSeconds = retryAfterSeconds(reset);
    }
}

/** Check a limit without throwing. Allows all when limiting is disabled. */
export async function rateLimit(tier: Tier, key: string): Promise<RateResult> {
    const l = limiter(tier);
    if (!l) return { ok: true, limit: 0, remaining: 0, reset: 0 };
    const r = await l.limit(key);
    return { ok: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

/** Check a limit and throw RateLimitError(429) if exceeded. */
export async function enforceRateLimit(tier: Tier, key: string): Promise<void> {
    const r = await rateLimit(tier, key);
    if (!r.ok) throw new RateLimitError(r.reset);
}

/** Best-effort client IP from proxy headers (Vercel/Netlify/Cloudflare). */
export function clientIp(request: Request): string {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    return (
        request.headers.get("cf-connecting-ip") ??
        request.headers.get("x-real-ip") ??
        "unknown"
    );
}

export function retryAfterSeconds(reset: number): number {
    const secs = Math.ceil((reset - Date.now()) / 1000);
    return secs > 0 ? secs : 1;
}
