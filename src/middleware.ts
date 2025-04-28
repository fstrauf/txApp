import { withAuth } from 'next-auth/middleware';

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
// This protects routes by default if the user is not authenticated.
export default withAuth({
  // Matches the pages we want to protect
  pages: {
    signIn: '/auth/signin', // Redirect to the actual signin page
    // error: '/auth/error', // Optional: page to redirect to on error
  },
});

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
    '/lunchmoney/:path*', // Protects /lunchmoney and all sub-routes like /lunchmoney/settings
    // Add other paths you want to protect here, e.g., '/dashboard/:path*'
  ],
}; 