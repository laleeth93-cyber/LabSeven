"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getMessageStationStats, getMessageStationSettings, updateMessageStationSettings } from '@/app/actions/message-station';
import { MessageSquare, Settings2, LayoutDashboard, FileText, Receipt, ShieldAlert, Send, Activity, Zap, Loader2 } from 'lucide-react';

export default function MessageStation() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
      whatsappReportAuto: false, whatsappReportManual: true,
      whatsappInvoiceAuto: false, whatsappInvoiceManual: true,
      whatsappAdminAlertAuto: false, whatsappAdminAlertManual: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data: session } = useSession();

  const menuItems = [
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
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col w-full max-w-none animate-in fade-in duration-300 bg-[#f8fafc]">
      
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
        
        {/* Compact Header inside the body */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 z-20 relative">
            <div>
                <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <MessageSquare size={18} className="text-[#9575cd]" />
                    Message Station
                    <span className="px-2 py-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] uppercase tracking-wider rounded-md shadow-sm font-bold">
                    Hub
                    </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                    Centralized control center for all automated notifications and communications.
                </p>
            </div>
        </div>

        {/* Horizontal Menu */}
        <div className="flex items-center px-5 border-b border-slate-100 bg-slate-50/50 shrink-0 overflow-x-auto hide-scrollbar z-20 relative">
            {menuItems.map(item => {
                const isActive = activeMenu === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold transition-all border-b-[3px] whitespace-nowrap ${
                            isActive 
                            ? 'border-[#9575cd] text-[#7e57c2] bg-white' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        <item.icon size={16} className={isActive ? 'text-[#9575cd]' : 'text-slate-400'} />
                        {item.label}
                    </button>
                )
            })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-white overflow-y-auto">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-32 bg-slate-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none z-0"></div>

            <div className="relative z-10 w-full p-6 max-w-6xl mx-auto h-full">
                
                {activeMenu === 'dashboard' ? (
                    <div className="w-full space-y-6">
                        <div className="flex items-center justify-between mb-2">
                           <h2 className="text-xl font-black text-slate-800">Usage Analytics</h2>
                           {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Used Messages Card */}
                            <div className="bg-gradient-to-br from-violet-500 to-[#5e35b1] rounded-2xl p-6 shadow-md shadow-violet-500/20 text-white relative overflow-hidden flex items-center justify-between">
                                <div className="absolute top-0 right-0 p-12 bg-white rounded-full blur-3xl opacity-10 -mr-8 -mt-8 pointer-events-none"></div>
                                <div>
                                    <p className="text-violet-100 font-bold text-sm uppercase tracking-wide mb-1">Messages Used</p>
                                    <h3 className="text-4xl font-black">{stats?.totalSent || 0}</h3>
                                </div>
                                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <Send size={24} className="text-white" />
                                </div>
                            </div>
                            
                            {/* Remaining Messages Card */}
                            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 shadow-md shadow-emerald-500/20 text-white relative overflow-hidden flex items-center justify-between">
                                <div className="absolute top-0 right-0 p-12 bg-white rounded-full blur-3xl opacity-10 -mr-8 -mt-8 pointer-events-none"></div>
                                <div>
                                    <p className="text-emerald-100 font-bold text-sm uppercase tracking-wide mb-1">Available Credits</p>
                                    <h3 className="text-4xl font-black">{stats?.limit ?? 0}</h3>
                                </div>
                                <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                                    <Activity size={24} className="text-white" />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pt-4">Usage Breakdown</h3>
                        
                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Reporting */}
                            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 group hover:border-[#9575cd] transition-colors">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Reporting</p>
                                    <p className="text-2xl font-black text-slate-800">{stats?.reportCount || 0}</p>
                                </div>
                            </div>

                            {/* Invoices */}
                            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 group hover:border-[#9575cd] transition-colors">
                                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <Receipt size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Invoices</p>
                                    <p className="text-2xl font-black text-slate-800">{stats?.invoiceCount || 0}</p>
                                </div>
                            </div>

                            {/* Alerts */}
                            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 group hover:border-[#9575cd] transition-colors">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Admin Alerts</p>
                                    <p className="text-2xl font-black text-slate-800">{stats?.alertCount || 0}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : activeMenu === 'report' ? (
                    <div className="w-full max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center justify-between mb-4">
                           <div>
                               <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                   <FileText className="text-[#9575cd]" size={24} />
                                   Report Notification Settings
                               </h2>
                               <p className="text-sm text-slate-500 mt-1">Configure how patients receive their reports via WhatsApp.</p>
                           </div>
                           {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Automation Preferences</h3>
                            
                            <div className="space-y-6">
                                {/* Auto Send */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#9575cd]/30 transition-colors bg-slate-50/50">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Auto Send (Recommended)</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Automatically send the report PDF to the patient's WhatsApp as soon as the results are approved and the report is finalized.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappReportAuto} onChange={e => setSettings(s => ({...s, whatsappReportAuto: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Manual Send */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#9575cd]/30 transition-colors bg-slate-50/50">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Send size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Manual Send Button</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Enable the manual &quot;Send WhatsApp&quot; button on the Report View page, allowing staff to trigger the message manually.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappReportManual} onChange={e => setSettings(s => ({...s, whatsappReportManual: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />}
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeMenu === 'invoice' ? (
                    <div className="w-full max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center justify-between mb-4">
                           <div>
                               <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                   <Receipt className="text-[#9575cd]" size={24} />
                                   Invoice Notification Settings
                               </h2>
                               <p className="text-sm text-slate-500 mt-1">Configure how patients receive their invoices/receipts via WhatsApp.</p>
                           </div>
                           {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Automation Preferences</h3>
                            
                            <div className="space-y-6">
                                {/* Auto Send */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#9575cd]/30 transition-colors bg-slate-50/50">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Auto Send (Recommended)</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Automatically send the invoice PDF to the patient's WhatsApp as soon as registration is completed.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappInvoiceAuto} onChange={e => setSettings(s => ({...s, whatsappInvoiceAuto: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Manual Send */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#9575cd]/30 transition-colors bg-slate-50/50">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Send size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Manual Send Button</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Enable the manual &quot;Send WhatsApp&quot; button on the Invoice preview, allowing staff to trigger the message manually.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappInvoiceManual} onChange={e => setSettings(s => ({...s, whatsappInvoiceManual: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />}
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : activeMenu === 'admin' ? (
                    <div className="w-full max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center justify-between mb-4">
                           <div>
                               <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                   <ShieldAlert className="text-[#9575cd]" size={24} />
                                   Admin Alert Settings
                               </h2>
                               <p className="text-sm text-slate-500 mt-1">Configure when administrators receive critical system alerts via WhatsApp.</p>
                           </div>
                           {isLoading && <Loader2 size={16} className="animate-spin text-slate-400" />}
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 pb-4 border-b border-slate-100">Automation Preferences</h3>
                            
                            <div className="space-y-6">
                                {/* Auto Send */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#9575cd]/30 transition-colors bg-slate-50/50">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">System Triggered Alerts (Recommended)</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Automatically alert administrators on critical events like discounts given or dues cleared.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappAdminAlertAuto} onChange={e => setSettings(s => ({...s, whatsappAdminAlertAuto: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                {/* Manual Send */}
                                <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-[#9575cd]/30 transition-colors bg-slate-50/50">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                            <Send size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">Manual Send Button</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">Enable the manual &quot;Alert Admin&quot; button in relevant sections.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-2">
                                        <input type="checkbox" className="sr-only peer" checked={settings.whatsappAdminAlertManual} onChange={e => setSettings(s => ({...s, whatsappAdminAlertManual: e.target.checked}))} />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                <button 
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="px-6 py-2.5 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />}
                                    {isSaving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
                
            </div>
        </div>

      </div>
    </div>
  );
}
