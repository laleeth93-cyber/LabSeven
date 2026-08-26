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
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col scale-in-center">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-20 pointer-events-none">
                        <Send size={120} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Send size={20} />
                            WhatsApp Dispatch
                        </h2>
                        <p className="text-emerald-100 text-sm mt-1">Send {documentType} to Patient</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors relative z-10 text-white">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Patient Name</p>
                            <p className="text-sm font-bold text-slate-800">{patientName}</p>
                        </div>
                    </div>

                    {!existingPhone && (
                        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex items-start gap-3 border border-amber-200">
                            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                            <p>This patient does not have a registered mobile number. Please enter one to continue.</p>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">WhatsApp Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 outline-none transition-colors font-medium text-slate-800"
                                placeholder="10-digit mobile number"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-md shadow-emerald-200 flex items-center justify-center gap-2">
                            <Send size={18} />
                            Send Now
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
