// --- BLOCK middleware.ts OPEN ---
import { withAuth } from "next-auth/middleware";

import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (token?.isSupportMode) {
      if (
        path.startsWith('/list') ||
        path.startsWith('/results') ||
        path.startsWith('/registration')
      ) {
        return NextResponse.redirect(new URL('/', req.url));
      }
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

// Explicitly match all routes, letting the 'authorized' callback handle the logic
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo\\.png).*)'],
};
// --- BLOCK middleware.ts CLOSE ---