// --- BLOCK app/super-admin/components/GlobalSyncWidget.tsx OPEN ---
"use client";

import React, { useState } from 'react';
import { DatabaseZap, Loader2 } from 'lucide-react';
import { pushMasterDataToAllLabs } from '@/app/actions/master-sync';
import toast from 'react-hot-toast';

export default function GlobalSyncWidget() {
  const [isPushing, setIsPushing] = useState(false);

  const handlePushLibrary = async () => {
    if (!confirm("Are you sure? This will push all Tests, Parameters, Masters, and Sensitivity rules from your account to ALL registered client laboratories. It will only add new items, it will not delete existing client data.")) return;

    setIsPushing(true);
    const toastId = toast.loading("Syncing massive master library to all labs. This might take a moment...");

    try {
        const res = await pushMasterDataToAllLabs();
        if (res?.success) {
            toast.success(res.message, { id: toastId, duration: 5000 });
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
    <button
        onClick={handlePushLibrary}
        disabled={isPushing}
        className="h-9 px-4 rounded-lg font-bold text-white text-[11px] shadow-sm transition-all hover:shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 whitespace-nowrap"
        style={{ background: 'linear-gradient(135deg, #d946ef, #9333ea)' }}
        title="Push new Tests, Parameters, and Sensitivity configs to all active labs"
    >
        {isPushing ? <Loader2 size={14} className="animate-spin" /> : <DatabaseZap size={14} />}
        {isPushing ? 'Syncing Library...' : 'Global Master Data Sync'}
    </button>
  );
}
// --- BLOCK app/super-admin/components/GlobalSyncWidget.tsx CLOSE ---