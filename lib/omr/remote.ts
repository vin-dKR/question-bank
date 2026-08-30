const OMR_SERVICE_TOKEN_HEADER = "x-omr-service-token";
const VERCEL_PROTECTION_BYPASS_HEADER = "x-vercel-protection-bypass";

export interface RemoteOmrService {
    baseUrl: string;
    headers: Record<string, string>;
}

function normalizeBaseUrl(raw: string, source: string, vercelSystemUrl = false): string {
    const value = vercelSystemUrl && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`${source} must be a valid absolute URL.`);
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error(`${source} must use http or https.`);
    }
    if (url.username || url.password) {
        throw new Error(`${source} must not contain credentials.`);
    }
    if (url.search || url.hash) {
        throw new Error(`${source} must not contain a query string or fragment.`);
    }

    const pathname = url.pathname.replace(/\/+$/, "");
    if (pathname && pathname !== "/api") {
        throw new Error(`${source} must point to the service origin, optionally ending in /api.`);
    }

    const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:" && !isLoopback) {
        throw new Error(`${source} must use https in production.`);
    }

    return url.origin;
}

function selectedBaseUrl(): string | null {
    const configured = process.env.OMR_SERVICE_URL?.trim();
    if (configured) return normalizeBaseUrl(configured, "OMR_SERVICE_URL");

    const deploymentUrl = process.env.VERCEL_URL?.trim();
    const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    const vercelEnvironment = process.env.VERCEL_ENV?.trim();

    // Preview deployments must call their own deployment, not silently send
    // data to production. Production uses the stable production domain.
    if (vercelEnvironment === "preview" && deploymentUrl) {
        return normalizeBaseUrl(deploymentUrl, "VERCEL_URL", true);
    }
    if (vercelEnvironment === "production" && productionUrl) {
        return normalizeBaseUrl(productionUrl, "VERCEL_PROJECT_PRODUCTION_URL", true);
    }

    // VERCEL_ENV can be absent when system variables are copied to another
    // host. Prefer the exact deployment in that ambiguous case.
    if (deploymentUrl) return normalizeBaseUrl(deploymentUrl, "VERCEL_URL", true);
    if (productionUrl) {
        return normalizeBaseUrl(productionUrl, "VERCEL_PROJECT_PRODUCTION_URL", true);
    }

    return null;
}

/**
 * Resolve one remote service for the current environment.
 *
 * There is deliberately no multi-URL retry: falling from a protected preview
 * deployment through to production can cross environment boundaries and hide
 * a broken deployment. Local development returns null and uses local Python.
 */
export function getRemoteOmrService(): RemoteOmrService | null {
    const baseUrl = selectedBaseUrl();
    if (!baseUrl) return null;

    const serviceToken = process.env.OMR_SERVICE_TOKEN?.trim();
    if (!serviceToken) {
        throw new Error("OMR_SERVICE_TOKEN must be configured when using the remote OMR service.");
    }

    const headers: Record<string, string> = {
        "content-type": "application/json",
        [OMR_SERVICE_TOKEN_HEADER]: serviceToken,
    };

    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
    if (bypassSecret) {
        headers[VERCEL_PROTECTION_BYPASS_HEADER] = bypassSecret;
    }

    return { baseUrl, headers };
}

export function describeRemoteEndpoint(baseUrl: string, endpoint: string): string {
    const url = new URL(endpoint, baseUrl);
    return `${url.origin}${url.pathname}`;
}

export function remoteHttpError(
    response: Response,
    responseText: string,
    endpoint: string,
    applicationError?: string,
): Error {
    if (response.status === 401 && applicationError === "Unauthorized") {
        return new Error(
            `${endpoint} rejected x-omr-service-token. Verify OMR_SERVICE_TOKEN matches the remote service deployment.`,
        );
    }

    const normalizedBody = responseText.toLowerCase();
    const looksProtected =
        (response.status === 401 || response.status === 403) &&
        (normalizedBody.includes("protected deployment") ||
            normalizedBody.includes("authentication required") ||
            normalizedBody.includes("vercel"));

    if (looksProtected) {
        return new Error(
            `${endpoint} was blocked by Vercel Deployment Protection (${response.status}). ` +
                "Enable Protection Bypass for Automation and provide VERCEL_AUTOMATION_BYPASS_SECRET to the caller.",
        );
    }

    const detail = applicationError || response.statusText || `HTTP ${response.status}`;
    return new Error(`${endpoint} returned ${response.status}: ${detail}`);
}
