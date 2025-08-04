import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { useRouter } from 'next/router';
import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://question-editor.vercel.app',
    'https://multi-crop.vercel.app'
]

const isOnboardingRoute = (req: NextRequest) => req.nextUrl.pathname.startsWith('/onboarding');
const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Handle CORS for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return handleCors(req)
    }

    const { userId, sessionClaims } = await auth()

    // Always allow public routes and auth/signup/onboarding pages
    if (
        req.nextUrl.pathname.startsWith('/onboarding') ||
        req.nextUrl.pathname.startsWith('/auth') ||
        isPublicRoute(req)
    ) {
        return NextResponse.next()
    }

    // Redirect unsigned users trying to access private routes to sign up
    if (!userId) {
        return NextResponse.redirect(new URL('/auth/signup', req.url))
    }

    // Redirect users without onboardingComplete to onboarding flow
    if (userId && !sessionClaims?.metadata?.onboardingComplete) {
        return NextResponse.redirect(new URL('/onboarding/user-type', req.url))
    }

    // Allow signed in users on protected routes
    return NextResponse.next()
})


function handleCors(request: NextRequest) {
    const origin = request.headers.get('origin')
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)

    console.log('CORS Debug:', {
        origin,
        isAllowedOrigin,
        allowedOrigins,
        method: request.method,
        url: request.url
    })

    // Handle preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 })

        if (isAllowedOrigin) {
            response.headers.set('Access-Control-Allow-Origin', origin)
        }

        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range, Expires')
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours

        return response
    }

    // For other requests, let them proceed and add CORS headers in the response
    const response = NextResponse.next()

    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range, Expires')
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    return response
}

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
