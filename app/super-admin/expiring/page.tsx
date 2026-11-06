// --- BLOCK app/super-admin/expiring/page.tsx OPEN ---
import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AlertTriangle, Clock, Crown, Building2, LibraryBig, UserCog, IndianRupee } from "lucide-react";
import SuperAdminTable from "../components/SuperAdminTable";

export default async function ExpiringLabsPage() {
  const allLabs = await prisma.organization.findMany({
    where: { id: { not: 1 } },
    include: {
      _count: { select: { bills: true } }
    }
  });

  const labs = allLabs.filter(lab => {
      let expDate = lab.subscriptionEndsAt ? new Date(lab.subscriptionEndsAt) : null;
      if (!expDate) {
          expDate = new Date(lab.createdAt);
          expDate.setDate(expDate.getDate() + 5);
      }

      const today = new Date();
      const next5Days = new Date();
      next5Days.setDate(today.getDate() + 5);

      return expDate >= today && expDate <= next5Days;
  });

  labs.sort((a, b) => {
      const dateA = a.subscriptionEndsAt ? new Date(a.subscriptionEndsAt) : new Date(a.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      const dateB = b.subscriptionEndsAt ? new Date(b.subscriptionEndsAt) : new Date(b.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000);
      return dateA.getTime() - dateB.getTime();
  });

  const hqTabs = [
    { href: "/super-admin", label: "Tenant Labs", icon: <Building2 size={13} />, active: false },
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
            <div className="p-1 rounded bg-rose-50 text-rose-600 shadow-2xs">
              <AlertTriangle size={16} />
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

        {/* Sub-header Toolbar flush under header */}
        <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="p-1 rounded bg-rose-50 text-rose-600 shrink-0">
              <Clock size={14} />
            </div>
            <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 shrink-0" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              Expiring Within 5 Days
            </h3>
            <span className="text-[10px] xl:text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 shrink-0">
              {labs.length} Urgent Labs
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 min-h-0 custom-scrollbar flex flex-col">
          <SuperAdminTable labs={labs} />
        </div>

      </div>
    </div>
  );
}
// --- BLOCK app/super-admin/expiring/page.tsx CLOSE ---
