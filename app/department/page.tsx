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

export default function DepartmentPage({ embedded = false }: { embedded?: boolean } = {}) {
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
        console.error("Database Error:", error);
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
    if (!formData.name.trim()) return alert("Department Name is required");

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

  const mainContent = (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* TOOLBAR / HEADER: 38px / 42px */}
      <div className="px-2.5 xl:px-3 py-1.5 md:py-0 bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-2 z-10 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
        {/* Left: Title & Count */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
          <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs"><Building2 size={15}/></div>
          <span className="text-[14px] xl:text-[15px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
            Departments
          </span>
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 leading-tight">
            {filteredList.length} Total
          </span>
        </div>

        {/* Right: Search & Add Button */}
        <div className="flex items-center gap-1.5 xl:gap-2">
          <div className="relative w-40 lg:w-52 xl:w-60 shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 rounded-[5px] border border-slate-300 text-[11px] xl:text-[12px] font-normal text-slate-800 placeholder:text-[11px] xl:placeholder:text-[12px] placeholder:text-slate-400 bg-white focus:outline-none focus:border-[#9575cd] transition-all"
            />
          </div>

          {canPerform('Add') && (
            <button 
              onClick={handleAdd} 
              className="h-[24px] xl:h-[26px] px-2 xl:px-2.5 bg-[#9575cd] hover:bg-[#8565bd] text-white text-[11px] xl:text-[12px] font-medium rounded-[5px] shadow-sm flex items-center gap-1 xl:gap-1.5 transition-all active:scale-95 leading-none shrink-0"
            >
              <Plus size={13} strokeWidth={2.5}/>
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* TABLE AREA: with spacing matching Result Entry and Patient List */}
      <div className="flex-1 overflow-hidden bg-white p-0 md:p-2.5 xl:p-3 flex flex-col min-h-0">
        
        {/* Mobile Cards View (md:hidden) */}
        <div className="block md:hidden overflow-y-auto p-2 space-y-2 h-full custom-scrollbar">
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
                  <span className="font-medium text-slate-800 text-xs truncate">{item.name}</span>
                  <span className="font-mono text-[#9575cd] bg-purple-50 px-1 py-0.5 rounded text-[9px] border border-purple-100 shrink-0 font-medium">
                    {item.code}
                  </span>
                </div>
                {item.description && (
                  <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {canPerform('Edit') ? (
                      <button onClick={() => handleToggle(item.id, item.isActive)} disabled={isPending} className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-[11px]' : 'translate-x-[1px]'}`} />
                      </button>
                    ) : <Lock size={12} className="text-slate-300" />}
                    <span className="text-[10px] text-slate-500">{item.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canPerform('Edit') && (
                      <button onClick={() => handleEdit(item)} className="text-teal-600 inline-flex items-center gap-1 text-[10px] font-medium active:opacity-70 leading-none">
                        <Edit size={11} strokeWidth={2} className="shrink-0" /> Edit
                      </button>
                    )}
                    {canPerform('Delete') && (
                      <button onClick={() => handleDeleteClick(item.id)} className="text-rose-600 inline-flex items-center gap-1 text-[10px] font-medium active:opacity-70 leading-none">
                        <Trash2 size={11} strokeWidth={2} className="shrink-0" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (hidden md:flex) */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden">
          <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left text-sm border-collapse min-w-[650px] bg-white border-spacing-0">
              <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                <tr>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-28">Code</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left min-w-[180px]">Department Name</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left min-w-[200px]">Description</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24">Status</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <MusicBarLoader text="Loading Departments..." />
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No departments found.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="font-mono text-[11px] font-medium text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 leading-tight inline-block">
                          {item.code}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="font-medium text-slate-800 text-[11px] leading-tight">
                          {item.name}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left max-w-[300px] overflow-hidden">
                        <span className="text-slate-500 text-[11px] truncate block leading-tight">
                          {item.description || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {canPerform('Edit') ? (
                            <button 
                              onClick={() => handleToggle(item.id, item.isActive)} 
                              disabled={isPending} 
                              className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${item.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                              title={item.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${item.isActive ? 'translate-x-[11px]' : 'translate-x-[1px]'}`} />
                            </button>
                          ) : <Lock size={12} className="text-slate-300" />}
                        </div>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1 leading-none align-middle">
                          {canPerform('Edit') ? (
                            <button 
                              onClick={() => handleEdit(item)} 
                              className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-teal-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none"
                              title="Edit Department"
                            >
                              <Edit className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 block" strokeWidth={2} />
                            </button>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                          {canPerform('Delete') ? (
                            <button 
                              onClick={() => handleDeleteClick(item.id)} 
                              className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none"
                              title="Delete Department"
                            >
                              <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 block" strokeWidth={2} />
                            </button>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FOOTER BAR: 30px / 34px */}
      <div className="bg-white md:bg-slate-50 border-t border-slate-200 px-2.5 xl:px-3 py-1 md:py-0 min-h-[30px] h-[30px] xl:min-h-[34px] xl:h-[34px] flex items-center justify-between shrink-0 gap-2 w-full text-[11px] text-slate-500 font-normal">
        <div>
          Total Departments: <span className="font-semibold text-slate-700">{filteredList.length}</span>
        </div>
        <div className="text-[10px] text-slate-400">
          {filteredList.filter(d => d.isActive).length} Active • {filteredList.filter(d => !d.isActive).length} Inactive
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ADD/EDIT MODAL: Resized, Modern, and Proportioned with 20px Calibri Header */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] md:max-w-[520px] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
            
            {/* Modal Header: 38px / 42px */}
            <div className="px-3.5 xl:px-4 py-2 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                  <Building2 size={16} />
                </div>
                <h3 className="text-[18px] xl:text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                  {editingId ? 'Edit Department' : 'Add Department'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-[24px] w-[24px] rounded-[5px] flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 md:p-5 space-y-3.5 text-[11px] xl:text-[12px] bg-white">
              {/* Row 1: Name (col-8) & Code (col-4) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 block">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full text-[11px] xl:text-[12px] h-[26px] xl:h-[28px] border border-slate-300 rounded-[5px] px-2.5 outline-none focus:border-[#9575cd] font-normal text-slate-800 placeholder:text-slate-400 bg-white" 
                    placeholder="e.g. Hematology, Biochemistry, Pathology" 
                    autoFocus 
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 block">
                    Code (Auto)
                  </label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    readOnly 
                    className="w-full text-[11px] xl:text-[12px] h-[26px] xl:h-[28px] border border-slate-200 rounded-[5px] px-2.5 outline-none bg-slate-50 text-slate-500 cursor-not-allowed font-mono font-medium" 
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 block">
                  Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className="w-full text-[11px] xl:text-[12px] border border-slate-300 rounded-[5px] px-2.5 py-1.5 outline-none focus:border-[#9575cd] h-20 resize-none font-normal text-slate-800 placeholder:text-slate-400 bg-white custom-scrollbar" 
                  placeholder="Enter brief description or notes about this department..." 
                />
              </div>

              {/* Row 3: Status Toggle Card */}
              <div className="flex items-center justify-between p-2.5 rounded-[6px] border border-slate-200 bg-slate-50/70">
                <div>
                  <span className="text-[11px] xl:text-[12px] font-medium text-slate-800 block">Department Status</span>
                  <span className="text-[10px] text-slate-500 block">Enable or disable this department for tests and reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold ${formData.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-xs ${formData.isActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer: 42px */}
            <div className="bg-slate-50 border-t border-slate-200 px-3.5 xl:px-4 py-2 flex items-center justify-end gap-2 shrink-0 min-h-[42px]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="h-[26px] xl:h-[28px] px-3.5 text-[11px] xl:text-[12px] font-normal text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-[5px] shadow-2xs transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave} 
                disabled={isPending} 
                className="h-[26px] xl:h-[28px] px-4 text-[11px] xl:text-[12px] font-medium text-white bg-[#9575cd] hover:bg-[#8565bd] rounded-[5px] shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-95 leading-none"
              >
                {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                <span>{editingId ? 'Update Department' : 'Save Department'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border-[3px] border-red-100">
              <AlertTriangle className="text-red-500" size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>Delete Department?</h3>
            <p className="text-xs text-slate-500 mb-5">Are you sure you want to delete this department? This action cannot be undone.</p>
            <div className="flex gap-2.5">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 h-[28px] text-xs font-normal text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 h-[28px] text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70">
                 {isPending ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200 max-w-xs w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-[3px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight text-center">{successMessage}</h2>
            {formData.name && <p className="text-slate-500 text-xs mt-1 text-center font-normal">{formData.name}</p>}
          </div>
        </div>
      )}

      {/* CONTAINER */}
      {embedded ? (
        <div className="flex flex-col w-full h-full overflow-hidden bg-white">
          {mainContent}
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full">
          <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
            {mainContent}
          </div>
        </div>
      )}
    </>
  );
}
