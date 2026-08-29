/**
 * Turn anything thrown or returned into text a person can read.
 *
 * Exists because a toast reading "[object Object]" was shipped to a user. The
 * value had crossed a service boundary typed as `string`, which it was only by
 * agreement — the bg-clean service returned an object, it reached
 * `new Error(...)`, and stringified to that literal text. The type said string;
 * the runtime disagreed; the user got nothing useful.
 *
 * Use this at every point where a value of uncertain shape becomes UI text.
 * Types do not survive a network hop, so the boundary needs a runtime guard,
 * not a cast.
 */
export function errorText(value: unknown, fallback = "Something went wrong."): string {
    if (typeof value === "string") return value.trim() || fallback;
    if (value instanceof Error) return value.message.trim() || fallback;

    if (value && typeof value === "object") {
        // Common shapes from APIs and validation layers, in the order they are
        // worth trying: our own `{error}`, FastAPI's `{detail}`, a plain
        // `{message}`.
        const o = value as Record<string, unknown>;
        for (const key of ["error", "detail", "message"]) {
            const v = o[key];
            if (typeof v === "string" && v.trim()) return v;
        }
        // An array of validation errors — surface the first readable one rather
        // than the whole payload.
        if (Array.isArray(o.detail) && o.detail.length) {
            const first = o.detail[0] as Record<string, unknown>;
            if (typeof first?.msg === "string") return first.msg;
        }
        try {
            const json = JSON.stringify(value);
            // Better a short raw payload than "[object Object]"; anything long
            // is noise in a toast.
            if (json && json !== "{}" && json.length <= 200) return json;
        } catch {
            // Circular or otherwise unserialisable — fall through.
        }
    }

    return fallback;
}
