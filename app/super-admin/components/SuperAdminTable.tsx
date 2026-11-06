// --- BLOCK app/super-admin/components/SuperAdminTable.tsx OPEN ---
"use client";

import React, { useState, useMemo } from "react";
import { Trash2, RefreshCw, Power, ShieldAlert, CalendarPlus, X, CheckCircle2, Filter, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const counts = useMemo(() => {
    let trials = 0;
    let subscribed = 0;
    let nearExpiry = 0;
    let expired = 0;

    labs.forEach(lab => {
      const { status, expDate } = getLabLifecycle(lab);
      if (status === "TRIAL" || status === "TRIAL_UPGRADED") trials++;
      if (status === "PAID") subscribed++;
      if (status === "EXPIRED") expired++;
      if (status !== "HQ" && status !== "EXPIRED" && expDate) {
        const daysLeft = (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        if (daysLeft >= 0 && daysLeft <= 5) nearExpiry++;
      }
    });

    return { total: labs.length, trials, subscribed, nearExpiry, expired };
  }, [labs]);

  const filteredLabs = useMemo(() => {
    return labs.filter(lab => {
      const { status, expDate } = getLabLifecycle(lab);
      
      if (filterMode === "TRIAL" && !(status === "TRIAL" || status === "TRIAL_UPGRADED")) return false;
      if (filterMode === "SUBSCRIBED" && status !== "PAID") return false;
      if (filterMode === "EXPIRED" && status !== "EXPIRED") return false;
      
      if (filterMode === "NEAR_EXPIRY") {
          if (status === "HQ" || status === "EXPIRED") return false;
          if (expDate) {
              const daysLeft = (expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
              if (!(daysLeft >= 0 && daysLeft <= 5)) return false;
          } else {
            return false;
          }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lab.name.toLowerCase().includes(q);
        const matchesEmail = lab.email?.toLowerCase().includes(q);
        const matchesPhone = lab.phone?.includes(q);
        const matchesId = `org-${lab.id}`.includes(q) || lab.id.toString() === q;
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesId) return false;
      }
      
      return true;
    });
  }, [labs, filterMode, searchQuery]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    setLoadingId(id);
    const res = await toggleLabStatus(id, currentStatus);
    if (res.success) toast.success(res.message); else toast.error(res.message);
    setLoadingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) return;
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
    if (res.success) { 
      toast.success(res.message); 
      setRenewalModalOpen(false); 
    } else {
      toast.error(res.message);
    }
    setIsProcessing(false);
  };

  const handleToggleSensitivity = async (id: number, currentStatus: boolean) => {
    setSensitivityLoading(id);
    const res = await toggleSensitivityModule(id, currentStatus);
    if (res.success) toast.success(res.message); else toast.error(res.message);
    setSensitivityLoading(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 space-y-2">
      {/* FILTER & SEARCH BAR AS SEPARATE CARD BLOCK */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-2 xl:p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="h-[22px] xl:h-[24px] flex items-center bg-slate-100 rounded p-0.5 gap-0.5 border border-slate-200 shrink-0 text-[10px] xl:text-[11px]">
            <button 
              onClick={() => setFilterMode("ALL")} 
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${filterMode === "ALL" ? "bg-white shadow-2xs text-[#9575cd] font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              All Accounts ({counts.total})
            </button>
            <button 
              onClick={() => setFilterMode("TRIAL")} 
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${filterMode === "TRIAL" ? "bg-white shadow-2xs text-amber-700 font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              Free Trials ({counts.trials})
            </button>
            <button 
              onClick={() => setFilterMode("SUBSCRIBED")} 
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${filterMode === "SUBSCRIBED" ? "bg-white shadow-2xs text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              Subscribers ({counts.subscribed})
            </button>
            <button 
              onClick={() => setFilterMode("NEAR_EXPIRY")} 
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${filterMode === "NEAR_EXPIRY" ? "bg-white shadow-2xs text-orange-600 font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              Near Expiry ({counts.nearExpiry})
            </button>
            <button 
              onClick={() => setFilterMode("EXPIRED")} 
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${filterMode === "EXPIRED" ? "bg-white shadow-2xs text-rose-700 font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              Expired ({counts.expired})
            </button>
          </div>
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input 
            type="text" 
            placeholder="Search tenant lab..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
          />
        </div>
      </div>

      {/* DESKTOP TABLE VIEW AS SEPARATE BLOCK */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse border-spacing-0 whitespace-nowrap">
            <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
              <tr>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-10" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>#</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Lab ID</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Organization Name</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Contact Info</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>SaaS Tier</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-16" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Bills</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Started</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Expires</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Sensitivity</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Plan</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-16" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabs.map((lab, index) => {
                const lifecycle = getLabLifecycle(lab);
                const isExpired = lifecycle.status === "EXPIRED";
                const isNearExpiry = lifecycle.expDate && (lifecycle.expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 5 && !isExpired && lifecycle.status !== "HQ";

                return (
                  <tr key={lab.id} className={`transition-colors group hover:bg-slate-50/80 border-b border-[#d9d9d9] ${isExpired ? 'bg-rose-50/20' : isNearExpiry ? 'bg-amber-50/20' : ''}`}>
                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center font-medium text-slate-500 text-[11px]">
                      {index + 1}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="font-mono text-slate-700 text-[11px] font-medium">
                      {lifecycle.status === "HQ" ? (
                        <span className="font-bold text-slate-900">HQ-0001</span>
                      ) : (
                        `ORG-${lab.id.toString().padStart(4, '0')}`
                      )}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-semibold text-[11px] xl:text-[12px] ${lifecycle.status === "HQ" ? 'text-purple-700 font-bold' : 'text-slate-800'}`}>
                          {lab.name}
                        </span>
                        {lifecycle.status === "HQ" && (
                          <span className="text-[9px] bg-purple-100 text-[#5e35b1] px-1 py-0.2 rounded border border-purple-200 font-bold">
                            HQ Master
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                      <div className="flex flex-col gap-0.5 text-[10.5px]">
                        <span className="text-slate-600">{lab.email || "N/A"}</span>
                        {lab.phone && <span className="font-mono text-slate-400">{lab.phone}</span>}
                      </div>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                      {lifecycle.status === "TRIAL" && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          Free Trial
                        </span>
                      )}
                      {lifecycle.status === "TRIAL_UPGRADED" && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          Trial · {lifecycle.upcomingPlan}
                        </span>
                      )}
                      {lifecycle.status === "PAID" && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {lifecycle.label}
                        </span>
                      )}
                      {lifecycle.status === "EXPIRED" && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          Expired ({lab.plan})
                        </span>
                      )}
                      {lifecycle.status === "HQ" && (
                        <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Master
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center font-mono font-medium text-slate-700 text-[11px]">
                      {lab._count.bills}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-slate-600 text-[11px] font-normal">
                      {lifecycle.startDate ? lifecycle.startDate.toLocaleDateString('en-GB') : "-"}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className={`text-[11px] font-medium ${isExpired ? 'text-rose-600 font-bold' : isNearExpiry ? 'text-orange-600 font-bold' : 'text-slate-700'}`}>
                      {lifecycle.status === "HQ" ? (
                        <span className="text-slate-400 italic">Lifetime</span>
                      ) : (
                        lifecycle.expDate?.toLocaleDateString('en-GB') || "-"
                      )}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <button 
                        disabled={lifecycle.status === "HQ" || sensitivityLoading === lab.id} 
                        onClick={() => handleToggleSensitivity(lab.id, lab.hasSensitivity)} 
                        className={`w-7 h-4 rounded-full relative transition-colors disabled:opacity-40 inline-flex items-center ${lab.hasSensitivity ? 'bg-[#9575cd]' : 'bg-slate-300'}`}
                        title={lab.hasSensitivity ? "Sensitivity Enabled" : "Sensitivity Disabled"}
                      >
                        {sensitivityLoading === lab.id ? (
                          <RefreshCw size={8} className="animate-spin text-white mx-auto" />
                        ) : (
                          <div className={`w-3 h-3 bg-white rounded-full absolute transition-all shadow-2xs ${lab.hasSensitivity ? 'left-[13px]' : 'left-[2px]'}`} />
                        )}
                      </button>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <button 
                        disabled={lifecycle.status === "HQ"} 
                        onClick={() => handleOpenRenewal(lab)} 
                        className="h-[22px] px-2 text-[10px] font-semibold bg-purple-50 text-[#9575cd] border border-purple-200 hover:bg-purple-100 rounded transition-colors inline-flex items-center gap-1 disabled:opacity-30 shadow-2xs"
                      >
                        <CalendarPlus size={11} /> Plan
                      </button>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <button 
                        disabled={lifecycle.status === "HQ" || loadingId === lab.id} 
                        onClick={() => handleToggleStatus(lab.id, lab.isActive)} 
                        className={`h-[22px] px-2 rounded text-[10px] font-semibold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-40 shadow-2xs ${
                          lab.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {loadingId === lab.id ? <RefreshCw size={10} className="animate-spin" /> : <Power size={10} />}
                        {lab.isActive ? "Active" : "Off"}
                      </button>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <button 
                        disabled={lifecycle.status === "HQ" || loadingId === lab.id} 
                        onClick={() => handleDelete(lab.id, lab.name)} 
                        className="h-[22px] w-[22px] rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors disabled:opacity-30 inline-flex items-center justify-center shadow-2xs"
                        title="Permanently Delete Laboratory"
                      >
                        <Trash2 size={13} strokeWidth={2}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLabs.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 text-xs italic">
                    No tenant laboratories found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PINNED TABLE FOOTER */}
        <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>Showing: <strong className="text-slate-700">{filteredLabs.length} of {labs.length} Laboratories</strong></span>
            <span>•</span>
            <span>Total Bills: <strong className="text-purple-700">{labs.reduce((acc, l) => acc + l._count.bills, 0)}</strong></span>
          </div>
          <div className="text-[10px] text-slate-400">
            Click Plan to extend or adjust SaaS tiers
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden flex-1 min-h-0 overflow-y-auto space-y-2 pb-3 custom-scrollbar">
        {filteredLabs.length === 0 ? (
          <div className="rounded-[6px] border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            No laboratories match this view.
          </div>
        ) : filteredLabs.map((lab) => {
          const lifecycle = getLabLifecycle(lab);
          const isExpired = lifecycle.status === "EXPIRED";
          const isNearExpiry = lifecycle.expDate && (lifecycle.expDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 5 && !isExpired && lifecycle.status !== "HQ";

          return (
            <article key={lab.id} className="rounded-[6px] border border-slate-200 bg-white p-2.5 shadow-2xs flex flex-col gap-1.5">
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="truncate text-xs font-bold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    {lab.name}
                  </h4>
                  <p className="font-mono text-[9px] text-slate-500">
                    {lifecycle.status === "HQ" ? "HQ-0001" : `ORG-${lab.id.toString().padStart(4, '0')}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold ${
                  isExpired ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                  isNearExpiry ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                  lifecycle.status === 'HQ' ? 'bg-slate-800 text-white' : 
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {lifecycle.status === "TRIAL_UPGRADED" ? `Trial · ${lifecycle.upcomingPlan}` : lifecycle.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 border-t border-slate-100 pt-1.5">
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block">Email</span>
                  <span className="truncate block font-normal">{lab.email || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-semibold block">Expires</span>
                  <span className="block font-medium">{lifecycle.status === "HQ" ? "Lifetime" : lifecycle.expDate?.toLocaleDateString('en-GB') || "-"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-1.5">
                <div className="flex items-center gap-1">
                  <button 
                    disabled={lifecycle.status === "HQ"} 
                    onClick={() => handleOpenRenewal(lab)} 
                    className="h-6 px-2 text-[9px] font-semibold bg-purple-50 text-[#9575cd] border border-purple-200 rounded flex items-center gap-1 shadow-2xs"
                  >
                    <CalendarPlus size={10} /> Plan
                  </button>
                  <button 
                    disabled={lifecycle.status === "HQ" || loadingId === lab.id} 
                    onClick={() => handleToggleStatus(lab.id, lab.isActive)} 
                    className={`h-6 px-2 text-[9px] font-semibold rounded border flex items-center gap-1 shadow-2xs ${
                      lab.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <Power size={10} /> {lab.isActive ? "Active" : "Off"}
                  </button>
                </div>
                <button 
                  disabled={lifecycle.status === "HQ" || loadingId === lab.id} 
                  onClick={() => handleDelete(lab.id, lab.name)} 
                  className="h-6 px-2 text-[9px] font-semibold rounded border border-rose-200 bg-rose-50 text-rose-700 flex items-center gap-1 shadow-2xs"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* RENEWAL MODAL */}
      {renewalModalOpen && selectedLab && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
              <h3 className="font-semibold text-[15px] xl:text-[16px] text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                <CalendarPlus size={15} className="text-[#9575cd]"/> Modify SaaS Subscription
              </h3>
              <button onClick={() => setRenewalModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={submitRenewal} className="p-4 space-y-3">
              <div className="bg-purple-50/60 border border-purple-100 p-2.5 rounded-[6px]">
                <p className="text-[9.5px] text-[#9575cd] font-semibold uppercase tracking-wider mb-0.5">Target Laboratory</p>
                <p className="font-semibold text-slate-800 text-[13px] xl:text-[14px]" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>{selectedLab.name}</p>
                <p className="text-[10.5px] text-slate-500 font-normal mt-0.5">
                  Current Tier: <strong className="text-slate-700">{selectedLab.plan === "Free" ? "Free Trial" : selectedLab.plan}</strong>
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                  Select SaaS Tier
                </label>
                <select 
                  value={renewPlan} 
                  onChange={(e) => setRenewPlan(e.target.value)} 
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd]"
                >
                  <option value="Starter">Starter Plan</option>
                  <option value="Professional">Professional Plan</option>
                  <option value="Enterprise">Enterprise Plan</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                  Duration to Add
                </label>
                <select 
                  value={renewDuration} 
                  onChange={(e) => setRenewDuration(Number(e.target.value))} 
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd]"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year (12 Months)</option>
                </select>
                <p className="text-[9.5px] text-slate-400 mt-1 italic">
                  Time is stacked onto existing subscription end date without losing active days.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setRenewalModalOpen(false)} 
                  className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-normal text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="h-[24px] xl:h-[26px] px-3.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                >
                  {isProcessing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  <span>{isProcessing ? 'Processing...' : 'Apply Tier'}</span>
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
