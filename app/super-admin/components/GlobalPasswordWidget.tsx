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
                className="flex items-center gap-1 sm:gap-1.5 h-6.5 sm:h-7.5 px-1.5 sm:px-2.5 bg-white border border-slate-200 text-slate-700 text-[9.5px] sm:text-xs font-bold rounded sm:rounded-lg shadow-xs hover:bg-slate-50 transition-colors shrink-0 select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                title="Change Global Admin Password"
            >
                <Lock size={11} className="sm:w-3.5 sm:h-3.5 text-fuchsia-600 shrink-0" />
                <span className="hidden sm:inline">Support Key</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop to dismiss on outside click */}
                    <div 
                        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none" 
                        onClick={() => setIsOpen(false)} 
                    />

                    {/* Centered modal on mobile, dropdown below button on desktop */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none sm:pointer-events-auto sm:p-0 sm:inset-auto sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:block">
                        <div className="pointer-events-auto w-full max-w-xs sm:w-72 bg-white rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Lock size={15} className="text-fuchsia-600 shrink-0" />
                                    Global Support Password
                                </h3>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors sm:hidden"
                                    title="Close"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                            
                            <p className="text-[11px] text-slate-500 mb-4 leading-tight font-medium">
                                This master password allows support staff to log into any client account without their actual password.
                            </p>

                            <div className="space-y-3">
                                <input type="text" autoComplete="username" style={{ display: 'none' }} />
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 font-medium"
                                />
                                <div className="flex gap-2 justify-end mt-2">
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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
