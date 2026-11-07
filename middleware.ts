// --- BLOCK middleware.ts OPEN ---
import { withAuth } from "next-auth/middleware";

import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (token?.isSupportMode) {
      // Support mode now has access to all routes including registration, list, and results.
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        
        // Allow all public routes to bypass authentication
        if (
          path.startsWith('/login') ||
          path.startsWith('/register') ||
          path.startsWith('/reset') ||
          path.startsWith('/verify') || 
          path.startsWith('/api')
        ) {
          return true; 
        }
        
        // Require auth for everything else
        return !!token;
      }
    }
  }
);

// Explicitly match all routes except NextAuth internal endpoints and static assets
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|logo\\.png).*)'],
};
// --- BLOCK middleware.ts CLOSE ---