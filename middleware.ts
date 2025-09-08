import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://question-editor.vercel.app',
    'https://multi-crop.vercel.app',
    'https://omr-checker.vercel.app'
]

const isOnboardingRoute = (req: NextRequest) => req.nextUrl.pathname.startsWith('/onboarding');
const isPublicRoute = createRouteMatcher(['/auth/signin', '/auth/signup', '/auth/sso-callback', "/", "/api", "/api/omr"])

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // console.log("c-midddleare", req.url)
    // Handle CORS for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return handleCors(req)
    }

    const { userId, sessionClaims, redirectToSignIn } = await auth()

    // For users visiting /onboarding, don't try to redirect
    if (userId && isOnboardingRoute(req)) {
        return NextResponse.next()
    }

    // If the user isn't signed in and the route is private, redirect to sign-in
    if (!userId && !isPublicRoute(req)) return redirectToSignIn({ returnBackUrl: req.url })

    // Catch users who do not have `onboardingComplete: true` in their publicMetadata
    // Redirect them to the /onboarding route to complete onboarding
    if (userId && !sessionClaims?.metadata?.onboardingComplete) {
        console.log("the sessionClaims is not true")
        const onboardingUrl = new URL('/onboarding/user-type', req.url)
        return NextResponse.redirect(onboardingUrl)
    }

    // If the user is logged in and the route is protected, let them view.
    if (userId && !isPublicRoute(req)) return NextResponse.next()
})


function handleCors(request: NextRequest) {
    const origin = request.headers.get('origin')
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)

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
