"use client";

import React, { useState } from 'react';
import { Lock, Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { changeGlobalAdminPassword } from '@/app/actions/super-admin';

export default function GlobalPasswordWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!password || password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsSaving(true);
        const res = await changeGlobalAdminPassword(password);
        if (res.success) {
            toast.success(res.message);
            setIsOpen(false);
            setPassword('');
        } else {
            toast.error(res.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-all shrink-0 select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                title="Change Global Admin Support Key"
            >
                <Lock size={12} className="text-[#9575cd] shrink-0" />
                <span>Support Key</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none" 
                        onClick={() => setIsOpen(false)} 
                    />

                    {/* Modal / Popover */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-none sm:pointer-events-auto sm:p-0 sm:inset-auto sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-1.5 sm:block">
                        <div className="pointer-events-auto w-full max-w-xs sm:w-80 bg-white rounded-[10px] shadow-2xl sm:shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="px-3.5 py-2 border-b border-slate-200 bg-slate-50 flex justify-between items-center min-h-[36px] h-[36px]">
                                <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    <Lock size={13} className="text-[#9575cd] shrink-0" />
                                    Global Support Key
                                </h3>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Close"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            
                            <div className="p-3.5 space-y-2.5">
                                <p className="text-[11px] text-slate-500 leading-snug font-normal">
                                    Master password allowing support staff to log into any tenant account for troubleshooting.
                                </p>

                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                        New Master Key
                                    </label>
                                    <input type="text" autoComplete="username" style={{ display: 'none' }} />
                                    <input 
                                        type="password" 
                                        placeholder="Min. 6 characters" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="new-password"
                                        className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="h-[24px] xl:h-[26px] px-3.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                                    >
                                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                        Save Key
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
