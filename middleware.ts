import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Export the middleware function
export default function middleware(request: NextRequest) {
    // Get the response
    const response = NextResponse.next()

    // Add CORS headers to all responses
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', '*')
    response.headers.set('Access-Control-Max-Age', '86400')

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
        })
    }

    return response
}

// Apply middleware to all API routes
export const config = {
    matcher: [
        '/api/:path*',
    ],
};
