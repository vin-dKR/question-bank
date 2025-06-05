import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicApiRoute = createRouteMatcher(['/api/(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

export default function middleware(req: NextRequest) {
    const origin = req.headers.get('origin') || '';
    console.log('Request:', {
        path: req.nextUrl.pathname,
        method: req.method,
        origin,
    });

    // Handle all /api routes (bypass Clerk authentication)
    if (isPublicApiRoute(req)) {
        // Handle preflight (OPTIONS) requests
        if (req.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*', // Or 'https://question-editor.vercel.app'
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Handle other methods (GET, POST, PUT, etc.)
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*'); // Or 'https://question-editor.vercel.app'
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        console.log('Response Headers:', [...response.headers.entries()]);
        return response;
    }

    // Apply Clerk authentication for protected routes
    if (isProtectedRoute(req)) {
        return clerkMiddleware();
    }

    // Pass through other routes without Clerk
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
