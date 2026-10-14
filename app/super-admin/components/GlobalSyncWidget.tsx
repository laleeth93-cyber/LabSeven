"use client";

import React, { useState } from 'react';
import { Database, Loader2 } from 'lucide-react'; // Changed DatabaseZap to Database
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
        className="h-6.5 sm:h-7.5 px-2 sm:px-3 rounded sm:rounded-lg font-bold text-white text-[9.5px] sm:text-[11px] shadow-xs transition-all hover:shadow-md active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 disabled:opacity-70 whitespace-nowrap shrink-0 select-none"
        style={{ background: 'linear-gradient(135deg, #d946ef, #9333ea)', WebkitTapHighlightColor: 'transparent' }}
        title="Push new Tests, Parameters, and Sensitivity configs to all active labs"
    >
        {isPushing ? <Loader2 size={11} className="animate-spin sm:w-3.5 sm:h-3.5 shrink-0" /> : <Database size={11} className="sm:w-3.5 sm:h-3.5 shrink-0" />}
        <span>{isPushing ? 'Syncing...' : <><span className="sm:hidden">Data Sync</span><span className="hidden sm:inline">Global Master Data Sync</span></>}</span>
    </button>
  );
}