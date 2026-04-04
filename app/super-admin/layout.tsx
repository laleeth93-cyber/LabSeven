// --- BLOCK app/super-admin/layout.tsx OPEN ---
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // 🚨 THE LOCKDOWN: Check if user exists and if their Lab ID is exactly 1 (Master HQ)
  if (!session?.user || (session.user as any).orgId !== 1) {
    // If they are a normal user trying to sneak into the Super Admin URL, kick them back to dashboard!
    redirect("/?view=dashboard"); 
  }

  // If they pass the security check, render the Super Admin pages
  return <>{children}</>;
}
// --- BLOCK app/super-admin/layout.tsx CLOSE ---