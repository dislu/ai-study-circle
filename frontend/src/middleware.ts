import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/features',
  '/how-it-works',
  '/about',
  '/examples'
];

// Define routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/documents',
  '/profile'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Check for authentication token
    const token = request.cookies.get('token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // Redirect to auth page with the original URL as a redirect parameter
      const authUrl = new URL('/auth', request.url);
      authUrl.searchParams.set('mode', 'signin');
      authUrl.searchParams.set('redirect', pathname);
      
      return NextResponse.redirect(authUrl);
    }
  }
  
  return NextResponse.next();
}

// Configure which routes to run middleware on
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