// --- BLOCK types/next-auth.d.ts OPEN ---
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    orgId: number; // Added our SaaS Organization ID
    isSupportMode?: boolean; // Flag for Global Support Admin Access
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    orgId: number; // Added our SaaS Organization ID
    isSupportMode?: boolean; // Flag for Global Support Admin Access
  }
}
// --- BLOCK types/next-auth.d.ts CLOSE ---