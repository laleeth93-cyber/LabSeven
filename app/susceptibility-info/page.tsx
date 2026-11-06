"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Save, Loader2, Search, Bug, Pill, CheckCircle, ChevronLeft, ChevronRight, AlertCircle, FileText, X, Trash2 } from 'lucide-react';
import { getOrganismsPaginated, getMicrobiologyMaster, saveMicrobiologyMaster, deleteMicrobiologyMaster } from '@/app/actions/microbiology';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function SusceptibilityInfoPage(props: any) {
    const embedded = props?.embedded ?? false;
    const [isPending, startTransition] = useTransition();
    
    // UI Loading States
    const [isLoading, setIsLoading] = useState(true); 
    const [isTableLoading, setIsTableLoading] = useState(false); 
    
    // Master Background Data
    const [masterInterpretations, setMasterInterpretations] = useState<any[]>([]);
    const [masterAntibiotics, setMasterAntibiotics] = useState<any[]>([]);
    const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

    // Left Pane State (Paginated Organisms)
    const [organisms, setOrganisms] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");

    // Right Pane & Form State
    const [form, setForm] = useState<{ id?: number, code: string, name: string, isActive: boolean }>({ code: '', name: '', isActive: true });
    const [selectedOrganisms, setSelectedOrganisms] = useState<any[]>([]);
    const [activeOrganismId, setActiveOrganismId] = useState<number | null>(null);
    
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Initial Background Load
    useEffect(() => {
        loadBackgroundMasters();
    }, []);

    // Debounced Search & Pagination Load
    useEffect(() => {
        const timer = setTimeout(() => {
            loadOrganisms(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function loadBackgroundMasters() {
        try {
            const [intRes, antiRes, infoRes] = await Promise.all([
                getMicrobiologyMaster('interpretation'),
                getMicrobiologyMaster('antibiotic'),
                getMicrobiologyMaster('susceptibilityInfo') 
            ]);

            if (intRes.success) setMasterInterpretations(intRes.data || []);
            if (antiRes.success) setMasterAntibiotics(antiRes.data || []);
            if (infoRes.success) {
                setSavedTemplates(infoRes.data || []);
                if (!form.id) {
                    setForm(prev => ({ ...prev, code: generateNextCode(infoRes.data || []) }));
                }
            }

            setIsLoading(false);
        } catch (err) { 
            console.error(err); 
            setIsLoading(false);
        }
    }

    const generateNextCode = (items: any[]) => {
        let max = 0;
        items.forEach(item => {
            if (item.code?.startsWith('INF-')) {
                const num = parseInt(item.code.replace('INF-', ''), 10);
                if (!isNaN(num) && num > max) max = num;
            }
        });
        return `INF-${(max + 1).toString().padStart(3, '0')}`;
    };

    async function loadOrganisms(page: number, search: string) {
        setIsTableLoading(true);
        try {
            const res = await getOrganismsPaginated(page, 20, search);
            if (res.success) {
                setOrganisms(res.data || []);
                setCurrentPage(page);
                setTotalPages(res.totalPages || 1);
                setTotalRecords(res.total || 0);
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsTableLoading(false); 
        }
    }

    const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (!id) {
            handleCancel();
            return;
        }
        const selected = savedTemplates.find(i => i.id.toString() === id);
        if (selected) {
            setForm({ id: selected.id, code: selected.code, name: selected.name, isActive: selected.isActive });
            try {
                const parsedDetails = JSON.parse(selected.details || '[]');
                setSelectedOrganisms(parsedDetails);
                if (parsedDetails.length > 0) setActiveOrganismId(parsedDetails[0].id);
                else setActiveOrganismId(null);
            } catch (e) {
                setSelectedOrganisms([]);
                setActiveOrganismId(null);
            }
        }
    };

    const handleCancel = () => {
        setForm({ id: undefined, code: generateNextCode(savedTemplates), name: '', isActive: true });
        setSelectedOrganisms([]);
        setActiveOrganismId(null);
    };

    const handleToggleOrganism = (org: any) => {
        const exists = selectedOrganisms.find(o => o.id === org.id);
        
        if (exists) {
            const updated = selectedOrganisms.filter(o => o.id !== org.id);
            setSelectedOrganisms(updated);
            if (activeOrganismId === org.id) {
                setActiveOrganismId(updated.length > 0 ? updated[0].id : null);
            }
        } else {
            const defaultAntibiotics = (org.antibiotics || []).map((linkedAnti: any) => {
                const fullAnti = masterAntibiotics.find(a => a.id === linkedAnti.id) || linkedAnti;
                return {
                    id: fullAnti.id,
                    name: fullAnti.name || 'Unknown Antibiotic',
                    result: '',
                    value: '',
                    interpretation: '',
                    breakPoint: '',
                    mic: ''
                };
            });

            const newOrg = {
                id: org.id,
                code: org.code,
                name: org.name,
                antibioticResults: defaultAntibiotics
            };

            setSelectedOrganisms([...selectedOrganisms, newOrg]);
            setActiveOrganismId(org.id);
        }
    };

    const handleUpdateCell = (orgId: number, antiId: number, field: string, value: string) => {
        setSelectedOrganisms(prev => prev.map(org => {
            if (org.id !== orgId) return org;
            return {
                ...org,
                antibioticResults: org.antibioticResults.map((anti: any) => {
                    if (anti.id !== antiId) return anti;
                    return { ...anti, [field]: value };
                })
            };
        }));
    };

    const handleSave = () => {
        if (!form.name || !form.code) return alert("Code and Configuration Title are required.");
        if (selectedOrganisms.length === 0) return alert("Please select at least one organism.");

        const payload = {
            id: form.id,
            code: form.code,
            name: form.name,
            details: JSON.stringify(selectedOrganisms),
            isActive: form.isActive
        };

        startTransition(async () => {
            const res = await saveMicrobiologyMaster('susceptibilityInfo', payload);
            if (res.success) {
                setSuccessMessage("Configuration saved successfully!");
                setShowSuccessPopup(true);
                
                const infoRes = await getMicrobiologyMaster('susceptibilityInfo');
                if (infoRes.success) setSavedTemplates(infoRes.data || []);
                
                setTimeout(() => setShowSuccessPopup(false), 1500);
            } else {
                alert(res.message);
            }
        });
    };

    const handleDelete = async () => {
        if (!form.id) return;
        if(!confirm("Are you sure you want to delete this configuration?")) return;
        const res = await deleteMicrobiologyMaster('susceptibilityInfo', form.id);
        if (res.success) {
            const infoRes = await getMicrobiologyMaster('susceptibilityInfo');
            if (infoRes.success) setSavedTemplates(infoRes.data || []);
            handleCancel();
        } else alert(res.message);
    };

    if (isLoading) return <div className="h-full flex items-center justify-center bg-white"><MusicBarLoader text="Loading Master Data..." /></div>;

    const activeOrganismData = selectedOrganisms.find(o => o.id === activeOrganismId);

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

            {/* TOP HEADER CONTROLS TOOLBAR */}
            <div className="min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] px-2.5 xl:px-3 bg-white md:bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar">
                    <div className="p-1 rounded bg-blue-50 text-blue-600 shrink-0">
                        <FileText size={14} />
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Config:</label>
                        <select 
                            value={form.id || ""} 
                            onChange={handleSelectTemplate}
                            className="h-[24px] xl:h-[26px] text-[11px] xl:text-[12px] font-medium text-slate-700 border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd] cursor-pointer"
                        >
                            <option value="">-- Create New --</option>
                            {savedTemplates.map(info => (
                                <option key={info.id} value={info.id}>{info.code} : {info.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="w-px h-4 bg-slate-300 mx-1 hidden sm:block shrink-0"></div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <input 
                            type="text" 
                            value={form.code} 
                            onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
                            placeholder="Code" 
                            className="h-[24px] xl:h-[26px] w-20 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd]" 
                        />
                    </div>
                    <div className="flex-1 min-w-[140px] max-w-sm">
                        <input 
                            type="text" 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            placeholder="Configuration Title (e.g. Blood Culture Profile)" 
                            className="w-full h-[24px] xl:h-[26px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd]" 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    {form.id && (
                        <button 
                            onClick={handleDelete} 
                            className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] xl:text-[12px] font-medium flex items-center gap-1 transition-colors shadow-2xs"
                        >
                            <Trash2 size={13}/> Delete
                        </button>
                    )}
                    <button 
                        onClick={handleCancel} 
                        className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-[11px] xl:text-[12px] font-medium shadow-2xs transition-colors"
                    >
                        Reset
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isPending} 
                        className="h-[24px] xl:h-[26px] px-3.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50" 
                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                    >
                        {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} Save Setup
                    </button>
                </div>
            </div>

            {/* CONTENT AREA: SEPARATE BLOCKS WITH SPACING MATCHING PATIENT LIST & RESULT ENTRY */}
            <div className="flex-1 overflow-hidden bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 flex flex-col md:flex-row gap-2.5 xl:gap-3 min-h-0">
                {/* LEFT PANE - PAGINATED ORGANISM MASTER BLOCK */}
                <div className="w-full md:w-[260px] xl:w-[280px] bg-white border border-slate-200 rounded-[6px] shadow-sm flex flex-col shrink-0 min-h-0 overflow-hidden relative">
                    <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 shrink-0">
                        <div className="relative w-full">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input 
                                type="text" 
                                placeholder="Search organisms..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-[22px] xl:h-[24px] pl-6 pr-2 bg-white border border-slate-300 rounded-[5px] text-[11px] font-normal focus:outline-none focus:border-[#9575cd]"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                        {isTableLoading && (
                            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                                <MusicBarLoader text="Loading Organisms..." />
                            </div>
                        )}

                        {organisms.length === 0 && !isTableLoading ? (
                            <div className="text-center p-6 text-slate-400">
                                <AlertCircle size={18} className="mx-auto mb-1.5 opacity-50"/>
                                <p className="text-[11px] font-normal">No organisms found.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {organisms.map((org) => {
                                    const isSelected = selectedOrganisms.some(o => o.id === org.id);
                                    return (
                                        <label 
                                            key={org.id}
                                            className={`w-full text-left px-2.5 py-1.5 border-b border-slate-100 transition-colors flex items-center gap-2 cursor-pointer group ${
                                                isSelected ? 'bg-purple-50/70' : 'bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => handleToggleOrganism(org)}
                                                className="rounded text-[#9575cd] focus:ring-[#9575cd] accent-[#9575cd] cursor-pointer w-3.5 h-3.5 shrink-0"
                                            />
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className={`text-[10px] font-mono w-14 shrink-0 ${isSelected ? 'text-[#9575cd] font-semibold' : 'text-slate-400 font-normal'}`}>
                                                    {org.code}
                                                </span>
                                                <span className={`text-[11px] truncate ${isSelected ? 'text-[#7e57c2] font-semibold' : 'text-slate-700 font-normal'}`}>
                                                    {org.name}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="min-h-[26px] h-[26px] px-2.5 bg-[#f8fafc] border-t border-slate-200 flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-normal text-slate-500">
                                Pg {currentPage} / {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => loadOrganisms(currentPage - 1, searchTerm)} 
                                    disabled={currentPage === 1 || isTableLoading}
                                    className="h-[20px] w-[20px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                >
                                    <ChevronLeft size={12}/>
                                </button>
                                <button 
                                    onClick={() => loadOrganisms(currentPage + 1, searchTerm)} 
                                    disabled={currentPage >= totalPages || isTableLoading}
                                    className="h-[20px] w-[20px] rounded border border-slate-300 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                                >
                                    <ChevronRight size={12}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT PANE - SUSCEPTIBILITY TABLE BLOCK */}
                <div className="flex-1 bg-white border border-slate-200 rounded-[6px] shadow-sm overflow-hidden flex flex-col min-h-0 relative">
                    {selectedOrganisms.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                            <Pill size={36} className="mb-2.5 opacity-20" />
                            <p className="text-sm font-semibold text-slate-600">No Organisms Selected</p>
                            <p className="text-xs text-slate-400 mt-0.5">Check organisms from the left list to build the susceptibility panel.</p>
                        </div>
                    ) : (
                        <>
                            {/* TOP TABS FOR SELECTED ORGANISMS */}
                            <div className="min-h-[32px] h-[32px] px-2.5 bg-[#f8fafc] border-b border-slate-200 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                                {selectedOrganisms.map((org, index) => (
                                    <div 
                                        key={org.id}
                                        onClick={() => setActiveOrganismId(org.id)}
                                        className={`h-[22px] px-2 rounded-[4px] text-[11px] font-normal cursor-pointer transition-all shrink-0 flex items-center gap-1.5 border ${
                                            activeOrganismId === org.id 
                                                ? 'bg-white border-[#9575cd] text-[#7e57c2] font-medium shadow-2xs' 
                                                : 'bg-white/80 border-slate-200 text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <span className={`flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] ${activeOrganismId === org.id ? 'bg-purple-100 text-[#7e57c2]' : 'bg-slate-100 text-slate-500'}`}>
                                            {index + 1}
                                        </span>
                                        <span className="truncate max-w-[140px]">{org.name}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleToggleOrganism(org); }} 
                                            className="p-0.5 rounded hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-colors"
                                            title="Remove Organism"
                                        >
                                            <X size={11}/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Table for the Active Organism Tab */}
                            {activeOrganismData && (
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse border-spacing-0 min-w-[650px]">
                                        <thead className="bg-[#9575cd] border-b border-[#7e57c2] sticky top-0 z-10 shadow-2xs text-white">
                                            <tr>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-48" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Antibiotic Name</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Result</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Value</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-32" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Interpretation</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-28" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>BreakPoint</th>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-28" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>MIC (µg/ml)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activeOrganismData.antibioticResults.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-400 text-[11px] font-normal">
                                                        No default antibiotics linked to this organism.<br/>
                                                        <span className="text-[10px] text-slate-400">Go to Organisms Master to map antibiotics to this organism.</span>
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeOrganismData.antibioticResults.map((anti: any) => (
                                                    <tr key={anti.id} className="hover:bg-slate-50/80 transition-colors group">
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-700 bg-slate-50/30">
                                                            {anti.name}
                                                        </td>
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                            <input 
                                                                type="text" 
                                                                value={anti.result}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'result', e.target.value)}
                                                                className="w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-300 hover:border-slate-400 rounded-[4px] px-2 focus:border-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-2xs"
                                                            />
                                                        </td>
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                            <input 
                                                                type="text" 
                                                                value={anti.value}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'value', e.target.value)}
                                                                className="w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-300 hover:border-slate-400 rounded-[4px] px-2 focus:border-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-2xs"
                                                            />
                                                        </td>
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                            <select 
                                                                value={anti.interpretation}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'interpretation', e.target.value)}
                                                                className="w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-300 hover:border-slate-400 rounded-[4px] px-1.5 outline-none focus:border-[#9575cd] cursor-pointer bg-white transition-all shadow-2xs"
                                                            >
                                                                <option value="">- Select -</option>
                                                                {masterInterpretations.filter(i => i.isActive).map(int => (
                                                                    <option key={int.id} value={int.name}>{int.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                            <input 
                                                                type="text" 
                                                                value={anti.breakPoint}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'breakPoint', e.target.value)}
                                                                className="w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-300 hover:border-slate-400 rounded-[4px] px-2 focus:border-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-2xs"
                                                            />
                                                        </td>
                                                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                                            <input 
                                                                type="text" 
                                                                value={anti.mic}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'mic', e.target.value)}
                                                                className="w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-300 hover:border-slate-400 rounded-[4px] px-2 focus:border-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-2xs"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
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
                            Susceptibility Info
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
