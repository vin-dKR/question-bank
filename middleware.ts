import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define allowed origins
const allowedOrigins = ['https://question-editor.vercel.app', 'http://localhost:5173'];

// Define public API paths that don't require authentication
const isPublicRoute = createRouteMatcher(['/api/questions(.*)']);

// Define protected routes (e.g., frontend routes)
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

// Common headers to allow in CORS
const allowedHeaders = [
    'Content-Type',
    'Cache-Control',
    'Accept',
    'Accept-Language',
    'User-Agent',
    'Referer',
    'X-Requested-With',
    'Pragma',
    'Expires',
];

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Get the request's Origin header
    const origin = req.headers.get('origin') || '';

    // Log request details for debugging
    console.log('Request:', {
        path: req.nextUrl.pathname,
        method: req.method,
        origin,
        headers: [...req.headers.entries()],
    });

    // Normalize origin for comparison
    const isAllowedOrigin = origin && allowedOrigins.some(
        (allowed) => {
            const normalizedAllowed = allowed.toLowerCase().replace(/\/+$/, '');
            const normalizedOrigin = origin.toLowerCase().replace(/\/+$/, '');
            return normalizedAllowed === normalizedOrigin;
        }
    );

    // Handle CORS preflight requests for public API routes
    if (req.method === 'OPTIONS' && isPublicRoute(req)) {
        const headers: Record<string, string> = {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': allowedHeaders.join(', '),
            'Access-Control-Max-Age': '86400',
        };
        if (isAllowedOrigin) {
            headers['Access-Control-Allow-Origin'] = origin;
            headers['Vary'] = 'Origin';
        }
        return new NextResponse(null, { status: 204, headers });
    }

    // For public API routes, add CORS headers and restrict unallowed origins
    if (isPublicRoute(req)) {
        if (!isAllowedOrigin && origin !== '' && origin !== 'null') {
            console.log('Blocking unallowed origin:', origin);
            return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const response = NextResponse.next();
        if (isAllowedOrigin) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Vary', 'Origin');
        } else {
            response.headers.set('Access-Control-Allow-Origin', '*'); // For same-origin or no-origin
        }
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        return response;
    }

    // For protected routes, enforce Clerk authentication
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // For other routes, continue without modification
    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
