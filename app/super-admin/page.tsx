// --- BLOCK app/super-admin/page.tsx OPEN ---
import React from "react";
import { prisma } from "@/lib/prisma";
import SuperAdminTable from "./components/SuperAdminTable";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const labs = await prisma.organization.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      plan: true,
      isActive: true,
      hasSensitivity: true,
      createdAt: true,
      subscriptionEndsAt: true,
      _count: {
        select: { bills: true }
      }
    }
  });

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/50 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Master HQ <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-[10px] uppercase rounded-full border border-fuchsia-200">System Control</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage tenant lifecycle, subscriptions, and system security.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 mb-6">
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Labs</p>
            <p className="text-2xl font-black text-[#a07be1] mt-1">{labs.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Active Subs</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {labs.filter(l => l.isActive && l.id !== 1).length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Bills Generated</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {labs.reduce((acc, lab) => acc + lab._count.bills, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
        <SuperAdminTable labs={labs} />
      </div>

    </div>
  );
}
// --- BLOCK app/super-admin/page.tsx CLOSE ---