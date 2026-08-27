/**
 * Resolves a stored image reference to something renderable.
 *
 * Question rows come from two eras of the ingest pipeline. Newer rows store a full
 * Supabase URL; older ones store only the object name ("question_3_Foo.jpg") whose
 * bucket path was never recorded. Both point at real objects in the public `images`
 * bucket — the bare ones just need the base URL put back in front.
 *
 * Before this existed, every render site independently required the value to start
 * with "https", so roughly 1,700 questions silently showed no diagram at all.
 */

const BASE = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BASE_URL ?? "";

/**
 * Some stored URLs are double-encoded (%2520 where %20 was meant) and 404 unless
 * decoded once. Only applied to absolute URLs — a bare object name is passed
 * through untouched, since many already contain a deliberate %20.
 */
function decodeOnce(url: string): string {
    try {
        const decoded = decodeURIComponent(url);
        return decoded !== url ? decoded : url;
    } catch {
        return url;
    }
}

/**
 * Returns a usable src, or null when the value cannot be resolved to one.
 * Handles absolute URLs, data URLs, app-relative paths, and bare object names.
 */
export function resolveQuestionImage(src: string | null | undefined): string | null {
    if (!src) return null;

    const trimmed = src.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith("data:")) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;

    if (/^https?:\/\//i.test(trimmed)) {
        const decoded = decodeOnce(trimmed);
        try {
            return new URL(decoded).toString();
        } catch {
            return null;
        }
    }

    // A bare object name. Without a base URL configured there is nothing to build.
    if (!BASE) return null;
    return BASE.replace(/\/+$/, "") + "/" + trimmed.replace(/^\/+/, "");
}

/** True when the reference can be rendered — use to gate the <Image> entirely. */
export function hasQuestionImage(src: string | null | undefined): boolean {
    return resolveQuestionImage(src) !== null;
}
