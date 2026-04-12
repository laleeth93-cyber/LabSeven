// --- BLOCK app/antibiotic-classes/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { Save, Loader2, Layers, Edit2, Trash2, Plus, CheckCircle, Upload, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMicrobiologyMaster, getAntibioticClassesPaginated, saveMicrobiologyMaster, deleteMicrobiologyMaster, deleteAllMicrobiologyMaster, importMicrobiologyMaster } from '@/app/actions/microbiology';
import * as XLSX from 'xlsx';
import MusicBarLoader from '@/app/components/MusicBarLoader'; // 🚨 NEW IMPORT

export default function AntibioticClassesPage() {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // Pagination & Search States
    const [classes, setClasses] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [microForm, setMicroForm] = useState<{ id?: number, code: string, name: string, isActive: boolean }>({ code: '', name: '', isActive: true });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadClasses(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function loadClasses(page: number, search: string) {
        setIsTableLoading(true);
        // On initial load, component isn't visibly ready until this finishes
        if (isLoading) setIsLoading(false); 
        
        try {
            const res = await getAntibioticClassesPaginated(page, 20, search);
            if (res.success) {
                setClasses(res.data || []);
                setCurrentPage(page);
                setTotalPages(res.totalPages || 1);
                setTotalRecords(res.total || 0);
                
                if (!microForm.id) {
                    let max = 0;
                    (res.data || []).forEach((item: any) => {
                        if (item.code?.startsWith('CLS-')) {
                            const num = parseInt(item.code.replace('CLS-', ''), 10);
                            if (!isNaN(num) && num > max) max = num;
                        }
                    });
                    setMicroForm(prev => ({ ...prev, code: `CLS-${(max + 1).toString().padStart(3, '0')}` }));
                }
            }
        } catch (err) { console.error(err); } 
        finally { setIsTableLoading(false); }
    }

    const handleEdit = (item: any) => setMicroForm({ id: item.id, code: item.code, name: item.name, isActive: item.isActive });
    
    const handleCancel = () => {
        let max = 0;
        classes.forEach(item => {
            if (item.code?.startsWith('CLS-')) {
                const num = parseInt(item.code.replace('CLS-', ''), 10);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        setMicroForm({ id: undefined, code: `CLS-${(max + 1).toString().padStart(3, '0')}`, name: '', isActive: true });
    };

    const handleSave = () => {
        if (!microForm.name || !microForm.code) return alert("Code and Name are required.");
        startTransition(async () => {
            const res = await saveMicrobiologyMaster('antibioticClass', microForm);
            if (res.success) {
                await loadClasses(currentPage, searchTerm);
                setSuccessMessage(res.message);
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 1500);
                handleCancel();
            } else alert(res.message);
        });
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Are you sure you want to delete this class?")) return;
        const res = await deleteMicrobiologyMaster('antibioticClass', id);
        if (res.success) {
            await loadClasses(currentPage, searchTerm);
        } else alert(res.message);
    };

    const handleDeleteAll = async () => {
        if (totalRecords === 0) return alert("No records to delete.");
        if (!confirm("⚠️ WARNING: Are you sure you want to delete ALL Antibiotic Classes? This action cannot be undone!")) return;
        
        setIsTableLoading(true);
        const res = await deleteAllMicrobiologyMaster('antibioticClass');
        if (res.success) {
            await loadClasses(1, "");
            setSuccessMessage("All records deleted!");
            setShowSuccessPopup(true);
            setTimeout(() => setShowSuccessPopup(false), 1500);
        } else {
            alert(res.message);
        }
        setIsTableLoading(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                
                const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

                if (rawData.length === 0) throw new Error("Excel file is empty.");

                let nextCodeNum = totalRecords + 1;
                const formattedData: any[] = [];
                
                rawData.forEach(row => {
                    if (!row || row.length === 0) return;
                    
                    const val1 = String(row[0] || '').trim();
                    const val2 = String(row[1] || '').trim();
                    
                    if (!val1) return;
                    
                    if (val1.toLowerCase() === 'class' || val1.toLowerCase() === 'name' || val1.toLowerCase() === 'antibiotic class') return;

                    let code = "";
                    let name = "";

                    if (val2 && (val1.startsWith('CLS-') || /^[A-Z0-9]+$/.test(val1))) {
                        code = val1;
                        name = val2;
                    } else {
                        name = val1; 
                    }

                    if (!code) {
                        code = `CLS-${nextCodeNum.toString().padStart(3, '0')}`;
                        nextCodeNum++;
                    }

                    formattedData.push({ code: code.toUpperCase(), name });
                });

                if (formattedData.length === 0) throw new Error("Could not find any valid names to import.");

                const res = await importMicrobiologyMaster('antibioticClass', formattedData);
                if (res.success) {
                    await loadClasses(1, "");
                    setSuccessMessage(res.message);
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 2000);
                } else alert(res.message);
            } catch (error: any) { alert(error.message || "Error parsing Excel file."); } 
            finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const handleExport = async () => {
        if (totalRecords === 0) return alert("No data to export.");
        setIsTableLoading(true);
        try {
            const res = await getMicrobiologyMaster('antibioticClass');
            if(res.success) {
                const exportData = (res.data || []).map((item:any) => ({
                    Code: item.code,
                    Name: item.name,
                    Status: item.isActive ? 'Active' : 'Inactive'
                }));
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Antibiotic_Classes");
                XLSX.writeFile(wb, "Antibiotic_Classes_Master.xlsx");
            }
        } catch(e) {}
        setIsTableLoading(false);
    };

    // 🚨 REPLACED SPINNER WITH MUSIC BAR
    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#f1f5f9]"><MusicBarLoader text="Preparing Classes..." /></div>;

    return (
        <div className="h-full w-full bg-[#f1f5f9] p-4 md:p-6 flex flex-col font-sans text-slate-600 overflow-hidden relative">
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100"><CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} /></div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
                    </div>
                </div>
            )}

            <div className="flex-1 w-full flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className="w-full md:w-[350px] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                           {microForm.id ? <Edit2 size={16} className="text-blue-500"/> : <Plus size={16} className="text-[#9575cd]"/>}
                           {microForm.id ? `Edit Class` : `Add New Class`}
                        </h3>
                        {microForm.id && <button onClick={handleCancel} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-white border rounded">Cancel</button>}
                    </div>
                    <div className="p-6 space-y-5 flex-1">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wide">Class Code *</label>
                            <input type="text" value={microForm.code} onChange={(e) => setMicroForm({...microForm, code: e.target.value.toUpperCase()})} placeholder="E.g. CLS-001" className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#9575cd] bg-slate-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block tracking-wide">Class Name *</label>
                            <input type="text" value={microForm.name} onChange={(e) => setMicroForm({...microForm, name: e.target.value})} placeholder="E.g. Penicillins" className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:border-[#9575cd]" />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <input type="checkbox" checked={microForm.isActive} onChange={(e) => setMicroForm({...microForm, isActive: e.target.checked})} className="rounded text-[#9575cd] accent-[#9575cd] w-4 h-4 cursor-pointer" />
                            <span className="text-xs font-bold text-slate-700">Active Status</span>
                        </label>
                    </div>
                    <div className="p-5 border-t border-slate-100 bg-slate-50">
                        <button onClick={handleSave} disabled={isPending} className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-70" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
                            {isPending ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Class
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                    <header className="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 text-[#9575cd] rounded-lg shadow-sm"><Layers size={20}/></div>
                            <div>
                                <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">Antibiotic Classes</h1>
                                <span className="text-[11px] text-slate-500 font-medium">Total Configured: {totalRecords}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {/* SEARCH BOX */}
                            <div className="relative mr-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search classes..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] w-48 sm:w-56 transition-all bg-white"
                                />
                            </div>

                            <button onClick={handleExport} disabled={totalRecords === 0} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                                <Download size={14}/> Export
                            </button>
                            <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isImporting ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>} Import
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
                            <button onClick={handleDeleteAll} disabled={isPending || totalRecords === 0} className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                                <Trash2 size={14}/> Delete All
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                        {/* 🚨 REPLACED TABLE SPINNER WITH MUSIC BAR */}
                        {isTableLoading && (
                            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                <MusicBarLoader text="Loading Classes..." />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Code</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Class Name</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28 text-center">Status</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {classes.length === 0 && !isTableLoading ? (
                                    <tr><td colSpan={4} className="py-16 text-center text-slate-400 text-sm font-medium">No classes found.</td></tr>
                                ) : (
                                    classes.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-3 text-xs font-bold text-slate-400 w-24 font-mono">{item.code}</td>
                                            <td className="px-6 py-3 text-sm font-bold text-slate-700">{item.name}</td>
                                            <td className="px-6 py-3 w-28 text-center">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${item.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                                    {item.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 w-24">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded shadow-sm border border-transparent hover:border-blue-200 bg-white"><Edit2 size={14}/></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded shadow-sm border border-transparent hover:border-red-200 bg-white"><Trash2 size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                            <span className="text-xs font-medium text-slate-500">
                                Showing <span className="font-bold text-slate-700">{(currentPage - 1) * 20 + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * 20, totalRecords)}</span> of <span className="font-bold text-slate-700">{totalRecords}</span> entries
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => loadClasses(currentPage - 1, searchTerm)} 
                                    disabled={currentPage === 1 || isTableLoading}
                                    className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                                >
                                    <ChevronLeft size={16}/>
                                </button>
                                <span className="text-xs font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</span>
                                <button 
                                    onClick={() => loadClasses(currentPage + 1, searchTerm)} 
                                    disabled={currentPage >= totalPages || isTableLoading}
                                    className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                                >
                                    <ChevronRight size={16}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/antibiotic-classes/page.tsx CLOSE ---