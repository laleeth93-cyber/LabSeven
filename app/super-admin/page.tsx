// --- BLOCK app/super-admin/page.tsx OPEN ---
import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Crown, Building2, LibraryBig, UserCog, IndianRupee, Layers } from "lucide-react";
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

  const totalBills = labs.reduce((acc, lab) => acc + lab._count.bills, 0);
  const activeSubs = labs.filter(l => l.isActive && l.id !== 1).length;
  const trialCount = labs.filter(l => l.plan === "Free" || l.plan.includes("Trial")).length;

  const hqTabs = [
    { href: "/super-admin", label: "Tenant Labs", icon: <Building2 size={13} />, active: true },
    { href: "/super-admin/central-library", label: "Central Library", icon: <LibraryBig size={13} />, active: false },
    { href: "/super-admin/admins", label: "System Admins", icon: <UserCog size={13} />, active: false },
    { href: "/super-admin/recharge", label: "Message Recharge", icon: <IndianRupee size={13} />, active: false },
  ];

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
      <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
        
        {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
          {/* Left: 20px Title in Calibri */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
              <Crown size={16} />
            </div>
            <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              Master HQ
            </h2>
          </div>

          {/* Right: Desktop Module Tabs */}
          <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
            {hqTabs.map(tab => (
              <Link 
                key={tab.href}
                href={tab.href}
                className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                  tab.active ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Tabs Header */}
        <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
          {hqTabs.map(tab => (
            <Link 
              key={tab.href}
              href={tab.href}
              className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                tab.active ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>

        {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
        <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shrink-0">
              <Building2 size={14} />
            </div>
            <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 shrink-0" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              Laboratories & SaaS Subscriptions
            </h3>
            <span className="text-[10px] xl:text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 shrink-0">
              Total Labs ({labs.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <GlobalPasswordWidget />
            <GlobalWipeButton />
            <GlobalSyncWidget />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 min-h-0 custom-scrollbar flex flex-col gap-2.5">
          {/* Summary Metric Strip as Separate Card Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:gap-2.5 shrink-0">
            <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Labs</span>
                <span className="text-[16px] xl:text-[18px] font-bold text-slate-800 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                  {labs.length}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-purple-50 text-[#9575cd] flex items-center justify-center">
                <Building2 size={16} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Active Subs</span>
                <span className="text-[16px] xl:text-[18px] font-bold text-emerald-600 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                  {activeSubs}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Crown size={16} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Free Trials</span>
                <span className="text-[16px] xl:text-[18px] font-bold text-amber-600 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                  {trialCount}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Invoices</span>
                <span className="text-[16px] xl:text-[18px] font-bold text-slate-800 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                  {totalBills}
                </span>
              </div>
              <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                <IndianRupee size={16} />
              </div>
            </div>
          </div>

          {/* Super Admin Table Component */}
          <SuperAdminTable labs={labs} />
        </div>

      </div>
    </div>
  );
}
// --- BLOCK app/super-admin/page.tsx CLOSE ---
