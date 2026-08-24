import { authkit, handleAuthkitProxy } from '@workos-inc/authkit-nextjs'
import { NextRequest, NextResponse } from 'next/server'

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

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://question-editor.vercel.app',
    'https://multi-crop.vercel.app',
    'https://omr-checker.vercel.app'
]

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

const CORS_METHODS = 'GET, POST, PUT, DELETE, OPTIONS'
const CORS_HEADERS =
    'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range, Expires'

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin')
    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Methods', CORS_METHODS)
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
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
        // API routes authorize themselves (lib/auth/guard.ts) and must answer
        // with a JSON 401 rather than an HTML redirect — the satellite tools
        // can't parse a redirect. They still need AuthKit's request headers.
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
