// --- BLOCK app/list/components/EditPatientModal.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { UserCog, X, Loader2, CheckCircle2, CheckCircle } from 'lucide-react';
import { updatePatientDetails } from '@/app/actions/patient-list';

interface EditPatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    editBill: any;
    onSuccess: () => void;
}

export default function EditPatientModal({ isOpen, onClose, editBill, onSuccess }: EditPatientModalProps) {
    const [isPending, startTransition] = useTransition();
    
    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [formData, setFormData] = useState({
        designation: 'Mr.',
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        gender: 'Male',
        ageY: 0,
        ageM: 0,
        ageD: 0,
        address: '',
        referralType: 'Self',
        refDoctor: ''
    });

    useEffect(() => {
        if (isOpen && editBill?.patient) {
            setShowSuccessPopup(false); // Reset on open
            const p = editBill.patient;
            setFormData({
                designation: p.designation || 'Mr.',
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                phone: p.phone || '',
                email: p.email || '',
                gender: p.gender || 'Male',
                ageY: p.ageY || 0,
                ageM: p.ageM || 0,
                ageD: p.ageD || 0,
                address: p.address || '',
                referralType: p.referralType || 'Self',
                refDoctor: p.refDoctor || ''
            });
        }
    }, [isOpen, editBill]);

    if (!isOpen || !editBill) return null;

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!formData.firstName.trim()) return alert("First Name is required.");
        
        startTransition(async () => {
            const res = await updatePatientDetails(editBill.patient.id, formData);
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
        <div className="fixed inset-0 z-[500] bg-black/40 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative">
                
                {/* INNER SUCCESS OVERLAY */}
                {showSuccessPopup && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Patient Updated!</h2>
                      <p className="text-slate-500 text-sm mt-1 text-center font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                  </div>
                )}

                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserCog size={18} className="text-[#9575cd]"/> Edit Patient Details
                    </h2>
                    <button onClick={onClose} disabled={isPending || showSuccessPopup} className="text-slate-400 hover:text-red-500 transition-colors bg-white p-1 rounded-md shadow-sm border border-slate-200 disabled:opacity-50"><X size={18}/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
                    
                    {/* Demographics Section */}
                    <div>
                        <h3 className="text-xs font-bold text-[#9575cd] uppercase tracking-wider mb-3">Demographics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Title</label>
                                <select name="designation" value={formData.designation} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none bg-white">
                                    <option value="Mr.">Mr.</option><option value="Mrs.">Mrs.</option>
                                    <option value="Miss">Miss</option><option value="Master">Master</option>
                                    <option value="Baby">Baby</option><option value="Dr.">Dr.</option>
                                    <option value="Prof.">Prof.</option>
                                </select>
                            </div>
                            <div className="col-span-12 md:col-span-4">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">First Name <span className="text-red-500">*</span></label>
                                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none" />
                            </div>
                            <div className="col-span-12 md:col-span-5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Age & Gender Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Age</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <span className="text-[9px] text-slate-400 font-bold ml-1">Years</span>
                                    <input type="number" min="0" name="ageY" value={formData.ageY} onChange={handleChange} className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm text-center focus:border-[#9575cd] outline-none" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] text-slate-400 font-bold ml-1">Months</span>
                                    <input type="number" min="0" max="11" name="ageM" value={formData.ageM} onChange={handleChange} className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm text-center focus:border-[#9575cd] outline-none" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] text-slate-400 font-bold ml-1">Days</span>
                                    <input type="number" min="0" max="31" name="ageD" value={formData.ageD} onChange={handleChange} className="w-full h-9 border border-slate-300 rounded-lg px-2 text-sm text-center focus:border-[#9575cd] outline-none" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none bg-white">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-xs font-bold text-[#9575cd] uppercase tracking-wider mb-3">Contact & Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Phone Number</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none" />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Email ID</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none" />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Address</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Referral Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Referral Type</label>
                            <select name="referralType" value={formData.referralType} onChange={handleChange} className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none bg-white">
                                <option value="Self">Self</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Hospital">Hospital</option>
                                <option value="Lab">Lab</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1 block">Referred By (Name)</label>
                            <input 
                                type="text" 
                                name="refDoctor" 
                                value={formData.refDoctor} 
                                onChange={handleChange} 
                                disabled={formData.referralType === 'Self'}
                                placeholder={formData.referralType === 'Self' ? 'Self' : 'Enter referring name'}
                                className="w-full h-10 border border-slate-300 rounded-lg px-3 text-sm focus:border-[#9575cd] outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                            />
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} disabled={isPending || showSuccessPopup} className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isPending || showSuccessPopup}
                        className="px-6 py-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-sm"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                        Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}
// --- BLOCK app/list/components/EditPatientModal.tsx CLOSE ---