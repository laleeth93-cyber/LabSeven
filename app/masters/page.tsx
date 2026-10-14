// --- BLOCK app/masters/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Database, Plus, Search, Edit, Trash2, Droplet, Box, FlaskConical, Scale, Calculator, List, X, Save, Loader2, AlertTriangle, CheckCircle, Lock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Mobile specific states
  const [mobileStatusFilter, setMobileStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  // 🚨 UPDATED SCREEN NAMES TO MATCH PERMISSIONS MATRIX
  const tabs = [
      { id: 'specimen', label: 'Specimen', icon: <Droplet size={16}/>, screen: 'Specimen' },
      { id: 'vacutainer', label: 'Vacutainer', icon: <Box size={16}/>, screen: 'Vacutainers' },
      { id: 'method', label: 'Method', icon: <FlaskConical size={16}/>, screen: 'Method' },
      { id: 'uom', label: 'UOM', icon: <Scale size={16}/>, screen: 'UOM' },
      { id: 'operator', label: 'Operator', icon: <Calculator size={16}/>, screen: 'Operator' },
      { id: 'multivalue', label: 'Multivalues', icon: <List size={16}/>, screen: 'Multivalues' },
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
      if (permsLoaded && safeActiveTab) loadData(safeActiveTab);
  }, [safeActiveTab, permsLoaded]);

  // Reset mobile page when tab, search, or status filter changes
  useEffect(() => {
    setMobileCurrentPage(1);
  }, [safeActiveTab, searchTerm, mobileStatusFilter]);

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

  const filteredList = dataList.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Mobile filtered list (with active/inactive filter)
  const mobileFilteredList = useMemo(() => {
    return filteredList.filter((item: any) => {
      if (mobileStatusFilter === 'Active') return item.isActive;
      if (mobileStatusFilter === 'Inactive') return !item.isActive;
      return true;
    });
  }, [filteredList, mobileStatusFilter]);

  const mobileTotalPages = Math.ceil(mobileFilteredList.length / ITEMS_PER_PAGE) || 1;
  const mobileStartIndex = (mobileCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMobileList = mobileFilteredList.slice(mobileStartIndex, mobileStartIndex + ITEMS_PER_PAGE);

  if (!permsLoaded) return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
          <MusicBarLoader text="Authenticating..." />
      </div>
  );

  if (visibleTabs.length === 0) {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <Lock className="text-slate-300 mb-4" size={48} />
              <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
              <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any records within the Masters module.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-0 md:p-6 font-sans relative overflow-hidden">
      
      {/* --- ADD / EDIT MODAL (RESPONSIVE) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[92%] sm:max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs md:text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                {editingId ? 'Edit' : 'Add New'} {tabs.find(t => t.id === safeActiveTab)?.label}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1"><X size={16} /></button>
            </div>
            
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
               <div>
                 <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Name</label>
                 <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full text-xs md:text-sm border border-slate-300 rounded px-2.5 py-1.5 md:px-3 md:py-2 outline-none focus:border-[#9575cd]" placeholder="Enter Name" autoFocus/>
               </div>
               <div>
                 <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Code (Auto)</label>
                 <input type="text" value={formData.code} readOnly className="w-full text-xs md:text-sm border border-slate-200 rounded px-2.5 py-1.5 md:px-3 md:py-2 outline-none bg-slate-100 text-slate-500 cursor-not-allowed font-mono"/>
               </div>

               {safeActiveTab === 'specimen' && (
                 <>
                   <div>
                     <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Type</label>
                     <input type="text" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full text-xs md:text-sm border border-slate-300 rounded px-2.5 py-1.5 md:px-3 md:py-2 outline-none focus:border-[#9575cd]" placeholder="e.g. Whole Blood"/>
                   </div>
                   <div>
                      <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Default Container</label>
                      <select value={formData.container || ''} onChange={(e) => setFormData({...formData, container: e.target.value})} className="w-full text-xs md:text-sm border border-slate-300 rounded px-2.5 py-1.5 md:px-3 md:py-2 outline-none focus:border-[#9575cd]">
                        <option value="">-- Select Vacutainer --</option>
                        {vacutainerList.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
                      </select>
                   </div>
                 </>
               )}

               {safeActiveTab === 'vacutainer' && (
                  <div>
                    <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Cap Color</label>
                    <div className="flex items-center gap-2 h-[34px] md:h-[38px] border border-slate-300 rounded px-2">
                      <input type="color" value={formData.color || '#000000'} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-7 h-5 md:w-8 md:h-6 cursor-pointer border-none bg-transparent p-0"/>
                      <span className="text-xs text-slate-500 font-mono">{formData.color}</span>
                    </div>
                  </div>
               )}

               {safeActiveTab === 'operator' && (
                 <div>
                   <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Symbol</label>
                   <input type="text" value={formData.symbol || ''} onChange={(e) => setFormData({...formData, symbol: e.target.value})} className="w-full text-xs md:text-sm border border-slate-300 rounded px-2.5 py-1.5 md:px-3 md:py-2 font-mono outline-none focus:border-[#9575cd]" placeholder="e.g. <, >, ="/>
                 </div>
               )}

               {safeActiveTab === 'multivalue' && (
                 <div>
                   <label className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-0.5 md:mb-1 block tracking-wider">Values (Comma Separated)</label>
                   <textarea value={formData.values || ''} onChange={(e) => setFormData({...formData, values: e.target.value})} className="w-full text-xs md:text-sm border border-slate-300 rounded px-2.5 py-1.5 md:px-3 md:py-2 h-20 md:h-24 resize-none focus:border-[#9575cd] outline-none" placeholder="Option 1, Option 2, Option 3..."/>
                 </div>
               )}

               <div className="pt-2 md:pt-4 flex gap-2 md:gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-1.5 md:py-2 text-[11px] md:text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors">CANCEL</button>
                  <button onClick={handleSave} disabled={isPending} className="flex-1 py-1.5 md:py-2 text-[11px] md:text-xs font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-70">
                    {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} {editingId ? 'UPDATE' : 'SAVE'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL (RESPONSIVE) --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[280px] md:max-w-sm overflow-hidden p-4 md:p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 border-[3px] md:border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1 md:mb-2">Delete Master?</h3>
            <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">Are you sure you want to delete this master record? This action cannot be undone.</p>
            <div className="flex gap-2 md:gap-3">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-1.5 md:py-2.5 text-xs md:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-1.5 md:py-2.5 text-xs md:text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-70">{isPending ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS POPUP (RESPONSIVE) --- */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[280px] md:max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 md:mb-5 border-[3px] md:border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
            {formData.name && <p className="text-slate-500 text-xs md:text-sm mt-1 text-center font-medium truncate max-w-full">{formData.name}</p>}
          </div>
        </div>
      )}

      {/* --- DESKTOP LAYOUT (100% UNCHANGED AND UNMODIFIED) --- */}
      <div className="hidden md:flex flex-col flex-1 w-full h-full overflow-hidden">
        <div className="h-16 bg-white border border-slate-200 rounded-t-xl flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2 text-slate-800"><Database className="text-[#9575cd]" size={20}/><h1 className="text-lg font-bold tracking-tight">Lab Masters</h1></div>
            {canPerform('Add') && (
              <button onClick={handleAdd} className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"><Plus size={16} /> ADD NEW</button>
            )}
        </div>

        <div className="bg-white border-x border-b border-slate-200 px-6 py-4 flex flex-col gap-4 shrink-0">
            <div className="flex gap-6 border-b border-slate-100 overflow-x-auto">
                {visibleTabs.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id as MasterTab); setSearchTerm(''); }} className={`pb-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 whitespace-nowrap ${safeActiveTab === tab.id ? 'text-[#9575cd] border-[#9575cd]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                      {tab.icon} {tab.label}
                  </button>
                ))}
            </div>
            <div className="relative max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input type="text" placeholder={`Search ${safeActiveTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] outline-none transition-all"/>
            </div>
        </div>

        <div className="flex-1 bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden flex flex-col">
            <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
               <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Code</div>
               {safeActiveTab === 'vacutainer' && <div className="w-16 text-[10px] font-bold text-slate-500 uppercase">Color</div>}
               {safeActiveTab === 'operator' && <div className="w-16 text-[10px] font-bold text-slate-500 uppercase">Symbol</div>}
               
               <div className={`${safeActiveTab === 'method' ? 'flex-1' : 'w-48'} text-[10px] font-bold text-slate-500 uppercase`}>Name</div>
               
               {safeActiveTab === 'specimen' && <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">Container</div>}
               {safeActiveTab === 'multivalue' && <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">Values</div>}
               
               {['uom', 'operator', 'vacutainer'].includes(safeActiveTab as string) && <div className="flex-1"></div>}
               
               <div className="w-20 text-center text-[10px] font-bold text-slate-500 uppercase">Status</div>
               <div className="w-20 text-center text-[10px] font-bold text-slate-500 uppercase">Action</div>
            </div>

            <div className="flex-1 overflow-y-auto relative">
               {isLoading ? (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                      <MusicBarLoader text={`Loading ${safeActiveTab}s...`} />
                  </div>
               ) : filteredList.length === 0 ? (
                   <div className="flex flex-col items-center justify-center h-40 text-slate-400"><p className="text-xs">No records found.</p></div>
               ) : (
                   filteredList.map((item: any) => (
                      <div key={item.id} className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group gap-4">
                          <div className="w-24 text-xs font-mono font-semibold text-slate-600">{item.code}</div>
                          {safeActiveTab === 'vacutainer' && <div className="w-16"><div className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: item.color }}></div></div>}
                          {safeActiveTab === 'operator' && <div className="w-16 text-sm font-bold font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-center border">{item.symbol}</div>}
                          
                          <div className={`${safeActiveTab === 'method' ? 'flex-1 whitespace-nowrap' : 'w-48'} text-sm font-medium text-slate-700`}>{item.name}</div>
                          
                          {safeActiveTab === 'specimen' && <div className="flex-1 text-xs text-slate-500">{item.container}</div>}
                          {safeActiveTab === 'multivalue' && <div className="flex-1 text-xs text-slate-500 truncate min-w-0">{item.values}</div>}
                          
                          {['uom', 'operator', 'vacutainer'].includes(safeActiveTab as string) && <div className="flex-1"></div>}
                          
                          <div className="w-20 flex justify-center">
                              {canPerform('Edit') ? (
                                <button onClick={() => handleToggleStatus(item.id, item.isActive)} disabled={isPending} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}><span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} /></button>
                              ) : <Lock size={14} className="text-slate-300" />}
                          </div>

                          <div className="w-20 flex justify-center gap-2">
                               {canPerform('Edit') ? <button onClick={() => handleEdit(item)} disabled={isPending} className="text-slate-400 hover:text-[#9575cd] transition-colors"><Edit size={14}/></button> : <span className="w-6 text-center text-slate-300">-</span>}
                               {canPerform('Delete') ? <button onClick={() => handleDeleteClick(item.id)} disabled={isPending} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button> : <span className="w-6 text-center text-slate-300">-</span>}
                          </div>
                      </div>
                   ))
               )}
            </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT (BUILT SPECIFICALLY FOR MOBILE RATIO) --- */}
      <div className="flex md:hidden flex-col flex-1 w-full h-full bg-white overflow-hidden relative">
        
        {/* Mobile Header Inside Card (Search, Status Filter & Add New) */}
        <header className="flex items-center gap-1.5 px-2.5 py-2 shrink-0 z-20 bg-white border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={`Search ${tabs.find(t => t.id === safeActiveTab)?.label || 'master'}...`}
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={mobileStatusFilter}
              onChange={(e) => {
                setMobileStatusFilter(e.target.value as any);
                setMobileCurrentPage(1);
              }}
              className="h-6 pl-2 pr-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Add New Button */}
          {canPerform('Add') && (
            <button 
              onClick={handleAdd}
              className="h-6 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-2 rounded text-[10px] font-bold shrink-0 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Plus size={12} strokeWidth={2.5}/> Add New
            </button>
          )}
        </header>

        {/* Mobile Cards List */}
        <div className="flex-1 overflow-y-auto w-full px-2 py-2 bg-white flex flex-col gap-2 pb-16 custom-scrollbar">
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
              <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 flex flex-col gap-1.5 relative">
                {/* Top Row: Name and Code */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8.5px] font-semibold shrink-0">
                    {item.code}
                  </span>
                </div>

                {/* Middle Row: Sub-Master Specific Details */}
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

                {/* Bottom Row: Status Toggle & Actions (Edit, Delete) */}
                <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {canPerform('Edit') ? (
                      <button 
                        onClick={() => handleToggleStatus(item.id, item.isActive)} 
                        disabled={isPending} 
                        className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
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
                        className="text-[#9575cd] flex items-center gap-0.5 text-[9px] font-bold active:opacity-70"
                      >
                        <Edit size={10} /> Edit
                      </button>
                    )}
                    {canPerform('Delete') && (
                      <button 
                        onClick={() => handleDeleteClick(item.id)} 
                        disabled={isPending} 
                        className="text-red-500 flex items-center gap-0.5 text-[9px] font-bold active:opacity-70"
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

        {/* Mobile Locked Non-Moving Footer */}
        <div className="shrink-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between border-t border-slate-100 shadow-sm">
          {/* Back Button */}
          <button 
            onClick={() => window.history.back()} 
            className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all"
          >
            <ChevronLeft size={12} className="mr-0.5" /> Back
          </button>

          {/* Page Number & Direction Controls */}
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

          {/* Record Count Badge */}
          <div className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[9px] rounded shrink-0">
            {mobileFilteredList.length === 0 ? '0 of 0' : `${mobileStartIndex + 1}-${Math.min(mobileStartIndex + ITEMS_PER_PAGE, mobileFilteredList.length)} of ${mobileFilteredList.length}`}
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
// --- BLOCK app/masters/page.tsx CLOSE ---