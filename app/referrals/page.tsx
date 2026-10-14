// --- BLOCK app/referrals/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    Search, Plus, Edit, Trash2, Loader2, Building2, Phone, MapPin, 
    Stethoscope, FlaskConical, Microscope, AlertCircle, X, CheckCircle2, 
    Percent, AlertTriangle, CheckCircle, Lock, ChevronLeft, RefreshCw,
    ChevronDown, User, Mail
} from 'lucide-react';
import { getReferrals, saveReferral, deleteReferral, toggleReferralStatus } from '@/app/actions/referral';
import MusicBarLoader from '@/app/components/MusicBarLoader';
import { usePermissions } from '@/app/context/PermissionContext';

type ReferralType = 'Doctor' | 'Lab' | 'Hospital' | 'Outsource';

function ReferralsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const { orgId, permissions, userRole, permsLoaded } = usePermissions();

    const [activeTab, setActiveTab] = useState<ReferralType>('Doctor');

    useEffect(() => {
        if (!tabParam) return;
        const normalized = tabParam.toLowerCase();
        if (normalized === 'doctor' || normalized === 'doctors') {
            setActiveTab('Doctor');
        } else if (normalized === 'lab' || normalized === 'labs' || normalized === 'partner labs') {
            setActiveTab('Lab');
        } else if (normalized === 'hospital' || normalized === 'hospitals') {
            setActiveTab('Hospital');
        } else if (normalized === 'outsource' || normalized === 'outsourced' || normalized === 'outsourced labs') {
            setActiveTab('Outsource');
        }
    }, [tabParam]);

    const [referrals, setReferrals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All'); 
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    
    const [isPending, startTransition] = useTransition();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRef, setEditingRef] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', specialization: '', clinicName: '', hospital: '', degree: '', contactPerson: '', commission: '', isActive: true
    });

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const canSee = (screenName: string) => {
        if (orgId === 1) return true;
        if (!permsLoaded) return false;
        if (permissions.length === 0) return true; 
        return permissions.some(p => p.module === screenName && p.action === 'Access');
    };

    const canPerform = (screenName: string, action: string) => {
        if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
        if (permissions.length === 0) return true; 
        return permissions.some(p => p.module === screenName && p.action === action);
    };

    const tabsDef = [
        { id: 'Doctor', screen: 'Doctors', icon: <Stethoscope size={16} /> },
        { id: 'Lab', screen: 'Partner Labs', icon: <FlaskConical size={16} /> },
        { id: 'Hospital', screen: 'Hospitals', icon: <Building2 size={16} /> },
        { id: 'Outsource', screen: 'Outsourced Labs', icon: <Microscope size={16} /> }
    ];

    const visibleTabs = tabsDef.filter(t => canSee(t.screen));

    useEffect(() => {
        if (permsLoaded && visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id as ReferralType);
        }
    }, [permsLoaded, activeTab, visibleTabs]);

    const loadData = async () => {
        setIsLoading(true);
        const res = await getReferrals(activeTab, searchQuery);
        if (res.success && res.data) setReferrals(res.data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!permsLoaded) return;
        const timer = setTimeout(() => { loadData(); }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, permsLoaded]);

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
            name: ref.name || '', phone: ref.phone || '', email: ref.email || '', specialization: ref.specialization || '',
            clinicName: ref.clinicName || '', hospital: ref.hospital || '', degree: ref.degree || '', contactPerson: ref.contactPerson || '',
            commission: ref.commission ? ref.commission.toString() : '', isActive: ref.isActive
        });
        setIsFormOpen(true);
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

    const handleDeleteClick = (id: number) => { setDeleteConfirmId(id); };

    const confirmDelete = () => {
        if (!deleteConfirmId) return;
        startTransition(async () => {
            const res = await deleteReferral(deleteConfirmId);
            setDeleteConfirmId(null);
            if (res.success) {
                setSuccessMessage("Deleted Successfully!");
                setShowSuccessPopup(true);
                setTimeout(() => { setShowSuccessPopup(false); loadData(); }, 1500);
            } else alert(res.message);
        });
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        const newStatus = !currentStatus;
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
        Doctor: { 
            icon: Stethoscope, 
            title: "Doctors Directory", 
            nameLabel: "Doctor Name", 
            namePlaceholder: "Dr. John Doe",
            specLabel: "Specialization", 
            specPlaceholder: "e.g. Cardiologist",
            locLabel: "Clinic Name / Address",
            locPlaceholder: "Clinic or Consultation Room",
            addBtnLabel: "Add Doctor",
            singularLabel: "Doctor",
            searchPlaceholder: "Search doctors...",
            emptyText: "No doctors found.",
            iconBg: "bg-blue-50 text-blue-600 border border-blue-100"
        },
        Lab: { 
            icon: FlaskConical, 
            title: "Labs Directory", 
            nameLabel: "Laboratory Name", 
            namePlaceholder: "e.g. Apex Diagnostics",
            specLabel: "Lab Type / Specialization", 
            specPlaceholder: "e.g. Pathology, Imaging",
            locLabel: "Branch Location / Address", 
            locPlaceholder: "Branch Location / Full Address",
            addBtnLabel: "Add Partner Lab",
            singularLabel: "Partner Lab",
            searchPlaceholder: "Search partner labs...",
            emptyText: "No partner labs found.",
            iconBg: "bg-teal-50 text-teal-600 border border-teal-100"
        },
        Hospital: { 
            icon: Building2, 
            title: "Hospitals Directory", 
            nameLabel: "Hospital Name", 
            namePlaceholder: "e.g. City General Hospital",
            specLabel: "Hospital Type", 
            specPlaceholder: "e.g. Multispecialty, General",
            locLabel: "Hospital Address", 
            locPlaceholder: "Hospital Address / Landmark",
            addBtnLabel: "Add Hospital",
            singularLabel: "Hospital",
            searchPlaceholder: "Search hospitals...",
            emptyText: "No hospitals found.",
            iconBg: "bg-purple-50 text-purple-600 border border-purple-100"
        },
        Outsource: { 
            icon: Microscope, 
            title: "Outsourced Centers Directory", 
            nameLabel: "Center Name", 
            namePlaceholder: "e.g. National Reference Lab",
            specLabel: "Services / Specialized Tests", 
            specPlaceholder: "e.g. Histopathology, Genetics",
            locLabel: "Center Address", 
            locPlaceholder: "Full Address",
            addBtnLabel: "Add Outsource Center",
            singularLabel: "Outsource Center",
            searchPlaceholder: "Search outsource centers...",
            emptyText: "No outsource centers found.",
            iconBg: "bg-amber-50 text-amber-600 border border-amber-100"
        }
    };
    
    const currentUI = activeTab ? uiConfig[activeTab] : uiConfig['Doctor'];
    const ActiveIcon = currentUI.icon;

    if (!permsLoaded) return (
        <div className="w-full h-full flex items-center justify-center bg-[#f1f5f9]">
            <MusicBarLoader text="Authenticating..." />
        </div>
    );

    if (visibleTabs.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#f1f5f9] p-6 text-center">
                <Lock className="text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any settings within the Referrals module.</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col font-sans relative overflow-hidden">
            
            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border-[3px] border-red-100">
                    <AlertTriangle className="text-red-500" size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Delete {currentUI.singularLabel || activeTab}?</h3>
                  <p className="text-xs text-slate-500 mb-4">Are you sure you want to delete this record? This action cannot be undone.</p>
                  <div className="flex gap-2">
                     <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-7 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">Cancel</button>
                     <button onClick={confirmDelete} disabled={isPending} className="flex-1 h-7 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70">
                       {isPending ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>} Delete
                     </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Toast */}
            {showSuccessPopup && (
              <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-300 p-4">
                <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-xs w-full border border-slate-100">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-[3px] border-emerald-100">
                    <CheckCircle className="text-emerald-500" size={26} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
                </div>
              </div>
            )}

            {/* Add / Edit Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col w-full max-w-sm max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                                {editingRef ? <Edit size={12} className="text-teal-600"/> : <Plus size={12} className="text-[#9575cd]"/>}
                                {editingRef ? `Edit ${currentUI.singularLabel || activeTab}` : `Add New ${currentUI.singularLabel || activeTab}`}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"><X size={13}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2">
                                <div className={activeTab === 'Doctor' ? 'col-span-2' : 'col-span-3'}>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">{currentUI.nameLabel} <span className="text-red-500">*</span></label>
                                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={currentUI.namePlaceholder || "Enter Name"} className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" autoFocus />
                                </div>
                                {activeTab === 'Doctor' && (
                                    <div className="col-span-1">
                                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Degree</label>
                                        <input type="text" value={formData.degree} onChange={e => setFormData({...formData, degree: e.target.value})} placeholder="MBBS, MD" className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" />
                                    </div>
                                )}
                            </div>

                            {activeTab !== 'Doctor' && (
                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">
                                        {activeTab === 'Hospital' ? 'Doctor / Incharge Name' : activeTab === 'Lab' ? 'Contact Person / Manager' : 'Center Incharge / Representative'}
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.contactPerson} 
                                        onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                                        placeholder={activeTab === 'Hospital' ? "e.g. Dr. Verma / Incharge" : activeTab === 'Lab' ? "e.g. Lab Manager" : "e.g. Center Manager"} 
                                        className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" 
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Phone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mobile Number" className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white font-mono text-slate-700" />
                                </div>
                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optional email" className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" />
                                </div>
                            </div>

                            {activeTab === 'Doctor' && (
                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Hospital / Clinic</label>
                                    <input type="text" value={formData.hospital} onChange={e => setFormData({...formData, hospital: e.target.value})} placeholder="Associated Hospital" className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" />
                                </div>
                            )}

                            {activeTab === 'Outsource' ? (
                                <div>
                                    <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">Services / Specialized Tests</label>
                                    <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Histopathology, Genetics" className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">{currentUI.specLabel || 'Specialization'}</label>
                                        <input type="text" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} placeholder={currentUI.specPlaceholder} className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" />
                                    </div>
                                    <div>
                                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block text-[#9575cd] flex items-center gap-0.5"><Percent size={9}/> Comm. %</label>
                                        <input type="number" value={formData.commission} onChange={e => setFormData({...formData, commission: e.target.value})} placeholder="e.g. 15" className="w-full h-6 border border-[#9575cd]/40 bg-purple-50/20 rounded px-2 text-[10px] font-bold focus:border-[#9575cd] outline-none text-slate-800" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-0.5 block">{currentUI.locLabel || 'Address'}</label>
                                <input type="text" value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} placeholder={currentUI.locPlaceholder || "Full Address"} className="w-full h-6 border border-slate-200 rounded px-2 text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700" />
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[9.5px] font-bold text-slate-700">Account Status</span>
                                <button 
                                    type="button" 
                                    onClick={() => setFormData({...formData, isActive: !formData.isActive})} 
                                    className={`h-4 px-2 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase transition-all ${
                                        formData.isActive ? 'bg-emerald-500 text-white shadow-2xs' : 'bg-slate-200 text-slate-600'
                                    }`}
                                >
                                    {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-end gap-1.5">
                            <button onClick={() => setIsFormOpen(false)} className="h-6 px-3 text-[9px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded transition-colors">Cancel</button>
                            <button onClick={handleSubmit} disabled={isPending} className="h-6 px-4 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-[9px] font-bold rounded flex items-center gap-1 transition-colors disabled:opacity-70 shadow-sm">
                                {isPending ? <Loader2 size={11} className="animate-spin"/> : <CheckCircle2 size={11}/>}
                                <span>Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* DESKTOP RATIO (100% UNTOUCHED ORIGINAL LAYOUT)                            */}
            {/* ========================================================================= */}
            <div className="hidden md:flex flex-col flex-1 h-full w-full bg-[#f1f5f9] p-6 overflow-hidden">
                <header className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 shrink-0 flex flex-col relative z-20">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white overflow-x-auto no-scrollbar rounded-t-2xl">
                        {visibleTabs.map(tab => (
                            <button key={tab.id} onClick={() => { setActiveTab(tab.id as ReferralType); setSearchQuery(''); setActiveFilter('All'); setIsFormOpen(false); }}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#9575cd] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                                {tab.icon} {tab.screen}
                            </button>
                        ))}
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
                                {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Add') && (
                                    <button onClick={handleOpenAdd} className="w-full md:w-auto h-10 px-4 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm">
                                        {isFormOpen && !editingRef ? <X size={18} /> : <Plus size={18} />}
                                        {isFormOpen && !editingRef ? 'Close Form' : `Add ${activeTab === 'Outsource' ? 'Center' : activeTab}`}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col z-10 relative">
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <MusicBarLoader text={`Loading ${activeTab === 'Outsource' ? 'Centers' : activeTab}s...`} />
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
                                        {activeTab === 'Doctor' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Specialization</th>}
                                        {activeTab === 'Doctor' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Hospital / Clinic</th>}
                                        {activeTab === 'Hospital' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Doctor Name</th>}
                                        {activeTab === 'Lab' && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Contact Person</th>}
                                        {(activeTab === 'Hospital' || activeTab === 'Lab' || activeTab === 'Outsource') && <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Address</th>}
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px]">Contact Info</th>
                                        {activeTab !== 'Outsource' && <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-center bg-purple-50/50">Comm. %</th>}
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px] text-center">Status</th>
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-[11px] text-center border-l border-slate-100">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredReferrals.map(ref => (
                                        <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors group">
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

                                            {activeTab === 'Doctor' && <td className="py-3 px-6 text-slate-600 font-medium text-xs">{ref.specialization || '-'}</td>}
                                            {activeTab === 'Doctor' && <td className="py-3 px-6 text-slate-600 font-medium text-xs">{ref.hospital || ref.clinicName || '-'}</td>}
                                            {(activeTab === 'Hospital' || activeTab === 'Lab') && <td className="py-3 px-6 text-slate-600 font-medium text-xs">{ref.contactPerson || '-'}</td>}
                                            {(activeTab === 'Hospital' || activeTab === 'Lab' || activeTab === 'Outsource') && <td className="py-3 px-6 text-slate-600 font-medium text-xs max-w-xs truncate">{ref.clinicName || '-'}</td>}

                                            <td className="py-3 px-6">
                                                <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                                                    {ref.phone && <span className="flex items-center gap-1 font-mono"><Phone size={12} className="text-slate-400"/> {ref.phone}</span>}
                                                    {ref.email && <span className="text-slate-400 text-[11px] truncate max-w-[150px]">{ref.email}</span>}
                                                    {!ref.phone && !ref.email && <span className="text-slate-300">-</span>}
                                                </div>
                                            </td>

                                            {activeTab !== 'Outsource' && (
                                                <td className="py-3 px-4 text-center font-bold text-slate-700 bg-purple-50/20">
                                                    {ref.commission ? <span className="text-xs text-[#9575cd] font-black">{ref.commission}%</span> : <span className="text-slate-300">-</span>}
                                                </td>
                                            )}

                                            <td className="py-3 px-6 text-center">
                                                <button onClick={() => handleToggleStatus(ref.id, ref.isActive)} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${ref.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${ref.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                    {ref.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>

                                            <td className="py-3 px-6 text-center border-l border-slate-100">
                                                <div className="flex items-center justify-center gap-2">
                                                    {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Edit') && (
                                                        <button onClick={() => handleOpenEdit(ref)} className="p-1.5 bg-white border border-slate-200 rounded text-teal-600 hover:bg-teal-50 hover:border-teal-200 shadow-sm" title={`Edit ${activeTab}`}>
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                    {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Delete') ? (
                                                        <button onClick={() => handleDeleteClick(ref.id)} className="p-1.5 bg-white border border-slate-200 rounded text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm" title={`Delete ${activeTab}`}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    ) : <span className="w-6 text-center text-slate-300">-</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MOBILE RATIO (TAILORED FOR MOBILE VIEWPORT)                                */}
            {/* ========================================================================= */}
            <div className="flex md:hidden flex-col flex-1 w-full h-full bg-[#f1f5f9] p-2 overflow-hidden">
                <div className="w-full h-full bg-white rounded-none border-0 shadow-sm overflow-hidden flex flex-col relative">
                    
                    {/* Mobile Top Header: Search & Status Dropdown Button (No grey line, no pills) */}
                    <div className="p-2 flex items-center gap-1.5 shrink-0 bg-white">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                placeholder={currentUI.searchPlaceholder || `Search ${activeTab.toLowerCase()}s...`} 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-6 pl-6 pr-2 border border-slate-200 rounded text-[10px] focus:border-[#9575cd] outline-none bg-white text-slate-700 placeholder:text-slate-400" 
                            />
                            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                        </div>

                        {/* Status Filter Dropdown Button beside Search Bar */}
                        <div className="relative shrink-0">
                            <button 
                                type="button"
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className="h-6 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-bold text-slate-700 flex items-center gap-1 active:scale-95 transition-all shadow-2xs"
                            >
                                <span className={activeFilter !== 'All' ? 'text-[#9575cd]' : 'text-slate-700'}>
                                    {activeFilter}
                                </span>
                                <span className="text-[8px] text-slate-400 font-normal">
                                    ({activeFilter === 'All' ? stats.total : activeFilter === 'Active' ? stats.active : stats.inactive})
                                </span>
                                <ChevronDown size={10} className={`text-slate-400 transition-transform duration-150 ${showStatusDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showStatusDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                                    <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                        {[
                                            { id: 'All', label: 'All', count: stats.total },
                                            { id: 'Active', label: 'Active', count: stats.active },
                                            { id: 'Inactive', label: 'Inactive', count: stats.inactive }
                                        ].map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setActiveFilter(item.id);
                                                    setShowStatusDropdown(false);
                                                }}
                                                className={`w-full px-2.5 py-1 text-left text-[9.5px] font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                                    activeFilter === item.id ? 'text-[#9575cd] bg-purple-50/50' : 'text-slate-600'
                                                }`}
                                            >
                                                <span>{item.label}</span>
                                                <span className={`text-[8.5px] ${activeFilter === item.id ? 'text-[#9575cd]' : 'text-slate-400'}`}>
                                                    {item.count}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile List Content Area */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-white">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center py-12">
                                <MusicBarLoader text={`Loading ${currentUI.singularLabel || activeTab}s...`} />
                            </div>
                        ) : filteredReferrals.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 py-12">
                                <AlertCircle size={32} className="opacity-25"/>
                                <p className="text-[10px] font-medium text-slate-500">{currentUI.emptyText}</p>
                            </div>
                        ) : (
                            filteredReferrals.map(ref => (
                                <div key={ref.id} className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col gap-1.5 transition-all">
                                    {/* Row 1: Name, Badges & Status Toggle */}
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className={`w-5 h-5 rounded-full ${currentUI.iconBg} flex items-center justify-center shrink-0`}>
                                                <ActiveIcon size={11} />
                                            </div>
                                            <span className="font-bold text-[10.5px] text-slate-800 truncate leading-tight">{ref.name}</span>
                                            
                                            {/* Tab-specific secondary badges */}
                                            {activeTab === 'Doctor' && ref.degree && (
                                                <span className="text-[7.5px] font-bold text-[#9575cd] bg-purple-50 px-1 py-0.2 rounded border border-purple-200 shrink-0">
                                                    {ref.degree}
                                                </span>
                                            )}
                                            {activeTab === 'Lab' && ref.specialization && (
                                                <span className="text-[7.5px] font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200 shrink-0 truncate max-w-[90px]">
                                                    {ref.specialization}
                                                </span>
                                            )}
                                            {activeTab === 'Hospital' && ref.specialization && (
                                                <span className="text-[7.5px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 shrink-0 truncate max-w-[90px]">
                                                    {ref.specialization}
                                                </span>
                                            )}
                                            {activeTab === 'Outsource' && (
                                                <span className="text-[7.5px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200 shrink-0">
                                                    {ref.specialization || 'Outsource'}
                                                </span>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => handleToggleStatus(ref.id, ref.isActive)} 
                                            className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                                ref.isActive 
                                                    ? 'bg-[#9575cd] text-white' 
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}
                                        >
                                            {ref.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </button>
                                    </div>

                                    {/* Row 2: Secondary info tailored per tab */}
                                    <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-500 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Doctor: Associated Clinic / Hospital */}
                                            {activeTab === 'Doctor' && (ref.hospital || ref.clinicName) && (
                                                <span className="flex items-center gap-0.5 truncate max-w-[130px]">
                                                    <Building2 size={10} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{ref.hospital || ref.clinicName}</span>
                                                </span>
                                            )}
                                            {activeTab === 'Doctor' && ref.specialization && (
                                                <span className="flex items-center gap-0.5 text-slate-600 font-medium">
                                                    • {ref.specialization}
                                                </span>
                                            )}

                                            {/* Lab & Hospital & Outsource: Contact Person */}
                                            {activeTab !== 'Doctor' && ref.contactPerson && (
                                                <span className="flex items-center gap-0.5 text-slate-600 font-medium truncate max-w-[130px]">
                                                    <User size={9} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{ref.contactPerson}</span>
                                                </span>
                                            )}

                                            {/* Lab & Hospital & Outsource: Address / Location */}
                                            {activeTab !== 'Doctor' && ref.clinicName && (
                                                <span className="flex items-center gap-0.5 text-slate-500 truncate max-w-[140px]">
                                                    <MapPin size={9} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{ref.clinicName}</span>
                                                </span>
                                            )}

                                            {/* Phone number */}
                                            {ref.phone && (
                                                <span className="flex items-center gap-0.5 text-slate-600 font-mono">
                                                    <Phone size={9} className="text-slate-400 shrink-0" />
                                                    {ref.phone}
                                                </span>
                                            )}

                                            {/* Outsource Email if no phone */}
                                            {activeTab === 'Outsource' && !ref.phone && ref.email && (
                                                <span className="flex items-center gap-0.5 text-slate-500 truncate max-w-[120px]">
                                                    <Mail size={9} className="text-slate-400 shrink-0" />
                                                    <span className="truncate">{ref.email}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Commission % badge */}
                                        {activeTab !== 'Outsource' && ref.commission ? (
                                            <span className="text-[8px] font-bold text-[#9575cd] bg-purple-50 px-1 py-0.2 rounded border border-purple-200 shrink-0 flex items-center gap-0.5">
                                                <Percent size={8}/> {ref.commission}%
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* Row 3: Action Buttons */}
                                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100">
                                        {ref.phone && (
                                            <a 
                                                href={`tel:${ref.phone}`} 
                                                className="h-5 px-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-[8px] font-bold flex items-center gap-0.5 border border-blue-100 active:scale-95 transition-all"
                                            >
                                                <Phone size={9} /> Call
                                            </a>
                                        )}
                                        {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Edit') && (
                                            <button 
                                                onClick={() => handleOpenEdit(ref)} 
                                                className="h-5 px-1.5 bg-slate-50 hover:bg-slate-100 text-teal-600 rounded text-[8px] font-bold flex items-center gap-0.5 border border-slate-200 active:scale-95 transition-all"
                                            >
                                                <Edit size={9} /> Edit
                                            </button>
                                        )}
                                        {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Delete') && (
                                            <button 
                                                onClick={() => handleDeleteClick(ref.id)} 
                                                className="h-5 px-1.5 bg-slate-50 hover:bg-rose-50 text-rose-600 rounded text-[8px] font-bold flex items-center gap-0.5 border border-slate-200 hover:border-rose-200 active:scale-95 transition-all"
                                            >
                                                <Trash2 size={9} /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Mobile Proper Footer (No grey line, no refresh button) */}
                    <footer className="shrink-0 bg-white p-2 z-[50] pb-safe">
                        <div className="flex items-center gap-1.5 w-full">
                            <button 
                                type="button"
                                onClick={() => router.back()} 
                                className="h-6 flex-1 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-medium text-[9px] rounded active:scale-95 transition-all gap-0.5"
                            >
                                <ChevronLeft size={12} />
                                <span>Back</span>
                            </button>

                            {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Add') && (
                                <button 
                                    type="button"
                                    onClick={handleOpenAdd}
                                    className="h-6 flex-1 bg-[#9575cd] hover:bg-[#7e57c2] text-white rounded text-[9.5px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                                >
                                    <Plus size={11} />
                                    <span>{currentUI.addBtnLabel}</span>
                                </button>
                            )}
                        </div>
                    </footer>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

export default function ReferralsPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-[#f1f5f9]">
                <MusicBarLoader text="Loading Referrals..." />
            </div>
        }>
            <ReferralsContent />
        </Suspense>
    );
}
// --- BLOCK app/referrals/page.tsx CLOSE ---