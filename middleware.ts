import { authkit, handleAuthkitProxy } from '@workos-inc/authkit-nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { allowedOrigins } from '@/lib/cors'

/**
 * One pass, two concerns:
 *
 *   1. CORS for /api/* (the allowlist below is duplicated in netlify.toml for
 *      /api/omr/* and /api/questions — update BOTH).
 *   2. "signed in or not" for everything else.
 *
 * TWO THINGS HERE ARE EASY TO GET WRONG, AND BOTH FAIL ONLY AT RUNTIME:
 *
 * (a) `authkit()` must run for API routes too. `withAuth()` THROWS if the
 *     `x-workos-middleware` request header is missing — it does not fall back to
 *     reading the session cookie. So short-circuiting /api/* straight to a CORS
 *     response breaks every route that calls getAuthContext(): the questions
 *     API, school-test, OMR. Only the OPTIONS preflight can skip it.
 *
 * (b) The headers `authkit()` returns must be merged with `handleAuthkitProxy`,
 *     not passed to `NextResponse.next({ headers })`. Some of them
 *     (`x-workos-session`, `x-workos-middleware`, `x-url`, …) are REQUEST
 *     headers meant only for downstream server components. Setting them as
 *     response headers leaks the sealed session to the browser and starves
 *     `withAuth()` of what it needs.
 *
 * The onboarding gate that used to live here is gone (doc §6) — it read
 * `sessionClaims.metadata.onboardingComplete`, a Clerk publicMetadata field
 * AuthKit has no equivalent for. It is now a DB check in
 * app/(dashboard)/layout.tsx. Middleware does the one thing it is good at.
 */

// `allowedOrigins` is imported from lib/cors — the single source of truth. It
// gates localhost to non-production. (Previously this file, lib/cors.ts, and
// netlify.toml each kept their own drifting copy — see doc §Layer 6.)

/** Reachable without a session. */
const PUBLIC_PATHS = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/forgot-pass',
]

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.includes(pathname)
}

/**
 * The ONLY API paths reachable without a WorkOS session or a Bearer token.
 * Everything else under /api/* is default-DENY (see the isApi block below):
 * the middleware rejects anonymous callers with a JSON 401 before the route
 * runs, so a route that forgets to call its own guard can no longer leak.
 *
 * `/api/webhooks/workos` is public because it authenticates itself by HMAC
 * signature (WorkOS has no session cookie) — see the route's constructEvent().
 */
const PUBLIC_API_PATHS = [
    '/api/webhooks/workos',
]

function isPublicApiPath(pathname: string): boolean {
    return PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

const CORS_METHODS = 'GET, POST, PUT, DELETE, OPTIONS'
const CORS_HEADERS =
    'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range, Expires'

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin')
    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Vary', 'Origin')
    }
    response.headers.set('Access-Control-Allow-Methods', CORS_METHODS)
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS)
    // No `Access-Control-Allow-Credentials`: the satellites authenticate with a
    // Bearer token, not cookies, so credentialed CORS is unnecessary (and
    // reflecting an origin with credentials is a known risk). See lib/cors.ts.
    return response
}

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isApi = pathname.startsWith('/api/')

    // Preflight carries no credentials and needs no session work.
    if (isApi && request.method === 'OPTIONS') {
        const response = applyCors(request, new NextResponse(null, { status: 200 }))
        response.headers.set('Access-Control-Max-Age', '86400')
        return response
    }

    const { session, headers, authorizationUrl } = await authkit(request)

    if (isApi) {
        // DEFAULT-DENY. Anonymous callers (no session AND no Bearer token) are
        // rejected here with a JSON 401 — never an HTML redirect, which the
        // satellite tools can't parse. A route can still tighten this (org /
        // ownership / valid-key checks via lib/auth/guard.ts), but it can no
        // longer accidentally be *looser* than "someone presented credentials".
        //
        // We only check for the PRESENCE of a Bearer header here, not its
        // validity — requireApiActor() does the constant-time key comparison
        // inside the route. Presence is enough to let the request through to
        // the code that can answer with the right 401 shape.
        const hasBearer = request.headers.get('authorization')?.startsWith('Bearer ')
        if (!isPublicApiPath(pathname) && !session.user && !hasBearer) {
            return applyCors(
                request,
                NextResponse.json(
                    { success: false, error: 'Authentication required.' },
                    { status: 401 }
                )
            )
        }

        // Authorized-or-will-be: pass through with AuthKit's request headers so
        // getAuthContext() / withAuth() work downstream.
        return applyCors(request, handleAuthkitProxy(request, headers))
    }

    if (!session.user && !isPublicPath(pathname) && authorizationUrl) {
        // Straight to the hosted AuthKit page. The PKCE cookie authkit() just
        // minted is in `headers`, so this needs no extra hop through
        // /auth/signin (that route still exists for direct links).
        return handleAuthkitProxy(request, headers, { redirect: authorizationUrl })
    }

    return handleAuthkitProxy(request, headers)
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
