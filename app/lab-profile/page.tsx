// --- BLOCK app/lab-profile/page.tsx OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { Building2, Save, Upload, Loader2, Image as ImageIcon, MapPin, Phone, Mail, Globe, Info, Hash, CheckCircle } from 'lucide-react';
import { getLabProfile, updateLabProfile } from '@/app/actions/lab-profile';
import MusicBarLoader from '@/app/components/MusicBarLoader'; // 🚨 NEW IMPORT

export default function LabProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [settings, setSettings] = useState<any>({
        name: '', tagline: '', address: '', phone: '', email: '', website: '', logoUrl: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const res = await getLabProfile();
        if (res.success && res.data) {
            setSettings((prev: any) => ({ ...prev, ...res.data }));
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateLabProfile(settings);
        if (res.success) {
            // Tell the Header to update its data instantly!
            window.dispatchEvent(new Event('labProfileUpdated'));
            
            // SHOW SUCCESS POPUP
            setShowSuccessPopup(true);
            setTimeout(() => { setShowSuccessPopup(false); }, 1500);
        } else {
            alert("Error saving profile: " + res.message);
        }
        setIsSaving(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setSettings({ ...settings, logoUrl: reader.result as string }); };
            reader.readAsDataURL(file);
        }
    };

    // 🚨 REPLACED SPINNER WITH MUSIC BAR
    if (isLoading) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-[#f1f5f9]">
                <MusicBarLoader text="Loading Lab Profile..." />
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#f1f5f9] p-4 md:p-6 overflow-y-auto font-sans relative">
            
            {/* --- SUCCESS POPUP OVERLAY --- */}
            {showSuccessPopup && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                    <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Profile Saved!</h2>
                </div>
              </div>
            )}

            <div className="max-w-5xl mx-auto space-y-6 relative z-10">
                
                {/* HEADER CARD */}
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-purple-50 to-transparent pointer-events-none"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-gradient-to-br from-[#9575cd] to-[#7e57c2] p-3 rounded-xl shadow-md text-white">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="font-extrabold text-slate-800 text-xl tracking-tight">Laboratory Profile</h1>
                            <p className="text-sm text-slate-500 font-medium mt-0.5">Manage your laboratory's identity, branding, and contact details.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="bg-[#9575cd] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[#7e57c2] flex items-center gap-2 transition-all disabled:opacity-70 shadow-md hover:shadow-lg active:scale-95 relative z-10 w-full sm:w-auto justify-center"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>

                {/* CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: LOGO UPLOAD */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 text-base mb-1 flex items-center gap-2">
                                <ImageIcon size={18} className="text-[#9575cd]"/> Lab Logo
                            </h3>
                            <p className="text-xs text-slate-500 mb-6">This logo will appear on your printed reports and invoices.</p>
                            
                            <div className="w-full aspect-square max-w-[240px] mx-auto border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group transition-colors hover:border-[#9575cd] hover:bg-purple-50/30">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} alt="Lab Logo" className="w-full h-full object-contain p-4" />
                                ) : (
                                    <div className="text-center text-slate-400 flex flex-col items-center">
                                        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                                            <Upload size={24} className="text-slate-400 group-hover:text-[#9575cd] transition-colors" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-600">Upload Image</span>
                                        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB</span>
                                    </div>
                                )}
                                
                                <label className={`absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-all ${settings.logoUrl ? 'bg-slate-900/60 opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                    {settings.logoUrl && (
                                        <>
                                            <Upload size={24} className="mb-2 text-white" />
                                            <span className="text-xs font-bold text-white">Change Logo</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                            
                            {settings.logoUrl && (
                                <div className="mt-4 flex justify-center">
                                    <button 
                                        onClick={() => setSettings({...settings, logoUrl: null})} 
                                        className="text-xs text-rose-500 font-bold hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Remove Logo
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* HELPER CARD */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-1">Why complete your profile?</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        The information provided here is directly linked to your PDF generator. Ensuring these details are accurate will make your patient reports look highly professional and compliant.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: FORM FIELDS */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* SECTION 1: GENERAL INFO */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 text-base mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
                                <Building2 size={18} className="text-[#9575cd]"/> General Information
                            </h3>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Laboratory Name <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Building2 size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={settings.name || ''} 
                                            onChange={(e) => setSettings({...settings, name: e.target.value})} 
                                            placeholder="e.g. SmartLab Diagnostics Center" 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-[#9575cd] focus:ring-4 focus:ring-[#9575cd]/10 outline-none transition-all" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Tagline / Slogan</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Hash size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={settings.tagline || ''} 
                                            onChange={(e) => setSettings({...settings, tagline: e.target.value})} 
                                            placeholder="e.g. Accuracy you can trust, care you can feel" 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-[#9575cd] focus:ring-4 focus:ring-[#9575cd]/10 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: CONTACT DETAILS */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 text-base mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
                                <MapPin size={18} className="text-[#9575cd]"/> Contact & Location
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Phone size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={settings.phone || ''} 
                                            onChange={(e) => setSettings({...settings, phone: e.target.value})} 
                                            placeholder="+91 98765 43210" 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-[#9575cd] focus:ring-4 focus:ring-[#9575cd]/10 outline-none transition-all" 
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Mail size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="email" 
                                            value={settings.email || ''} 
                                            onChange={(e) => setSettings({...settings, email: e.target.value})} 
                                            placeholder="contact@smartlab.com" 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-[#9575cd] focus:ring-4 focus:ring-[#9575cd]/10 outline-none transition-all" 
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Website URL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Globe size={16} className="text-slate-400" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={settings.website || ''} 
                                            onChange={(e) => setSettings({...settings, website: e.target.value})} 
                                            placeholder="www.smartlab.com" 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-[#9575cd] focus:ring-4 focus:ring-[#9575cd]/10 outline-none transition-all" 
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 mb-1.5 ml-1">Physical Address</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none">
                                            <MapPin size={16} className="text-slate-400 mt-0.5" />
                                        </div>
                                        <textarea 
                                            value={settings.address || ''} 
                                            onChange={(e) => setSettings({...settings, address: e.target.value})} 
                                            placeholder="Enter the full, formatted address of the laboratory..." 
                                            rows={3} 
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-[#9575cd] focus:ring-4 focus:ring-[#9575cd]/10 outline-none transition-all resize-none" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/lab-profile/page.tsx CLOSE ---