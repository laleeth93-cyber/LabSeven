// --- BLOCK app/super-admin/expiring/page.tsx OPEN ---
import React from "react";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Clock, PhoneForwarded } from "lucide-react";
import SuperAdminTable from "../components/SuperAdminTable";

export const dynamic = 'force-dynamic';

export default async function ExpiringLabsPage() {
  
  // 1. Fetch all labs except Master HQ
  const allLabs = await prisma.organization.findMany({
    where: { id: { not: 1 } },
    include: {
      _count: { select: { bills: true } }
    }
  });

  // 2. Filter them manually to ensure the 5-Day fallback applies to older accounts
  const labs = allLabs.filter(lab => {
      let expDate = lab.subscriptionEndsAt ? new Date(lab.subscriptionEndsAt) : null;
      
      // If missing from database, calculate 5 days from creation
      if (!expDate) {
          expDate = new Date(lab.createdAt);
          expDate.setDate(expDate.getDate() + 5);
      }

      const today = new Date();
      const next5Days = new Date();
      next5Days.setDate(today.getDate() + 5);

      // Only keep labs expiring between right now and 5 days from now
      return expDate >= today && expDate <= next5Days;
  });

  // Sort the results so the closest expiration shows up first
  labs.sort((a, b) => {
      const dateA = a.subscriptionEndsAt ? new Date(a.subscriptionEndsAt) : new Date(a.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      const dateB = b.subscriptionEndsAt ? new Date(b.subscriptionEndsAt) : new Date(b.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      return dateA.getTime() - dateB.getTime();
  });

  const expiringCount = labs.length;

  return (
    <div className="w-full max-w-[100vw] min-h-screen bg-slate-50 p-4 md:p-6 font-sans overflow-x-hidden">
      
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-red-600 tracking-tight flex items-center gap-2">
            <AlertTriangle size={24} />
            Expiring Within 5 Days
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">High-priority renewal targets. Contact these labs immediately.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-lg border border-red-200 shadow-sm flex-1 xl:flex-none min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center"><Clock size={16} className="text-red-600" /></div>
            <div><p className="text-[11px] font-bold text-red-400 uppercase">At Risk</p><p className="text-lg font-black text-red-700 leading-none">{expiringCount}</p></div>
          </div>
          <div className="flex items-center gap-3 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200 shadow-sm flex-1 xl:flex-none min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"><PhoneForwarded size={16} className="text-orange-600" /></div>
            <div><p className="text-[11px] font-bold text-orange-400 uppercase">Action</p><p className="text-sm font-black text-orange-700 leading-none mt-1">Call Required</p></div>
          </div>
        </div>
      </div>

      <SuperAdminTable labs={labs} />

    </div>
  );
}
// --- BLOCK app/super-admin/expiring/page.tsx CLOSE ---