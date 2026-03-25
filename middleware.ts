import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Protect all pages except the login and public assets
export const config = { 
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico).*)"] 
};