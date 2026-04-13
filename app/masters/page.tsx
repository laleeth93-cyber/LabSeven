// --- BLOCK app/masters/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Database, Plus, Search, Edit, Trash2, Droplet, Box, FlaskConical, Scale, Calculator, List, X, Save, Loader2, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { getMasterData, saveMasterData, deleteMasterData, toggleMasterStatus, generateMasterCode } from '@/app/actions/masters';
import { useSession } from "next-auth/react"; 
import { getUserPermissions } from '@/app/actions/authorizations';
import MusicBarLoader from '@/app/components/MusicBarLoader'; // 🚨 NEW IMPORT

type MasterTab = 'specimen' | 'vacutainer' | 'method' | 'uom' | 'operator' | 'multivalue';

export default function MastersPage() {
  const { data: session } = useSession();
  const orgId = (session?.user as any)?.orgId; 
  const [permissions, setPermissions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [permsLoaded, setPermsLoaded] = useState(false);

  const [activeTab, setActiveTab] = useState<MasterTab>('specimen');
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
      if (permissions.length === 0) return true; // Default allow unmapped to view
      return permissions.some(p => p.module === screenName && p.action === 'Access');
  };

  // 🚨 ACTION-LEVEL GATEKEEPER
  const canPerform = (action: string) => {
      if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
      if (permissions.length === 0) return true; // Default allow unmapped
      const activeScreen = tabs.find(t => t.id === safeActiveTab)?.screen;
      return permissions.some(p => p.module === activeScreen && p.action === action);
  };

  const tabs = [
      { id: 'specimen', label: 'Specimen', icon: <Droplet size={16}/>, screen: 'Specimens' },
      { id: 'vacutainer', label: 'Vacutainer', icon: <Box size={16}/>, screen: 'Vacutainers' },
      { id: 'method', label: 'Method', icon: <FlaskConical size={16}/>, screen: 'Methods' },
      { id: 'uom', label: 'UOM', icon: <Scale size={16}/>, screen: 'UOM' },
      { id: 'operator', label: 'Operator', icon: <Calculator size={16}/>, screen: 'Operators' },
      { id: 'multivalue', label: 'Multivalues', icon: <List size={16}/>, screen: 'Multivalues' },
  ];

  const visibleTabs = tabs.filter(t => canSee(t.screen));
  const safeActiveTab = visibleTabs.find(t => t.id === activeTab) ? activeTab : (visibleTabs[0]?.id as MasterTab | null);

  useEffect(() => {
      if (permsLoaded && safeActiveTab && safeActiveTab !== activeTab) {
          setActiveTab(safeActiveTab);
          setSearchTerm('');
      }
  }, [permsLoaded, safeActiveTab, activeTab]);

  useEffect(() => {
      if (permsLoaded && safeActiveTab) loadData(safeActiveTab);
  }, [safeActiveTab, permsLoaded]);

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

  // 🚨 REPLACED AUTH SPINNER WITH MUSIC BAR
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
    <div className="flex flex-col w-full h-full bg-slate-50 p-6 font-sans relative">
      
      {/* ADD / EDIT MODAL - Left untouched as it relies on Add/Edit clicks to open */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                {editingId ? 'Edit' : 'Add New'} {tabs.find(t => t.id === safeActiveTab)?.label}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-4">
               <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full text-sm border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#9575cd]" placeholder="Enter Name" autoFocus/></div>
               <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Code (Auto)</label><input type="text" value={formData.code} readOnly className="w-full text-sm border border-slate-200 rounded px-3 py-2 outline-none bg-slate-100 text-slate-500 cursor-not-allowed font-mono"/></div>

               {safeActiveTab === 'specimen' && (
                 <>
                   <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label><input type="text" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full text-sm border border-slate-300 rounded px-3 py-2" placeholder="e.g. Whole Blood"/></div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Default Container</label>
                      <select value={formData.container || ''} onChange={(e) => setFormData({...formData, container: e.target.value})} className="w-full text-sm border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#9575cd]">
                        <option value="">-- Select Vacutainer --</option>
                        {vacutainerList.map((v: any) => <option key={v.id} value={v.name}>{v.name}</option>)}
                      </select>
                   </div>
                 </>
               )}

               {safeActiveTab === 'vacutainer' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cap Color</label>
                    <div className="flex items-center gap-2 h-[38px] border border-slate-300 rounded px-2"><input type="color" value={formData.color || '#000000'} onChange={(e) => setFormData({...formData, color: e.target.value})} className="w-8 h-6 cursor-pointer border-none bg-transparent p-0"/><span className="text-xs text-slate-500 font-mono">{formData.color}</span></div>
                  </div>
               )}

               {safeActiveTab === 'operator' && (
                 <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Symbol</label><input type="text" value={formData.symbol || ''} onChange={(e) => setFormData({...formData, symbol: e.target.value})} className="w-full text-sm border border-slate-300 rounded px-3 py-2 font-mono" placeholder="e.g. <, >, ="/></div>
               )}

               {safeActiveTab === 'multivalue' && (
                 <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Values (Comma Separated)</label><textarea value={formData.values || ''} onChange={(e) => setFormData({...formData, values: e.target.value})} className="w-full text-sm border border-slate-300 rounded px-3 py-2 h-24 resize-none focus:border-[#9575cd]" placeholder="Option 1, Option 2, Option 3..."/></div>
               )}

               <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors">CANCEL</button>
                  <button onClick={handleSave} disabled={isPending} className="flex-1 py-2 text-xs font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70">{isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} {editingId ? 'UPDATE' : 'SAVE'}</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Master?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this master record? This action cannot be undone.</p>
            <div className="flex gap-3">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70">{isPending ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="h-16 bg-white border border-slate-200 rounded-t-xl flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-800"><Database className="text-[#9575cd]" size={20}/><h1 className="text-lg font-bold tracking-tight">Lab Masters</h1></div>
          {/* 🚨 SECURED: ADD BUTTON */}
          {canPerform('Add') && (
            <button onClick={handleAdd} className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"><Plus size={16} /> ADD NEW</button>
          )}
      </div>

      <div className="bg-white border-x border-b border-slate-200 px-6 py-4 flex flex-col gap-4">
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
                // 🚨 REPLACED TABLE SPINNER WITH MUSIC BAR
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
                        
                        {/* 🚨 SECURED: TOGGLE STATUS (EDIT) */}
                        <div className="w-20 flex justify-center">
                            {canPerform('Edit') ? (
                              <button onClick={() => handleToggleStatus(item.id, item.isActive)} disabled={isPending} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}><span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} /></button>
                            ) : <Lock size={14} className="text-slate-300" />}
                        </div>

                        {/* 🚨 SECURED: EDIT & DELETE BUTTONS */}
                        <div className="w-20 flex justify-center gap-2">
                             {canPerform('Edit') ? <button onClick={() => handleEdit(item)} disabled={isPending} className="text-slate-400 hover:text-[#9575cd] transition-colors"><Edit size={14}/></button> : <span className="w-6 text-center text-slate-300">-</span>}
                             {canPerform('Delete') ? <button onClick={() => handleDeleteClick(item.id)} disabled={isPending} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button> : <span className="w-6 text-center text-slate-300">-</span>}
                        </div>
                    </div>
                 ))
             )}
          </div>
      </div>

      {showSuccessPopup && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100"><CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} /></div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
            <p className="text-slate-500 text-sm mt-1 text-center font-medium">{formData.name}</p>
          </div>
        </div>
      )}

    </div>
  );
}
// --- BLOCK app/masters/page.tsx CLOSE ---