import { NextRequest, NextResponse } from 'next/server'

/**
 * SINGLE SOURCE OF TRUTH for cross-origin access (docs/API_SECURITY.md, Layer 6).
 * `middleware.ts` imports `allowedOrigins` from here — do not keep a second copy.
 * (netlify.toml also sets edge CORS headers for a couple of paths; prefer letting
 * this runtime layer own CORS so the lists can't drift again.)
 *
 * IMPORTANT: CORS is a BROWSER control only. It does NOT stop curl / servers /
 * Postman from calling these endpoints — authentication (lib/auth/guard.ts)
 * does. Never treat the origin allowlist as a security boundary.
 *
 * We deliberately DO NOT send `Access-Control-Allow-Credentials: true`: the
 * satellite tools authenticate with a Bearer token (not cookies), so credentialed
 * CORS is unnecessary, and reflecting an arbitrary origin together with
 * credentials is a well-known misconfiguration. Dropping it lets us stay strict.
 */

const PROD_ORIGINS = [
    'https://question-editor.vercel.app',
    'https://multi-crop.vercel.app',
    'https://omr-checker.vercel.app',
]

const DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
]

/** Localhost origins are only allowed outside production. */
export const allowedOrigins =
    process.env.NODE_ENV === 'production'
        ? PROD_ORIGINS
        : [...PROD_ORIGINS, ...DEV_ORIGINS]

export function corsHeaders(request: NextRequest) {
    const origin = request.headers.get('origin')
    const headers = new Headers()

    if (origin && allowedOrigins.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin)
        // Responses vary by Origin now that we reflect it — keep caches correct.
        headers.set('Vary', 'Origin')
    }

    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range, Expires'
    )

    return headers
}

export function handleCorsResponse(request: NextRequest, response: NextResponse) {
    corsHeaders(request).forEach((value, key) => response.headers.set(key, value))
    return response
}

export function handleOptionsRequest(request: NextRequest) {
    const headers = corsHeaders(request)
    headers.set('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours
    return new NextResponse(null, { status: 200, headers })
}
