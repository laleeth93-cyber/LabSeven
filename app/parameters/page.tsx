// --- BLOCK app/parameters/page.tsx OPEN ---
"use client";

import React, { useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Search, Filter, Loader2, FileText, Settings, Activity, Type, Edit, Check, X, ChevronDown, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getParameters, deleteParameter, updateParameterStatus } from '@/app/actions/parameters';
import MusicBarLoader from '@/app/components/MusicBarLoader';
import { usePermissions } from '@/app/context/PermissionContext';

export default function ParametersListPage() {
  const { orgId, permissions, userRole, permsLoaded } = usePermissions();

  const [parameters, setParameters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [filterType, setFilterType] = useState('All');     
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isPending, startTransition] = useTransition();
  const filterRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const canPerform = (action: string) => {
    if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
    if (permissions.length === 0) return true; 
    return permissions.some(p => p.module === 'Parameters' && p.action === action);
  };

  useEffect(() => {
    loadParameters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🚨 FIXED: Bulletproof loading state
  const loadParameters = async () => {
    setIsLoading(true);
    try {
        const res = await getParameters();
        if (res && res.success) {
            setParameters(res.data || []);
        } else {
            setParameters([]);
        }
    } catch (error) {
        console.error("Vercel Timeout or Database Error:", error);
        setParameters([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    
    startTransition(async () => {
      await deleteParameter(deleteConfirmId);
      setDeleteConfirmId(null);
      setSuccessMessage("Deleted Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => { setShowSuccessPopup(false); loadParameters(); }, 1500);
    });
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setParameters(prev => prev.map(p => p.id === id ? { ...p, isActive: newStatus } : p));

    startTransition(async () => {
       const res = await updateParameterStatus(id, newStatus);
       if (!res.success) {
           alert("Failed to update status");
           setParameters(prev => prev.map(p => p.id === id ? { ...p, isActive: currentStatus } : p));
       } else {
           setSuccessMessage(newStatus ? "Enabled Successfully!" : "Disabled Successfully!");
           setShowSuccessPopup(true);
           setTimeout(() => setShowSuccessPopup(false), 1500);
       }
    });
  };

  const getCategory = (inputType: string) => {
    if (inputType === 'Numerical') return 'Quantitative';
    return 'Qualitative';
  };

  const filteredParams = parameters.filter(p => {
    const matchesSearch = 
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (filterStatus === 'Active') matchesStatus = p.isActive === true;
    if (filterStatus === 'Inactive') matchesStatus = p.isActive === false;

    let matchesType = true;
    const type = getCategory(p.inputType);
    if (filterType === 'Quantitative') matchesType = type === 'Quantitative';
    if (filterType === 'Qualitative') matchesType = type === 'Qualitative';

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredParams.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedParams = filteredParams.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeFilterCount = (filterStatus !== 'All' ? 1 : 0) + (filterType !== 'All' ? 1 : 0);

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-6 relative">
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden w-full h-full">

          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
             <div className="flex items-center gap-2 text-slate-800">
                 <Settings className="text-[#9575cd]" size={20}/>
                 <h1 className="text-lg font-bold tracking-tight">Parameters Library</h1>
             </div>
             <div className="flex items-center gap-3">
                 {canPerform('Add') && (
                     <Link href="/parameters/add">
                        <button className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95">
                            <Plus size={16} /> ADD NEW PARAMETER
                        </button>
                     </Link>
                 )}
             </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-4 shrink-0 bg-white border-b border-slate-50">
              <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" placeholder="Search parameters..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none transition-all"
                  />
              </div>

              <div className="relative" ref={filterRef}>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-10 px-4 border rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-purple-50 border-[#9575cd] text-[#9575cd]' : 'bg-white border-slate-200 text-slate-600 hover:border-[#9575cd] hover:text-[#9575cd]'}`}
                  >
                      <Filter size={14}/> FILTER
                      {activeFilterCount > 0 && <span className="bg-[#9575cd] text-white text-[9px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                      <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
                  </button>

                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                            <div className="space-y-1">
                                {['All', 'Active', 'Inactive'].map(status => (
                                    <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                        <input type="radio" name="status" checked={filterStatus === status} onChange={() => setFilterStatus(status)} className="accent-[#9575cd]" />
                                        <span className="text-sm text-slate-700">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Type</label>
                            <div className="space-y-1">
                                {['All', 'Quantitative', 'Qualitative'].map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                        <input type="radio" name="type" checked={filterType === type} onChange={() => setFilterType(type)} className="accent-[#9575cd]" />
                                        <span className="text-sm text-slate-700">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100">
                            <button onClick={() => { setFilterStatus('All'); setFilterType('All'); setShowFilters(false); }} className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">Reset Filters</button>
                        </div>
                    </div>
                  )}
              </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-white">
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 shrink-0">
                  <div className="w-48 text-[10px] font-bold text-slate-500 uppercase">Code</div>
                  <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">Parameter Name</div>
                  <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">Display Name</div>
                  <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Units</div>
                  <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Type</div>
                  <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Format</div>
                  <div className="w-24 text-center text-[10px] font-bold text-slate-500 uppercase">Status</div>
                  <div className="w-24 text-center text-[10px] font-bold text-slate-500 uppercase">Action</div>
              </div>

              <div className="flex-1 overflow-y-auto">
                  {isLoading ? (
                      <div className="flex items-center justify-center h-40">
                          <MusicBarLoader text="Loading Parameters..." />
                      </div>
                  ) : filteredParams.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                          <FileText size={48} className="mb-2 opacity-20"/>
                          <p className="text-sm">No parameters found.</p>
                      </div>
                  ) : (
                      paginatedParams.map((param) => (
                          <div key={param.id} className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group">
                              <div className="w-48 text-xs font-semibold text-slate-700 font-mono truncate pr-8" title={param.code}>{param.code ? (param.code.length > 20 ? param.code.substring(0, 20) + '...' : param.code) : '-'}</div>
                              <div className="flex-1 text-sm font-medium text-slate-800 truncate pr-4">{param.name}</div>
                              <div className="flex-1 text-xs text-slate-500 truncate pr-4">{param.displayName || param.name}</div>
                              <div className="w-24 text-xs text-slate-600 font-medium">{param.unit || <span className="text-slate-300">-</span>}</div>
                              
                              <div className="w-24">
                                  {getCategory(param.inputType) === 'Quantitative' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100"><Activity size={10} className="mr-1"/> QUANT</span>
                                  ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100"><Type size={10} className="mr-1"/> QUAL</span>
                                  )}
                              </div>

                              <div className="w-24 text-[11px] font-medium text-slate-500">{param.inputType}</div>
                              
                              <div className="w-24 flex justify-center">
                                  {canPerform('Edit') ? (
                                    <button onClick={() => handleToggleStatus(param.id, param.isActive)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#9575cd] focus:ring-offset-1 ${param.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${param.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                  ) : <Lock size={14} className="text-slate-300" />}
                              </div>

                              <div className="w-24 flex justify-center items-center gap-1">
                                  {canPerform('Edit') ? (
                                      param.id ? (
                                        <Link href={`/parameters/edit/${param.id}`}><button className="p-1.5 hover:bg-purple-50 rounded text-slate-400 hover:text-[#9575cd] transition-colors"><Edit size={14} /></button></Link>
                                      ) : (
                                        <button className="p-1.5 text-slate-300 cursor-not-allowed"><Edit size={14} /></button>
                                      )
                                  ) : <span className="w-6 text-center text-slate-300">-</span>}
                                  
                                  {canPerform('Delete') ? (
                                      <button onClick={() => handleDeleteClick(param.id)} disabled={isPending} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors">
                                          {isPending ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14} />}
                                      </button>
                                  ) : <span className="w-6 text-center text-slate-300">-</span>}
                              </div>
                          </div>
                      ))
                  )}
              </div>
              
              <div className="h-14 border-t border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
                 <div className="text-xs font-medium text-slate-500">
                    Showing <span className="font-bold text-slate-700">{filteredParams.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-bold text-slate-700">{Math.min(startIndex + ITEMS_PER_PAGE, filteredParams.length)}</span> of <span className="font-bold text-slate-700">{filteredParams.length}</span> parameters
                 </div>
                 <div className="flex items-center gap-3">
                     <button 
                         onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                         disabled={currentPage === 1}
                         className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                     >
                         <ChevronLeft size={16} />
                     </button>
                     <span className="text-xs font-bold text-slate-700 min-w-[80px] text-center">
                         Page {currentPage} of {totalPages || 1}
                     </span>
                     <button 
                         onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                         disabled={currentPage === totalPages || totalPages === 0}
                         className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                     >
                         <ChevronRight size={16} />
                     </button>
                 </div>
              </div>

          </div>
      </div>

      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Parameter?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this parameter? This action cannot be undone.</p>
            <div className="flex gap-3">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                 {isPending ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
          </div>
        </div>
      )}

    </div>
  );
}
// --- BLOCK app/parameters/page.tsx CLOSE ---