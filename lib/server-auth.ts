// --- BLOCK lib/server-auth.ts OPEN ---
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * A secure helper function for Server Actions and API Routes.
 * It strictly enforces that a user is logged in and returns their Organization ID.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).orgId) {
    // If there is no session or no orgId, throw a secure error
    throw new Error("UNAUTHORIZED: You must be logged in to perform this action.");
  }

  return {
    user: session.user,
    orgId: (session.user as any).orgId as number,
  };
}
// --- BLOCK lib/server-auth.ts CLOSE ---