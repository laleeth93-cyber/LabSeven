"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getMessageStationStats, getMessageStationSettings, updateMessageStationSettings } from '@/app/actions/message-station';
import { 
    MessageSquare, Settings2, LayoutDashboard, FileText, Receipt, 
    ShieldAlert, Send, Activity, Zap, Loader2, CheckCircle, ChevronLeft, Info 
} from 'lucide-react';
import MusicBarLoader from '@/app/components/MusicBarLoader';

type MenuTab = 'dashboard' | 'report' | 'invoice' | 'admin';

function MessageStationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeMenu, setActiveMenu] = useState<MenuTab>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
      whatsappReportAuto: false, whatsappReportManual: true,
      whatsappInvoiceAuto: false, whatsappInvoiceManual: true,
      whatsappAdminAlertAuto: false, whatsappAdminAlertManual: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const { data: session } = useSession();

  useEffect(() => {
    if (!tabParam) return;
    const lower = tabParam.toLowerCase();
    if (['dashboard', 'report', 'invoice', 'admin'].includes(lower)) {
        setActiveMenu(lower as MenuTab);
    }
  }, [tabParam]);

  const menuItems: { id: MenuTab; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'report', label: 'Report Notification', icon: FileText },
    { id: 'invoice', label: 'Invoice Notification', icon: Receipt },
    { id: 'admin', label: 'Admin Alert', icon: ShieldAlert }
  ];

  useEffect(() => {
    if (activeMenu === 'dashboard') {
        setIsLoading(true);
        getMessageStationStats().then(res => {
            if (res.success) setStats(res.data);
            setIsLoading(false);
        });
    } else {
        setIsLoading(true);
        getMessageStationSettings().then(res => {
            if (res.success && res.data) {
                setSettings({
                    whatsappReportAuto: res.data.whatsappReportAuto ?? false,
                    whatsappReportManual: res.data.whatsappReportManual ?? true,
                    whatsappInvoiceAuto: res.data.whatsappInvoiceAuto ?? false,
                    whatsappInvoiceManual: res.data.whatsappInvoiceManual ?? true,
                    whatsappAdminAlertAuto: res.data.whatsappAdminAlertAuto ?? false,
                    whatsappAdminAlertManual: res.data.whatsappAdminAlertManual ?? true
                });
            }
            setIsLoading(false);
        });
    }
  }, [activeMenu]);

  const handleSaveSettings = async () => {
      setIsSaving(true);
      await updateMessageStationSettings(settings);
      setIsSaving(false);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 1500);
  };

  const currentTabDef = menuItems.find(m => m.id === activeMenu) || menuItems[0];
  const CurrentIcon = currentTabDef.icon;

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
      <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
        
        {/* SUCCESS POPUP */}
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-xl animate-in zoom-in-95 duration-200 max-w-xs w-full mx-4 border border-slate-200">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-100">
                <CheckCircle className="text-emerald-500" size={26} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight text-center" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                Settings Saved Successfully!
              </h2>
            </div>
          </div>
        )}

        {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
            {/* Left: 20px Title in Calibri */}
            <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                    <Send size={16} />
                </div>
                <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    Message Station
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[9.5px] uppercase tracking-wider rounded font-bold shadow-2xs">
                    HUB
                </span>
            </div>

            {/* Right: Desktop Module Tabs (Dashboard, Report Notification, Invoice Notification, Admin Alert) */}
            <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                {menuItems.map(item => {
                    const isActive = activeMenu === item.id;
                    const ItemIcon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveMenu(item.id);
                                router.replace(`/message-station?tab=${item.id}`, { scroll: false });
                            }}
                            className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                                isActive ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <ItemIcon size={13} className={isActive ? 'text-[#9575cd]' : 'text-slate-400'} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Mobile Tabs Header */}
        <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
            {menuItems.map(item => {
                const isActive = activeMenu === item.id;
                const ItemIcon = item.icon;
                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveMenu(item.id);
                            router.replace(`/message-station?tab=${item.id}`, { scroll: false });
                        }}
                        className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                            isActive ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
                        }`}
                    >
                        <ItemIcon size={12} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </div>

        {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
        <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-purple-50 text-[#9575cd]">
                    <CurrentIcon size={14} />
                </div>
                <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    {activeMenu === 'dashboard' ? 'Messaging Usage & Analytics' : `${currentTabDef.label} Settings`}
                </h3>
                <span className="text-[10px] text-slate-500 font-normal bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {activeMenu === 'dashboard' ? `Available Credits: ${stats?.limit ?? 0}` : 'WhatsApp Automation'}
                </span>
            </div>

            <div className="flex items-center gap-1.5">
                {activeMenu !== 'dashboard' ? (
                    <button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="h-[24px] xl:h-[26px] px-3.5 xl:px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all shrink-0 disabled:opacity-50"
                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} strokeWidth={2} />}
                        <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                        {isLoading && <Loader2 size={13} className="animate-spin text-[#9575cd]" />}
                        <span className="hidden sm:inline">Real-time Delivery Analytics</span>
                    </div>
                )}
            </div>
        </div>

        {/* CONTENT AREA - CARDS AS SEPARATE BLOCKS */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 custom-scrollbar min-h-0 flex flex-col">
            <div className="max-w-6xl w-full mx-auto space-y-2.5 xl:space-y-3">
                
                {/* 1. DASHBOARD TAB */}
                {activeMenu === 'dashboard' && (
                    <div className="space-y-2.5 xl:space-y-3">
                        
                        {/* Top Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 xl:gap-3">
                            
                            {/* Card 1: Messages Used */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3.5 xl:p-4 flex items-center justify-between relative overflow-hidden">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Messages Used</p>
                                    <h3 className="text-2xl xl:text-3xl font-bold text-slate-800 leading-none">
                                        {isLoading ? '...' : (stats?.totalSent || 0)}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-normal">Total notifications delivered to patients & admins</p>
                                </div>
                                <div className="w-11 h-11 rounded-[6px] bg-purple-50 text-[#9575cd] border border-purple-100 flex items-center justify-center shrink-0">
                                    <Send size={20} strokeWidth={2} />
                                </div>
                            </div>

                            {/* Card 2: Available Credits */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3.5 xl:p-4 flex items-center justify-between relative overflow-hidden">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Available Credits</p>
                                    <h3 className="text-2xl xl:text-3xl font-bold text-emerald-600 leading-none">
                                        {isLoading ? '...' : (stats?.limit ?? 0)}
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-normal">Remaining message balance on current plan</p>
                                </div>
                                <div className="w-11 h-11 rounded-[6px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                    <Activity size={20} strokeWidth={2} />
                                </div>
                            </div>
                        </div>

                        {/* Section Header */}
                        <div className="pt-1">
                            <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                <Info size={14} className="text-[#9575cd]"/> Usage Breakdown by Notification Type
                            </h3>
                        </div>

                        {/* Usage Breakdown Cards (Separate Blocks) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 xl:gap-3">
                            
                            {/* Breakdown 1: Reporting */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3.5 flex items-center gap-3 hover:border-[#9575cd] transition-all">
                                <div className="w-10 h-10 rounded-[6px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Report Notifications</p>
                                    <p className="text-xl font-bold text-slate-800 leading-none mb-0.5">{isLoading ? '...' : (stats?.reportCount || 0)}</p>
                                    <span className="text-[10px] text-slate-400">Patient report PDFs</span>
                                </div>
                            </div>

                            {/* Breakdown 2: Invoices */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3.5 flex items-center gap-3 hover:border-[#9575cd] transition-all">
                                <div className="w-10 h-10 rounded-[6px] bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                                    <Receipt size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Invoice Notifications</p>
                                    <p className="text-xl font-bold text-slate-800 leading-none mb-0.5">{isLoading ? '...' : (stats?.invoiceCount || 0)}</p>
                                    <span className="text-[10px] text-slate-400">Billing receipts & bills</span>
                                </div>
                            </div>

                            {/* Breakdown 3: Admin Alerts */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3.5 flex items-center gap-3 hover:border-[#9575cd] transition-all">
                                <div className="w-10 h-10 rounded-[6px] bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                                    <ShieldAlert size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Admin Alerts</p>
                                    <p className="text-xl font-bold text-slate-800 leading-none mb-0.5">{isLoading ? '...' : (stats?.alertCount || 0)}</p>
                                    <span className="text-[10px] text-slate-400">Security & audit events</span>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 2. REPORT NOTIFICATION TAB */}
                {activeMenu === 'report' && (
                    <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-4 xl:p-5 flex flex-col space-y-3.5 max-w-4xl mx-auto w-full">
                        <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[14px] xl:text-[15px] font-semibold text-slate-800 flex items-center gap-2" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    <FileText size={16} className="text-[#9575cd]"/> Report Notification Automation
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Configure how patients receive their diagnostic test reports via WhatsApp.</p>
                            </div>
                            {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                        </div>

                        <div className="space-y-2.5">
                            {/* Auto Send Toggle */}
                            <div className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[5px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                        <Zap size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-semibold text-slate-800">Auto Send (Recommended)</h4>
                                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                            Automatically send the test report PDF to the patient&apos;s WhatsApp number once results are approved and finalized.
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.whatsappReportAuto} 
                                        onChange={e => setSettings(s => ({...s, whatsappReportAuto: e.target.checked}))} 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Manual Send Toggle */}
                            <div className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[5px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                        <Send size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-semibold text-slate-800">Manual Send Button</h4>
                                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                            Enable the manual &quot;Send WhatsApp&quot; button in the Report View and Patient List action menus.
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.whatsappReportManual} 
                                        onChange={e => setSettings(s => ({...s, whatsappReportManual: e.target.checked}))} 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="h-[26px] xl:h-[28px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} strokeWidth={2} />}
                                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. INVOICE NOTIFICATION TAB */}
                {activeMenu === 'invoice' && (
                    <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-4 xl:p-5 flex flex-col space-y-3.5 max-w-4xl mx-auto w-full">
                        <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[14px] xl:text-[15px] font-semibold text-slate-800 flex items-center gap-2" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    <Receipt size={16} className="text-[#9575cd]"/> Invoice Notification Automation
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Configure how patients receive invoice and billing receipts via WhatsApp.</p>
                            </div>
                            {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                        </div>

                        <div className="space-y-2.5">
                            {/* Auto Send Toggle */}
                            <div className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[5px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                        <Zap size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-semibold text-slate-800">Auto Send (Recommended)</h4>
                                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                            Automatically send the invoice receipt PDF to the patient&apos;s WhatsApp as soon as patient registration or payment is saved.
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.whatsappInvoiceAuto} 
                                        onChange={e => setSettings(s => ({...s, whatsappInvoiceAuto: e.target.checked}))} 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Manual Send Toggle */}
                            <div className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[5px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                        <Send size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-semibold text-slate-800">Manual Send Button</h4>
                                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                            Enable the manual &quot;Send WhatsApp&quot; button in the invoice dialog and patient billing panels.
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.whatsappInvoiceManual} 
                                        onChange={e => setSettings(s => ({...s, whatsappInvoiceManual: e.target.checked}))} 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="h-[26px] xl:h-[28px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} strokeWidth={2} />}
                                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. ADMIN ALERT TAB */}
                {activeMenu === 'admin' && (
                    <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-4 xl:p-5 flex flex-col space-y-3.5 max-w-4xl mx-auto w-full">
                        <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[14px] xl:text-[15px] font-semibold text-slate-800 flex items-center gap-2" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    <ShieldAlert size={16} className="text-[#9575cd]"/> Admin Alert Automation
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 font-normal">Configure automatic WhatsApp alerts delivered directly to lab administrators.</p>
                            </div>
                            {isLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                        </div>

                        <div className="space-y-2.5">
                            {/* System Triggered Alerts Toggle */}
                            <div className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[5px] bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                                        <Zap size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-semibold text-slate-800">System Triggered Alerts (Recommended)</h4>
                                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                            Instantly alert administrators when critical billing events occur (e.g., special discounts granted, dues cleared, test cancellations).
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.whatsappAdminAlertAuto} 
                                        onChange={e => setSettings(s => ({...s, whatsappAdminAlertAuto: e.target.checked}))} 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Manual Alert Toggle */}
                            <div className="p-3 rounded-[6px] border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-[5px] bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                                        <Send size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-semibold text-slate-800">Manual Alert Staff Trigger</h4>
                                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                                            Allow authorized front-desk staff to send direct escalation alerts to management when required.
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.whatsappAdminAlertManual} 
                                        onChange={e => setSettings(s => ({...s, whatsappAdminAlertManual: e.target.checked}))} 
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="h-[26px] xl:h-[28px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Settings2 size={13} strokeWidth={2} />}
                                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* Mobile Footer */}
        <footer className="md:hidden shrink-0 bg-white p-2 z-[50] pb-safe border-t border-slate-100">
            <div className="flex items-center gap-1.5 w-full">
                <button 
                    type="button" 
                    onClick={() => router.back()} 
                    className="h-6 flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-medium text-[9px] rounded active:scale-95 transition-all gap-0.5"
                >
                    <ChevronLeft size={12} />
                    <span>Back</span>
                </button>

                {activeMenu !== 'dashboard' && (
                    <button 
                        type="button" 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="h-6 flex-1 bg-[#9575cd] hover:bg-[#7e57c2] text-white rounded text-[9.5px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all disabled:opacity-60"
                    >
                        {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Settings2 size={11} />}
                        <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                )}
            </div>
        </footer>

      </div>
    </div>
  );
}

export default function MessageStationPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-white font-sans">
                <MusicBarLoader text="Loading Message Station..." />
            </div>
        }>
            <MessageStationContent />
        </Suspense>
    );
}
