import React from "react";
import { prisma } from "@/lib/prisma";
import SuperAdminTable from "./components/SuperAdminTable";
import GlobalSyncWidget from "./components/GlobalSyncWidget"; 
import GlobalWipeButton from "./components/GlobalWipeButton"; 

import GlobalPasswordWidget from "./components/GlobalPasswordWidget"; 

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
    <div className="flex flex-col h-full w-full bg-slate-50/50 p-2 sm:p-6 overflow-y-auto custom-scrollbar">
      
      <div className="mb-3 sm:mb-5 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
        <h1 className="text-base sm:text-2xl font-black text-slate-800 tracking-tight shrink-0">
          Master HQ
        </h1>
        
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <GlobalPasswordWidget />
          <GlobalWipeButton />
          <GlobalSyncWidget />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2.5 sm:mb-4 max-w-md sm:max-w-lg">
        <div className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xs flex flex-col justify-center">
          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Labs</span>
          <span className="text-sm sm:text-base font-black text-[#a07be1] leading-tight mt-0.5">{labs.length}</span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xs flex flex-col justify-center">
          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Subs</span>
          <span className="text-sm sm:text-base font-black text-emerald-600 leading-tight mt-0.5">
            {labs.filter(l => l.isActive && l.id !== 1).length}
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-lg sm:rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xs flex flex-col justify-center">
          <span className="text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Bills</span>
          <span className="text-sm sm:text-base font-black text-slate-700 leading-tight mt-0.5">
            {labs.reduce((acc, lab) => acc + lab._count.bills, 0)}
          </span>
        </div>
      </div>

      <div className="flex-1 bg-transparent md:bg-white rounded-none md:rounded-xl shadow-none md:shadow-sm border-0 md:border md:border-slate-200 overflow-hidden flex flex-col min-h-0 md:min-h-[500px]">
        <SuperAdminTable labs={labs} />
      </div>

    </div>
  );
}