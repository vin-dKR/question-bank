import "server-only";

/**
 * Cloudflare Turnstile server-side verification (docs/API_SECURITY.md, Layer 4).
 *
 * PLACEMENT NOTE: account SIGN-UP runs on WorkOS-HOSTED AuthKit pages, so the
 * anti-bot control for signup itself is a WorkOS dashboard setting, not an
 * in-app widget. This helper is for the surfaces we DO control: a step-up
 * challenge on a custom form, or when an actor trips the bulk-read ceiling and
 * we want to prove a human is driving before letting them continue.
 *
 * `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are already
 * provisioned in the environment.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Returns true if the token is a valid Turnstile solution. Fails OPEN when the
 * secret isn't configured (dev/preview) so local flows aren't blocked, but logs
 * in production so a missing secret is visible rather than silently permissive.
 */
export async function verifyTurnstile(
    token: string | null | undefined,
    ip?: string
): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — challenge skipped.");
        }
        return true;
    }
    if (!token) return false;

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    try {
        const res = await fetch(VERIFY_URL, { method: "POST", body });
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
    } catch (err) {
        console.error("[turnstile] verification request failed:", err);
        return false;
    }
}
