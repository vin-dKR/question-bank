import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// Add your allowed domains here
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'https://localhost:5173',
    'https://question-editor.vercel.app',
    'https://multi-crop.vercel.app'
    // Add more domains as needed
]

export default clerkMiddleware((auth: any, req: NextRequest) => {
    // Handle CORS for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return handleCors(req)
    }
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
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range')
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
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
