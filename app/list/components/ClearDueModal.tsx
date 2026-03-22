// --- BLOCK app/list/components/ClearDueModal.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Banknote, X, Loader2, CheckCircle2, CheckCircle } from 'lucide-react';
import { clearBillDue } from '@/app/actions/patient-list';

interface ClearDueModalProps {
    isOpen: boolean;
    onClose: () => void;
    dueBill: any;
    onSuccess: () => void;
}

export default function ClearDueModal({ isOpen, onClose, dueBill, onSuccess }: ClearDueModalProps) {
    const [clearAmount, setClearAmount] = useState<string>('');
    const [payMode, setPayMode] = useState<string>('Cash');
    const [isPending, startTransition] = useTransition();

    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        if (isOpen && dueBill) {
            setShowSuccessPopup(false);
            setClearAmount(dueBill.dueAmount.toString());
            setPayMode('Cash');
        }
    }, [isOpen, dueBill]);

    if (!isOpen || !dueBill) return null;

    const handleSubmit = () => {
        const amount = parseFloat(clearAmount);
        if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount");
        
        startTransition(async () => {
            const res = await clearBillDue(dueBill.id, amount, payMode);
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
        <div className="fixed inset-0 z-[500] bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative">
                
                {/* INNER SUCCESS OVERLAY */}
                {showSuccessPopup && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 max-w-[280px] w-full mx-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border-[4px] border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Due Cleared!</h2>
                      <p className="text-slate-500 text-sm mt-1 text-center font-medium">₹{clearAmount} received via {payMode}</p>
                    </div>
                  </div>
                )}

                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Banknote size={18} className="text-red-500"/> Clear Due Amount</h2>
                    <button onClick={onClose} disabled={isPending || showSuccessPopup} className="text-slate-400 hover:text-slate-600 disabled:opacity-50"><X size={18}/></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-red-700 uppercase">Total Due</span>
                        <span className="text-lg font-black text-red-600">₹{dueBill.dueAmount}</span>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Paying Amount</label>
                        <input 
                            type="number" 
                            value={clearAmount}
                            onChange={(e) => setClearAmount(e.target.value)}
                            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm font-bold focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Payment Mode</label>
                        <select 
                            value={payMode}
                            onChange={(e) => setPayMode(e.target.value)}
                            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none bg-white"
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                    </div>
                    
                    <button 
                        onClick={handleSubmit}
                        disabled={isPending || showSuccessPopup}
                        className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                        Submit Payment
                    </button>
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/list/components/ClearDueModal.tsx CLOSE ---