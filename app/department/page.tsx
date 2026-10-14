// --- BLOCK app/department/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Building2, Plus, Search, Edit, Trash2, X, Save, Loader2, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { 
  getDepartments, 
  saveDepartment, 
  deleteDepartment, 
  toggleDepartmentStatus,
  generateDepartmentCode 
} from '@/app/actions/department';
import MusicBarLoader from '@/app/components/MusicBarLoader';
import { usePermissions } from '@/app/context/PermissionContext';

export default function DepartmentPage() {
  const { orgId, permissions, userRole, permsLoaded } = usePermissions();

  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', isActive: true });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const canPerform = (action: string) => {
    if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
    if (permissions.length === 0) return true; 
    return permissions.some(p => p.module === 'Departments' && p.action === action);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🚨 FIXED: Bulletproof loading state
  const loadData = async () => {
    setIsLoading(true);
    try {
        const res = await getDepartments();
        if (res && res.success) {
            setDepartments(res.data || []);
        } else {
            setDepartments([]);
        }
    } catch (error) {
        console.error("Vercel Timeout or Database Error:", error);
        setDepartments([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    setEditingId(null);
    const autoCode = await generateDepartmentCode();
    setFormData({ name: '', code: autoCode, description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({ name: item.name, code: item.code, description: item.description || '', isActive: item.isActive });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return alert("Name is required");

    startTransition(async () => {
      const res = await saveDepartment({ ...formData, id: editingId });
      if (res.success) {
        setIsModalOpen(false);
        setSuccessMessage(editingId ? "Updated Successfully!" : "Created Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => { setShowSuccessPopup(false); loadData(); }, 1500);
      } else {
        alert(res.message || "Failed to save");
      }
    });
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    
    startTransition(async () => {
      await deleteDepartment(deleteConfirmId);
      setDeleteConfirmId(null);
      
      setSuccessMessage("Deleted Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => { setShowSuccessPopup(false); loadData(); }, 1500);
    });
  };

  const handleToggle = (id: number, currentStatus: boolean) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, isActive: !currentStatus } : d));
    
    startTransition(async () => {
      await toggleDepartmentStatus(id, currentStatus);
      
      setSuccessMessage(!currentStatus ? "Enabled Successfully!" : "Disabled Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 1500);
    });
  };

  const filteredList = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-2 md:p-6 font-sans">
      
      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[280px] md:max-w-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                {editingId ? 'Edit' : 'Add'} Department
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
               <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Department Name</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full text-[11px] h-7 border border-slate-300 rounded px-2 outline-none focus:border-[#9575cd]" placeholder="e.g. Hematology" autoFocus />
               </div>
               <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Code (Auto)</label>
                  <input type="text" value={formData.code} readOnly className="w-full text-[11px] h-7 border border-slate-200 rounded px-2 outline-none bg-slate-100 text-slate-500 cursor-not-allowed font-mono" />
               </div>
               <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full text-[11px] border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#9575cd] h-12 resize-none" placeholder="Optional details..." />
               </div>

               <div className="pt-2 flex gap-2">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 h-7 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors">CANCEL</button>
                  <button onClick={handleSave} disabled={isPending} className="flex-1 h-7 text-[10px] font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70">
                    {isPending ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>} SAVE
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Department?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this department? This action cannot be undone.</p>
            <div className="flex gap-3">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                 {isPending ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex flex-col h-full overflow-hidden">
          {/* HEADER */}
          <div className="h-16 bg-white border border-slate-200 rounded-t-xl flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2 text-slate-800">
                 <Building2 className="text-[#9575cd]" size={20}/>
                 <h1 className="text-lg font-bold tracking-tight">Department Master</h1>
              </div>
              {canPerform('Add') && (
                <button onClick={handleAdd} className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95">
                   <Plus size={16} /> ADD NEW
                </button>
              )}
          </div>

          {/* TOOLBAR */}
          <div className="bg-white border-x border-b border-slate-200 px-6 py-4 flex flex-col gap-4">
              <div className="relative max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input type="text" placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] outline-none transition-all"/>
              </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden flex flex-col">
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
                 <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Code</div>
                 <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">Department Name</div>
                 <div className="w-20 text-center text-[10px] font-bold text-slate-500 uppercase">Status</div>
                 <div className="w-20 text-center text-[10px] font-bold text-slate-500 uppercase">Action</div>
              </div>

              <div className="flex-1 overflow-y-auto">
                 {isLoading ? (
                     <div className="flex items-center justify-center h-40">
                         <MusicBarLoader text="Loading Departments..." />
                     </div>
                 ) : filteredList.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                         <p className="text-xs">No departments found.</p>
                     </div>
                 ) : (
                     filteredList.map((item) => (
                        <div key={item.id} className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group gap-4">
                            <div className="w-24 text-xs font-mono font-semibold text-slate-600">{item.code}</div>
                            <div className="flex-1 text-sm font-medium text-slate-700">{item.name}</div>
                            
                            <div className="w-20 flex justify-center">
                                {canPerform('Edit') ? (
                                  <button onClick={() => handleToggle(item.id, item.isActive)} disabled={isPending} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                  </button>
                                ) : <Lock size={14} className="text-slate-300" />}
                            </div>

                            <div className="w-20 flex justify-center gap-2">
                                 {canPerform('Edit') ? (
                                   <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-[#9575cd] transition-colors"><Edit size={14}/></button>
                                 ) : <span className="w-6 text-center text-slate-300">-</span>}
                                 
                                 {canPerform('Delete') ? (
                                   <button onClick={() => handleDeleteClick(item.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                 ) : <span className="w-6 text-center text-slate-300">-</span>}
                            </div>
                        </div>
                     ))
                 )}
              </div>
          </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden p-0 bg-transparent">
          <div className="w-full h-full bg-white rounded-none border-0 overflow-hidden flex flex-col relative">
              
              {/* Header inside card (Search and Add) */}
              <header className="flex flex-col gap-1.5 px-1.5 py-2 shrink-0 z-20 bg-white border-b border-slate-100">
                  <div className="flex items-center gap-1.5 w-full shrink-0">
                     <div className="relative flex-1">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                             <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                         </svg>
                         <input 
                             type="text" 
                             placeholder="Search departments..." 
                             value={searchTerm} 
                             onChange={(e) => setSearchTerm(e.target.value)} 
                             className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all" 
                         />
                     </div>
                     {canPerform('Add') && (
                         <button onClick={handleAdd} className="h-6 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-2 rounded text-[10px] font-bold shrink-0 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95">
                             <Plus size={12} strokeWidth={2.5}/> Add New
                         </button>
                     )}
                  </div>
              </header>

              {/* Mobile Cards List inside card */}
              <div className="flex-1 overflow-y-auto w-full px-1.5 py-2 bg-white flex flex-col gap-2 pb-24 custom-scrollbar">
                 {isLoading ? (
                     <div className="flex items-center justify-center h-40">
                         <MusicBarLoader text="Loading Departments..." />
                     </div>
                 ) : filteredList.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                         <p className="text-xs font-medium">No departments found.</p>
                     </div>
                 ) : (
                     filteredList.map((item) => (
                         <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-2 flex flex-col gap-1.5 relative">
                             
                             <div className="flex items-start justify-between gap-2">
                                 <div className="flex flex-col flex-1 min-w-0">
                                     <span className="font-medium text-slate-700 text-xs truncate">{item.name}</span>
                                 </div>
                                 <span className="font-mono text-slate-500 bg-slate-50 px-1 py-0.5 rounded text-[8px] border border-slate-200 shrink-0">
                                     {item.code}
                                 </span>
                             </div>

                             <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                                 <div className="flex items-center gap-1.5">
                                     {canPerform('Edit') ? (
                                       <button onClick={() => handleToggle(item.id, item.isActive)} disabled={isPending} className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                         <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-[11px]' : 'translate-x-[2px]'}`} />
                                       </button>
                                     ) : <Lock size={12} className="text-slate-300" />}
                                     <span className="text-[9px] text-slate-500">{item.isActive ? 'Active' : 'Inactive'}</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                      {canPerform('Edit') && (
                                        <button onClick={() => handleEdit(item)} className="text-[#9575cd] flex items-center gap-1 text-[9px] font-medium active:opacity-70">
                                            <Edit size={10}/> Edit
                                        </button>
                                      )}
                                      {canPerform('Delete') && (
                                        <button onClick={() => handleDeleteClick(item.id)} className="text-red-500 flex items-center gap-1 text-[9px] font-medium active:opacity-70">
                                            <Trash2 size={10}/> Delete
                                        </button>
                                      )}
                                 </div>
                             </div>

                         </div>
                     ))
                 )}
              </div>

              {/* MOBILE FIXED FOOTER */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between">
                  <button onClick={() => window.history.back()} className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5"><path d="m15 18-6-6 6-6"/></svg> Back
                  </button>
                  
                   <div className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[9px] rounded shrink-0">
                       {filteredList.length === 0 ? '0 departments' : `${filteredList.length} ${filteredList.length === 1 ? 'department' : 'departments'}`}
                   </div>
              </div>
          </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
            <p className="text-slate-500 text-sm mt-1 text-center font-medium">{formData.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
// --- BLOCK app/department/page.tsx CLOSE ---