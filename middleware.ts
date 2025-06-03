import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define allowed origins
const allowedOrigins = ['https://multi-crop.vercel.app']

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

    // Normalize origin for comparison (handle null, case sensitivity, etc.)
    const isAllowedOrigin = origin && allowedOrigins.some(
        (allowed) => allowed.toLowerCase() === origin.toLowerCase()
    );

    // Handle CORS preflight requests for public API routes
    if (req.method === 'OPTIONS' && isPublicRoute(req)) {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': allowedHeaders.join(', '),
                'Access-Control-Max-Age': '86400',
                ...(isAllowedOrigin && { 'Vary': 'Origin' }),
            },
        });
    }

    // For public API routes, add CORS headers and restrict unallowed origins
    if (isPublicRoute(req)) {
        if (!isAllowedOrigin && origin !== '' && origin !== 'null') {
            console.log('Blocking unallowed origin:', origin);
            return new NextResponse(JSON.stringify({ error: 'Origin not allowed' }), {
                status: 403,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }

        const response = NextResponse.next();
        // Allow same-origin or no-origin requests (e.g., curl without Origin header)
        response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        response.headers.set('Vary', 'Origin');
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
        // Skip Next.js internals and static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
