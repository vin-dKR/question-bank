import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

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
    cached = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return cached;
}

export const SUPABASE_IMAGE_BUCKET = process.env.SUPABASE_IMAGE_BUCKET ?? "images";
