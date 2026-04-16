// --- BLOCK app/super-admin/subscribed/page.tsx OPEN ---
import React from "react";
import { prisma } from "@/lib/prisma";
import { CheckCircle, Users, Receipt } from "lucide-react";
import SuperAdminTable from "../components/SuperAdminTable";

export const dynamic = 'force-dynamic';

export default async function SubscribedLabsPage() {
  // 1. Fetch only labs that are NOT on a "Free Trial" and are NOT the Master HQ
  const labs = await prisma.organization.findMany({
    where: {
        id: { not: 1 }, 
        plan: { not: "Free Trial" }
    },
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: { bills: true }
      }
    }
  });

  const totalSubscribers = labs.length;
  const subscriberBills = labs.reduce((sum: number, lab: any) => sum + lab._count.bills, 0);

  return (
    <div className="w-full max-w-[100vw] min-h-screen bg-slate-50 p-4 md:p-6 font-sans overflow-x-hidden">
      
      <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={24} />
            Active Subscribers
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Paying customers currently using the SaaS platform</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex-1 xl:flex-none min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><Users size={16} className="text-emerald-600" /></div>
            <div><p className="text-[11px] font-bold text-slate-400 uppercase">Paid Labs</p><p className="text-lg font-black text-slate-800 leading-none">{totalSubscribers}</p></div>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex-1 xl:flex-none min-w-[140px]">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center"><Receipt size={16} className="text-purple-600" /></div>
            <div><p className="text-[11px] font-bold text-slate-400 uppercase">Total Bills</p><p className="text-lg font-black text-slate-800 leading-none">{subscriberBills}</p></div>
          </div>
        </div>
      </div>

      <SuperAdminTable labs={labs} />

    </div>
  );
}
// --- BLOCK app/super-admin/subscribed/page.tsx CLOSE ---