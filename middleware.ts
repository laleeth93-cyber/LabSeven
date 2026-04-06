// --- BLOCK middleware.ts OPEN ---
import { withAuth } from "next-auth/middleware";

export default withAuth({
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
});

// Explicitly match all routes, letting the 'authorized' callback handle the logic
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo\\.png).*)'],
};
// --- BLOCK middleware.ts CLOSE ---