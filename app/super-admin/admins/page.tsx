// --- BLOCK app/super-admin/admins/page.tsx OPEN ---
import React from "react";
import { prisma } from "@/lib/prisma";
import AdminsManager from "./components/AdminsManager";

export const dynamic = "force-dynamic";

export default async function SuperAdminsPage() {
  // Fetch all users belonging to Organization 1 (Master HQ)
  const admins = await prisma.user.findMany({
    where: { organizationId: 1 },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { id: 'asc' }
  });

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
      
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admin Accounts</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage personnel who have access to the Master System.</p>
      </div>

      <div className="max-w-5xl">
        <AdminsManager initialAdmins={admins} />
      </div>

    </div>
  );
}
// --- BLOCK app/super-admin/admins/page.tsx CLOSE ---