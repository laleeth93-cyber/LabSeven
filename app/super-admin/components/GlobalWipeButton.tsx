"use client";

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { wipeAllTenantData } from '@/app/actions/super-admin';

export default function GlobalWipeButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleExecuteWipe = async () => {
        if (confirmText !== 'WIPE ALL') return;
        
        setIsDeleting(true);
        try {
            const res = await wipeAllTenantData();
            if (res.success) {
                alert("Global Wipe Complete: " + res.message);
                setIsOpen(false);
                window.location.reload();
            } else {
                alert("Error: " + res.message);
            }
        } catch (err) {
            alert("A critical error occurred while attempting to wipe global data.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 flex items-center gap-1.5 shadow-2xs transition-all shrink-0 select-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                title="Permanently wipe all tenant clinical data"
            >
                <Trash2 size={12} className="text-rose-600 shrink-0" />
                <span>Global Wipe</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white w-full max-w-sm rounded-[10px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
                        
                        <div className="bg-rose-50 px-4 py-2.5 border-b border-rose-100 flex items-center justify-between min-h-[38px] shrink-0">
                            <h3 className="text-[14px] xl:text-[15px] font-semibold text-rose-700 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                                Critical: Global Data Wipe
                            </h3>
                            <button 
                                onClick={() => { setIsOpen(false); setConfirmText(''); }}
                                className="text-rose-400 hover:text-rose-600 transition-colors p-0.5"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <p className="text-[11px] text-slate-600 font-normal leading-snug">
                                This will permanently purge all tenant records across the database:
                            </p>
                            <ul className="text-[10px] text-rose-800 list-disc pl-4 space-y-0.5 bg-rose-50/60 p-2.5 rounded border border-rose-100 font-medium">
                                <li>All Patient profiles and visit histories</li>
                                <li>All Generated Invoices & Payment Receipts</li>
                                <li>All Test Results, Formats, and Approvals</li>
                            </ul>

                            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 block">
                                    Type "WIPE ALL" to confirm
                                </label>
                                <input 
                                    type="text" 
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="WIPE ALL"
                                    className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-bold text-rose-700 border border-rose-300 rounded px-2.5 text-center uppercase tracking-widest bg-white focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-1">
                                <button 
                                    onClick={() => { setIsOpen(false); setConfirmText(''); }}
                                    disabled={isDeleting}
                                    className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleExecuteWipe}
                                    disabled={isDeleting || confirmText !== 'WIPE ALL'}
                                    className="h-[24px] xl:h-[26px] px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] xl:text-[12px] rounded-[5px] shadow-2xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    <span>{isDeleting ? "Wiping..." : "Confirm Wipe"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
