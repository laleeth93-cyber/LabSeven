// --- BLOCK app/list/components/AuditLogModal.tsx OPEN ---
"use client";

import React from 'react';
import { X, History, PlusCircle, Edit3, CheckCircle2, AlertCircle, Banknote } from 'lucide-react';

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    auditBill: any;
}

export default function AuditLogModal({ isOpen, onClose, auditBill }: AuditLogModalProps) {
    if (!isOpen || !auditBill) return null;

    return (
        <div className="fixed inset-0 z-[500] bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><History size={18} className="text-blue-600"/> Activity & Audit Log</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-5">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Number</p>
                            <p className="text-sm font-bold text-slate-800">{auditBill.billNumber}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                            <p className="text-sm font-bold text-slate-800">₹{auditBill.netAmount}</p>
                        </div>
                    </div>

                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                        {/* Registration / Creation */}
                        <div className="relative pl-6">
                            <div className="absolute -left-[9px] top-0 bg-blue-100 text-blue-600 p-1 rounded-full border border-blue-200"><PlusCircle size={14} /></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">Registration & Billing</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">Created on {new Date(auditBill.date).toLocaleString('en-GB')}</span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">By: Admin</span>
                            </div>
                        </div>

                        {/* Results Entry */}
                        {auditBill.items.some((i: any) => i.status === 'Entered' || i.status === 'Approved' || i.status === 'Printed') ? (
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 bg-amber-100 text-amber-600 p-1 rounded-full border border-amber-200"><Edit3 size={14} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">Results Entered</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Values have been recorded</span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">By: Lab Tech</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative pl-6 opacity-40">
                                <div className="absolute -left-[9px] top-0 bg-slate-100 text-slate-400 p-1 rounded-full border border-slate-200"><Edit3 size={14} /></div>
                                <span className="text-xs font-bold text-slate-500">Awaiting Results Entry</span>
                            </div>
                        )}

                        {/* Results Approval */}
                        {auditBill.items.some((i: any) => i.status === 'Approved' || i.status === 'Printed') ? (
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 bg-green-100 text-green-600 p-1 rounded-full border border-green-200"><CheckCircle2 size={14} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">Results Approved</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Reports authorized for printing</span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">By: Pathologist</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative pl-6 opacity-40">
                                <div className="absolute -left-[9px] top-0 bg-slate-100 text-slate-400 p-1 rounded-full border border-slate-200"><CheckCircle2 size={14} /></div>
                                <span className="text-xs font-bold text-slate-500">Awaiting Approval</span>
                            </div>
                        )}

                        {/* Due Authorization / Financial */}
                        {auditBill.dueAmount > 0 ? (
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 bg-red-100 text-red-600 p-1 rounded-full border border-red-200"><AlertCircle size={14} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">Due Authorized</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">₹{auditBill.dueAmount} is pending</span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">Authorized By: Front Desk</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-0 bg-emerald-100 text-emerald-600 p-1 rounded-full border border-emerald-200"><Banknote size={14} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">Payment Cleared</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Fully paid</span>
                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit mt-1 border border-slate-200">Collected By: Cashier</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">Close</button>
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/list/components/AuditLogModal.tsx CLOSE ---