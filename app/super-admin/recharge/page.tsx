"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { IndianRupee, Activity, Loader2, RefreshCw, Plus, Crown, Building2, Search, X, MessageSquare, ArrowUpRight, LibraryBig, UserCog } from 'lucide-react';
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

    const hqTabs = [
        { href: "/super-admin", label: "Tenant Labs", icon: <Building2 size={13} />, active: false },
        { href: "/super-admin/central-library", label: "Central Library", icon: <LibraryBig size={13} />, active: false },
        { href: "/super-admin/admins", label: "System Admins", icon: <UserCog size={13} />, active: false },
        { href: "/super-admin/recharge", label: "Message Recharge", icon: <IndianRupee size={13} />, active: true },
    ];

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

    const totalBalance = organizations.reduce((acc, o) => acc + (o.whatsappLimit || 0), 0);

    if (orgId !== 1) {
        return (
            <div className="flex h-full items-center justify-center p-6 text-slate-500 flex-col gap-4 font-sans">
                <Crown size={48} className="opacity-20 text-[#9575cd]" />
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

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
                            <IndianRupee size={14} />
                        </div>
                        <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 shrink-0" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Tenant Message Recharge Hub
                        </h3>
                        <span className="text-[10px] xl:text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 shrink-0">
                            Total Labs ({organizations.length})
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                            type="button" 
                            onClick={loadOrganizations} 
                            disabled={isLoading}
                            className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1 shadow-2xs transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={12} className={isLoading ? "animate-spin text-[#9575cd]" : "text-slate-500"} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 min-h-0 custom-scrollbar flex flex-col gap-2.5">
                    {/* Summary Metric Strip */}
                    <div className="grid grid-cols-3 gap-2 xl:gap-2.5 shrink-0">
                        <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Laboratories</span>
                                <span className="text-[16px] xl:text-[18px] font-bold text-slate-800 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    {organizations.length}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded bg-purple-50 text-[#9575cd] flex items-center justify-center">
                                <Building2 size={16} />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Messages Balance</span>
                                <span className="text-[16px] xl:text-[18px] font-bold text-emerald-600 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    {totalBalance}
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <MessageSquare size={16} />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 shadow-2xs flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Message Base Rate</span>
                                <span className="text-[16px] xl:text-[18px] font-bold text-purple-700 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    ₹0.15 / msg
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded bg-purple-50 text-[#9575cd] flex items-center justify-center">
                                <IndianRupee size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0">
                        {/* LEFT: Top-Up Action Block */}
                        <div className="lg:col-span-5 bg-white rounded-[6px] border border-slate-200 shadow-sm p-3 xl:p-4 flex flex-col justify-between shrink-0">
                            <div>
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                                    <h3 className="font-semibold text-slate-800 text-[14px] xl:text-[15px] flex items-center gap-1.5" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                        <IndianRupee size={15} className="text-[#9575cd]" /> Top-Up Account Balance
                                    </h3>
                                    {isLoading && <Loader2 size={13} className="animate-spin text-[#9575cd]" />}
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                            Select Laboratory <span className="text-rose-500 ml-0.5">*</span>
                                        </label>
                                        <select 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd]"
                                            value={selectedOrgId}
                                            onChange={(e) => setSelectedOrgId(e.target.value === '' ? '' : Number(e.target.value))}
                                        >
                                            <option value="">-- Choose Laboratory --</option>
                                            {organizations.map(org => (
                                                <option key={org.id} value={org.id}>
                                                    {org.name} (Limit: {org.whatsappLimit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedOrgId && (
                                        <div className="space-y-3 animate-in fade-in duration-150">
                                            <div className="bg-purple-50/60 border border-purple-100 rounded-[6px] p-2.5 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9.5px] font-semibold text-[#9575cd] uppercase tracking-wider block">Current Balance</span>
                                                    <span className="text-[16px] font-bold text-slate-800 leading-none mt-0.5 block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                                        {selectedOrg?.whatsappLimit || 0} <span className="text-[10px] font-normal text-slate-500">msgs</span>
                                                    </span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={handleResetLimit}
                                                    disabled={isProcessing}
                                                    className="h-[22px] px-2 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-semibold border border-rose-200 rounded shadow-2xs transition-colors flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {isProcessing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                                                    <span>Reset to 0</span>
                                                </button>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                                    Recharge Amount (₹)
                                                </label>
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    value={rechargeAmount}
                                                    onChange={e => setRechargeAmount(e.target.value)}
                                                    placeholder="Enter amount (e.g. 100)"
                                                    className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"
                                                />

                                                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                                    <span className="text-[9px] font-semibold text-slate-400 uppercase mr-0.5">Quick:</span>
                                                    {PRESET_AMOUNTS.map(amt => (
                                                        <button
                                                            key={amt}
                                                            type="button"
                                                            onClick={() => setRechargeAmount(amt.toString())}
                                                            className={`h-[20px] px-1.5 rounded text-[10px] font-medium border transition-all ${
                                                                rechargeAmount === amt.toString()
                                                                    ? 'bg-[#9575cd] text-white border-[#9575cd] shadow-2xs'
                                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                                                            }`}
                                                        >
                                                            +₹{amt}
                                                        </button>
                                                    ))}
                                                </div>

                                                {rechargeAmount && !isNaN(Number(rechargeAmount)) && Number(rechargeAmount) > 0 && (
                                                    <div className="mt-2 p-2 rounded bg-purple-50/70 border border-purple-200 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                                                        <Activity size={12} className="text-[#9575cd] shrink-0" />
                                                        <span>
                                                            ₹{rechargeAmount} gives <strong className="text-purple-700 font-bold">{Math.floor(Number(rechargeAmount) / 0.15)}</strong> messages (@ ₹0.15/msg)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedOrgId && (
                                <div className="pt-3 border-t border-slate-100 mt-3">
                                    <button 
                                        type="button"
                                        onClick={handleRecharge}
                                        disabled={isProcessing || !rechargeAmount || isNaN(Number(rechargeAmount)) || Number(rechargeAmount) <= 0}
                                        className="h-[26px] xl:h-[28px] w-full rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center justify-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                                    >
                                        {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                                        <span>{isProcessing ? 'Processing Recharge...' : `Process Recharge ${rechargeAmount ? `(₹${rechargeAmount})` : ''}`}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Laboratories Balance Directory Table */}
                        <div className="lg:col-span-7 flex flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-[300px]">
                            {/* Table Subheader with Search */}
                            <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] xl:text-[13px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                        Tenant Laboratories
                                    </span>
                                    <span className="text-[10px] xl:text-[11px] px-2 py-0.5 rounded bg-purple-50 text-[#9575cd] font-semibold border border-purple-200">
                                        {filteredOrgs.length}
                                    </span>
                                </div>
                                <div className="relative w-44 sm:w-52">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                                    <input 
                                        type="text" 
                                        placeholder="Filter labs..."
                                        value={labSearchQuery}
                                        onChange={e => setLabSearchQuery(e.target.value)}
                                        className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
                                    />
                                </div>
                            </div>

                            {/* Table Area with space from header and edges matching Result Entry Worklist & Patient List */}
                            <div className="flex-1 overflow-hidden bg-slate-50/50 p-2 md:p-2.5 xl:p-3 flex flex-col min-h-0">
                                <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
                                    <table className="w-full text-left text-sm border-collapse border-spacing-0 whitespace-nowrap bg-white">
                                        <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                            <tr>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 border-b border-[#7e57c2]" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Lab ID</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none border-b border-[#7e57c2]" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Laboratory Name</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-right w-24 border-b border-[#7e57c2]" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Balance</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20 border-b border-[#7e57c2]" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrgs.map(org => {
                                                const isSelected = selectedOrgId === org.id;

                                                return (
                                                    <tr key={org.id} className={`hover:bg-purple-50/40 transition-colors border-b border-[#d9d9d9] ${isSelected ? 'bg-purple-50/50' : ''}`}>
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] font-mono text-slate-600 text-[11px]">
                                                            ORG-{org.id.toString().padStart(4, '0')}
                                                        </td>

                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                            <span className="font-medium text-slate-800 text-[11px] xl:text-[12px]">{org.name}</span>
                                                        </td>

                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-right">
                                                            <span className="font-bold text-emerald-600 font-mono text-[11px] xl:text-[12px]">
                                                                {org.whatsappLimit || 0}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 ml-1">msgs</span>
                                                        </td>

                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSelectedOrgId(isSelected ? '' : org.id)}
                                                                className={`h-[22px] px-2 text-[10px] font-semibold rounded shadow-2xs transition-colors inline-flex items-center gap-1 ${
                                                                    isSelected 
                                                                        ? 'bg-[#9575cd] text-white' 
                                                                        : 'bg-purple-50 text-[#9575cd] border border-purple-200 hover:bg-purple-100'
                                                                }`}
                                                            >
                                                                {isSelected ? <X size={10} /> : <ArrowUpRight size={10} />}
                                                                <span>{isSelected ? 'Selected' : 'Top-Up'}</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredOrgs.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs italic">
                                                        No laboratories found matching filter.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* PINNED TABLE FOOTER */}
                            <div className="px-3 py-1.5 md:py-2 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                <div>
                                    Showing: <strong className="text-slate-700">{filteredOrgs.length} Laboratories</strong>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    Click Top-Up to load into the recharge console
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
