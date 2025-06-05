import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes are considered public (accessible from other origins)
const isPublicRoute = createRouteMatcher(['/api/questions(.*)']);
// Define which routes are protected (require authentication)
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)']);

// Your Clerk middleware function
export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Get the origin of the request (where the request is coming from)
    const origin = req.headers.get('origin') || '';
    console.log('Request:', {
        path: req.nextUrl.pathname,
        method: req.method,
        origin,
    });

    // Start with the default response that would normally be returned by Next.js
    const response = NextResponse.next();

    // --- CORS Handling Logic ---
    // Check if the requested route is a public route that needs CORS enabled
    if (isPublicRoute(req)) {
        // Set the necessary CORS headers on the response.
        // These headers tell the browser that it's okay for certain origins to access this resource.

        // 'Access-Control-Allow-Origin': This is the most critical header.
        // It specifies which origin(s) are allowed to access the resource.
        // **Set this to the origin of your frontend application.**
        // In your case, it's 'https://question-editor.vercel.app'.
        // Using '*' is generally less secure as it allows any origin, but can be useful for development or public APIs.
        // For production, specifying the exact origin(s) is recommended.
        response.headers.set('Access-Control-Allow-Origin', 'https://question-editor.vercel.app');

        // 'Access-Control-Allow-Methods': This header specifies which HTTP methods
        // (GET, POST, PUT, DELETE, OPTIONS, etc.) are allowed when accessing the resource.
        // Include all the methods your frontend will use to interact with this API endpoint.
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        // 'Access-Control-Allow-Headers': This header is required for "non-simple" requests,
        // which include requests with custom headers (like 'Content-Type' if it's not application/x-www-form-urlencoded,
        // multipart/form-data, or text/plain, or 'Authorization' if you were using it).
        // You need to list the headers your frontend might send in cross-origin requests.
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 'Access-Control-Max-Age': This header tells the browser how long it can cache
        // the results of a preflight (OPTIONS) request. This can improve performance
        // by reducing the number of OPTIONS requests for subsequent requests to the same URL.
        // The value is in seconds (86400 seconds = 24 hours).
        response.headers.set('Access-Control-Max-Age', '86400');

        // Handle Preflight (OPTIONS) requests:
        // Browsers send an OPTIONS request before certain types of cross-origin requests
        // to check if the actual request is safe to send. Your server needs to respond
        // to this OPTIONS request with the correct CORS headers.
        if (req.method === 'OPTIONS') {
            // For an OPTIONS request, the server typically responds with a 204 No Content status
            // and includes the CORS headers. We return a new NextResponse with the status and headers.
            return new NextResponse(null, {
                status: 204, // 204 means "No Content" - the browser only needs the headers from this request.
                headers: response.headers, // Use the CORS headers we just set
            });
        }
    }

    // --- Protected Route Handling (Original Clerk Logic) ---
    // If the route is protected, use Clerk's authentication logic.
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Log the response headers being sent (useful for debugging)
    console.log('Response Headers:', [...response.headers.entries()]);

    // Return the response (either the original response with CORS headers for public routes,
    // or the result of auth.protect() for protected routes).
    return response;
});

// Configuration for the middleware, specifying which paths it should apply to.
export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
