"use client";

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
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
                window.location.reload(); // Refresh to update counts
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
            {/* The Trigger Button on Super Admin Dashboard */}
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white font-bold text-xs rounded shadow-sm border border-red-200 transition-all active:scale-95"
            >
                <Trash2 size={14} />
                Global Wipe
            </button>

            {/* The Danger Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        
                        <div className="bg-red-600 p-6 flex flex-col items-center justify-center text-white shrink-0">
                            <AlertTriangle size={48} className="mb-3 animate-pulse" />
                            <h2 className="text-xl font-black tracking-tight text-center">GLOBAL DATA WIPE</h2>
                        </div>

                        <div className="p-6">
                            <p className="text-sm font-bold text-slate-700 mb-2 text-center">
                                WARNING! You are about to permanently delete:
                            </p>
                            <ul className="text-xs text-slate-600 list-disc pl-5 mb-6 space-y-1 bg-red-50/50 p-4 rounded-lg border border-red-100">
                                <li>All Patients across <b>ALL</b> Client Logins</li>
                                <li>All Generated Invoices & Bills</li>
                                <li>All Test Results & Reports</li>
                                <li>All Payment Transactions</li>
                            </ul>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-[10px] text-red-800 font-bold mb-2 uppercase tracking-wide text-center">Type "WIPE ALL" to confirm</p>
                                <input 
                                    type="text" 
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="WIPE ALL"
                                    className="w-full px-3 py-2 border border-red-300 rounded text-red-600 font-black focus:outline-none focus:ring-2 focus:ring-red-500 text-center uppercase tracking-widest bg-white"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setIsOpen(false); setConfirmText(''); }}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleExecuteWipe}
                                    disabled={isDeleting || confirmText !== 'WIPE ALL'}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    {isDeleting ? "Wiping..." : "Confirm Wipe"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}