// --- BLOCK app/list/components/RefundModal.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { RefreshCcw, X, Loader2, CheckCircle2, AlertTriangle, User, FileText, CheckCircle } from 'lucide-react';
import { processRefund } from '@/app/actions/patient-list';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    refundBill: any;
    onSuccess: () => void;
}

export default function RefundModal({ isOpen, onClose, refundBill, onSuccess }: RefundModalProps) {
    const [refundAmount, setRefundAmount] = useState<string>('');
    const [refundMode, setRefundMode] = useState<string>('Cash');
    const [reason, setReason] = useState<string>('');
    const [isPending, startTransition] = useTransition();

    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        if (isOpen && refundBill) {
            setShowSuccessPopup(false); // Reset on open
            setRefundAmount(refundBill.paidAmount.toString());
            setRefundMode('Cash');
            setReason('');
        }
    }, [isOpen, refundBill]);

    if (!isOpen || !refundBill) return null;

    const patientName = `${refundBill.patient.designation || ''} ${refundBill.patient.firstName} ${refundBill.patient.lastName}`.trim();

    const handleSubmit = () => {
        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount to refund");
        if (amount > refundBill.paidAmount) return alert("Cannot refund more than the total paid amount.");
        
        startTransition(async () => {
            const res = await processRefund(refundBill.id, amount, refundMode, reason);
            if (res.success) {
                // SHOW SUCCESS POPUP OVER MODAL
                setShowSuccessPopup(true);
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                alert("Error: " + res.message);
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
                
                {/* INNER SUCCESS OVERLAY */}
                {showSuccessPopup && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 max-w-[280px] w-full mx-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-[4px] border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Refund Processed!</h2>
                      <p className="text-slate-500 text-sm mt-1 text-center font-medium">₹{refundAmount} refunded via {refundMode}</p>
                    </div>
                  </div>
                )}

                {/* HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 shrink-0">
                    <h2 className="font-extrabold text-slate-800 flex items-center gap-2">
                        <div className="bg-orange-500 text-white p-1.5 rounded-lg shadow-sm">
                            <RefreshCcw size={18} />
                        </div>
                        Issue Refund
                    </h2>
                    <button onClick={onClose} disabled={isPending || showSuccessPopup} className="text-slate-400 hover:text-red-500 hover:bg-white p-1.5 rounded-lg transition-colors disabled:opacity-50"><X size={20}/></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    
                    {/* BILL & PATIENT SUMMARY */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                                <User size={16} className="text-[#9575cd]" /> {patientName}
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                <FileText size={16} className="text-[#9575cd]" /> {refundBill.billNumber}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 font-medium">Total Bill Amount:</span>
                            <span className="font-bold text-slate-800">₹{refundBill.netAmount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 font-medium">Current Due:</span>
                            <span className="font-bold text-red-500">₹{refundBill.dueAmount}</span>
                        </div>
                        <div className="flex items-center justify-between bg-orange-100/50 p-2 rounded-lg border border-orange-200 mt-2">
                            <span className="text-orange-800 font-bold text-sm">Eligible for Refund (Total Paid):</span>
                            <span className="font-black text-orange-600 text-lg">₹{refundBill.paidAmount}</span>
                        </div>
                    </div>
                    
                    {/* REFUND FORM */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Refund Amount <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                                    <input 
                                        type="number" 
                                        max={refundBill.paidAmount}
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="w-full h-10 border border-slate-300 rounded-lg pl-8 pr-3 text-sm font-bold text-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Refund Mode</label>
                                <select 
                                    value={refundMode}
                                    onChange={(e) => setRefundMode(e.target.value)}
                                    className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white transition-all"
                                >
                                    <option value="Cash">Cash Return</option>
                                    <option value="UPI">UPI Transfer</option>
                                    <option value="Card Reversal">Card Reversal</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block">Reason for Refund</label>
                            <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Test cancelled by patient, Overcharged, etc."
                                className="w-full h-20 border border-slate-300 rounded-lg p-3 text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none transition-all"
                            />
                        </div>

                        {parseFloat(refundAmount) > refundBill.paidAmount && (
                            <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                <AlertTriangle size={14} /> Amount exceeds the total paid balance!
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} disabled={isPending || showSuccessPopup} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isPending || showSuccessPopup || parseFloat(refundAmount) > refundBill.paidAmount || parseFloat(refundAmount) <= 0}
                        className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {isPending ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>}
                        Process Refund
                    </button>
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/list/components/RefundModal.tsx CLOSE ---