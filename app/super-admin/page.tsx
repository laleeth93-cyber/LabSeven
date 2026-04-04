// --- BLOCK app/super-admin/page.tsx OPEN ---
"use client";

import React, { useState } from 'react';
import { Crown, DatabaseZap, Loader2, CheckCircle2 } from 'lucide-react';
import { pushMasterDataToAllLabs } from '@/app/actions/master-sync';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [isPushing, setIsPushing] = useState(false);

  const handlePushLibrary = async () => {
    if (!confirm("Are you sure? This will push all new Tests, Parameters, and Formats from your account to ALL registered laboratories.")) return;
    
    setIsPushing(true);
    const toastId = toast.loading("Syncing master library to all labs...");
    
    try {
        const res = await pushMasterDataToAllLabs();
        if (res.success) {
            toast.success(res.message, { id: toastId });
        } else {
            toast.error(res.message, { id: toastId });
        }
    } catch (err) {
        toast.error("Failed to execute global sync.", { id: toastId });
    } finally {
        setIsPushing(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#f1f5f9] p-6 font-sans overflow-y-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <Crown className="text-fuchsia-500" size={32} />
          Super Admin Console
        </h1>
        <p className="text-slate-500 font-medium mt-1 ml-11">Manage global SaaS configurations and laboratory tenants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* GLOBAL LIBRARY SYNC CARD */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                 <DatabaseZap size={100} className="text-fuchsia-600" />
             </div>
             
             <div className="flex items-center gap-3 mb-4">
                 <div className="p-2.5 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
                     <DatabaseZap size={24} />
                 </div>
                 <div>
                     <h2 className="text-lg font-bold text-slate-800">Global Library Sync</h2>
                     <p className="text-xs text-slate-500 font-medium tracking-wide">Test Database Engine</p>
                 </div>
             </div>

             <p className="text-sm text-slate-600 mb-6 flex-1 pr-6 leading-relaxed">
                 Push all new Tests, Parameters, Formats, and Ranges created in this Master account to all active tenant laboratories. Existing modified tests are safely skipped.
             </p>

             <button 
                onClick={handlePushLibrary}
                disabled={isPushing}
                className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #d946ef, #9333ea)' }}
             >
                 {isPushing ? <Loader2 size={18} className="animate-spin" /> : <DatabaseZap size={18} />}
                 {isPushing ? 'Broadcasting Updates...' : 'Push Updates to All Labs'}
             </button>
          </div>

          {/* You can add more Super Admin widgets here later! */}

      </div>
    </div>
  );
}
// --- BLOCK app/super-admin/page.tsx CLOSE ---