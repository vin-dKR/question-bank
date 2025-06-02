import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

// Define which routes should be protected by Clerk
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
]);

// Define your API routes that need CORS
const isApiRoute = (pathname: string) => {
    return pathname.startsWith('/api/');
};

export default async function middleware(request: NextRequest) {
    // Handle API routes with CORS
    if (isApiRoute(request.nextUrl.pathname)) {
        const response = NextResponse.next();

        // Set CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', '*');
        response.headers.set('Access-Control-Max-Age', '86400');

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        return response;
    }

    // Handle protected routes with Clerk
    if (isProtectedRoute(request)) {
        return clerkMiddleware()
    }

    // For all other routes, just continue
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!.*\\..*|_next).*)', // Don't run middleware on static files
        '/',
        '/(api|trpc)(.*)'         // Run middleware on API routes
    ],
};
