"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Database, Plus, Search, Edit, Trash2, Droplet, Box, FlaskConical, Scale, Calculator, List, X, Save, Loader2, AlertTriangle, CheckCircle, Lock, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getMasterData, saveMasterData, deleteMasterData, toggleMasterStatus, generateMasterCode } from '@/app/actions/masters';
import { useSession } from "next-auth/react"; 
import { getUserPermissions } from '@/app/actions/authorizations';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 

type MasterTab = 'specimen' | 'vacutainer' | 'method' | 'uom' | 'operator' | 'multivalue';

export default function MastersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const { data: session } = useSession();
  const orgId = (session?.user as any)?.orgId; 
  const [permissions, setPermissions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [permsLoaded, setPermsLoaded] = useState(false);

  const getInitialTab = (): MasterTab => {
    if (tabParam) {
      const lower = tabParam.toLowerCase();
      if (['specimen', 'vacutainer', 'method', 'uom', 'operator', 'multivalue'].includes(lower)) return lower as MasterTab;
      if (lower === 'multivalues') return 'multivalue';
      if (lower === 'vacutainers') return 'vacutainer';
    }
    return 'specimen';
  };

  const [activeTab, setActiveTab] = useState<MasterTab>(getInitialTab);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dataList, setDataList] = useState<any[]>([]);
  const [vacutainerList, setVacutainerList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination states
  const [desktopCurrentPage, setDesktopCurrentPage] = useState(1);
  const DESKTOP_ITEMS_PER_PAGE = 20;

  // Mobile specific states
  const [mobileStatusFilter, setMobileStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const MOBILE_ITEMS_PER_PAGE = 10;

  useEffect(() => {
      const fetchPerms = async () => {
          if (session?.user) {
              const userId = (session.user as any).id;
              if (userId) {
                  const res = await getUserPermissions(parseInt(userId));
                  if (res.success) {
                      setPermissions(res.data || []);
                      setUserRole(res.roleName || '');
                  }
              }
          }
          setPermsLoaded(true);
      };
      fetchPerms();
  }, [session]);

  const canSee = (screenName: string) => {
      if (orgId === 1) return true;
      if (!permsLoaded) return false;
      if (permissions.length === 0) return true; 
      return permissions.some(p => p.module === screenName && p.action === 'Access');
  };

  const canPerform = (action: string) => {
      if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
      if (permissions.length === 0) return true; 
      const activeScreen = tabs.find(t => t.id === safeActiveTab)?.screen;
      return permissions.some(p => p.module === activeScreen && p.action === action);
  };

  const tabs = [
      { id: 'specimen', label: 'Specimen', icon: <Droplet size={14}/>, screen: 'Specimen' },
      { id: 'vacutainer', label: 'Vacutainer', icon: <Box size={14}/>, screen: 'Vacutainers' },
      { id: 'method', label: 'Method', icon: <FlaskConical size={14}/>, screen: 'Method' },
      { id: 'uom', label: 'UOM', icon: <Scale size={14}/>, screen: 'UOM' },
      { id: 'operator', label: 'Operator', icon: <Calculator size={14}/>, screen: 'Operator' },
      { id: 'multivalue', label: 'Multivalues', icon: <List size={14}/>, screen: 'Multivalues' },
  ];

  const visibleTabs = tabs.filter(t => canSee(t.screen));
  const safeActiveTab = visibleTabs.find(t => t.id === activeTab) ? activeTab : (visibleTabs[0]?.id as MasterTab | null);

  useEffect(() => {
      if (!permsLoaded || visibleTabs.length === 0) return;
      if (tabParam) {
          const lower = tabParam.toLowerCase();
          let targetId: MasterTab | null = null;
          if (['specimen', 'vacutainer', 'method', 'uom', 'operator', 'multivalue'].includes(lower)) {
              targetId = lower as MasterTab;
          } else if (lower === 'multivalues') {
              targetId = 'multivalue';
          } else if (lower === 'vacutainers') {
              targetId = 'vacutainer';
          }
          if (targetId && visibleTabs.some(t => t.id === targetId)) {
              if (activeTab !== targetId) {
                  setActiveTab(targetId);
                  setSearchTerm('');
              }
              return;
          }
      }
      if (safeActiveTab && safeActiveTab !== activeTab) {
          setActiveTab(safeActiveTab);
          setSearchTerm('');
      }
  }, [tabParam, permsLoaded, safeActiveTab, activeTab, visibleTabs]);

  useEffect(() => {
      if (permsLoaded && safeActiveTab) {
          loadData(safeActiveTab);
          setDesktopCurrentPage(1);
          setMobileCurrentPage(1);
      }
  }, [safeActiveTab, permsLoaded]);

  // Reset pagination on search change
  useEffect(() => {
    setDesktopCurrentPage(1);
    setMobileCurrentPage(1);
  }, [searchTerm, mobileStatusFilter]);

  const loadData = async (tabToLoad: MasterTab) => {
    setIsLoading(true);
    const res = await getMasterData(tabToLoad);
    if (res.success) setDataList(res.data);

    if (tabToLoad === 'specimen') {
        const vRes = await getMasterData('vacutainer');
        if (vRes.success) setVacutainerList(vRes.data);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    setEditingId(null);
    const autoCode = await generateMasterCode(safeActiveTab!);

    setFormData({ 
      name: '', code: autoCode, isActive: true, color: '#000000', 
      type: '', container: '', symbol: '', values: '' 
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ ...item }); 
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("Name is required");

    startTransition(async () => {
      const res = await saveMasterData(safeActiveTab!, { ...formData, id: editingId });
      if (res.success) {
        setIsModalOpen(false);
        setSuccessMessage(editingId ? "Updated Successfully!" : "Created Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => { setShowSuccessPopup(false); loadData(safeActiveTab!); }, 1500);
      } else alert(res.message || "Failed to save");
    });
  };

  const handleDeleteClick = (id: number) => setDeleteConfirmId(id);

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    startTransition(async () => {
      await deleteMasterData(safeActiveTab!, deleteConfirmId);
      setDeleteConfirmId(null);
      setSuccessMessage("Deleted Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => { setShowSuccessPopup(false); loadData(safeActiveTab!); }, 1500);
    });
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setDataList(prev => prev.map(item => item.id === id ? { ...item, isActive: newStatus } : item));
    
    startTransition(async () => {
      await toggleMasterStatus(safeActiveTab!, id, newStatus);
      setSuccessMessage(newStatus ? "Enabled Successfully!" : "Disabled Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 1500);
    });
  };

  const filteredList = useMemo(() => {
    return dataList.filter((item: any) => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [dataList, searchTerm]);

  // Desktop Pagination
  const desktopTotalPages = Math.ceil(filteredList.length / DESKTOP_ITEMS_PER_PAGE) || 1;
  const desktopStartIndex = (desktopCurrentPage - 1) * DESKTOP_ITEMS_PER_PAGE;
  const paginatedDesktopList = filteredList.slice(desktopStartIndex, desktopStartIndex + DESKTOP_ITEMS_PER_PAGE);

  // Mobile filtered list (with active/inactive filter)
  const mobileFilteredList = useMemo(() => {
    return filteredList.filter((item: any) => {
      if (mobileStatusFilter === 'Active') return item.isActive;
      if (mobileStatusFilter === 'Inactive') return !item.isActive;
      return true;
    });
  }, [filteredList, mobileStatusFilter]);

  const mobileTotalPages = Math.ceil(mobileFilteredList.length / MOBILE_ITEMS_PER_PAGE) || 1;
  const mobileStartIndex = (mobileCurrentPage - 1) * MOBILE_ITEMS_PER_PAGE;
  const paginatedMobileList = mobileFilteredList.slice(mobileStartIndex, mobileStartIndex + MOBILE_ITEMS_PER_PAGE);

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
              <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any records within the Masters module.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
      <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">

        {/* --- ADD / EDIT MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-3">
            <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                <h3 className="text-[15px] xl:text-[16px] font-semibold text-slate-800 flex items-center gap-2 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                  {editingId ? 'Edit' : 'Add New'} {tabs.find(t => t.id === safeActiveTab)?.label}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-3.5 space-y-3">
                 <div>
                   <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Name *</label>
                   <input 
                     type="text" 
                     value={formData.name} 
                     onChange={(e) => setFormData({...formData, name: e.target.value})} 
                     className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                     placeholder="Enter Name" 
                     autoFocus
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Code (Auto)</label>
                   <input 
                     type="text" 
                     value={formData.code} 
                     readOnly 
                     className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-200 rounded-[5px] px-2.5 bg-slate-100 text-slate-500 cursor-not-allowed font-mono outline-none"
                   />
                 </div>

                 {safeActiveTab === 'specimen' && (
                   <>
                     <div>
                       <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Type</label>
                       <input 
                         type="text" 
                         value={formData.type || ''} 
                         onChange={(e) => setFormData({...formData, type: e.target.value})} 
                         className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                         placeholder="e.g. Whole Blood"
                       />
                     </div>
                     <div>
                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Default Container</label>
                        <select 
                          value={formData.container || ''} 
                          onChange={(e) => setFormData({...formData, container: e.target.value})} 
                          className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd] cursor-pointer"
                        >
                          <option value="">-- Select Vacutainer --</option>
                          {vacutainerList.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
                        </select>
                     </div>
                   </>
                 )}

                 {safeActiveTab === 'vacutainer' && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Cap Color</label>
                      <div className="flex items-center gap-2 h-[26px] xl:h-[28px] border border-slate-300 rounded-[5px] px-2 bg-white">
                        <input 
                          type="color" 
                          value={formData.color || '#000000'} 
                          onChange={(e) => setFormData({...formData, color: e.target.value})} 
                          className="w-6 h-5 cursor-pointer border-none bg-transparent p-0"
                        />
                        <span className="text-[11px] font-mono text-slate-600">{formData.color}</span>
                      </div>
                    </div>
                 )}

                 {safeActiveTab === 'operator' && (
                   <div>
                     <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Symbol</label>
                     <input 
                       type="text" 
                       value={formData.symbol || ''} 
                       onChange={(e) => setFormData({...formData, symbol: e.target.value})} 
                       className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 font-mono outline-none focus:border-[#9575cd] bg-white" 
                       placeholder="e.g. <, >, ="
                     />
                   </div>
                 )}

                 {safeActiveTab === 'multivalue' && (
                   <div>
                     <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Values (Comma Separated)</label>
                     <textarea 
                       value={formData.values || ''} 
                       onChange={(e) => setFormData({...formData, values: e.target.value})} 
                       className="w-full h-16 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] p-2 resize-none focus:border-[#9575cd] outline-none bg-white" 
                       placeholder="Option 1, Option 2, Option 3..."
                     />
                   </div>
                 )}

                 <div className="pt-2 flex justify-end gap-2">
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave} 
                      disabled={isPending} 
                      className="h-[24px] xl:h-[26px] px-3.5 text-[11px] xl:text-[12px] font-medium text-white rounded-[5px] shadow-2xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                    >
                      {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} {editingId ? 'Update' : 'Save'}
                    </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-rose-100">
                <AlertTriangle className="text-rose-500" size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-800 mb-1 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>Delete Record?</h3>
              <p className="text-[12px] text-slate-500 mb-4">Are you sure you want to delete this master record? This action cannot be undone.</p>
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

        {/* --- SUCCESS POPUP --- */}
        {showSuccessPopup && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-xl animate-in zoom-in-95 duration-200 max-w-xs w-full mx-4 border border-slate-200">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-100">
                <CheckCircle className="text-emerald-500" size={26} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight text-center" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>{successMessage}</h2>
              {formData.name && <p className="text-slate-500 text-[11px] mt-1 text-center font-normal truncate max-w-full">{formData.name}</p>}
            </div>
          </div>
        )}

        {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
            {/* Left: 20px Title in Calibri */}
            <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                    <Database size={16} />
                </div>
                <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    Lab Masters
                </h2>
            </div>

            {/* Right: Module Tabs (Specimen, Vacutainer, Method, UOM, Operator, Multivalues) */}
            <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                {visibleTabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as MasterTab);
                            setSearchTerm('');
                            router.replace(`/masters?tab=${tab.id}`, { scroll: false });
                        }}
                        className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                            safeActiveTab === tab.id ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
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
                        setActiveTab(tab.id as MasterTab);
                        setSearchTerm('');
                        router.replace(`/masters?tab=${tab.id}`, { scroll: false });
                    }}
                    className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                        safeActiveTab === tab.id ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
                    }`}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>

        {/* Sub-header Toolbar flush under header (rounded-none) */}
        <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-purple-50 text-[#9575cd]">
                    {tabs.find(t => t.id === safeActiveTab)?.icon}
                </div>
                <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    {tabs.find(t => t.id === safeActiveTab)?.label} Master
                </h3>
                <span className="text-[10px] text-slate-500 font-normal bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                    Total: {filteredList.length}
                </span>
            </div>

            <div className="flex items-center gap-1.5">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                    <input 
                        type="text" 
                        placeholder={`Search ${tabs.find(t => t.id === safeActiveTab)?.label || 'master'}...`}
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="h-[24px] xl:h-[26px] w-36 sm:w-48 pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
                    />
                </div>

                {canPerform('Add') && (
                    <button 
                        onClick={handleAdd}
                        className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                    >
                        <Plus size={13} strokeWidth={2.5}/> Add New
                    </button>
                )}
            </div>
        </div>

        {/* Content Area - TABLE AS SEPARATE BLOCK (matching Patient List & Result Entry) */}
        <div className="hidden md:flex flex-1 overflow-hidden bg-[#f8fafc] p-0 md:p-2.5 xl:p-3 flex-col min-h-0">
          <div className="w-full h-full flex flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white">
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
               {isLoading ? (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                      <MusicBarLoader text={`Loading ${tabs.find(t => t.id === safeActiveTab)?.label || 'Masters'}...`} />
                  </div>
               ) : filteredList.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                       <p className="text-[11px] font-normal">No records found.</p>
                   </div>
               ) : (
                   <table className="w-full text-left border-collapse border-spacing-0">
                       <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                           <tr>
                               <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Code</th>
                               
                               {safeActiveTab === 'vacutainer' && (
                                   <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Cap Color</th>
                               )}
                               {safeActiveTab === 'operator' && (
                                   <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Symbol</th>
                               )}

                               <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                                   {safeActiveTab === 'uom' ? 'Unit Name' : 'Name'}
                               </th>

                               {safeActiveTab === 'specimen' && (
                                   <>
                                       <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Default Container</th>
                                       <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-32" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Type</th>
                                   </>
                               )}

                               {safeActiveTab === 'multivalue' && (
                                   <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Predefined Values</th>
                               )}

                               <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                               <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Action</th>
                           </tr>
                       </thead>
                       <tbody>
                           {paginatedDesktopList.map((item: any) => (
                               <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                   <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-mono text-slate-500 font-normal">
                                       {item.code}
                                   </td>

                                   {safeActiveTab === 'vacutainer' && (
                                       <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                           <div className="flex items-center justify-center gap-1.5">
                                               <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs inline-block" style={{ backgroundColor: item.color || '#94a3b8' }} />
                                               <span className="font-mono text-[10px] text-slate-500">{item.color}</span>
                                           </div>
                                       </td>
                                   )}

                                   {safeActiveTab === 'operator' && (
                                       <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                           <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                               {item.symbol || '-'}
                                           </span>
                                       </td>
                                   )}

                                   <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-700">
                                       {item.name}
                                   </td>

                                   {safeActiveTab === 'specimen' && (
                                       <>
                                           <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-600">
                                               {item.container || '-'}
                                           </td>
                                           <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-500">
                                               {item.type || '-'}
                                           </td>
                                       </>
                                   )}

                                   {safeActiveTab === 'multivalue' && (
                                       <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-600 truncate max-w-xs" title={item.values}>
                                           {item.values || '-'}
                                       </td>
                                   )}

                                   <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                       {canPerform('Edit') ? (
                                           <button 
                                               onClick={() => handleToggleStatus(item.id, item.isActive)} 
                                               disabled={isPending} 
                                               className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${item.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                               title={item.isActive ? 'Active (Click to disable)' : 'Inactive (Click to enable)'}
                                           >
                                               <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-[11px]' : 'translate-x-[2px]'}`} />
                                           </button>
                                       ) : (
                                           <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                               {item.isActive ? 'Active' : 'Inactive'}
                                           </span>
                                       )}
                                   </td>

                                   <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                       <div className="flex items-center justify-center gap-1">
                                           {canPerform('Edit') ? (
                                               <button 
                                                   onClick={() => handleEdit(item)} 
                                                   disabled={isPending} 
                                                   className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 shadow-2xs text-teal-600 hover:bg-teal-50 flex items-center justify-center"
                                                   title="Edit Record"
                                               >
                                                   <Edit size={14} strokeWidth={2}/>
                                               </button>
                                           ) : (
                                               <span className="text-slate-300">-</span>
                                           )}
                                           {canPerform('Delete') ? (
                                               <button 
                                                   onClick={() => handleDeleteClick(item.id)} 
                                                   disabled={isPending} 
                                                   className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 shadow-2xs text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                                                   title="Delete Record"
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
                    Showing <strong className="font-medium text-slate-700">{filteredList.length === 0 ? 0 : desktopStartIndex + 1}</strong> to <strong className="font-medium text-slate-700">{Math.min(desktopStartIndex + DESKTOP_ITEMS_PER_PAGE, filteredList.length)}</strong> of <strong className="font-medium text-slate-700">{filteredList.length}</strong> entries
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

        {/* --- MOBILE CARDS LIST --- */}
        <div className="flex md:hidden flex-col flex-1 w-full h-full bg-white overflow-hidden relative">
          <div className="flex-1 overflow-y-auto w-full px-2 py-2 bg-slate-50/50 flex flex-col gap-2 pb-16 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <MusicBarLoader text={`Loading ${tabs.find(t => t.id === safeActiveTab)?.label || 'Master'}...`} />
              </div>
            ) : mobileFilteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-1.5">
                <Database size={32} className="opacity-25 mb-1" />
                <p className="text-[11px] font-medium text-slate-600">No {tabs.find(t => t.id === safeActiveTab)?.label || 'records'} found.</p>
                <p className="text-[9.5px] text-slate-400 text-center max-w-[200px]">Tap "+ Add New" to create a new record.</p>
              </div>
            ) : (
              paginatedMobileList.map((item: any) => (
                <div key={item.id} className="bg-white rounded-[6px] border border-slate-200 shadow-2xs p-2.5 flex flex-col gap-1.5 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8.5px] font-semibold shrink-0">
                      {item.code}
                    </span>
                  </div>

                  {safeActiveTab === 'specimen' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 flex-wrap">
                      {item.container ? (
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-600 font-medium">
                          <Box size={10} className="text-[#9575cd]" />
                          <span>Container:</span>
                          <strong className="text-slate-700">{item.container}</strong>
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 italic bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">No container</span>
                      )}
                      {item.type && (
                        <span className="text-[9px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                          Type: <strong className="text-slate-700">{item.type}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {safeActiveTab === 'vacutainer' && (
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-600 font-medium">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0" style={{ backgroundColor: item.color || '#94a3b8' }} />
                        <span>Cap Color:</span>
                        <strong className="font-mono text-[9px] text-slate-700">{item.color || 'None'}</strong>
                      </span>
                    </div>
                  )}

                  {safeActiveTab === 'method' && (
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded text-[8.5px] font-bold flex items-center gap-1">
                        <FlaskConical size={9} /> Lab Method
                      </span>
                    </div>
                  )}

                  {safeActiveTab === 'uom' && (
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[8.5px] font-bold flex items-center gap-1">
                        <Scale size={9} /> Unit of Measure
                      </span>
                    </div>
                  )}

                  {safeActiveTab === 'operator' && (
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[10px] px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        Symbol: <span className="text-[#9575cd] font-black">{item.symbol || '-'}</span>
                      </span>
                    </div>
                  )}

                  {safeActiveTab === 'multivalue' && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                      <div className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[9px] text-slate-600 truncate min-w-0 flex-1">
                        <span className="text-slate-400 font-semibold mr-1">Values:</span>
                        <span className="text-slate-700">{item.values || 'No predefined values'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {canPerform('Edit') ? (
                        <button 
                          onClick={() => handleToggleStatus(item.id, item.isActive)} 
                          disabled={isPending} 
                          className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${item.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-[11px]' : 'translate-x-[2px]'}`} />
                        </button>
                      ) : (
                        <Lock size={11} className="text-slate-300" />
                      )}
                      <span className="text-[8.5px] font-medium text-slate-500">{item.isActive ? 'Active' : 'Inactive'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {canPerform('Edit') && (
                        <button 
                          onClick={() => handleEdit(item)} 
                          disabled={isPending} 
                          className="text-teal-600 flex items-center gap-0.5 text-[9px] font-bold active:opacity-70"
                        >
                          <Edit size={10} /> Edit
                        </button>
                      )}
                      {canPerform('Delete') && (
                        <button 
                          onClick={() => handleDeleteClick(item.id)} 
                          disabled={isPending} 
                          className="text-rose-600 flex items-center gap-0.5 text-[9px] font-bold active:opacity-70"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Footer Toolbar */}
          <div className="shrink-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between border-t border-slate-100 shadow-sm">
            <button 
              onClick={() => window.history.back()} 
              className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all"
            >
              <ChevronLeft size={12} className="mr-0.5" /> Back
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <button 
                onClick={() => setMobileCurrentPage(p => Math.max(1, p - 1))} 
                disabled={mobileCurrentPage === 1}
                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft size={11} />
              </button>
              <span className="text-[9.5px] font-bold text-slate-700 min-w-[34px] text-center select-none">
                {mobileCurrentPage} / {mobileTotalPages || 1}
              </span>
              <button 
                onClick={() => setMobileCurrentPage(p => Math.min(mobileTotalPages, p + 1))} 
                disabled={mobileCurrentPage === mobileTotalPages || mobileTotalPages === 0}
                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all shadow-2xs"
                title="Next Page"
              >
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[9px] rounded shrink-0">
              {mobileFilteredList.length === 0 ? '0 of 0' : `${mobileStartIndex + 1}-${Math.min(mobileStartIndex + MOBILE_ITEMS_PER_PAGE, mobileFilteredList.length)} of ${mobileFilteredList.length}`}
            </div>
          </div>
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
