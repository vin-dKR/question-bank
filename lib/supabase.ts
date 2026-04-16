import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Try to extract the `role` claim out of a Supabase JWT without verifying the
 * signature. Used only for diagnostic logs — we're proving to ourselves that
 * the key we loaded CLAIMS to be service_role. If Supabase still enforces RLS
 * despite that, it means the key was invalidated on the server side (secret
 * rotated) and is being silently downgraded to anon.
 */
function decodeJwtRoleClaim(jwt: string): string | null {
    try {
        const payload = jwt.split(".")[1];
        if (!payload) return null;
        const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
        const json = Buffer.from(padded, "base64").toString("utf8");
        const parsed = JSON.parse(json) as { role?: string };
        return parsed.role ?? null;
    } catch {
        return null;
    }
}

/**
 * Server-side Supabase client using the service role key.
 * Never import this from a client component — the service role key must not
 * reach the browser.
 */
export function supabaseServer(): SupabaseClient {
    if (cached) return cached;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
        throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
    }

    const role = decodeJwtRoleClaim(key);
    const masked = `${key.slice(0, 12)}…${key.slice(-6)}`;
    console.log(
        `[school-test][supabase] client init — url=${url} keyRoleClaim=${role ?? "unknown"} ` +
        `keyLen=${key.length} key=${masked}`,
    );
    if (role !== "service_role") {
        console.warn(
            `[school-test][supabase] WARNING: SUPABASE_SERVICE_KEY does not claim role=service_role ` +
            `(got role=${role ?? "unknown"}). RLS will apply to this key and uploads will likely 403.`,
        );
    }

    cached = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return cached;
}

export const SUPABASE_IMAGE_BUCKET = process.env.SUPABASE_IMAGE_BUCKET ?? "images";
