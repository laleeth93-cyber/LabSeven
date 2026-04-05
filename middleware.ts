// --- BLOCK middleware.ts OPEN ---
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: '/login', // Redirect unauthenticated users to the login page
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - register (SaaS signup page)
     * - reset (Forgot password page) 🚨 ADDED THIS 🚨
     * - api (API routes should handle their own auth)
     * - logo
     */
    '/((?!_next/static|_next/image|favicon.ico|login|register|reset|api|logo).*)',
  ],
};
// --- BLOCK middleware.ts CLOSE ---