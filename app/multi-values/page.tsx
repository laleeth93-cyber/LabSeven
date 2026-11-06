"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Save, Loader2, ListTree, Edit2, Trash2, Plus, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getInterpretationsPaginated, saveMicrobiologyMaster, deleteMicrobiologyMaster, deleteAllMicrobiologyMaster } from '@/app/actions/microbiology';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function MultiValuesPage({ embedded = false }: { embedded?: boolean }) {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    
    const [interpretations, setInterpretations] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [form, setForm] = useState<{ id?: number, code: string, name: string, isActive: boolean }>({ code: '', name: '', isActive: true });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // AUTO-GENERATE CODE FUNCTION
    const generateNextCode = (items: any[], totalCount?: number) => {
        let max = 0;
        items.forEach(item => {
            if (item.code?.startsWith('INT-')) {
                const num = parseInt(item.code.replace('INT-', ''), 10);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        
        const highestCode = totalCount && totalCount > max ? totalCount : max;
        return `INT-${(highestCode + 1).toString().padStart(3, '0')}`;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function loadData(page: number, search: string) {
        setIsTableLoading(true);
        if (isLoading) setIsLoading(false); 
        
        try {
            const res = await getInterpretationsPaginated(page, 20, search);
            if (res.success) {
                const data = res.data || [];
                const total = res.total || 0;
                
                setInterpretations(data);
                setCurrentPage(page);
                setTotalPages(res.totalPages || 1);
                setTotalRecords(total);

                if (!form.id) {
                    setForm(prev => ({ ...prev, code: generateNextCode(data, total) }));
                }
                
                return { data, total }; 
            }
        } catch (err) { console.error(err); } 
        finally { setIsTableLoading(false); }
        return null;
    }

    const handleEdit = (item: any) => setForm({ id: item.id, code: item.code, name: item.name, isActive: item.isActive });
    
    const handleCancel = (freshData?: any[], freshTotal?: number) => {
        const itemsToUse = freshData || interpretations;
        const totalToUse = freshTotal !== undefined ? freshTotal : totalRecords;
        setForm({ id: undefined, code: generateNextCode(itemsToUse, totalToUse), name: '', isActive: true });
    };

    const handleSave = () => {
        if (!form.name || !form.code) return alert("Code and Name are required.");
        startTransition(async () => {
            const res = await saveMicrobiologyMaster('interpretation', form);
            if (res.success) {
                const freshResult = await loadData(currentPage, searchTerm);
                
                setSuccessMessage(res.message);
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 1500);
                
                if (freshResult) {
                    handleCancel(freshResult.data, freshResult.total);
                } else {
                    handleCancel();
                }
            } else alert(res.message);
        });
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Are you sure you want to delete this interpretation?")) return;
        const res = await deleteMicrobiologyMaster('interpretation', id);
        if (res.success) {
            const freshResult = await loadData(currentPage, searchTerm);
            if (form.id === id || !form.id) {
                handleCancel(freshResult?.data, freshResult?.total);
            }
        } else alert(res.message);
    };

    const handleDeleteAll = async () => {
        if (totalRecords === 0) return alert("No records to delete.");
        if (!confirm("⚠️ WARNING: Are you sure you want to delete ALL Interpretations? This action cannot be undone!")) return;
        
        setIsTableLoading(true);
        const res = await deleteAllMicrobiologyMaster('interpretation');
        if (res.success) {
            await loadData(1, "");
            setSuccessMessage("All records deleted!");
            setShowSuccessPopup(true);
            setTimeout(() => setShowSuccessPopup(false), 1500);
            handleCancel([], 0);
        } else alert(res.message);
        setIsTableLoading(false);
    };

    if (isLoading) return <div className="h-full flex items-center justify-center bg-white"><MusicBarLoader text="Preparing Interpretations..." /></div>;

    const content = (
        <div className="h-full w-full flex flex-col font-sans text-slate-600 overflow-hidden relative">
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-xl animate-in zoom-in-95 duration-200 max-w-xs w-full mx-4 border border-slate-200">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-100">
                            <CheckCircle className="text-emerald-500" size={26} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-sm font-semibold text-slate-800 tracking-tight text-center">{successMessage}</h2>
                    </div>
                </div>
            )}

            {/* SUB-HEADER TOOLBAR (FLUSH UNDER MAIN TABS) */}
            <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-purple-50 text-[#9575cd]">
                        <ListTree size={14}/>
                    </div>
                    <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Result Interpretations
                    </h3>
                    <span className="text-[10px] text-slate-500 font-normal bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                        Total: {totalRecords}
                    </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input 
                            type="text" 
                            placeholder="Search values..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-[24px] xl:h-[26px] w-36 sm:w-48 pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
                        />
                    </div>
                    <button 
                        onClick={handleDeleteAll} 
                        disabled={isPending || totalRecords === 0} 
                        className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] xl:text-[12px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                        <Trash2 size={13}/> Delete All
                    </button>
                </div>
            </div>

            {/* CONTENT AREA: SEPARATE BLOCKS WITH SPACING MATCHING PATIENT LIST & RESULT ENTRY */}
            <div className="flex-1 overflow-hidden bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 flex flex-col md:flex-row gap-2.5 xl:gap-3 min-h-0">
                {/* LEFT FORM CARD */}
                <div className="w-full md:w-[280px] lg:w-[300px] xl:w-[320px] bg-white border border-slate-200 rounded-[6px] shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 flex items-center gap-1.5" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                           {form.id ? <Edit2 size={13} className="text-teal-600"/> : <Plus size={13} className="text-[#9575cd]"/>}
                           {form.id ? `Edit Value` : `Add New Value`}
                        </h3>
                        {form.id && (
                            <button onClick={() => handleCancel()} className="h-[20px] md:h-[22px] px-1.5 text-[10px] text-slate-500 hover:text-slate-700 bg-white border border-slate-300 rounded shadow-2xs">
                                Cancel
                            </button>
                        )}
                    </div>
                    <div className="p-3 xl:p-3.5 space-y-3 flex-1 overflow-y-auto">
                        <div>
                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Result Code *</label>
                            <input 
                                type="text" 
                                value={form.code} 
                                onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} 
                                placeholder="E.g. INT-001" 
                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9575cd]" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Display Name *</label>
                            <input 
                                type="text" 
                                value={form.name} 
                                onChange={(e) => setForm({...form, name: e.target.value})} 
                                placeholder="E.g. Sensitive" 
                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                            />
                        </div>
                        
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-[5px] border border-slate-200">
                            <input 
                                type="checkbox" 
                                checked={form.isActive} 
                                onChange={(e) => setForm({...form, isActive: e.target.checked})} 
                                className="rounded text-[#9575cd] accent-[#9575cd] w-3.5 h-3.5 cursor-pointer" 
                            />
                            <span className="text-[11px] font-medium text-slate-700">Active Status</span>
                        </label>
                    </div>
                    <div className="p-2.5 xl:p-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
                        <button 
                            onClick={handleSave} 
                            disabled={isPending} 
                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-medium text-white rounded-[5px] flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50" 
                            style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                        >
                            {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Save Value
                        </button>
                    </div>
                </div>

                {/* RIGHT TABLE BLOCK (SEPARATE CARD LIKE PATIENT LIST) */}
                <div className="flex-1 bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden flex flex-col min-h-0 relative">
                    <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative bg-white">
                        {isTableLoading && (
                            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                <MusicBarLoader text="Loading Values..." />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse border-spacing-0">
                            <thead className="bg-[#9575cd] border-b border-[#7e57c2] sticky top-0 z-10 shadow-2xs text-white">
                                <tr>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Code</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Interpretation Name</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interpretations.length === 0 && !isTableLoading ? (
                                    <tr><td colSpan={4} className="py-12 text-center text-slate-400 text-[11px] font-normal">No interpretations found.</td></tr>
                                ) : (
                                    interpretations.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-500 font-mono">{item.code}</td>
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-700">{item.name}</td>
                                            
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${item.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        onClick={() => handleEdit(item)} 
                                                        className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 shadow-2xs text-teal-600 hover:bg-teal-50 flex items-center justify-center"
                                                        title="Edit Value"
                                                    >
                                                        <Edit2 size={14} strokeWidth={2}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)} 
                                                        className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 shadow-2xs text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                                                        title="Delete Value"
                                                    >
                                                        <Trash2 size={14} strokeWidth={2}/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls inside Table Block */}
                    <div className="min-h-[30px] h-[30px] xl:min-h-[34px] xl:h-[34px] px-3 bg-[#f8fafc] border-t border-slate-200 flex items-center justify-between shrink-0">
                        <span className="text-[11px] text-slate-500 font-normal">
                            Showing <strong className="font-medium text-slate-700">{totalRecords === 0 ? 0 : (currentPage - 1) * 20 + 1}</strong> to <strong className="font-medium text-slate-700">{Math.min(currentPage * 20, totalRecords)}</strong> of <strong className="font-medium text-slate-700">{totalRecords}</strong> entries
                        </span>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => loadData(currentPage - 1, searchTerm)} 
                                    disabled={currentPage === 1 || isTableLoading}
                                    className="h-[22px] w-[22px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                >
                                    <ChevronLeft size={13}/>
                                </button>
                                <span className="text-[11px] font-medium text-slate-700 px-1">Page {currentPage} of {totalPages}</span>
                                <button 
                                    onClick={() => loadData(currentPage + 1, searchTerm)} 
                                    disabled={currentPage >= totalPages || isTableLoading}
                                    className="h-[22px] w-[22px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                >
                                    <ChevronRight size={13}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
            <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                            <ListTree size={16} />
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Result Interpretations
                        </h2>
                    </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#f8fafc]">
                    {content}
                </div>
            </div>
        </div>
    );
}
