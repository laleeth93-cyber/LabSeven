// --- BLOCK app/super-admin/components/SuperAdminTable.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { Trash2, RefreshCw, Power, ShieldAlert, CalendarPlus, X, CheckCircle2, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { toggleLabStatus, deleteLabPermanently, renewLabSubscription, toggleSensitivityModule } from "@/app/actions/super-admin";

type LabData = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  plan: string;
  isActive: boolean;
  hasSensitivity: boolean; 
  createdAt: Date;
  subscriptionEndsAt?: Date | null; 
  _count: { bills: number };
};

export default function SuperAdminTable({ labs }: { labs: LabData[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [sensitivityLoading, setSensitivityLoading] = useState<number | null>(null);
  
  const [filterMode, setFilterMode] = useState<"ALL" | "TRIAL" | "SUBSCRIBED" | "NEAR_EXPIRY" | "EXPIRED">("ALL");
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<LabData | null>(null);
  const [renewPlan, setRenewPlan] = useState("Professional");
  const [renewDuration, setRenewDuration] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const getLabLifecycle = (lab: LabData) => {
      if (lab.id === 1) return { status: "HQ", label: "System Master" };

      const now = new Date();
      const startDate = new Date(lab.createdAt);
      const trialEndDate = new Date(startDate);
      trialEndDate.setDate(trialEndDate.getDate() + 5);

      const expDate = lab.subscriptionEndsAt ? new Date(lab.subscriptionEndsAt) : trialEndDate;

      if (now > expDate) {
          return { status: "EXPIRED", label: "Expired", startDate, expDate };
      }

      if (now <= trialEndDate) {
          if (lab.plan !== "Free Trial" && lab.plan !== "Free") {
              return { status: "TRIAL_UPGRADED", label: "Free Trial", upcomingPlan: lab.plan, startDate, expDate };
          }
          return { status: "TRIAL", label: "Free Trial", startDate, expDate: trialEndDate };
      }

      return { status: "PAID", label: lab.plan, startDate, expDate };
  };

  const filteredLabs = labs.filter(lab => {
      const { status, expDate } = getLabLifecycle(lab);
      
      if (filterMode === "TRIAL") return status === "TRIAL" || status === "TRIAL_UPGRADED";
      if (filterMode === "SUBSCRIBED") return status === "PAID";
      if (filterMode === "EXPIRED") return status === "EXPIRED";
      
      if (filterMode === "NEAR_EXPIRY") {
          if (status === "HQ" || status === "EXPIRED") return false;
          if (expDate) {
              const daysLeft = (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
              return daysLeft >= 0 && daysLeft <= 5; 
          }
          return false;
      }
      
      return true;
  });

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    setLoadingId(id);
    const res = await toggleLabStatus(id, currentStatus);
    if (res.success) toast.success(res.message); else toast.error(res.message);
    setLoadingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    setLoadingId(id);
    const res = await deleteLabPermanently(id);
    if (res.success) toast.success(res.message); else toast.error(res.message);
    setLoadingId(null);
  };

  const handleOpenRenewal = (lab: LabData) => {
    setSelectedLab(lab);
    setRenewPlan(lab.plan === "Free" || lab.plan.includes("Trial") ? "Professional" : lab.plan);
    setRenewalModalOpen(true);
  };

  const submitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;
    setIsProcessing(true);
    const res = await renewLabSubscription(selectedLab.id, renewPlan, renewDuration);
    if (res.success) { toast.success(res.message); setRenewalModalOpen(false); } 
    else toast.error(res.message);
    setIsProcessing(false);
  };

  const handleToggleSensitivity = async (id: number, currentStatus: boolean) => {
    setSensitivityLoading(id);
    const res = await toggleSensitivityModule(id, currentStatus);
    if (res.success) toast.success(res.message); else toast.error(res.message);
    setSensitivityLoading(null);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 md:gap-4 h-full">
      <div className="flex justify-between items-center bg-transparent md:bg-white p-0 md:p-2.5 rounded-none md:rounded-lg border-0 md:border md:border-slate-300 shadow-none md:shadow-sm overflow-x-auto shrink-0 custom-scrollbar">
        <div className="flex items-center gap-1.5 md:gap-2 min-w-max">
            <Filter size={13} className="md:w-4 md:h-4 text-slate-400 shrink-0 ml-0.5" />
            <div className="flex bg-slate-200/70 md:bg-slate-100 p-0.5 md:p-1 rounded-md gap-0.5 md:gap-1">
                <button onClick={() => setFilterMode("ALL")} className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded transition-colors whitespace-nowrap select-none ${filterMode === "ALL" ? "bg-white shadow-sm text-[#a07be1]" : "text-slate-500 hover:text-slate-700"}`}>All Accounts</button>
                <button onClick={() => setFilterMode("TRIAL")} className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded transition-colors whitespace-nowrap select-none ${filterMode === "TRIAL" ? "bg-white shadow-sm text-amber-600" : "text-slate-500 hover:text-slate-700"}`}>Free Trials</button>
                <button onClick={() => setFilterMode("SUBSCRIBED")} className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded transition-colors whitespace-nowrap select-none ${filterMode === "SUBSCRIBED" ? "bg-white shadow-sm text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Subscribers</button>
                <button onClick={() => setFilterMode("NEAR_EXPIRY")} className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded transition-colors whitespace-nowrap select-none ${filterMode === "NEAR_EXPIRY" ? "bg-white shadow-sm text-orange-500" : "text-slate-500 hover:text-slate-700"}`}>
                  <span className="md:hidden">Near Expiry</span>
                  <span className="hidden md:inline">Near Expiry (5 Days)</span>
                </button>
                <button onClick={() => setFilterMode("EXPIRED")} className={`px-2.5 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded transition-colors whitespace-nowrap select-none ${filterMode === "EXPIRED" ? "bg-white shadow-sm text-red-600" : "text-slate-500 hover:text-slate-700"}`}>Expired</button>
            </div>
        </div>
      </div>

      <div className="hidden md:block w-full bg-white border border-slate-300 shadow-sm overflow-x-auto h-full min-h-[400px] custom-scrollbar relative rounded-b-lg">
        <table className="w-full border-collapse text-[12px] text-left whitespace-nowrap min-w-max">
          <thead className="sticky top-0 z-20 shadow-md outline outline-1 outline-[#a07be1]">
            <tr className="bg-[#a07be1] text-white">
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold w-12 text-center bg-white/10">Sr. No</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">Lab ID</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">Organization Name</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">Contact Email</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">Phone No</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">SaaS Plan</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide text-center">Bill Count</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">Start Date</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide">Exp. Date</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide text-center">Sensitivity</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide text-center">Manage</th>
              <th className="border-r border-[#8e62d9] px-3 py-2.5 font-bold tracking-wide text-center">Access</th>
              <th className="px-3 py-2.5 font-bold tracking-wide text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {filteredLabs.map((lab, index) => {
              const lifecycle = getLabLifecycle(lab);
              const isExpired = lifecycle.status === "EXPIRED";
              const isNearExpiry = lifecycle.expDate && (lifecycle.expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 5 && !isExpired && lifecycle.status !== "HQ";

              return (
                <tr key={lab.id} className={`transition-colors group border-b border-slate-200 ${isExpired ? 'bg-red-50/30 hover:bg-red-50/50' : isNearExpiry ? 'bg-orange-50/30 hover:bg-orange-50/50' : 'hover:bg-purple-50/40 bg-white'}`}>
                  <td className="border-r border-slate-200 px-2 py-2 text-center bg-slate-50/50 text-slate-500 font-bold group-hover:bg-purple-50/50">{index + 1}</td>
                  <td className="border-r border-slate-200 px-3 py-2 font-mono text-slate-600 font-medium">
                    {lifecycle.status === "HQ" ? "HQ-0001" : `ORG-${lab.id.toString().padStart(4, '0')}`}
                  </td>
                  <td className={`border-r border-slate-200 px-3 py-2 font-bold ${lifecycle.status === "HQ" ? 'text-red-600' : 'text-[#a07be1]'}`}>
                    {lab.name} {lifecycle.status === "HQ" && <ShieldAlert size={12} className="inline ml-1" />}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2 text-slate-600">{lab.email || "N/A"}</td>
                  <td className="border-r border-slate-200 px-3 py-2 text-slate-600 font-mono">{lab.phone || "N/A"}</td>
                  
                  <td className="border-r border-slate-200 px-3 py-2 text-slate-700 font-semibold align-middle">
                    {lifecycle.status === "TRIAL" && <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded text-[11px]">Free Trial</span>}
                    {lifecycle.status === "TRIAL_UPGRADED" && (
                        <div className="flex flex-col gap-1 items-start">
                            <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px]">Free Trial Active</span>
                            <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-black">Renewed: {lifecycle.upcomingPlan}</span>
                        </div>
                    )}
                    {lifecycle.status === "PAID" && <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-[11px]">{lifecycle.label}</span>}
                    {lifecycle.status === "EXPIRED" && <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded text-[11px]">Expired ({lab.plan})</span>}
                    {lifecycle.status === "HQ" && <span className="bg-slate-800 text-white border border-slate-900 px-2 py-1 rounded text-[11px]">Master HQ</span>}
                  </td>
                  
                  <td className="border-r border-slate-200 px-3 py-2 text-center font-bold text-slate-700 bg-slate-50/50">{lab._count.bills}</td>
                  <td className="border-r border-slate-200 px-3 py-2 text-slate-600">{lifecycle.startDate?.toLocaleDateString('en-GB') || "-"}</td>
                  <td className={`border-r border-slate-200 px-3 py-2 font-bold ${isExpired ? 'text-red-600' : isNearExpiry ? 'text-orange-500' : 'text-slate-600'}`}>
                    {lifecycle.status === "HQ" ? "Lifetime" : lifecycle.expDate?.toLocaleDateString('en-GB')}
                  </td>
                  
                  <td className="border-r border-slate-200 px-3 py-2 text-center">
                    <button 
                      disabled={lifecycle.status === "HQ" || sensitivityLoading === lab.id} 
                      onClick={() => handleToggleSensitivity(lab.id, lab.hasSensitivity)} 
                      className={`w-10 h-5 rounded-full relative transition-colors disabled:opacity-50 ${lab.hasSensitivity ? 'bg-[#a07be1]' : 'bg-slate-300'}`}
                    >
                      {sensitivityLoading === lab.id ? (
                        <RefreshCw size={10} className="animate-spin text-white absolute left-[14px] top-[5px]" />
                      ) : (
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all shadow-sm ${lab.hasSensitivity ? 'left-[22px]' : 'left-[3px]'}`} />
                      )}
                    </button>
                  </td>

                  <td className="border-r border-slate-200 px-3 py-2 text-center">
                    <button disabled={lifecycle.status === "HQ"} onClick={() => handleOpenRenewal(lab)} className="text-[10px] font-bold bg-[#a07be1]/10 text-[#a07be1] border border-[#a07be1]/20 px-3 py-1.5 rounded hover:bg-[#a07be1] hover:text-white transition-colors inline-flex items-center gap-1.5 disabled:opacity-30">
                      <CalendarPlus size={12} /> Manage Plan
                    </button>
                  </td>

                  <td className="border-r border-slate-200 px-3 py-2 text-center">
                    <button disabled={lifecycle.status === "HQ" || loadingId === lab.id} onClick={() => handleToggleStatus(lab.id, lab.isActive)} className={`text-[10px] font-bold px-3 py-1.5 rounded w-20 inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-50 ${lab.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'}`}>
                      {loadingId === lab.id ? <RefreshCw size={12} className="animate-spin" /> : <Power size={12} />}
                      {lab.isActive ? "ACTIVE" : "DISABLED"}
                    </button>
                  </td>

                  <td className="px-3 py-2 text-center">
                    <button disabled={lifecycle.status === "HQ" || loadingId === lab.id} onClick={() => handleDelete(lab.id, lab.name)} className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-30 inline-flex border border-red-100 hover:border-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex-1 min-h-0 overflow-y-auto space-y-2 p-0 md:p-1.5 pb-3 custom-scrollbar">
        {filteredLabs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            No laboratories match this view.
          </div>
        ) : filteredLabs.map((lab) => {
          const lifecycle = getLabLifecycle(lab);
          const isExpired = lifecycle.status === "EXPIRED";
          const isNearExpiry = lifecycle.expDate && (lifecycle.expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 5 && !isExpired && lifecycle.status !== "HQ";

          return (
            <article key={lab.id} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-bold text-slate-800">{lab.name}</h2>
                  <p className="mt-0.5 font-mono text-[9px] text-slate-500">
                    {lifecycle.status === "HQ" ? "HQ-0001" : `ORG-${lab.id.toString().padStart(4, '0')}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold ${isExpired ? 'bg-red-50 text-red-700' : isNearExpiry ? 'bg-orange-50 text-orange-700' : lifecycle.status === 'HQ' ? 'bg-slate-800 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                  {lifecycle.status === "TRIAL_UPGRADED" ? `Trial · ${lifecycle.upcomingPlan}` : lifecycle.label}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-100 pt-1.5">
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Email</p>
                  <p className="break-all text-[9.5px] text-slate-700 truncate">{lab.email || "N/A"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Phone</p>
                  <p className="break-all text-[9.5px] text-slate-700">{lab.phone || "N/A"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Bills</p>
                  <p className="text-[9.5px] font-bold text-slate-700">{lab._count.bills}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase text-slate-400">Expires</p>
                  <p className="text-[9.5px] text-slate-700">{lifecycle.status === "HQ" ? "Lifetime" : lifecycle.expDate?.toLocaleDateString('en-GB') || "-"}</p>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1 border-t border-slate-100 pt-1.5">
                <button
                  disabled={lifecycle.status === "HQ" || sensitivityLoading === lab.id}
                  onClick={() => handleToggleSensitivity(lab.id, lab.hasSensitivity)}
                  className="flex h-6 min-w-0 items-center justify-center gap-1 rounded border border-slate-200 text-[8.5px] font-semibold text-slate-600 disabled:opacity-50 active:scale-95 transition-all select-none px-1"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title={`Sensitivity ${lab.hasSensitivity ? "On" : "Off"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${lab.hasSensitivity ? 'bg-violet-500' : 'bg-slate-300'}`} />
                  <span className="truncate">Sens {lab.hasSensitivity ? "On" : "Off"}</span>
                </button>
                <button
                  disabled={lifecycle.status === "HQ"}
                  onClick={() => handleOpenRenewal(lab)}
                  className="flex h-6 min-w-0 items-center justify-center gap-0.5 rounded border border-violet-200 bg-violet-50 text-[8.5px] font-semibold text-violet-700 disabled:opacity-50 active:scale-95 transition-all select-none px-1"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Manage Plan"
                >
                  <CalendarPlus size={10} className="shrink-0" />
                  <span className="truncate">Manage Plan</span>
                </button>
                <button
                  disabled={lifecycle.status === "HQ" || loadingId === lab.id}
                  onClick={() => handleToggleStatus(lab.id, lab.isActive)}
                  className={`flex h-6 min-w-0 items-center justify-center gap-0.5 rounded border text-[8.5px] font-semibold disabled:opacity-50 active:scale-95 transition-all select-none px-1 ${lab.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title={lab.isActive ? "Active (click to disable)" : "Disabled (click to activate)"}
                >
                  <Power size={10} className="shrink-0" />
                  <span className="truncate">{lab.isActive ? "Active" : "Disabled"}</span>
                </button>
                <button
                  disabled={lifecycle.status === "HQ" || loadingId === lab.id}
                  onClick={() => handleDelete(lab.id, lab.name)}
                  className="flex h-6 min-w-0 items-center justify-center gap-0.5 rounded border border-red-200 bg-red-50 text-[8.5px] font-semibold text-red-700 disabled:opacity-50 active:scale-95 transition-all select-none px-1"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Delete Laboratory"
                >
                  <Trash2 size={10} className="shrink-0" />
                  <span className="truncate">Delete</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* RENEWAL MODAL */}
      {renewalModalOpen && selectedLab && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#a07be1] p-4 flex justify-between items-center text-white">
              <h2 className="font-black text-lg flex items-center gap-2"><CalendarPlus size={20}/> Modify Subscription</h2>
              <button onClick={() => setRenewalModalOpen(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={submitRenewal} className="p-6">
              <div className="mb-6 bg-purple-50 border border-purple-100 p-3 rounded-lg">
                <p className="text-xs text-purple-600 font-bold uppercase mb-1">Target Laboratory</p>
                <p className="font-black text-slate-800 text-lg">{selectedLab.name}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Current Base Plan: {selectedLab.plan === "Free" ? "Free Trial" : selectedLab.plan}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select SaaS Tier</label>
                  <select value={renewPlan} onChange={(e) => setRenewPlan(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 focus:border-[#a07be1] focus:ring-1 focus:ring-[#a07be1] outline-none">
                    <option value="Starter">Starter Plan (Basic)</option>
                    <option value="Professional">Professional Plan (Recommended)</option>
                    <option value="Enterprise">Enterprise Plan (Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Months to Add</label>
                  <select value={renewDuration} onChange={(e) => setRenewDuration(Number(e.target.value))} className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-medium text-slate-800 focus:border-[#a07be1] focus:ring-1 focus:ring-[#a07be1] outline-none">
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>1 Year (12 Months)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1.5">Note: This time is added to the end of their existing trial or current expiration date. They will not lose any active days.</p>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setRenewalModalOpen(false)} className="flex-1 h-10 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isProcessing} className="flex-1 h-10 rounded-lg font-bold text-white bg-[#a07be1] hover:bg-[#8e62d9] transition-colors flex items-center justify-center gap-2">
                  {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Process Upgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// --- BLOCK app/super-admin/components/SuperAdminTable.tsx CLOSE ---