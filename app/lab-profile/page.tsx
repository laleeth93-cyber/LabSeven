"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Building2, Save, Upload, Loader2, Image as ImageIcon, MapPin, 
    Phone, Mail, Globe, Info, Hash, CheckCircle, LayoutTemplate, 
    SlidersHorizontal, Trash2, ChevronLeft 
} from 'lucide-react';
import { getLabProfile, updateLabProfile } from '@/app/actions/lab-profile';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function LabProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingLetterhead, setIsUploadingLetterhead] = useState(false);
    
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [settings, setSettings] = useState<any>({
        name: '', tagline: '', address: '', phone: '', email: '', website: '', logoUrl: '', letterheadUrl: '',
        lhWidth: '', lhHeight: '', lhMt: '', lhMb: '', lhMl: '', lhMr: ''
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
            window.dispatchEvent(new Event('labProfileUpdated'));
            setShowSuccessPopup(true);
            setTimeout(() => { setShowSuccessPopup(false); }, 1500);
        } else {
            alert("Error saving profile: " + res.message);
        }
        setIsSaving(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'letterheadUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const setLoading = field === 'logoUrl' ? setIsUploadingLogo : setIsUploadingLetterhead;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", field === 'logoUrl' ? "logos" : "letterheads"); 

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                setSettings({ ...settings, [field]: result.url });
            } else {
                alert("Upload failed: " + result.error);
            }
        } catch (error) {
            console.error("R2 Upload Error:", error);
            alert("An error occurred while uploading to the storage server.");
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-white font-sans">
                <MusicBarLoader text="Loading Lab Profile..." />
            </div>
        );
    }

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
                        Profile Saved Successfully!
                      </h2>
                    </div>
                  </div>
                )}

                {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    {/* Left: 20px Title in Calibri */}
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                            <Building2 size={16} />
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Laboratory Profile
                        </h2>
                    </div>

                    {/* Right: Save Profile Action Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                            onClick={handleSave} 
                            disabled={isSaving || isUploadingLogo || isUploadingLetterhead} 
                            className="h-[24px] xl:h-[26px] px-3.5 xl:px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all shrink-0 disabled:opacity-50"
                            style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                        >
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} strokeWidth={2} />} 
                            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                        </button>
                    </div>
                </div>

                {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
                <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd]">
                            <SlidersHorizontal size={14} />
                        </div>
                        <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Organization Branding & Information
                        </h3>
                        <span className="text-[10px] text-slate-500 font-normal bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            Org ID: {settings.organizationId || settings.id || '001'}
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                        <Info size={12} className="text-[#9575cd]" />
                        <span>Changes reflect across all reports, invoices, and letterheads</span>
                    </div>
                </div>

                {/* DESKTOP CONTENT AREA - CARDS AS SEPARATE BLOCKS */}
                <div className="hidden md:flex flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 custom-scrollbar min-h-0 flex-col">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 xl:gap-3 max-w-7xl w-full mx-auto">
                        
                        {/* LEFT COLUMN: BRANDING (LOGO & LETTERHEAD) */}
                        <div className="lg:col-span-5 space-y-2.5 xl:space-y-3">
                            
                            {/* BLOCK 1: LAB LOGO */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3 xl:p-3.5 flex flex-col">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                        <ImageIcon size={14} className="text-[#9575cd]"/> Lab Logo
                                    </h3>
                                    <span className="text-[9.5px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Square 1:1</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-normal mt-1 mb-2">Used across standard headers and compact reports.</p>
                                
                                <div className="w-32 h-32 mx-auto border-2 border-dashed border-slate-300 rounded-[6px] flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group hover:border-[#9575cd] transition-colors">
                                    {isUploadingLogo ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={20} className="text-[#9575cd] animate-spin mb-1" />
                                            <span className="text-[10px] font-medium text-slate-500">Uploading...</span>
                                        </div>
                                    ) : settings.logoUrl ? (
                                        <img src={settings.logoUrl} alt="Lab Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center text-slate-400 flex flex-col items-center">
                                            <Upload size={18} className="text-slate-400 group-hover:text-[#9575cd] transition-colors mb-1" />
                                            <span className="text-[10px] font-medium text-slate-500">Upload Logo</span>
                                        </div>
                                    )}
                                    
                                    {!isUploadingLogo && (
                                        <label className={`absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-all ${settings.logoUrl ? 'bg-slate-900/60 opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                            {settings.logoUrl && (
                                                <>
                                                    <Upload size={18} className="mb-1 text-white" />
                                                    <span className="text-[10px] font-medium text-white">Change Logo</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoUrl')} disabled={isUploadingLogo} />
                                        </label>
                                    )}
                                </div>
                                
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <label className="h-[24px] xl:h-[26px] px-3 rounded-[5px] text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                                        <Upload size={11} />
                                        <span>{settings.logoUrl ? 'Change' : 'Upload'}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoUrl')} disabled={isUploadingLogo} />
                                    </label>
                                    {settings.logoUrl && !isUploadingLogo && (
                                        <button 
                                            onClick={() => setSettings({...settings, logoUrl: null})} 
                                            className="h-[24px] xl:h-[26px] px-2 text-[11px] font-medium text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-[5px] flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 size={11}/> Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* BLOCK 2: INVOICE LETTERHEAD BANNER */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3 xl:p-3.5 flex flex-col">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                        <LayoutTemplate size={14} className="text-[#9575cd]"/> Invoice Letterhead
                                    </h3>
                                    <span className="text-[9.5px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Wide Banner</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-normal mt-1 mb-2">Replaces standard text header on printed invoices.</p>
                                
                                <div className="w-full aspect-[3/1] max-h-28 mx-auto border-2 border-dashed border-slate-300 rounded-[6px] flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden group hover:border-[#9575cd] transition-colors">
                                    {isUploadingLetterhead ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 size={20} className="text-[#9575cd] animate-spin mb-1" />
                                            <span className="text-[10px] font-medium text-slate-500">Uploading banner...</span>
                                        </div>
                                    ) : settings.letterheadUrl ? (
                                        <img src={settings.letterheadUrl} alt="Letterhead" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-center text-slate-400 flex flex-col items-center">
                                            <Upload size={18} className="text-slate-400 group-hover:text-[#9575cd] transition-colors mb-1" />
                                            <span className="text-[10px] font-medium text-slate-500">Upload Banner Image</span>
                                        </div>
                                    )}
                                    
                                    {!isUploadingLetterhead && (
                                        <label className={`absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-all ${settings.letterheadUrl ? 'bg-slate-900/60 opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                            {settings.letterheadUrl && (
                                                <>
                                                    <Upload size={18} className="mb-1 text-white" />
                                                    <span className="text-[10px] font-medium text-white">Change Banner</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'letterheadUrl')} disabled={isUploadingLetterhead} />
                                        </label>
                                    )}
                                </div>
                                
                                <div className="mt-2 flex items-center justify-center gap-2">
                                    <label className="h-[24px] xl:h-[26px] px-3 rounded-[5px] text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                                        <Upload size={11} />
                                        <span>{settings.letterheadUrl ? 'Change Banner' : 'Upload Banner'}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'letterheadUrl')} disabled={isUploadingLetterhead} />
                                    </label>
                                    {settings.letterheadUrl && !isUploadingLetterhead && (
                                        <button 
                                            onClick={() => setSettings({...settings, letterheadUrl: null})} 
                                            className="h-[24px] xl:h-[26px] px-2 text-[11px] font-medium text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-[5px] flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 size={11}/> Remove
                                        </button>
                                    )}
                                </div>

                                {/* Letterhead Dimensions & Margins Configurator */}
                                {settings.letterheadUrl && !isUploadingLetterhead && (
                                    <div className="mt-3 border-t border-slate-100 pt-2.5">
                                        <h4 className="text-[11px] font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                            <SlidersHorizontal size={12} className="text-[#9575cd]"/> Dimensions & Margins (pixels)
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <label className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-tight block mb-0.5">Width (default 100%)</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="100%" 
                                                    value={settings.lhWidth || ''} 
                                                    onChange={e => setSettings({...settings, lhWidth: e.target.value})} 
                                                    className="w-full h-[24px] xl:h-[26px] px-2 text-[11px] font-normal border border-slate-300 rounded-[5px] outline-none focus:border-[#9575cd] bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-tight block mb-0.5">Height (default Auto)</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="Auto" 
                                                    value={settings.lhHeight || ''} 
                                                    onChange={e => setSettings({...settings, lhHeight: e.target.value})} 
                                                    className="w-full h-[24px] xl:h-[26px] px-2 text-[11px] font-normal border border-slate-300 rounded-[5px] outline-none focus:border-[#9575cd] bg-white" 
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1.5 mb-2">
                                            <div>
                                                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight block mb-0.5 text-center">Top</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    value={settings.lhMt || ''} 
                                                    onChange={e => setSettings({...settings, lhMt: e.target.value})} 
                                                    className="w-full h-[24px] xl:h-[26px] px-1 text-center text-[11px] font-normal border border-slate-300 rounded-[5px] outline-none focus:border-[#9575cd] bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight block mb-0.5 text-center">Bottom</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="20" 
                                                    value={settings.lhMb || ''} 
                                                    onChange={e => setSettings({...settings, lhMb: e.target.value})} 
                                                    className="w-full h-[24px] xl:h-[26px] px-1 text-center text-[11px] font-normal border border-slate-300 rounded-[5px] outline-none focus:border-[#9575cd] bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight block mb-0.5 text-center">Left</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    value={settings.lhMl || ''} 
                                                    onChange={e => setSettings({...settings, lhMl: e.target.value})} 
                                                    className="w-full h-[24px] xl:h-[26px] px-1 text-center text-[11px] font-normal border border-slate-300 rounded-[5px] outline-none focus:border-[#9575cd] bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight block mb-0.5 text-center">Right</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    value={settings.lhMr || ''} 
                                                    onChange={e => setSettings({...settings, lhMr: e.target.value})} 
                                                    className="w-full h-[24px] xl:h-[26px] px-1 text-center text-[11px] font-normal border border-slate-300 rounded-[5px] outline-none focus:border-[#9575cd] bg-white" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2.5 p-2 rounded-[5px] bg-blue-50/70 border border-blue-200 flex items-start gap-1.5">
                                    <Info size={12} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-blue-700 leading-tight font-normal">
                                        If an Invoice Letterhead is set, it will replace the Lab Logo and textual header on printed invoices.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: GENERAL INFO & CONTACT DETAILS */}
                        <div className="lg:col-span-7 space-y-2.5 xl:space-y-3">
                            
                            {/* BLOCK 3: GENERAL INFORMATION */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3 xl:p-3.5 flex flex-col space-y-2.5">
                                <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    <Building2 size={14} className="text-[#9575cd]"/> General Information
                                </h3>
                                
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                        Laboratory Name <span className="text-rose-500 ml-0.5">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={settings.name || ''} 
                                            onChange={(e) => setSettings({...settings, name: e.target.value})} 
                                            placeholder="e.g. SmartLab Diagnostics Center" 
                                            className="w-full h-[26px] xl:h-[28px] pl-8 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                        Tagline / Slogan
                                    </label>
                                    <div className="relative">
                                        <Hash size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={settings.tagline || ''} 
                                            onChange={(e) => setSettings({...settings, tagline: e.target.value})} 
                                            placeholder="e.g. Accuracy you can trust, care you can feel" 
                                            className="w-full h-[26px] xl:h-[28px] pl-8 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* BLOCK 4: CONTACT & LOCATION */}
                            <div className="rounded-[6px] border border-slate-200 shadow-sm bg-white p-3 xl:p-3.5 flex flex-col space-y-2.5">
                                <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    <MapPin size={14} className="text-[#9575cd]"/> Contact & Location
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Phone Number</label>
                                        <div className="relative">
                                            <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={settings.phone || ''} 
                                                onChange={(e) => setSettings({...settings, phone: e.target.value})} 
                                                placeholder="+91 98765 43210" 
                                                className="w-full h-[26px] xl:h-[28px] pl-8 pr-2.5 text-[11px] xl:text-[12px] font-mono border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]" 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Email Address</label>
                                        <div className="relative">
                                            <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="email" 
                                                value={settings.email || ''} 
                                                onChange={(e) => setSettings({...settings, email: e.target.value})} 
                                                placeholder="contact@smartlab.com" 
                                                className="w-full h-[26px] xl:h-[28px] pl-8 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Website URL</label>
                                    <div className="relative">
                                        <Globe size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={settings.website || ''} 
                                            onChange={(e) => setSettings({...settings, website: e.target.value})} 
                                            placeholder="www.smartlab.com" 
                                            className="w-full h-[26px] xl:h-[28px] pl-8 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Physical Address</label>
                                    <div className="relative">
                                        <MapPin size={13} className="absolute top-2 left-2.5 text-slate-400" />
                                        <textarea 
                                            value={settings.address || ''} 
                                            onChange={(e) => setSettings({...settings, address: e.target.value})} 
                                            placeholder="Enter the full, formatted address of the laboratory..." 
                                            rows={3} 
                                            className="w-full pl-8 pr-2.5 py-1.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd] resize-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* MOBILE VIEWPORT */}
                <div className="flex md:hidden flex-col flex-1 w-full h-full bg-[#f8fafc] p-2 overflow-hidden font-sans">
                    <div className="w-full h-full bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                        
                        {/* Mobile Content Area */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-white">
                            
                            {/* GENERAL INFO SECTION */}
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                                    <Building2 size={12} className="text-[#9575cd]" />
                                    <span className="text-[10px] font-bold text-slate-800">Laboratory Details</span>
                                </div>

                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">
                                        Lab Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={settings.name || ''} 
                                            onChange={(e) => setSettings({...settings, name: e.target.value})} 
                                            placeholder="e.g. SmartLab Diagnostics" 
                                            className="w-full h-6 pl-6 pr-2 border border-slate-200 rounded text-[10px] font-bold focus:border-[#9575cd] outline-none bg-white text-slate-800 placeholder:text-slate-400" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">
                                        Tagline / Slogan
                                    </label>
                                    <div className="relative">
                                        <Hash size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={settings.tagline || ''} 
                                            onChange={(e) => setSettings({...settings, tagline: e.target.value})} 
                                            placeholder="e.g. Accuracy you can trust" 
                                            className="w-full h-6 pl-6 pr-2 border border-slate-200 rounded text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700 placeholder:text-slate-400" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CONTACT & LOCATION SECTION */}
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                                    <MapPin size={12} className="text-[#9575cd]" />
                                    <span className="text-[10px] font-bold text-slate-800">Contact & Location</span>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5">
                                    <div>
                                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Phone Number</label>
                                        <div className="relative">
                                            <Phone size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={settings.phone || ''} 
                                                onChange={(e) => setSettings({...settings, phone: e.target.value})} 
                                                placeholder="+91 98765 43210" 
                                                className="w-full h-6 pl-6 pr-2 border border-slate-200 rounded text-[10px] font-mono focus:border-[#9575cd] outline-none bg-white text-slate-700" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Email Address</label>
                                        <div className="relative">
                                            <Mail size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="email" 
                                                value={settings.email || ''} 
                                                onChange={(e) => setSettings({...settings, email: e.target.value})} 
                                                placeholder="contact@lab.com" 
                                                className="w-full h-6 pl-6 pr-2 border border-slate-200 rounded text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Website URL</label>
                                    <div className="relative">
                                        <Globe size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={settings.website || ''} 
                                            onChange={(e) => setSettings({...settings, website: e.target.value})} 
                                            placeholder="www.smartlab.com" 
                                            className="w-full h-6 pl-6 pr-2 border border-slate-200 rounded text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Physical Address</label>
                                    <div className="relative">
                                        <MapPin size={11} className="absolute left-2 top-2 text-slate-400" />
                                        <textarea 
                                            value={settings.address || ''} 
                                            onChange={(e) => setSettings({...settings, address: e.target.value})} 
                                            placeholder="Full address of the laboratory..." 
                                            rows={2} 
                                            className="w-full pl-6 pr-2 py-1 border border-slate-200 rounded text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700 resize-none" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* LOGO SECTION */}
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <ImageIcon size={12} className="text-[#9575cd]" />
                                        <span className="text-[10px] font-bold text-slate-800">Lab Logo</span>
                                    </div>
                                    <span className="text-[8px] text-slate-400">Square 1:1</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-16 h-16 shrink-0 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden relative group">
                                        {isUploadingLogo ? (
                                            <Loader2 size={16} className="text-[#9575cd] animate-spin" />
                                        ) : settings.logoUrl ? (
                                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Upload size={16} className="text-slate-300" />
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <label className="h-6 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs">
                                            <Upload size={10} />
                                            <span>{settings.logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoUrl')} disabled={isUploadingLogo} />
                                        </label>

                                        {settings.logoUrl && !isUploadingLogo && (
                                            <button 
                                                type="button"
                                                onClick={() => setSettings({...settings, logoUrl: null})} 
                                                className="h-5 text-[8.5px] text-rose-500 font-bold hover:bg-rose-50 rounded flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Trash2 size={10} />
                                                <span>Remove</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* LETTERHEAD BANNER SECTION */}
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2">
                                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <LayoutTemplate size={12} className="text-[#9575cd]" />
                                        <span className="text-[10px] font-bold text-slate-800">Invoice Letterhead</span>
                                    </div>
                                    <span className="text-[8px] text-slate-400">Wide banner</span>
                                </div>

                                <div className="w-full aspect-[3/1] max-h-24 border border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50 overflow-hidden relative">
                                    {isUploadingLetterhead ? (
                                        <div className="flex items-center gap-1.5">
                                            <Loader2 size={16} className="text-[#9575cd] animate-spin" />
                                            <span className="text-[9px] font-bold text-slate-500">Uploading banner...</span>
                                        </div>
                                    ) : settings.letterheadUrl ? (
                                        <img src={settings.letterheadUrl} alt="Letterhead" className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-0.5 text-slate-400">
                                            <Upload size={16} />
                                            <span className="text-[8.5px] font-medium">No letterhead uploaded</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <label className="h-6 flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-all shadow-2xs">
                                        <Upload size={10} />
                                        <span>{settings.letterheadUrl ? 'Change Banner' : 'Upload Banner'}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'letterheadUrl')} disabled={isUploadingLetterhead} />
                                    </label>

                                    {settings.letterheadUrl && !isUploadingLetterhead && (
                                        <button 
                                            type="button"
                                            onClick={() => setSettings({...settings, letterheadUrl: null})} 
                                            className="h-6 px-2 text-[8.5px] text-rose-500 font-bold hover:bg-rose-50 border border-slate-200 rounded flex items-center justify-center gap-1 transition-colors"
                                        >
                                            <Trash2 size={10} />
                                            <span>Remove</span>
                                        </button>
                                    )}
                                </div>

                                {/* Dimensions & Margins */}
                                {settings.letterheadUrl && (
                                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                        <span className="text-[9px] font-bold text-slate-700 flex items-center gap-1">
                                            <SlidersHorizontal size={10} className="text-[#9575cd]" />
                                            <span>Dimensions & Margins (px)</span>
                                        </span>

                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div>
                                                <label className="text-[8px] font-bold text-slate-400 block mb-0.5">Width</label>
                                                <input type="number" placeholder="100%" value={settings.lhWidth || ''} onChange={e => setSettings({...settings, lhWidth: e.target.value})} className="w-full h-6 px-2 border border-slate-200 rounded text-[10px] outline-none focus:border-[#9575cd]" />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-bold text-slate-400 block mb-0.5">Height</label>
                                                <input type="number" placeholder="Auto" value={settings.lhHeight || ''} onChange={e => setSettings({...settings, lhHeight: e.target.value})} className="w-full h-6 px-2 border border-slate-200 rounded text-[10px] outline-none focus:border-[#9575cd]" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1">
                                            <div>
                                                <label className="text-[7.5px] font-bold text-slate-400 block mb-0.5">Top</label>
                                                <input type="number" placeholder="0" value={settings.lhMt || ''} onChange={e => setSettings({...settings, lhMt: e.target.value})} className="w-full h-6 px-1 text-center border border-slate-200 rounded text-[10px] outline-none focus:border-[#9575cd]" />
                                            </div>
                                            <div>
                                                <label className="text-[7.5px] font-bold text-slate-400 block mb-0.5">Bottom</label>
                                                <input type="number" placeholder="20" value={settings.lhMb || ''} onChange={e => setSettings({...settings, lhMb: e.target.value})} className="w-full h-6 px-1 text-center border border-slate-200 rounded text-[10px] outline-none focus:border-[#9575cd]" />
                                            </div>
                                            <div>
                                                <label className="text-[7.5px] font-bold text-slate-400 block mb-0.5">Left</label>
                                                <input type="number" placeholder="0" value={settings.lhMl || ''} onChange={e => setSettings({...settings, lhMl: e.target.value})} className="w-full h-6 px-1 text-center border border-slate-200 rounded text-[10px] outline-none focus:border-[#9575cd]" />
                                            </div>
                                            <div>
                                                <label className="text-[7.5px] font-bold text-slate-400 block mb-0.5">Right</label>
                                                <input type="number" placeholder="0" value={settings.lhMr || ''} onChange={e => setSettings({...settings, lhMr: e.target.value})} className="w-full h-6 px-1 text-center border border-slate-200 rounded text-[10px] outline-none focus:border-[#9575cd]" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-1.5 rounded bg-blue-50/70 border border-blue-100 flex items-start gap-1">
                                    <Info size={11} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[8px] text-blue-700 leading-tight">
                                        If an Invoice Letterhead is set, it will replace the Logo and text header on printed invoices.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Footer */}
                        <footer className="shrink-0 bg-white p-2 z-[50] pb-safe border-t border-slate-100">
                            <div className="flex items-center gap-1.5 w-full">
                                <button 
                                    type="button" 
                                    onClick={() => router.back()} 
                                    className="h-6 flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-medium text-[9px] rounded active:scale-95 transition-all gap-0.5"
                                >
                                    <ChevronLeft size={12} />
                                    <span>Back</span>
                                </button>

                                <button 
                                    type="button" 
                                    onClick={handleSave}
                                    disabled={isSaving || isUploadingLogo || isUploadingLetterhead}
                                    className="h-6 flex-1 bg-[#9575cd] hover:bg-[#7e57c2] text-white rounded text-[9.5px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all disabled:opacity-60"
                                >
                                    {isSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                    <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
            </div>
        </div>
    );
}
