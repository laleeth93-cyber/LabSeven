// --- BLOCK app/parameters/page.tsx OPEN ---
"use client";

import React, { useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { Plus, Trash2, Search, Filter, Loader2, FileText, Settings, Activity, Type, Edit, ChevronDown, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { getParameters, deleteParameter, updateParameterStatus } from '@/app/actions/parameters';
import MusicBarLoader from '@/app/components/MusicBarLoader';
import { usePermissions } from '@/app/context/PermissionContext';

export default function ParametersListPage({ embedded = true }: { embedded?: boolean } = {}) {
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
  const [isGoToPopupOpen, setIsGoToPopupOpen] = useState(false);

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
        console.error("Database Error:", error);
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
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.displayName && p.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const mainContent = (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* TOOLBAR / HEADER: 38px / 42px */}
      <div className="px-2.5 xl:px-3 py-1.5 md:py-0 bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-2 z-10 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
        {/* Left: Title & Quick Type Filter Pills */}
        <div className="flex items-center gap-2 xl:gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
              <Settings size={15} />
            </div>
            <span className="text-[14px] xl:text-[15px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              Parameters
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 leading-tight">
              {filteredParams.length} Total
            </span>
          </div>

          {/* Quick Type Filter Pills */}
          <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-[5px] border border-slate-200 h-[24px] xl:h-[26px]">
            {[
              { id: 'All', label: 'All', count: parameters.length },
              { id: 'Quantitative', label: 'Quant', count: parameters.filter(p => getCategory(p.inputType) === 'Quantitative').length },
              { id: 'Qualitative', label: 'Qual', count: parameters.filter(p => getCategory(p.inputType) === 'Qualitative').length },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => { setFilterType(chip.id); setCurrentPage(1); }}
                className={`h-full px-2 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1 leading-none ${
                  filterType === chip.id
                    ? 'bg-white shadow-2xs text-[#9575cd] font-medium'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full leading-none ${
                  filterType === chip.id ? 'bg-purple-100 text-[#9575cd] font-semibold' : 'bg-slate-200/70 text-slate-500'
                }`}>{chip.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search, Filter, Add */}
        <div className="flex items-center gap-1.5 xl:gap-2">
          <div className="relative w-36 lg:w-44 xl:w-52 shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search parameters..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full pl-7 pr-2.5 h-[24px] xl:h-[26px] bg-white border border-slate-300 rounded-[5px] text-[11px] xl:text-[12px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#9575cd] transition-all" 
            />
          </div>

          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`h-[24px] xl:h-[26px] px-2 rounded-[5px] border text-[11px] xl:text-[12px] font-normal flex items-center gap-1 transition-all ${
                showFilters || activeFilterCount > 0 
                  ? 'bg-purple-50 border-[#9575cd] text-[#9575cd]' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter size={12} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#9575cd] text-white text-[9px] px-1 py-0.2 rounded-full font-semibold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={11} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-[6px] shadow-xl border border-slate-200 z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="mb-3">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">Status</label>
                  <div className="space-y-1">
                    {['All', 'Active', 'Inactive'].map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded text-[11px] text-slate-700">
                        <input type="radio" name="filterStatus" checked={filterStatus === status} onChange={() => setFilterStatus(status)} className="accent-[#9575cd]" />
                        <span>{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">Type</label>
                  <div className="space-y-1">
                    {['All', 'Quantitative', 'Qualitative'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded text-[11px] text-slate-700">
                        <input type="radio" name="filterType" checked={filterType === type} onChange={() => setFilterType(type)} className="accent-[#9575cd]" />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button onClick={() => { setFilterStatus('All'); setFilterType('All'); setShowFilters(false); }} className="w-full py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors text-center">Reset Filters</button>
                </div>
              </div>
            )}
          </div>

          {canPerform('Add') && (
            <Link href="/parameters/add">
              <button className="h-[24px] xl:h-[26px] px-2.5 bg-[#9575cd] hover:bg-[#8565bd] text-white text-[11px] xl:text-[12px] font-medium rounded-[5px] shadow-sm flex items-center gap-1 transition-all active:scale-95 leading-none shrink-0">
                <Plus size={13} strokeWidth={2.5}/>
                <span>Add Parameter</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* TABLE AREA */}
      <div className="flex-1 overflow-hidden bg-white p-0 md:p-2.5 xl:p-3 flex flex-col min-h-0">
        
        {/* Mobile Cards View (md:hidden) */}
        <div className="block md:hidden overflow-y-auto p-2 space-y-2 h-full custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <MusicBarLoader text="Loading Parameters..." />
            </div>
          ) : filteredParams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <p className="text-xs font-medium">No parameters found.</p>
            </div>
          ) : (
            paginatedParams.map((param) => {
              const isQuant = getCategory(param.inputType) === 'Quantitative';
              return (
                <div key={param.id} className="bg-white rounded-lg border border-slate-200 shadow-sm p-2 flex flex-col gap-1.5 relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-800 text-xs truncate">{param.name}</span>
                        {isQuant ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">QUANT</span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">QUAL</span>
                        )}
                      </div>
                      {param.displayName && param.displayName !== param.name && (
                        <span className="text-[10px] text-slate-400 truncate">{param.displayName}</span>
                      )}
                    </div>
                    <span className="font-mono text-[#9575cd] bg-purple-50 px-1 py-0.5 rounded text-[9px] border border-purple-100 shrink-0 font-medium">
                      {param.code || '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>Unit: <strong className="text-slate-700">{param.unit || '-'}</strong></span>
                    <span>•</span>
                    <span>Format: <strong className="text-slate-700">{param.inputType}</strong></span>
                    {param.decimals && param.inputType === 'Numerical' && (
                      <>
                        <span>•</span>
                        <span>Dec: <strong className="text-slate-700">{param.decimals}</strong></span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      {canPerform('Edit') ? (
                        <button onClick={() => handleToggleStatus(param.id, param.isActive)} className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${param.isActive ? 'bg-green-500' : 'bg-slate-300'}`}>
                          <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${param.isActive ? 'translate-x-[11px]' : 'translate-x-[1px]'}`} />
                        </button>
                      ) : <Lock size={12} className="text-slate-300" />}
                      <span className="text-[10px] text-slate-500">{param.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canPerform('Edit') && (
                        <Link href={`/parameters/edit/${param.id}`} className="text-teal-600 inline-flex items-center gap-1 text-[10px] font-medium active:opacity-70 leading-none">
                          <Edit size={11} strokeWidth={2} className="shrink-0" /> Edit
                        </Link>
                      )}
                      {canPerform('Delete') && (
                        <button onClick={() => handleDeleteClick(param.id)} className="text-rose-600 inline-flex items-center gap-1 text-[10px] font-medium active:opacity-70 leading-none">
                          <Trash2 size={11} strokeWidth={2} className="shrink-0" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (hidden md:flex) */}
        <div className="hidden md:flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden">
          <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
            <table className="w-full text-left text-sm border-collapse min-w-[750px] bg-white border-spacing-0">
              <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                <tr>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-36">Code</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left min-w-[170px]">Parameter Name</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left min-w-[150px]">Display Name</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-24">Units</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-24">Type</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-24">Format</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20">Status</th>
                  <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <MusicBarLoader text="Loading Parameters..." />
                    </td>
                  </tr>
                ) : filteredParams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      No parameters found.
                    </td>
                  </tr>
                ) : (
                  paginatedParams.map((param) => (
                    <tr key={param.id} className="hover:bg-purple-50/40 transition-colors">
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="font-mono text-[11px] font-medium text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 leading-tight inline-block">
                          {param.code || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="font-medium text-slate-800 text-[11px] leading-tight">
                          {param.name}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="text-slate-600 text-[11px] leading-tight">
                          {param.displayName || param.name || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="text-slate-600 text-[11px] leading-tight">
                          {param.unit || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        {getCategory(param.inputType) === 'Quantitative' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Activity size={10} /> QUANT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <Type size={10} /> QUAL
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                        <span className="text-slate-600 text-[11px] leading-tight">
                          {param.inputType}
                        </span>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {canPerform('Edit') ? (
                            <button 
                              onClick={() => handleToggleStatus(param.id, param.isActive)} 
                              className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${param.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                              title={param.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${param.isActive ? 'translate-x-[11px]' : 'translate-x-[1px]'}`} />
                            </button>
                          ) : <Lock size={12} className="text-slate-300" />}
                        </div>
                      </td>
                      <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1 leading-none align-middle">
                          {canPerform('Edit') ? (
                            <Link href={`/parameters/edit/${param.id}`}>
                              <button 
                                className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-teal-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none"
                                title="Edit Parameter"
                              >
                                <Edit className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 block" strokeWidth={2} />
                              </button>
                            </Link>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                          {canPerform('Delete') ? (
                            <button 
                              onClick={() => handleDeleteClick(param.id)} 
                              disabled={isPending}
                              className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none disabled:opacity-50"
                              title="Delete Parameter"
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
          Showing <span className="font-semibold text-slate-700">{filteredParams.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + ITEMS_PER_PAGE, filteredParams.length)}</span> of <span className="font-semibold text-slate-700">{filteredParams.length}</span> parameters
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="h-[22px] px-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xs text-[10px]"
          >
            <ChevronLeft size={12} className="mr-0.5" /> Prev
          </button>
          <span className="text-[11px] font-medium text-slate-700 px-1">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-[22px] px-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xs text-[10px]"
          >
            Next <ChevronRight size={12} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border-[3px] border-red-100">
              <AlertTriangle className="text-red-500" size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Parameter?</h3>
            <p className="text-xs text-slate-500 mb-5 font-normal">Are you sure you want to delete this parameter? This action cannot be undone.</p>
            <div className="flex gap-2.5">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-1.5 text-xs font-normal text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-[5px] shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                 {isPending ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>} Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-xs w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-[3px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight text-center">{successMessage}</h2>
          </div>
        </div>
      )}

      {/* CONTAINER */}
      <div className="flex flex-col w-full h-full overflow-hidden bg-white relative font-sans">
        {mainContent}
      </div>
    </>
  );
}
// --- BLOCK app/parameters/page.tsx CLOSE ---
