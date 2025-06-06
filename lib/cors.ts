import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'https://question-editor.vercel.app',
    'https://multi-crop.vercel.app'
]

export function corsHeaders(request: NextRequest) {
    const origin = request.headers.get('origin')
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)
    
    const headers = new Headers()
    
    if (isAllowedOrigin) {
        headers.set('Access-Control-Allow-Origin', origin)
    }
    
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Accept-Language, Content-Language, Range, Expires')
    headers.set('Access-Control-Allow-Credentials', 'true')
    
    return headers
}

export function handleCorsResponse(request: NextRequest, response: NextResponse) {
    const corsHeadersObj = corsHeaders(request)
    
    // Add CORS headers to the response
    corsHeadersObj.forEach((value, key) => {
        response.headers.set(key, value)
    })
    
    return response
}

export function handleOptionsRequest(request: NextRequest) {
    const headers = corsHeaders(request)
    headers.set('Access-Control-Max-Age', '86400') // Cache preflight for 24 hours
    
    return new NextResponse(null, {
        status: 200,
        headers
    })
} 