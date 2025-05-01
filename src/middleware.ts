import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
// This protects routes by default if the user is not authenticated.
export default withAuth(
  // Note that this function is passed 세션 object -> token is Type DecodedJWT
  function middleware(req: NextRequestWithAuth) {
    // If the user is trying to access /integrations immediately after signup (inferred by presence of action param potentially, though we removed it)
    // or just generally, we might allow access even if token is briefly null during redirect.
    // For simplicity now, we just let the page handle auth check if needed.
    // console.log('Middleware path:', req.nextUrl.pathname)
    // console.log('Middleware token:', req.nextauth.token)

    // Example: Allow access to /integrations regardless, page will handle trial logic
    if (req.nextUrl.pathname.startsWith('/integrations')) {
      return NextResponse.next();
    }

    // For other matched routes (like /lunchmoney), this will enforce authentication.
    // If the token is null (not authenticated), withAuth will redirect to signIn page.
    
    // If we reach here for a protected route and the user *is* authenticated,
    // NextResponse.next() allows the request to proceed.
    // The default behavior of withAuth handles the redirection for unauthenticated users for matched routes.
  },
  {
    callbacks: {
      // authorized callback determines if the user is authorized for matched routes
      authorized: ({ token, req }) => {
        // Allow access to /integrations explicitly - This might be redundant if handled above, but adds clarity
        if (req.nextUrl.pathname.startsWith('/integrations')) {
          return true; 
        }
        // For all other routes matched by `config.matcher` (e.g., /lunchmoney), require a token
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

// Define the routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page itself)
     * - / (the public homepage) - Adjust if your homepage requires login
     */
    // '/((?!api|_next/static|_next/image|favicon.ico|login|^/$).*)', // Example stricter matcher

    // Or, simply list the paths to protect:
    '/integrations/:path*', // Check integrations explicitly
    '/lunchmoney/:path*', // Protects /lunchmoney and all sub-routes like /lunchmoney/settings
    // Add other paths you want to protect here, e.g., '/dashboard/:path*'
  ],
}; 