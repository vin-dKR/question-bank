import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/api/questions(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const origin = req.headers.get('origin') || '';
    console.log('Request:', {
        path: req.nextUrl.pathname,
        method: req.method,
        origin,
    });

    // Handle CORS for public routes
    if (isPublicRoute(req)) {
        // Handle preflight (OPTIONS) requests
        {/*
        if (req.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*', // Or specify allowed origins, e.g., 'https://question-editor.vercel.app'
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
                },
            });
        }
        */}

        // Handle actual requests
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*'); // Or specify allowed origins
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        console.log('Response Headers:', [...response.headers.entries()]);
        return response;
    }

    // Protect other routes
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
