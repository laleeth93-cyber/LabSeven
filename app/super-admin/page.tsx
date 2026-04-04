// --- BLOCK app/super-admin/page.tsx OPEN ---
import React from "react";
import { prisma } from "@/lib/prisma";
import { Database, Building2, Activity, Receipt } from "lucide-react";
import SuperAdminTable from "./components/SuperAdminTable";
import GlobalSyncWidget from "./components/GlobalSyncWidget"; // 🚨 IMPORT THE NEW WIDGET

// Force Next.js to fetch fresh data every time you load the page
export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  // 1. Fetch all laboratories and accurately count their total bills
  const labs = await prisma.organization.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: { bills: true }
      }
    }
  });

  // 2. Calculate Dashboard Metrics
  const totalLabs = labs.length;
  const activeLabs = labs.filter(lab => lab.isActive).length;
  const totalSystemBills = labs.reduce((sum, lab) => sum + lab._count.bills, 0);

  return (
    // FULL WIDTH BODY CONTAINER
    <div className="w-full max-w-[100vw] min-h-screen bg-slate-50 p-4 md:p-6 font-sans overflow-x-hidden flex flex-col gap-6">
      
      {/* HEADER, METRICS, AND SYNC WIDGET */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-stretch gap-4">
        
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Database className="text-[#a07be1]" size={24} />
            System Command Center
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Super Admin Excel Spreadsheet View</p>
        </div>
        
        <div className="flex flex-wrap xl:flex-nowrap gap-3 w-full xl:w-auto">
          {/* STAT CARDS */}
          <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex-1 min-w-[150px]">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Building2 size={16} className="text-blue-600" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Labs</p><p className="text-lg font-black text-slate-800 leading-none mt-0.5">{totalLabs}</p></div>
              </div>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex-1 min-w-[150px]">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><Activity size={16} className="text-emerald-600" /></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Active Labs</p><p className="text-lg font-black text-slate-800 leading-none mt-0.5">{activeLabs}</p></div>
              </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex-1 xl:flex-none min-w-[150px]">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center"><Receipt size={18} className="text-purple-600" /></div>
            <div><p className="text-[11px] font-bold text-slate-400 uppercase">Total Bills Generated</p><p className="text-2xl font-black text-slate-800 leading-none mt-1">{totalSystemBills}</p></div>
          </div>

          {/* 🚨 THE SYNC WIDGET */}
          <div className="w-full xl:w-[280px] shrink-0">
             <GlobalSyncWidget />
          </div>
        </div>
      </div>

      {/* RENDER THE CLIENT-SIDE SPREADSHEET TABLE */}
      <div className="flex-1 w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <SuperAdminTable labs={labs} />
      </div>

    </div>
  );
}
// --- BLOCK app/super-admin/page.tsx CLOSE ---