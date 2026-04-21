import { NextResponse } from 'next/server';

/**
 * Next.js Middleware for centralized route protection.
 * Runs on the Edge before every request.
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get('JSESSIONID');

    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some(path => pathname === path);
    
    // Public forms (e.g., /forms/[uuid]) should be accessible without login
    const isPublicForm = /^\/forms\/[a-f0-9-]+$/.test(pathname);
    
    // Static files, API routes, and public paths/forms are ignored by gating
    if (
        pathname.startsWith('/_next') || 
        pathname.startsWith('/api/') || 
        pathname.includes('/favicon.ico') ||
        isPublicPath ||
        isPublicForm
    ) {
        // If user is logged in and tries to access login/register, redirect to profile
        if (sessionCookie && isPublicPath) {
            return NextResponse.redirect(new URL('/profile', request.url));
        }
        return NextResponse.next();
    }

    // Protection logic for all other routes
    if (!sessionCookie) {
        const url = new URL('/login', request.url);
        // Optional: url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
