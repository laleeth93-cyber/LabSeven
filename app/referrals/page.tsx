// --- BLOCK app/referrals/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, Building2, Phone, MapPin, Stethoscope, FlaskConical, Microscope, AlertCircle, X, CheckCircle2, Percent, AlertTriangle, CheckCircle } from 'lucide-react';
import { getReferrals, saveReferral, deleteReferral, toggleReferralStatus } from '@/app/actions/referral';

type ReferralType = 'Doctor' | 'Lab' | 'Hospital' | 'Outsource';

export default function ReferralsPage() {
    const [activeTab, setActiveTab] = useState<ReferralType>('Doctor');

    const [referrals, setReferrals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); 
    
    const [isPending, startTransition] = useTransition();

    // Form Dropdown State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRef, setEditingRef] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        specialization: '', 
        clinicName: '',
        hospital: '',
        degree: '',
        contactPerson: '',
        commission: '',
        isActive: true
    });

    // --- DELETE CONFIRMATION STATE ---
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const loadData = async () => {
        setIsLoading(true);
        const res = await getReferrals(activeTab, searchQuery);
        if (res.success && res.data) setReferrals(res.data);
        setIsLoading(false);
    };

    useEffect(() => {
        const timer = setTimeout(() => { loadData(); }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeTab]);

    const handleOpenAdd = () => {
        if (isFormOpen && !editingRef) {
            setIsFormOpen(false); 
            return;
        }
        setEditingRef(null);
        setFormData({ name: '', phone: '', email: '', specialization: '', clinicName: '', hospital: '', degree: '', contactPerson: '', commission: '', isActive: true });
        setIsFormOpen(true);
    };

    const handleOpenEdit = (ref: any) => {
        setEditingRef(ref);
        setFormData({
            name: ref.name || '',
            phone: ref.phone || '',
            email: ref.email || '',
            specialization: ref.specialization || '',
            clinicName: ref.clinicName || '',
            hospital: ref.hospital || '',
            degree: ref.degree || '',
            contactPerson: ref.contactPerson || '',
            commission: ref.commission ? ref.commission.toString() : '',
            isActive: ref.isActive
        });
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) return alert("Name is required");
        startTransition(async () => {
            const dataToSave = editingRef ? { id: editingRef.id, ...formData } : formData;
            const res = await saveReferral(dataToSave, activeTab);
            if (res.success) {
                setIsFormOpen(false);
                setSuccessMessage(editingRef ? "Updated Successfully!" : "Created Successfully!");
                setShowSuccessPopup(true);
                setTimeout(() => { setShowSuccessPopup(false); loadData(); }, 1500);
            } else {
                alert(res.message);
            }
        });
    };

    const handleDeleteClick = (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (!deleteConfirmId) return;
        startTransition(async () => {
            const res = await deleteReferral(deleteConfirmId);
            setDeleteConfirmId(null);
            if (res.success) {
                setSuccessMessage("Deleted Successfully!");
                setShowSuccessPopup(true);
                setTimeout(() => { setShowSuccessPopup(false); loadData(); }, 1500);
            } else {
                alert(res.message);
            }
        });
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        // Optimistic UI update
        setReferrals(prev => prev.map(r => r.id === id ? { ...r, isActive: newStatus } : r));
        
        startTransition(async () => {
            await toggleReferralStatus(id, newStatus);
            setSuccessMessage(newStatus ? "Enabled Successfully!" : "Disabled Successfully!");
            setShowSuccessPopup(true);
            setTimeout(() => setShowSuccessPopup(false), 1500);
        });
    };

    const filteredReferrals = referrals.filter(ref => {
        if (activeFilter === 'Active') return ref.isActive;
        if (activeFilter === 'Inactive') return !ref.isActive;
        return true;
    });

    const stats = {
        total: referrals.length,
        active: referrals.filter(r => r.isActive).length,
        inactive: referrals.filter(r => !r.isActive).length,
    };

    const uiConfig = {
        Doctor: { icon: Stethoscope, title: "Doctors Directory", nameLabel: "Doctor Name", specLabel: "Specialization", locLabel: "Clinic Name" },
        Lab: { icon: FlaskConical, title: "Labs Directory", nameLabel: "Laboratory Name", specLabel: "Lab Type", locLabel: "Branch Location" },
        Hospital: { icon: Building2, title: "Hospitals Directory", nameLabel: "Hospital Name", specLabel: "Hospital Type", locLabel: "Address" },
        Outsource: { icon: Microscope, title: "Outsourced Centers Directory", nameLabel: "Center Name", specLabel: "", locLabel: "Address" }
    };
    const currentUI = uiConfig[activeTab];
    const ActiveIcon = currentUI.icon;

    return (
        <div className="h-full w-full bg-[#f1f5f9] p-4 md:p-6 flex flex-col font-sans relative">
            
            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteConfirmId && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
                    <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Delete {activeTab}?</h3>
                  <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this record? This action cannot be undone.</p>
                  <div className="flex gap-3">
                     <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                     <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                       {isPending ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Delete
                     </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- SUCCESS POPUP OVERLAY --- */}
            {showSuccessPopup && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                    <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
                </div>
              </div>
            )}

            <header className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 flex flex-col relative z-20">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white overflow-x-auto no-scrollbar rounded-t-2xl">
                    <button onClick={() => { setActiveTab('Doctor'); setSearchQuery(''); setActiveFilter('All'); setIsFormOpen(false); }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'Doctor' ? 'bg-[#9575cd] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                        <Stethoscope size={16} /> Doctors
                    </button>
                    <button onClick={() => { setActiveTab('Lab'); setSearchQuery(''); setActiveFilter('All'); setIsFormOpen(false); }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'Lab' ? 'bg-[#9575cd] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                        <FlaskConical size={16} /> Partner Labs
                    </button>
                    <button onClick={() => { setActiveTab('Hospital'); setSearchQuery(''); setActiveFilter('All'); setIsFormOpen(false); }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'Hospital' ? 'bg-[#9575cd] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                        <Building2 size={16} /> Hospitals
                    </button>
                    <button onClick={() => { setActiveTab('Outsource'); setSearchQuery(''); setActiveFilter('All'); setIsFormOpen(false); }}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'Outsource' ? 'bg-[#9575cd] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                        <Microscope size={16} /> Outsourced Labs
                    </button>
                </div>

                <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    <div className="flex items-center gap-3 text-slate-800">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                            <ActiveIcon size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-tight">{currentUI.title}</h1>
                            <p className="text-xs text-slate-500 font-medium">Manage your active {activeTab === 'Outsource' ? 'outsourced centers' : activeTab.toLowerCase()} list</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                        <div className="flex gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200 shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar shadow-inner">
                            {['All', 'Active', 'Inactive'].map(filter => (
                                <button key={filter} onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeFilter === filter ? 'bg-white text-[#9575cd] shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent'}`}>
                                    {filter} {filter === 'All' ? `(${stats.total})` : filter === 'Active' ? `(${stats.active})` : `(${stats.inactive})`}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-64 shrink-0">
                            <input type="text" placeholder={`Search ${activeTab.toLowerCase()}s...`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] outline-none shadow-sm" />
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        </div>
                        
                        <div className="relative w-full md:w-auto shrink-0 z-50">
                            <button onClick={handleOpenAdd} className="w-full md:w-auto h-10 px-4 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                                {isFormOpen && !editingRef ? <X size={18} /> : <Plus size={18} />}
                                {isFormOpen && !editingRef ? 'Close Form' : `Add ${activeTab === 'Outsource' ? 'Center' : activeTab}`}
                            </button>

                            {isFormOpen && (
                                <div className="absolute right-0 top-full mt-3 w-[340px] md:w-[400px] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-right z-[500]">
                                    <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            {editingRef ? <Edit size={16} className="text-teal-600"/> : <Plus size={16} className="text-[#9575cd]"/>}
                                            {editingRef ? `Edit ${activeTab === 'Outsource' ? 'Center' : activeTab}` : `Add New ${activeTab === 'Outsource' ? 'Center' : activeTab}`}
                                        </h2>
                                        <button onClick={() => setIsFormOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={16}/></button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[60vh] custom-scrollbar">
                                        {/* NAME & DEGREE ROW */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className={activeTab === 'Doctor' ? 'col-span-2' : 'col-span-3'}>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{currentUI.nameLabel} <span className="text-red-500">*</span></label>
                                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={activeTab === 'Doctor' ? "e.g. Dr. John Doe" : activeTab === 'Outsource' ? "e.g. Suburban Diagnostics" : "Enter Name"} className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" autoFocus />
                                            </div>
                                            {activeTab === 'Doctor' && (
                                                <div className="col-span-1">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Degree</label>
                                                    <input type="text" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} placeholder="e.g. MBBS, MD" className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                                </div>
                                            )}
                                        </div>

                                        {/* DOCTOR NAME FOR HOSPITALS/LABS ONLY */}
                                        {(activeTab === 'Hospital' || activeTab === 'Lab') && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{activeTab === 'Hospital' ? 'Doctor Name' : 'Contact Person'}</label>
                                                <input type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} placeholder="e.g. Dr. Smith / Mr. Ramesh" className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                            </div>
                                        )}

                                        {/* CONTACT ROW */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Phone</label>
                                                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mobile Number" className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Email</label>
                                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optional" className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                            </div>
                                        </div>

                                        {/* HOSPITAL ROW */}
                                        {activeTab === 'Doctor' && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Hospital Name</label>
                                                <input type="text" value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} placeholder="Associated Hospital" className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                            </div>
                                        )}

                                        {/* SPEC & COMMISSION ROW (HIDDEN FOR OUTSOURCE) */}
                                        {activeTab !== 'Outsource' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{activeTab === 'Doctor' ? 'Specialization' : 'Type / Details'}</label>
                                                    <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder={activeTab === 'Doctor' ? "e.g. Cardiologist" : "e.g. Pathology / Processing"} className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block text-[#9575cd] flex items-center gap-1"><Percent size={10}/> Commission</label>
                                                    <input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} placeholder="e.g. 15" className="w-full h-9 border border-[#9575cd]/40 bg-purple-50/30 rounded-md px-3 text-xs font-bold focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none" />
                                                </div>
                                            </div>
                                        )}

                                        {/* ADDRESS */}
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{currentUI.locLabel}</label>
                                            <input type="text" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} placeholder="Full Address" className="w-full h-9 border border-slate-300 rounded-md px-3 text-xs focus:border-[#9575cd] outline-none" />
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700">Account Status</span>
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <span className="text-[11px] text-slate-500 font-medium">{formData.isActive ? 'Active' : 'Inactive'}</span>
                                                <button type="button" onClick={() => setFormData({...formData, isActive: !formData.isActive})} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${formData.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                                                </button>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                                        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                                        <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-xs font-bold rounded-md flex items-center gap-2 transition-colors disabled:opacity-70 shadow-sm">
                                            {isPending ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} Save
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* TABLE LIST */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-10 relative">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="animate-spin text-[#9575cd]" size={32}/>
                            <p className="text-sm font-medium">Loading {activeTab === 'Outsource' ? 'Centers' : activeTab}s...</p>
                        </div>
                    ) : filteredReferrals.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                            <AlertCircle size={48} className="opacity-20 mb-2"/>
                            <p className="text-sm font-medium">No {activeTab === 'Outsource' ? 'outsourced centers' : activeTab.toLowerCase() + 's'} found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">{currentUI.nameLabel}</th>
                                    
                                    {/* DYNAMIC COLUMNS based on tab */}
                                    {activeTab === 'Doctor' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Specialization</th>}
                                    {activeTab === 'Doctor' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Hospital / Clinic</th>}
                                    
                                    {activeTab === 'Hospital' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Doctor Name</th>}
                                    {activeTab === 'Lab' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Contact Person</th>}
                                    
                                    {(activeTab === 'Hospital' || activeTab === 'Lab' || activeTab === 'Outsource') && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Address</th>}

                                    <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Contact Info</th>
                                    
                                    {/* HIDDEN FOR OUTSOURCE */}
                                    {activeTab !== 'Outsource' && <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-center bg-purple-50/50">Comm. %</th>}
                                    
                                    <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px] text-center">Status</th>
                                    <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px] text-center border-l border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredReferrals.map(ref => (
                                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors group">
                                        
                                        {/* DYNAMIC NAME & DEGREE */}
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                                    <ActiveIcon size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm">{ref.name}</span>
                                                    {activeTab === 'Doctor' && ref.degree && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{ref.degree}</span>}
                                                    {(activeTab === 'Hospital' || activeTab === 'Lab') && ref.specialization && <span className="text-[10px] text-slate-500">{ref.specialization}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* DOCTOR VIEW */}
                                        {activeTab === 'Doctor' && (
                                            <td className="py-3 px-6">
                                                <span className="text-sm text-slate-600 font-medium">{ref.specialization || '-'}</span>
                                            </td>
                                        )}
                                        {activeTab === 'Doctor' && (
                                            <td className="py-3 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    {ref.hospital && <span className="text-sm font-bold text-slate-700">{ref.hospital}</span>}
                                                    {ref.clinicName && <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> {ref.clinicName}</span>}
                                                    {!ref.hospital && !ref.clinicName && '-'}
                                                </div>
                                            </td>
                                        )}

                                        {/* HOSPITAL / LAB VIEW */}
                                        {(activeTab === 'Hospital' || activeTab === 'Lab') && (
                                            <td className="py-3 px-6">
                                                <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                                    {activeTab === 'Hospital' && ref.contactPerson && <Stethoscope size={14} className="text-blue-500"/>}
                                                    {ref.contactPerson || '-'}
                                                </div>
                                            </td>
                                        )}
                                        
                                        {/* ALL ADDRESS VIEWS */}
                                        {(activeTab === 'Hospital' || activeTab === 'Lab' || activeTab === 'Outsource') && (
                                            <td className="py-3 px-6">
                                                <span className="text-sm text-slate-600">{ref.clinicName || '-'}</span>
                                            </td>
                                        )}
                                        
                                        {/* Contact */}
                                        <td className="py-3 px-6">
                                            <div className="flex flex-col gap-1">
                                                {ref.phone ? (
                                                    <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
                                                        <Phone size={12} className="text-slate-400"/> {ref.phone}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs">-</span>}
                                                {ref.email && (
                                                    <div className="text-[11px] text-slate-500">{ref.email}</div>
                                                )}
                                            </div>
                                        </td>

                                        {/* COMMISSION PERCENTAGE */}
                                        {activeTab !== 'Outsource' && (
                                            <td className="py-3 px-4 text-center bg-purple-50/30">
                                                {ref.commission > 0 ? (
                                                    <span className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md border border-green-200">
                                                        {ref.commission}%
                                                    </span>
                                                ) : <span className="text-slate-300 text-sm">-</span>}
                                            </td>
                                        )}
                                        
                                        {/* Status Toggle */}
                                        <td className="py-3 px-6 text-center">
                                            <button onClick={() => handleToggleStatus(ref.id, ref.isActive)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${ref.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${ref.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        
                                        {/* Actions */}
                                        <td className="py-3 px-6 text-center border-l border-slate-100">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenEdit(ref)} className="p-1.5 bg-white border border-slate-200 rounded text-teal-600 hover:bg-teal-50 hover:border-teal-200 shadow-sm" title={`Edit ${activeTab}`}>
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteClick(ref.id)} className="p-1.5 bg-white border border-slate-200 rounded text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm" title={`Delete ${activeTab}`}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
// --- BLOCK app/referrals/page.tsx CLOSE ---