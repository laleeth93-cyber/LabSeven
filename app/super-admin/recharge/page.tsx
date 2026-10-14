"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { IndianRupee, Activity, Loader2, RefreshCw, Plus, Crown, Building2, Search, X, MessageSquare, ArrowUpRight } from 'lucide-react';
import { getOrganizationsForRecharge, rechargeOrganization, resetOrganizationLimit } from '@/app/actions/message-station';
import toast from 'react-hot-toast';

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

export default function SuperAdminRechargePage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;
    
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
    const [rechargeAmount, setRechargeAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [labSearchQuery, setLabSearchQuery] = useState<string>('');

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
            toast.error("Failed to load organizations: " + (res.error || "Unknown error"));
        }
        setIsLoading(false);
    };

    const handleRecharge = async () => {
        if (!selectedOrgId || !rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0) return;
        setIsProcessing(true);
        const res: any = await rechargeOrganization(Number(selectedOrgId), Number(rechargeAmount));
        if (res.success) {
            const added = res.addedMessages || Math.floor(Number(rechargeAmount) / 0.15);
            setRechargeAmount('');
            toast.success(`Recharged ₹${rechargeAmount}! Added ${added} messages.`);
            await loadOrganizations();
        } else {
            toast.error(res.error || 'Recharge failed');
        }
        setIsProcessing(false);
    };

    const handleResetLimit = async () => {
        if (!selectedOrgId) return;
        if (!confirm("Are you sure you want to reset this organization's message limit to 0?")) return;
        setIsProcessing(true);
        const res: any = await resetOrganizationLimit(Number(selectedOrgId));
        if (res.success) {
            toast.success("Organization limit reset to zero.");
            await loadOrganizations();
        } else {
            toast.error(res.error || 'Reset failed');
        }
        setIsProcessing(false);
    };

    const selectedOrg = organizations.find(o => o.id === selectedOrgId);
    const filteredOrgs = organizations.filter(o => !labSearchQuery.trim() || o.name?.toLowerCase().includes(labSearchQuery.toLowerCase()));

    if (orgId !== 1) {
        return (
            <div className="flex h-full items-center justify-center p-6 text-slate-500 flex-col gap-4">
                <Crown size={48} className="opacity-20 text-fuchsia-500" />
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-slate-50/50 p-2 sm:p-6 overflow-y-auto custom-scrollbar">
            
            {/* ========================================================================= */}
            {/* DESKTOP RATIO VIEW (100% PRESERVED, UNCHANGED)                            */}
            {/* ========================================================================= */}
            <div className="hidden md:block w-full">
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

            {/* ========================================================================= */}
            {/* MOBILE RATIO VIEW (TAILORED FOR MOBILE VIEWPORT)                           */}
            {/* ========================================================================= */}
            <div className="md:hidden flex flex-col gap-2.5 w-full">
                {/* Mobile Header: Title & Refresh button */}
                <div className="flex items-center justify-between gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-base font-black text-slate-800 tracking-tight">Recharge Hub</h1>
                        <span className="px-1.5 py-0.2 bg-fuchsia-100 text-fuchsia-700 text-[8px] font-bold uppercase rounded-full border border-fuchsia-200">HQ</span>
                    </div>
                    <button 
                        type="button" 
                        onClick={loadOrganizations} 
                        disabled={isLoading}
                        className="h-6 px-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[9.5px] font-bold rounded-md flex items-center gap-1 shadow-2xs active:scale-95 transition-all select-none"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        <RefreshCw size={10} className={isLoading ? "animate-spin text-fuchsia-600" : "text-slate-500"} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Cute Metrics Row (3 compact cards) */}
                <div className="grid grid-cols-3 gap-1.5 w-full shrink-0">
                    <div className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-xs flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Labs</span>
                        <span className="text-sm font-black text-slate-800 leading-tight mt-0.5">{organizations.length}</span>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-xs flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Balance</span>
                        <span className="text-sm font-black text-emerald-600 leading-tight mt-0.5">
                            {organizations.reduce((acc, o) => acc + (o.whatsappLimit || 0), 0)}
                        </span>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-xs flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Message Rate</span>
                        <span className="text-sm font-black text-fuchsia-600 leading-tight mt-0.5">₹0.15</span>
                    </div>
                </div>

                {/* Top-Up Form Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs flex flex-col gap-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <IndianRupee size={13} className="text-emerald-500" /> Top-Up Account
                        </h2>
                        <div className="flex items-center gap-1.5">
                            {isLoading && <Loader2 size={12} className="animate-spin text-fuchsia-600" />}
                            {selectedOrgId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedOrgId('');
                                        setRechargeAmount('');
                                    }}
                                    className="h-5 px-1.5 rounded text-[8.5px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-0.5 active:scale-95 transition-all select-none"
                                    title="Close message top-up"
                                >
                                    <X size={10} /> Close
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Laboratory Selector */}
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Select Laboratory</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <Building2 size={13} className="text-slate-400" />
                            </div>
                            <select 
                                className="w-full pl-7 pr-7 h-8 rounded-lg border border-slate-200 focus:border-[#d946ef] outline-none text-xs font-bold text-slate-800 bg-slate-50/60 appearance-none shadow-2xs"
                                value={selectedOrgId}
                                onChange={(e) => setSelectedOrgId(e.target.value === '' ? '' : Number(e.target.value))}
                            >
                                <option value="">-- Choose Laboratory --</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name} ({org.whatsappLimit || 0} msgs)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* If selected */}
                    {selectedOrgId && (
                        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200 pt-1">
                            {/* Current Limit Strip */}
                            <div className="bg-slate-50/80 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
                                <div>
                                    <p className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Current Balance</p>
                                    <p className="text-base font-black text-slate-800 leading-tight mt-0.5">
                                        {selectedOrg?.whatsappLimit || 0} <span className="text-[10px] font-medium text-slate-500">messages</span>
                                    </p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleResetLimit}
                                    disabled={isProcessing}
                                    className="h-6 px-2 bg-white hover:bg-rose-50 text-rose-600 text-[9px] font-bold border border-rose-200/70 rounded-md shadow-2xs transition-colors flex items-center gap-1 disabled:opacity-50 active:scale-95"
                                    style={{ WebkitTapHighlightColor: 'transparent' }}
                                >
                                    {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                    <span>Reset to 0</span>
                                </button>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Recharge Amount (₹)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                        <IndianRupee size={13} className="text-slate-400" />
                                    </div>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={rechargeAmount}
                                        onChange={e => setRechargeAmount(e.target.value)}
                                        placeholder="Enter amount (e.g. 100)"
                                        className="w-full pl-7 pr-3 h-8 rounded-lg border border-slate-200 focus:border-[#d946ef] outline-none font-bold text-slate-800 text-xs shadow-2xs bg-white"
                                    />
                                </div>

                                {/* Preset Chips */}
                                <div className="flex items-center gap-1 mt-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase shrink-0 mr-0.5">Quick:</span>
                                    {PRESET_AMOUNTS.map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setRechargeAmount(amt.toString())}
                                            className={`h-5 px-1.5 rounded text-[9px] font-bold border transition-all shrink-0 active:scale-95 ${
                                                rechargeAmount === amt.toString()
                                                    ? 'bg-fuchsia-600 text-white border-fuchsia-600 shadow-2xs'
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                            }`}
                                            style={{ WebkitTapHighlightColor: 'transparent' }}
                                        >
                                            +₹{amt}
                                        </button>
                                    ))}
                                </div>

                                {/* Yield Preview */}
                                {rechargeAmount && !isNaN(Number(rechargeAmount)) && Number(rechargeAmount) > 0 && (
                                    <div className="mt-2 p-1.5 rounded-md bg-fuchsia-50/80 border border-fuchsia-100 flex items-center gap-1.5 text-[10px]">
                                        <Activity size={12} className="text-fuchsia-600 shrink-0" />
                                        <span className="text-slate-700">
                                            ₹{rechargeAmount} yields <span className="font-black text-fuchsia-700">{Math.floor(Number(rechargeAmount) / 0.15)}</span> messages (@ ₹0.15/msg)
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="button"
                                onClick={handleRecharge}
                                disabled={isProcessing || !rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0}
                                className="h-8 w-full bg-[#d946ef] hover:bg-[#c026d3] text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                <span>{isProcessing ? 'Processing Recharge...' : `Process Recharge (${rechargeAmount ? `₹${rechargeAmount}` : 'Enter Amount'})`}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Laboratories Balance Directory */}
                <div className="flex flex-col gap-2 pt-1 pb-6">
                    <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Laboratories ({filteredOrgs.length})
                        </span>
                        <div className="relative w-36">
                            <input 
                                type="text"
                                placeholder="Filter labs..."
                                value={labSearchQuery}
                                onChange={e => setLabSearchQuery(e.target.value)}
                                className="w-full h-6 pl-5 pr-4 border border-slate-200 rounded text-[9.5px] focus:border-[#d946ef] outline-none bg-white text-slate-700 placeholder:text-slate-400 shadow-2xs"
                            />
                            <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            {labSearchQuery && (
                                <button onClick={() => setLabSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400">
                                    <X size={9} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {filteredOrgs.length === 0 ? (
                            <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
                                No laboratories match filter.
                            </div>
                        ) : (
                            filteredOrgs.map(org => {
                                const isSelected = selectedOrgId === org.id;
                                return (
                                    <article 
                                        key={org.id} 
                                        onClick={() => {
                                            if (selectedOrgId === org.id) {
                                                setSelectedOrgId('');
                                                setRechargeAmount('');
                                            } else {
                                                setSelectedOrgId(org.id);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        }}
                                        className={`rounded-lg border p-2 flex items-center justify-between gap-2 transition-all cursor-pointer select-none active:scale-98 ${
                                            isSelected 
                                                ? 'bg-fuchsia-50/50 border-[#d946ef] shadow-2xs ring-1 ring-[#d946ef]/30' 
                                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                                        }`}
                                        style={{ WebkitTapHighlightColor: 'transparent' }}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-xs font-bold text-slate-800 truncate">{org.name}</h3>
                                                {isSelected && (
                                                    <span className="text-[7.5px] font-bold text-fuchsia-700 bg-fuchsia-100 rounded px-1 py-0.2 flex items-center gap-0.5">
                                                        Selected <X size={7} />
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] font-mono text-slate-400">ORG-{org.id.toString().padStart(4, '0')}</p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <div className="text-right">
                                                <p className="text-xs font-black text-emerald-600 leading-tight">
                                                    {org.whatsappLimit || 0}
                                                </p>
                                                <p className="text-[7.5px] font-bold text-slate-400 uppercase">msgs</p>
                                            </div>
                                            <span className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                                isSelected ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}
                                            title={isSelected ? "Click again to close" : "Select laboratory"}>
                                                {isSelected ? <X size={12} /> : <ArrowUpRight size={12} />}
                                            </span>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
