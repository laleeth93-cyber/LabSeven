import React, { useState, useEffect } from 'react';
import { X, Send, Phone, User, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (phone: string, shouldSave: boolean) => void;
    patientName: string;
    existingPhone?: string | null;
    documentType: 'Report' | 'Invoice';
}

export default function WhatsAppConfirmModal({ isOpen, onClose, onConfirm, patientName, existingPhone, documentType }: Props) {
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setPhone(existingPhone || '');
            setIsSaving(!existingPhone); // default to save if they don't have one
        }
    }, [isOpen, existingPhone]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }
        onConfirm(cleanPhone, isSaving && !existingPhone);
    };

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-[6px] shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden flex flex-col scale-in-center">
                {/* MODAL HEADER */}
                <div className="min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] px-3.5 bg-white md:bg-slate-50/80 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                            <Send size={14} />
                        </div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-[14px] xl:text-[15px] font-semibold text-slate-800 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                WhatsApp Dispatch
                            </h3>
                            <span className="text-[10px] xl:text-[11px] px-1.5 py-0.5 rounded bg-purple-50 text-[#9575cd] font-semibold border border-purple-200 leading-none">
                                {documentType}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-3.5 flex flex-col gap-3">
                    <div className="bg-slate-50/60 p-2.5 rounded-[5px] border border-slate-200 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[4px] bg-purple-50 text-[#9575cd] border border-purple-100 flex items-center justify-center shrink-0">
                            <User size={15} />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[9.5px] font-semibold text-slate-500 uppercase tracking-wider block">Patient Name</span>
                            <span className="text-[12px] xl:text-[13px] font-semibold text-slate-800 leading-tight block truncate">{patientName}</span>
                        </div>
                    </div>

                    {!existingPhone && (
                        <div className="bg-amber-50 text-amber-800 p-2 rounded-[5px] text-[11px] flex items-start gap-1.5 border border-amber-200">
                            <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                            <p>This patient does not have a registered mobile number. Please enter one to continue.</p>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                            WhatsApp Number <span className="text-rose-500 ml-0.5">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                                <Phone size={13} />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full h-[26px] xl:h-[28px] pl-7 pr-2.5 rounded-[5px] border border-slate-300 text-[11px] xl:text-[12px] font-normal focus:outline-none focus:border-[#9575cd] text-slate-800"
                                placeholder="10-digit mobile number"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 h-[26px] xl:h-[28px] bg-white hover:bg-slate-50 text-slate-700 text-[11px] xl:text-[12px] font-medium border border-slate-300 rounded-[5px] shadow-2xs transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 h-[26px] xl:h-[28px] text-white text-[11px] xl:text-[12px] font-medium rounded-[5px] shadow-2xs hover:opacity-95 transition-all flex items-center justify-center gap-1"
                            style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                        >
                            <Send size={13} />
                            <span>Send Now</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
