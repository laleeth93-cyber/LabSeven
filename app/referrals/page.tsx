// --- BLOCK app/referrals/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    Search, Plus, Edit, Trash2, Loader2, Building2, Phone, MapPin, 
    Stethoscope, FlaskConical, Microscope, AlertCircle, X, CheckCircle2, 
    Percent, AlertTriangle, CheckCircle, Lock, ChevronLeft, ChevronRight,
    ChevronDown, User, Mail, HeartPulse
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
    const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Inactive'>('All'); 
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

    // Desktop Pagination state
    const [desktopCurrentPage, setDesktopCurrentPage] = useState(1);
    const DESKTOP_ITEMS_PER_PAGE = 20;

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
        { id: 'Doctor' as ReferralType, screen: 'Doctors', label: 'Doctors', icon: <Stethoscope size={14} /> },
        { id: 'Lab' as ReferralType, screen: 'Partner Labs', label: 'Partner Labs', icon: <FlaskConical size={14} /> },
        { id: 'Hospital' as ReferralType, screen: 'Hospitals', label: 'Hospitals', icon: <Building2 size={14} /> },
        { id: 'Outsource' as ReferralType, screen: 'Outsourced Labs', label: 'Outsourced Labs', icon: <Microscope size={14} /> }
    ];

    const visibleTabs = tabsDef.filter(t => canSee(t.screen));

    useEffect(() => {
        if (permsLoaded && visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
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

    useEffect(() => {
        setDesktopCurrentPage(1);
    }, [searchQuery, activeTab, activeFilter]);

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

    const filteredReferrals = useMemo(() => {
        return referrals.filter(ref => {
            if (activeFilter === 'Active') return ref.isActive;
            if (activeFilter === 'Inactive') return !ref.isActive;
            return true;
        });
    }, [referrals, activeFilter]);

    const stats = {
        total: referrals.length,
        active: referrals.filter(r => r.isActive).length,
        inactive: referrals.filter(r => !r.isActive).length,
    };

    const desktopTotalPages = Math.ceil(filteredReferrals.length / DESKTOP_ITEMS_PER_PAGE) || 1;
    const desktopStartIndex = (desktopCurrentPage - 1) * DESKTOP_ITEMS_PER_PAGE;
    const paginatedDesktopReferrals = filteredReferrals.slice(desktopStartIndex, desktopStartIndex + DESKTOP_ITEMS_PER_PAGE);

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
            title: "Partner Labs Directory", 
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
        <div className="w-full h-full flex items-center justify-center bg-white font-sans">
            <MusicBarLoader text="Authenticating..." />
        </div>
    );

    if (visibleTabs.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 text-center font-sans">
                <Lock className="text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any settings within the Referrals module.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
            <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
                
                {/* Delete Confirmation Modal */}
                {deleteConfirmId && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
                    <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center animate-in zoom-in-95 duration-200 border border-slate-200">
                      <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-rose-100">
                        <AlertTriangle className="text-rose-500" size={24} strokeWidth={2.5} />
                      </div>
                      <h3 className="text-[16px] font-semibold text-slate-800 mb-1 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Delete {currentUI.singularLabel || activeTab}?
                      </h3>
                      <p className="text-[12px] text-slate-500 mb-4 font-normal">Are you sure you want to delete this record? This action cannot be undone.</p>
                      <div className="flex gap-2 justify-center">
                         <button 
                           onClick={() => setDeleteConfirmId(null)} 
                           className="h-[26px] px-3 text-[11px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                         >
                           Cancel
                         </button>
                         <button 
                           onClick={confirmDelete} 
                           disabled={isPending} 
                           className="h-[26px] px-3.5 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-[5px] shadow-2xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                         >
                           {isPending ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>} Delete
                         </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Toast */}
                {showSuccessPopup && (
                  <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-xl animate-in zoom-in-95 duration-200 max-w-xs w-full mx-4 border border-slate-200">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={26} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-800 tracking-tight text-center" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        {successMessage}
                      </h2>
                    </div>
                  </div>
                )}

                {/* Add / Edit Form Modal */}
                {isFormOpen && (
                    <div className="fixed inset-0 z-[700] flex items-center justify-center p-3 bg-black/40 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-[10px] shadow-2xl border border-slate-200 flex flex-col w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150">
                            <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                                <h3 className="text-[15px] xl:text-[16px] font-semibold text-slate-800 flex items-center gap-2 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    {editingRef ? <Edit size={14} className="text-teal-600"/> : <Plus size={14} className="text-[#9575cd]"/>}
                                    {editingRef ? `Edit ${currentUI.singularLabel || activeTab}` : `Add New ${currentUI.singularLabel || activeTab}`}
                                </h3>
                                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                    <X size={16}/>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className={activeTab === 'Doctor' ? 'col-span-2' : 'col-span-3'}>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                            {currentUI.nameLabel} <span className="text-rose-500 ml-0.5">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})} 
                                            placeholder={currentUI.namePlaceholder || "Enter Name"} 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                            autoFocus 
                                        />
                                    </div>
                                    {activeTab === 'Doctor' && (
                                        <div className="col-span-1">
                                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Degree</label>
                                            <input 
                                                type="text" 
                                                value={formData.degree} 
                                                onChange={e => setFormData({...formData, degree: e.target.value})} 
                                                placeholder="MBBS, MD" 
                                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                            />
                                        </div>
                                    )}
                                </div>

                                {activeTab !== 'Doctor' && (
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                                            {activeTab === 'Hospital' ? 'Doctor / Incharge Name' : activeTab === 'Lab' ? 'Contact Person / Manager' : 'Center Incharge / Representative'}
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.contactPerson} 
                                            onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                                            placeholder={activeTab === 'Hospital' ? "e.g. Dr. Verma / Incharge" : activeTab === 'Lab' ? "e.g. Lab Manager" : "e.g. Center Manager"} 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Phone</label>
                                        <input 
                                            type="text" 
                                            value={formData.phone} 
                                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                                            placeholder="Mobile Number" 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white font-mono focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Email</label>
                                        <input 
                                            type="email" 
                                            value={formData.email} 
                                            onChange={e => setFormData({...formData, email: e.target.value})} 
                                            placeholder="Optional email" 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                </div>

                                {activeTab === 'Doctor' && (
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Hospital / Clinic</label>
                                        <input 
                                            type="text" 
                                            value={formData.hospital} 
                                            onChange={e => setFormData({...formData, hospital: e.target.value})} 
                                            placeholder="Associated Hospital or Clinic" 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                )}

                                {activeTab === 'Outsource' ? (
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Services / Specialized Tests</label>
                                        <input 
                                            type="text" 
                                            value={formData.specialization} 
                                            onChange={e => setFormData({...formData, specialization: e.target.value})} 
                                            placeholder="e.g. Histopathology, Genetics" 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">{currentUI.specLabel || 'Specialization'}</label>
                                            <input 
                                                type="text" 
                                                value={formData.specialization} 
                                                onChange={e => setFormData({...formData, specialization: e.target.value})} 
                                                placeholder={currentUI.specPlaceholder} 
                                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4 text-[#9575cd] gap-0.5">
                                                <Percent size={10}/> Commission %
                                            </label>
                                            <input 
                                                type="number" 
                                                value={formData.commission} 
                                                onChange={e => setFormData({...formData, commission: e.target.value})} 
                                                placeholder="e.g. 15" 
                                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-semibold border border-purple-300 bg-purple-50/20 rounded-[5px] px-2.5 focus:border-[#9575cd] outline-none text-slate-800" 
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">{currentUI.locLabel || 'Address'}</label>
                                    <input 
                                        type="text" 
                                        value={formData.clinicName} 
                                        onChange={e => setFormData({...formData, clinicName: e.target.value})} 
                                        placeholder={currentUI.locPlaceholder || "Full Address"} 
                                        className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                    />
                                </div>

                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                    <span className="text-[11px] font-medium text-slate-700">Account Status</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})} 
                                        className={`h-5 px-2.5 rounded-[4px] flex items-center justify-center text-[9px] font-bold uppercase transition-all shadow-2xs ${
                                            formData.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}
                                    >
                                        {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                                <button 
                                    onClick={() => setIsFormOpen(false)} 
                                    className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSubmit} 
                                    disabled={isPending} 
                                    className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                                >
                                    {isPending ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>}
                                    <span>Save</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    {/* Left: 20px Title in Calibri */}
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                            <HeartPulse size={16} />
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Referrals Directory
                        </h2>
                    </div>

                    {/* Right: Desktop Module Tabs (Doctors, Partner Labs, Hospitals, Outsourced Labs) */}
                    <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                        {visibleTabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => { 
                                    setActiveTab(tab.id); 
                                    setSearchQuery(''); 
                                    setActiveFilter('All'); 
                                    setIsFormOpen(false); 
                                    router.replace(`/referrals?tab=${tab.id.toLowerCase()}`, { scroll: false });
                                }}
                                className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                                    activeTab === tab.id ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Tabs Header */}
                <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
                    {visibleTabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { 
                                setActiveTab(tab.id); 
                                setSearchQuery(''); 
                                setActiveFilter('All'); 
                                setIsFormOpen(false); 
                                router.replace(`/referrals?tab=${tab.id.toLowerCase()}`, { scroll: false });
                            }}
                            className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                                activeTab === tab.id ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
                <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shrink-0">
                            <ActiveIcon size={14} />
                        </div>
                        <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 shrink-0" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            {currentUI.title}
                        </h3>

                        {/* Status Filter Toggle Pills */}
                        <div className="h-[22px] xl:h-[24px] flex items-center bg-slate-100 rounded p-0.5 gap-0.5 border border-slate-200 shrink-0 text-[10px] xl:text-[11px]">
                            {(['All', 'Active', 'Inactive'] as const).map(filter => (
                                <button 
                                    key={filter} 
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-2 py-0.5 rounded text-[10px] xl:text-[11px] transition-all whitespace-nowrap ${
                                        activeFilter === filter 
                                            ? 'bg-white shadow-2xs text-[#9575cd] font-semibold' 
                                            : 'text-slate-600 hover:text-slate-900 font-medium'
                                    }`}
                                >
                                    {filter} <span className="opacity-75 font-normal">({filter === 'All' ? stats.total : filter === 'Active' ? stats.active : stats.inactive})</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input 
                                type="text" 
                                placeholder={currentUI.searchPlaceholder || `Search ${activeTab.toLowerCase()}s...`}
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="h-[24px] xl:h-[26px] w-36 sm:w-48 pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
                            />
                        </div>

                        {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Add') && (
                            <button 
                                onClick={handleOpenAdd}
                                className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                <Plus size={13} strokeWidth={2.5}/> Add {activeTab === 'Outsource' ? 'Center' : activeTab}
                            </button>
                        )}
                    </div>
                </div>

                {/* DESKTOP CONTENT AREA - TABLE AS SEPARATE BLOCK (matching Patient List & Result Entry) */}
                <div className="hidden md:flex flex-1 overflow-hidden bg-[#f8fafc] p-0 md:p-2.5 xl:p-3 flex-col min-h-0">
                    <div className="w-full h-full flex flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white">
                        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
                            {isLoading ? (
                                <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                    <MusicBarLoader text={`Loading ${currentUI.title}...`} />
                                </div>
                            ) : filteredReferrals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                    <p className="text-[11px] font-normal">No {activeTab === 'Outsource' ? 'outsourced centers' : activeTab.toLowerCase() + 's'} found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse border-spacing-0">
                                    <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                        <tr>
                                            <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                                                {currentUI.nameLabel}
                                            </th>
                                            {activeTab === 'Doctor' && (
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Specialization</th>
                                            )}
                                            {activeTab === 'Doctor' && (
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Hospital / Clinic</th>
                                            )}
                                            {activeTab === 'Hospital' && (
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Doctor Name</th>
                                            )}
                                            {activeTab === 'Lab' && (
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Contact Person</th>
                                            )}
                                            {(activeTab === 'Hospital' || activeTab === 'Lab' || activeTab === 'Outsource') && (
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Address</th>
                                            )}
                                            <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Contact Info</th>
                                            {activeTab !== 'Outsource' && (
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Comm. %</th>
                                            )}
                                            <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                                            <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedDesktopReferrals.map((ref: any) => (
                                            <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-medium text-slate-800 text-[11px] xl:text-[12px]">{ref.name}</span>
                                                        {activeTab === 'Doctor' && ref.degree && (
                                                            <span className="text-[9px] font-medium text-[#9575cd] bg-purple-50 px-1 py-0.2 rounded border border-purple-200 uppercase tracking-tight">
                                                                {ref.degree}
                                                            </span>
                                                        )}
                                                        {(activeTab === 'Hospital' || activeTab === 'Lab') && ref.specialization && (
                                                            <span className="text-[10px] text-slate-500 font-normal">
                                                                ({ref.specialization})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {activeTab === 'Doctor' && (
                                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] xl:text-[12px] font-normal text-slate-700">
                                                        {ref.specialization || '-'}
                                                    </td>
                                                )}
                                                {activeTab === 'Doctor' && (
                                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] xl:text-[12px] font-normal text-slate-700">
                                                        {ref.hospital || ref.clinicName || '-'}
                                                    </td>
                                                )}
                                                {(activeTab === 'Hospital' || activeTab === 'Lab') && (
                                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] xl:text-[12px] font-normal text-slate-700">
                                                        {ref.contactPerson || '-'}
                                                    </td>
                                                )}
                                                {(activeTab === 'Hospital' || activeTab === 'Lab' || activeTab === 'Outsource') && (
                                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] xl:text-[12px] font-normal text-slate-700 max-w-xs truncate">
                                                        {ref.clinicName || '-'}
                                                    </td>
                                                )}

                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                    <div className="flex flex-col gap-0.5 text-[11px] text-slate-600 font-normal">
                                                        {ref.phone && <span className="flex items-center gap-1 font-mono text-[11px]"><Phone size={10} className="text-slate-400"/> {ref.phone}</span>}
                                                        {ref.email && <span className="text-slate-400 text-[10px] truncate max-w-[150px]">{ref.email}</span>}
                                                        {!ref.phone && !ref.email && <span className="text-slate-300">-</span>}
                                                    </div>
                                                </td>

                                                {activeTab !== 'Outsource' && (
                                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                        {ref.commission ? (
                                                            <span className="text-[10px] font-semibold text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                                {ref.commission}%
                                                            </span>
                                                        ) : <span className="text-slate-300">-</span>}
                                                    </td>
                                                )}

                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                    <button 
                                                        onClick={() => handleToggleStatus(ref.id, ref.isActive)} 
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all shadow-2xs ${
                                                            ref.isActive 
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                        }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${ref.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                        {ref.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>

                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Edit') ? (
                                                            <button 
                                                                onClick={() => handleOpenEdit(ref)} 
                                                                className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 shadow-2xs text-teal-600 hover:bg-teal-50 flex items-center justify-center"
                                                                title={`Edit ${activeTab}`}
                                                            >
                                                                <Edit size={14} strokeWidth={2}/>
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                        {canPerform(tabsDef.find(t => t.id === activeTab)?.screen!, 'Delete') ? (
                                                            <button 
                                                                onClick={() => handleDeleteClick(ref.id)} 
                                                                className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 shadow-2xs text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                                                                title={`Delete ${activeTab}`}
                                                            >
                                                                <Trash2 size={14} strokeWidth={2}/>
                                                            </button>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Desktop Pagination Footer inside the Table Block */}
                        <div className="bg-[#f8fafc] border-t border-slate-200 px-2.5 xl:px-3 min-h-[30px] h-[30px] xl:min-h-[34px] xl:h-[34px] flex items-center justify-between shrink-0 text-[11px] text-slate-500 font-normal">
                            <span>
                                Showing <strong className="font-medium text-slate-700">{filteredReferrals.length === 0 ? 0 : desktopStartIndex + 1}</strong> to <strong className="font-medium text-slate-700">{Math.min(desktopStartIndex + DESKTOP_ITEMS_PER_PAGE, filteredReferrals.length)}</strong> of <strong className="font-medium text-slate-700">{filteredReferrals.length}</strong> entries
                            </span>
                            {desktopTotalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => setDesktopCurrentPage(p => Math.max(1, p - 1))} 
                                        disabled={desktopCurrentPage === 1 || isLoading}
                                        className="h-[22px] w-[22px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                    >
                                        <ChevronLeft size={13}/>
                                    </button>
                                    <span className="text-[11px] font-medium text-slate-700 px-1">Page {desktopCurrentPage} of {desktopTotalPages}</span>
                                    <button 
                                        onClick={() => setDesktopCurrentPage(p => Math.min(desktopTotalPages, p + 1))} 
                                        disabled={desktopCurrentPage >= desktopTotalPages || isLoading}
                                        className="h-[22px] w-[22px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                    >
                                        <ChevronRight size={13}/>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MOBILE VIEWPORT */}
                <div className="flex md:hidden flex-col flex-1 w-full h-full bg-[#f8fafc] p-2 overflow-hidden">
                    <div className="w-full h-full bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                        
                        {/* Mobile Top Header: Search & Status Dropdown */}
                        <div className="p-2 flex items-center gap-1.5 shrink-0 bg-white border-b border-slate-100">
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

                            {/* Status Filter Dropdown */}
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
                                            {(['All', 'Active', 'Inactive'] as const).map(item => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveFilter(item);
                                                        setShowStatusDropdown(false);
                                                    }}
                                                    className={`w-full px-2.5 py-1 text-left text-[9.5px] font-bold flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                                        activeFilter === item ? 'text-[#9575cd] bg-purple-50/50' : 'text-slate-600'
                                                    }`}
                                                >
                                                    <span>{item}</span>
                                                    <span className={`text-[8.5px] ${activeFilter === item ? 'text-[#9575cd]' : 'text-slate-400'}`}>
                                                        {item === 'All' ? stats.total : item === 'Active' ? stats.active : stats.inactive}
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
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className={`w-5 h-5 rounded-full ${currentUI.iconBg} flex items-center justify-center shrink-0`}>
                                                    <ActiveIcon size={11} />
                                                </div>
                                                <span className="font-bold text-[10.5px] text-slate-800 truncate leading-tight">{ref.name}</span>
                                                
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
                                                        ? 'bg-emerald-600 text-white' 
                                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                }`}
                                            >
                                                {ref.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-500 flex-wrap">
                                            <div className="flex items-center gap-2 flex-wrap">
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

                                                {activeTab !== 'Doctor' && ref.contactPerson && (
                                                    <span className="flex items-center gap-0.5 text-slate-600 font-medium truncate max-w-[130px]">
                                                        <User size={9} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">{ref.contactPerson}</span>
                                                    </span>
                                                )}

                                                {activeTab !== 'Doctor' && ref.clinicName && (
                                                    <span className="flex items-center gap-0.5 text-slate-500 truncate max-w-[140px]">
                                                        <MapPin size={9} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">{ref.clinicName}</span>
                                                    </span>
                                                )}

                                                {ref.phone && (
                                                    <span className="flex items-center gap-0.5 text-slate-600 font-mono">
                                                        <Phone size={9} className="text-slate-400 shrink-0" />
                                                        {ref.phone}
                                                    </span>
                                                )}

                                                {activeTab === 'Outsource' && !ref.phone && ref.email && (
                                                    <span className="flex items-center gap-0.5 text-slate-500 truncate max-w-[120px]">
                                                        <Mail size={9} className="text-slate-400 shrink-0" />
                                                        <span className="truncate">{ref.email}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {activeTab !== 'Outsource' && ref.commission ? (
                                                <span className="text-[8px] font-bold text-[#9575cd] bg-purple-50 px-1 py-0.2 rounded border border-purple-200 shrink-0 flex items-center gap-0.5">
                                                    <Percent size={8}/> {ref.commission}%
                                                </span>
                                            ) : null}
                                        </div>

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
                                                    className="h-5 px-1.5 bg-slate-50 hover:bg-teal-50 text-teal-600 rounded text-[8px] font-bold flex items-center gap-0.5 border border-slate-200 hover:border-teal-200 active:scale-95 transition-all"
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

                        {/* Mobile Footer */}
                        <footer className="shrink-0 bg-white p-2 z-[50] pb-safe border-t border-slate-100">
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
        </div>
    );
}

export default function ReferralsPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-white font-sans">
                <MusicBarLoader text="Loading Referrals..." />
            </div>
        }>
            <ReferralsContent />
        </Suspense>
    );
}
// --- BLOCK app/referrals/page.tsx CLOSE ---