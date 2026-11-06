"use client";

import React, { useState, useEffect, useTransition, useRef, useMemo } from 'react';
import { Save, Loader2, Bug, Edit2, Trash2, Plus, CheckCircle, Upload, ListChecks, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMicrobiologyMaster, getOrganismsPaginated, saveMicrobiologyMaster, deleteMicrobiologyMaster, deleteAllMicrobiologyMaster, importMicrobiologyMaster, mapOrganismAntibiotics } from '@/app/actions/microbiology';
import * as XLSX from 'xlsx';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function OrganismsPage(props: any) {
    const embedded = props?.embedded ?? false;
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // Pagination & Search States
    const [organisms, setOrganisms] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [allAntibiotics, setAllAntibiotics] = useState<any[]>([]);
    const [microForm, setMicroForm] = useState<{ id?: number, code: string, name: string, isActive: boolean }>({ code: '', name: '', isActive: true });
    
    const [mappingModalOpen, setMappingModalOpen] = useState(false);
    const [selectedOrganism, setSelectedOrganism] = useState<any>(null);
    const [selectedAntibioticIds, setSelectedAntibioticIds] = useState<number[]>([]);

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => { 
        loadInitialData(); 
    }, []);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadOrganisms(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function loadInitialData() {
        setIsLoading(true);
        const antiRes = await getMicrobiologyMaster('antibiotic');
        if (antiRes.success) {
            setAllAntibiotics((antiRes.data || []).filter((a: any) => a.isActive));
        }
        setIsLoading(false);
    }

    async function loadOrganisms(page: number, search: string) {
        setIsTableLoading(true);
        try {
            const res = await getOrganismsPaginated(page, 20, search);
            if (res.success) {
                setOrganisms(res.data || []);
                setCurrentPage(page);
                setTotalPages(res.totalPages || 1);
                setTotalRecords(res.total || 0);
                
                if (!microForm.id) {
                    let max = 0;
                    (res.data || []).forEach((item: any) => {
                        if (item.code?.startsWith('ORG-')) {
                            const num = parseInt(item.code.replace('ORG-', ''), 10);
                            if (!isNaN(num) && num > max) max = num;
                        }
                    });
                    setMicroForm(prev => ({ ...prev, code: `ORG-${(max + 1).toString().padStart(3, '0')}` }));
                }

                if (selectedOrganism) {
                    const refreshedOrg = (res.data || []).find((o: any) => o.id === (selectedOrganism as any).id);
                    if (refreshedOrg) setSelectedAntibioticIds((refreshedOrg as any).antibiotics?.map((a: any) => a.id) || []);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsTableLoading(false);
        }
    }

    const handleEdit = (item: any) => setMicroForm({ id: item.id, code: item.code, name: item.name, isActive: item.isActive });
    
    const handleCancel = () => {
        let max = 0;
        organisms.forEach(item => {
            if (item.code?.startsWith('ORG-')) {
                const num = parseInt(item.code.replace('ORG-', ''), 10);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        setMicroForm({ id: undefined, code: `ORG-${(max + 1).toString().padStart(3, '0')}`, name: '', isActive: true });
    };

    const handleSave = () => {
        if (!microForm.name || !microForm.code) return alert("Code and Name are required.");
        startTransition(async () => {
            const res = await saveMicrobiologyMaster('organism', microForm);
            if (res.success) {
                await loadOrganisms(currentPage, searchTerm);
                setSuccessMessage(res.message);
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 1500);
                handleCancel();
            } else alert(res.message);
        });
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Are you sure you want to delete this organism?")) return;
        const res = await deleteMicrobiologyMaster('organism', id);
        if (res.success) {
            await loadOrganisms(currentPage, searchTerm);
        } else alert(res.message);
    };

    const handleDeleteAll = async () => {
        if (totalRecords === 0) return alert("No records to delete.");
        if (!confirm("⚠️ WARNING: Are you sure you want to delete ALL Organisms? This action cannot be undone!")) return;
        
        setIsTableLoading(true);
        const res = await deleteAllMicrobiologyMaster('organism');
        if (res.success) {
            await loadOrganisms(1, "");
            setSuccessMessage("All records deleted!");
            setShowSuccessPopup(true);
            setTimeout(() => setShowSuccessPopup(false), 1500);
        } else {
            alert(res.message);
        }
        setIsTableLoading(false);
    };

    const openMappingModal = (organism: any) => {
        setSelectedOrganism(organism);
        setSelectedAntibioticIds((organism as any).antibiotics?.map((a: any) => a.id) || []);
        setMappingModalOpen(true);
    };

    const toggleAntibiotic = (antiId: number) => {
        setSelectedAntibioticIds(prev => 
            prev.includes(antiId) ? prev.filter(id => id !== antiId) : [...prev, antiId]
        );
    };

    const handleSelectAll = () => setSelectedAntibioticIds(allAntibiotics.map(a => a.id));
    const handleDeselectAll = () => setSelectedAntibioticIds([]);

    const saveMapping = () => {
        if (!selectedOrganism) return;
        startTransition(async () => {
            const res = await mapOrganismAntibiotics((selectedOrganism as any).id, selectedAntibioticIds);
            if (res.success) {
                await loadOrganisms(currentPage, searchTerm);
                setMappingModalOpen(false);
                setSuccessMessage(res.message);
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 1500);
            } else alert(res.message);
        });
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
                    
                    if (!val1 || val1.toLowerCase() === 'organism' || val1.toLowerCase() === 'name') return;

                    let code = "";
                    let name = "";

                    if (val2 && (val1.startsWith('ORG-') || /^[A-Z0-9]+$/.test(val1))) {
                        code = val1;
                        name = val2;
                    } else {
                        name = val1; 
                    }

                    if (!code) {
                        code = `ORG-${nextCodeNum.toString().padStart(3, '0')}`;
                        nextCodeNum++;
                    }

                    formattedData.push({ code: code.toUpperCase(), name });
                });

                if (formattedData.length === 0) throw new Error("Could not find any valid names to import.");

                const res = await importMicrobiologyMaster('organism', formattedData);
                if (res.success) {
                    await loadOrganisms(1, ""); 
                    setSuccessMessage(res.message);
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 2000);
                } else alert(res.message);
            } catch (error: any) { alert(error.message || "Error parsing Excel file."); } 
            finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
        };
        reader.readAsBinaryString(file);
    };

    const groupedAntibiotics = useMemo(() => {
        return allAntibiotics.reduce((acc, anti) => {
            const group = anti.group || 'Uncategorized';
            if (!acc[group]) acc[group] = [];
            acc[group].push(anti);
            return acc;
        }, {} as Record<string, any[]>);
    }, [allAntibiotics]);

    if (isLoading) return <div className="h-full flex items-center justify-center bg-white"><MusicBarLoader text="Preparing Organisms..." /></div>;

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

            {mappingModalOpen && selectedOrganism && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-3 sm:p-4">
                    <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                        <header className="px-3 xl:px-4 py-2 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                            <div className="flex items-center gap-2">
                                <ListChecks className="text-[#9575cd]" size={16}/>
                                <div>
                                    <h2 className="text-[15px] xl:text-[16px] font-semibold text-slate-800 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                        Antibiotic Panel Setup
                                    </h2>
                                    <span className="text-[10px] text-slate-500">
                                        Default antibiotics for: <strong className="text-slate-700">{(selectedOrganism as any).name}</strong>
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setMappingModalOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors">
                                <X size={16}/>
                            </button>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-3 bg-white custom-scrollbar space-y-2.5">
                            {allAntibiotics.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 flex flex-col items-center">
                                    <MusicBarLoader text="Loading antibiotics..." />
                                </div>
                            ) : (
                                Object.keys(groupedAntibiotics).sort().map(group => (
                                    <div key={group} className="border border-slate-200 rounded-[6px] overflow-hidden">
                                        <div className="bg-slate-50 px-2.5 py-1 border-b border-slate-200">
                                            <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{group}</h3>
                                        </div>
                                        <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                                            {groupedAntibiotics[group].map((anti: any) => (
                                                <label key={anti.id} className={`flex items-start gap-1.5 p-1.5 rounded border cursor-pointer transition-all ${selectedAntibioticIds.includes(anti.id) ? 'border-[#9575cd] bg-purple-50/50 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                                    <input type="checkbox" checked={selectedAntibioticIds.includes(anti.id)} onChange={() => toggleAntibiotic(anti.id)} className="mt-0.5 rounded text-[#9575cd] focus:ring-[#9575cd] accent-[#9575cd] cursor-pointer w-3.5 h-3.5 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className={`text-[11px] font-medium leading-tight truncate ${selectedAntibioticIds.includes(anti.id) ? 'text-[#7e57c2]' : 'text-slate-700'}`} title={anti.name}>{anti.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-mono leading-none mt-0.5 truncate">{anti.code}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <footer className="px-3 xl:px-4 py-2 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">{selectedAntibioticIds.length} Selected</span>
                                <div className="h-3.5 w-px bg-slate-300 hidden sm:block"></div>
                                <button onClick={handleSelectAll} className="text-[10px] font-bold text-[#9575cd] hover:text-[#7e57c2] transition-colors hidden sm:block uppercase tracking-wider">Select All</button>
                                <button onClick={handleDeselectAll} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors hidden sm:block uppercase tracking-wider">Deselect All</button>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => setMappingModalOpen(false)} className="h-[24px] xl:h-[26px] px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={saveMapping} disabled={isPending || allAntibiotics.length === 0} className="h-[24px] xl:h-[26px] px-3.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white shadow-2xs hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-1.5" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
                                    {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Save Panel
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            )}

            {/* SUB-HEADER TOOLBAR (FLUSH UNDER MAIN TABS) */}
            <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-purple-50 text-[#9575cd]">
                        <Bug size={14}/>
                    </div>
                    <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Organisms Master
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
                            placeholder="Search organisms..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-[24px] xl:h-[26px] w-36 sm:w-48 pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
                        />
                    </div>

                    <input type="file" accept=".xlsx, .xls, .csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isImporting} 
                        className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] xl:text-[12px] font-medium flex items-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                        {isImporting ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>} Import
                    </button>
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
                           {microForm.id ? <Edit2 size={13} className="text-teal-600"/> : <Plus size={13} className="text-[#9575cd]"/>}
                           {microForm.id ? `Edit Organism` : `Add New Organism`}
                        </h3>
                        {microForm.id && (
                            <button onClick={handleCancel} className="h-[20px] md:h-[22px] px-1.5 text-[10px] text-slate-500 hover:text-slate-700 bg-white border border-slate-300 rounded shadow-2xs">
                                Cancel
                            </button>
                        )}
                    </div>
                    <div className="p-3 xl:p-3.5 space-y-3 flex-1 overflow-y-auto">
                        <div>
                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Organism Code *</label>
                            <input 
                                type="text" 
                                value={microForm.code} 
                                onChange={(e) => setMicroForm({...microForm, code: e.target.value.toUpperCase()})} 
                                placeholder="E.g. ORG-001" 
                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#9575cd]" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Organism Name *</label>
                            <input 
                                type="text" 
                                value={microForm.name} 
                                onChange={(e) => setMicroForm({...microForm, name: e.target.value})} 
                                placeholder="E.g. Staphylococcus aureus" 
                                className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 rounded-[5px] border border-slate-200">
                            <input 
                                type="checkbox" 
                                checked={microForm.isActive} 
                                onChange={(e) => setMicroForm({...microForm, isActive: e.target.checked})} 
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
                            {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Save Organism
                        </button>
                    </div>
                </div>

                {/* RIGHT TABLE BLOCK (SEPARATE CARD LIKE PATIENT LIST) */}
                <div className="flex-1 bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden flex flex-col min-h-0 relative">
                    <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative bg-white">
                        {isTableLoading && (
                            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                                <MusicBarLoader text="Loading Organisms..." />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse border-spacing-0">
                            <thead className="bg-[#9575cd] border-b border-[#7e57c2] sticky top-0 z-10 shadow-2xs text-white">
                                <tr>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Code</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Organism Name</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Panel</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                                    <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-20 text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organisms.length === 0 && !isTableLoading ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-[11px] font-normal">No organisms found.</td></tr>
                                ) : (
                                    organisms.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-500 font-mono">{item.code}</td>
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-700">{item.name}</td>
                                            
                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                                <button onClick={() => openMappingModal(item)} className={`h-[20px] md:h-[22px] px-2 rounded-[4px] text-[10px] font-medium transition-all border shadow-2xs flex items-center justify-center gap-1 mx-auto ${(item as any).antibiotics?.length > 0 ? 'bg-purple-50 text-[#7e57c2] border-purple-200 hover:bg-purple-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                                    <ListChecks size={11}/> {(item as any).antibiotics?.length || 0} Linked
                                                </button>
                                            </td>

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
                                                        title="Edit Organism"
                                                    >
                                                        <Edit2 size={14} strokeWidth={2}/>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)} 
                                                        className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 shadow-2xs text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                                                        title="Delete Organism"
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
                                    onClick={() => loadOrganisms(currentPage - 1, searchTerm)} 
                                    disabled={currentPage === 1 || isTableLoading}
                                    className="h-[22px] w-[22px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                >
                                    <ChevronLeft size={13}/>
                                </button>
                                <span className="text-[11px] font-medium text-slate-700 px-1">Page {currentPage} of {totalPages}</span>
                                <button 
                                    onClick={() => loadOrganisms(currentPage + 1, searchTerm)} 
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
                            <Bug size={16} />
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Organisms Master
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
