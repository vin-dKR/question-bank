import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/api/questions(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

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

export default clerkMiddleware(async (auth, req) => {
    const origin = req.headers.get('origin') || '';

    console.log('Request:', {
        path: req.nextUrl.pathname,
        method: req.method,
        origin,
        headers: [...req.headers.entries()],
        isPublicRoute: isPublicRoute(req),
    });

    if (isPublicRoute(req)) {
        if (req.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
                    'Access-Control-Max-Age': '86400',
                    'Vary': 'Origin',
                },
            });
        }

        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
        response.headers.set('Vary', 'Origin');
        console.log('Response Headers:', [...response.headers.entries()]);
        return response;
    }

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

