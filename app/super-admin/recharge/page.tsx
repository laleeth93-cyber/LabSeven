"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IndianRupee, Activity, Loader2, RefreshCw, Plus, Crown, Building2 } from 'lucide-react';
import { getOrganizationsForRecharge, rechargeOrganization, resetOrganizationLimit } from '@/app/actions/message-station';

export default function SuperAdminRechargePage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;
    
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
    const [rechargeAmount, setRechargeAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (orgId) {
            loadOrganizations();
        }
    }, [orgId]);

    const loadOrganizations = async () => {
        setIsLoading(true);
        const res: any = await getOrganizationsForRecharge();
        if (res.success && res.data) {
            setOrganizations(res.data);
        } else {
            alert("Failed to load organizations: " + (res.error || "Unknown error"));
        }
        setIsLoading(false);
    };

    const handleRecharge = async () => {
        if (!selectedOrgId || !rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0) return;
        setIsProcessing(true);
        const res: any = await rechargeOrganization(Number(selectedOrgId), Number(rechargeAmount));
        if (res.success) {
            setRechargeAmount('');
            await loadOrganizations();
        } else {
            alert(res.error || 'Recharge failed');
        }
        setIsProcessing(false);
    };

    const handleResetLimit = async () => {
        if (!selectedOrgId) return;
        if (!confirm("Are you sure you want to reset this organization's message limit to 0?")) return;
        setIsProcessing(true);
        const res: any = await resetOrganizationLimit(Number(selectedOrgId));
        if (res.success) {
            await loadOrganizations();
        } else {
            alert(res.error || 'Reset failed');
        }
        setIsProcessing(false);
    };

    if (orgId !== 1) {
        return (
            <div className="flex h-full items-center justify-center p-6 text-slate-500 flex-col gap-4">
                <Crown size={48} className="opacity-20 text-fuchsia-500" />
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-slate-50/50 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        Master HQ <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-[10px] uppercase rounded-full border border-fuchsia-200">Recharge Hub</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Manage tenant message limits and top-ups centrally.</p>
                </div>
            </div>

            <div className="w-full max-w-3xl space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <IndianRupee size={18} className="text-emerald-500" /> Top-Up Account
                        </h3>
                        {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                    </div>
                    
                    <div className="space-y-6">
                        {/* Organization Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Laboratory</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Building2 size={16} className="text-slate-400" />
                                </div>
                                <select 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#d946ef] focus:ring-2 focus:ring-[#d946ef]/20 transition-all outline-none font-bold text-slate-700 bg-slate-50 appearance-none"
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value === '' ? '' : Number(e.target.value))}
                                >
                                    <option value="">-- Choose an Organization --</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>
                                            {org.name} (Limit: {org.whatsappLimit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedOrgId && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Current Status Box */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Limit</p>
                                        <p className="text-2xl font-black text-slate-800">
                                            {organizations.find(o => o.id === selectedOrgId)?.whatsappLimit || 0} <span className="text-sm font-medium text-slate-500">msgs</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={handleResetLimit}
                                        disabled={isProcessing}
                                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold border border-slate-200 hover:border-rose-200 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                        Reset to Zero
                                    </button>
                                </div>

                                {/* Recharge Amount Input */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Recharge Amount (₹)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <IndianRupee size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="number"
                                            min="1"
                                            value={rechargeAmount}
                                            onChange={e => setRechargeAmount(e.target.value)}
                                            placeholder="Enter amount in INR (e.g. 100)"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#d946ef] focus:ring-2 focus:ring-[#d946ef]/20 transition-all outline-none font-bold text-slate-800 text-lg shadow-inner bg-white"
                                        />
                                    </div>
                                    {/* Preview Calculation */}
                                    {rechargeAmount && !isNaN(Number(rechargeAmount)) && Number(rechargeAmount) > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-sm">
                                            <span className="w-6 h-6 bg-fuchsia-100 text-fuchsia-600 rounded-full flex items-center justify-center shrink-0">
                                                <Activity size={12} className="font-bold" />
                                            </span>
                                            <span className="text-slate-600 font-medium">
                                                ₹{rechargeAmount} will yield <span className="font-black text-fuchsia-600 text-base">{Math.floor(Number(rechargeAmount) / 0.15)}</span> messages.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button 
                                        onClick={handleRecharge}
                                        disabled={isProcessing || !rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0}
                                        className="px-6 py-3 bg-[#d946ef] hover:bg-[#c026d3] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                        {isProcessing ? 'Processing...' : 'Process Recharge'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
