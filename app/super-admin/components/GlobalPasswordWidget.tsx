"use client";

import React, { useState } from 'react';
import { Lock, Loader2, Save } from 'lucide-react';
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
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
                title="Change Global Admin Password"
            >
                <Lock size={16} className="text-fuchsia-600" />
                <span className="hidden sm:inline">Support Key</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Lock size={16} className="text-fuchsia-600" />
                            Global Support Password
                        </h3>
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
            )}
        </div>
    );
}
