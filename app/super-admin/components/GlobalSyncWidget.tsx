// --- BLOCK app/super-admin/components/GlobalSyncWidget.tsx OPEN ---
"use client";

import React, { useState } from 'react';
import { DatabaseZap, Loader2 } from 'lucide-react';
import { pushMasterDataToAllLabs } from '@/app/actions/master-sync';
import toast from 'react-hot-toast';

export default function GlobalSyncWidget() {
  const [isPushing, setIsPushing] = useState(false);

  const handlePushLibrary = async () => {
    if (!confirm("Are you sure? This will push all new Tests, Parameters, and Formats from your account to ALL registered laboratories.")) return;

    setIsPushing(true);
    const toastId = toast.loading("Syncing master library to all labs...");

    try {
        const res = await pushMasterDataToAllLabs();
        if (res?.success) {
            toast.success(res.message, { id: toastId });
        } else {
            toast.error(res?.message || "Sync failed", { id: toastId });
        }
    } catch (err) {
        toast.error("Failed to execute global sync.", { id: toastId });
    } finally {
        setIsPushing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col relative overflow-hidden h-full">
       <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
           <DatabaseZap size={80} className="text-fuchsia-600" />
       </div>

       <div className="flex items-center gap-3 mb-2">
           <div className="p-2 bg-fuchsia-50 text-fuchsia-600 rounded-lg">
               <DatabaseZap size={18} />
           </div>
           <div>
               <h2 className="text-sm font-bold text-slate-800">Global Library Sync</h2>
               <p className="text-[9px] text-slate-400 font-bold tracking-wide uppercase">Test Database Engine</p>
           </div>
       </div>

       <p className="text-[11px] text-slate-500 mb-3 flex-1 pr-2 leading-relaxed">
           Push all new Tests, Parameters, and Formats from this Master account to all active tenant laboratories.
       </p>

       <button
          onClick={handlePushLibrary}
          disabled={isPushing}
          className="w-full py-2 rounded-lg font-bold text-white text-[11px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg, #d946ef, #9333ea)' }}
       >
           {isPushing ? <Loader2 size={14} className="animate-spin" /> : <DatabaseZap size={14} />}
           {isPushing ? 'Broadcasting Updates...' : 'Push Updates to All Labs'}
       </button>
    </div>
  );
}
// --- BLOCK app/super-admin/components/GlobalSyncWidget.tsx CLOSE ---