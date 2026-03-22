// --- BLOCK app/susceptibility-info/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Save, Loader2, Search, Bug, Pill, CheckCircle, ChevronLeft, ChevronRight, AlertCircle, FileText, X, Trash2 } from 'lucide-react';
import { getOrganismsPaginated, getMicrobiologyMaster, saveMicrobiologyMaster, deleteMicrobiologyMaster } from '@/app/actions/microbiology';

export default function SusceptibilityInfoPage() {
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

    // Toggle Organism Checkbox
    const handleToggleOrganism = (org: any) => {
        const exists = selectedOrganisms.find(o => o.id === org.id);
        
        if (exists) {
            // Remove it
            const updated = selectedOrganisms.filter(o => o.id !== org.id);
            setSelectedOrganisms(updated);
            if (activeOrganismId === org.id) {
                setActiveOrganismId(updated.length > 0 ? updated[0].id : null);
            }
        } else {
            // Add it and build default antibiotic panel
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

    if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-500 gap-2 bg-[#f1f5f9]"><Loader2 className="animate-spin text-[#9575cd]" size={32}/> Loading Master Data...</div>;

    const activeOrganismData = selectedOrganisms.find(o => o.id === activeOrganismId);

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

            {/* TOP HEADER CONTROLS */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-4 shrink-0 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 p-2 rounded-lg">
                        <FileText size={20} />
                    </div>
                    <div className="flex-1 max-w-xs">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Load Saved Configuration</label>
                        <select 
                            value={form.id || ""} 
                            onChange={handleSelectTemplate}
                            className="w-full text-sm font-bold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#9575cd] bg-slate-50 cursor-pointer"
                        >
                            <option value="">-- Create New Configuration --</option>
                            {savedTemplates.map(info => (
                                <option key={info.id} value={info.id}>{info.code} : {info.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="w-px h-10 bg-slate-200 mx-2 hidden md:block"></div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Config Code *</label>
                        <input type="text" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-24 text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#9575cd]" />
                    </div>
                    <div className="flex-1 max-w-sm">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Configuration Title *</label>
                        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="E.g. Blood Culture Profile" className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#9575cd]" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {form.id && (
                        <button onClick={handleDelete} className="px-4 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-2">
                            <Trash2 size={16}/> Delete
                        </button>
                    )}
                    <button onClick={handleCancel} className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors">
                        Reset
                    </button>
                    <button onClick={handleSave} disabled={isPending} className="px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
                        {isPending ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Setup
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full flex overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
                
                {/* PARTITION 1: LEFT SIDE - PAGINATED ORGANISM LIST */}
                <div className="w-[320px] border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 relative">
                    
                    {/* Header & Search */}
                    <div className="p-3 border-b border-slate-200 bg-white shrink-0">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
                            <Bug className="text-[#9575cd]" size={16}/> Organisms Master
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search organisms..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] transition-all"
                            />
                        </div>
                    </div>

                    {/* COMPACT EXCEL-STYLE Organism List with Checkboxes */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                        {isTableLoading && (
                            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                                <Loader2 className="animate-spin text-[#9575cd]" size={24}/>
                            </div>
                        )}

                        {organisms.length === 0 && !isTableLoading ? (
                            <div className="text-center p-6 text-slate-400">
                                <AlertCircle size={20} className="mx-auto mb-2 opacity-50"/>
                                <p className="text-xs font-medium">No organisms found.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {organisms.map((org) => {
                                    const isSelected = selectedOrganisms.some(o => o.id === org.id);
                                    return (
                                        <label 
                                            key={org.id}
                                            className={`w-full text-left px-3 py-2 border-b border-slate-100 transition-colors flex items-center gap-3 cursor-pointer group ${
                                                isSelected ? 'bg-purple-50/50' : 'bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => handleToggleOrganism(org)}
                                                className="rounded text-[#9575cd] focus:ring-[#9575cd] accent-[#9575cd] cursor-pointer w-4 h-4 shrink-0 mt-0.5"
                                            />
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className={`text-[10px] font-mono w-14 shrink-0 ${isSelected ? 'text-[#9575cd] font-bold' : 'text-slate-400'}`}>
                                                    {org.code}
                                                </span>
                                                <span className={`text-xs truncate ${isSelected ? 'text-[#7e57c2] font-bold' : 'text-slate-700 font-semibold'}`}>
                                                    {org.name}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Left Pane Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                            <span className="text-[10px] font-bold text-slate-500">
                                Pg {currentPage} / {totalPages}
                            </span>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => loadOrganisms(currentPage - 1, searchTerm)} 
                                    disabled={currentPage === 1 || isTableLoading}
                                    className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft size={14}/>
                                </button>
                                <button 
                                    onClick={() => loadOrganisms(currentPage + 1, searchTerm)} 
                                    disabled={currentPage >= totalPages || isTableLoading}
                                    className="p-1 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight size={14}/>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* PARTITION 2: RIGHT SIDE - SUSCEPTIBILITY DATA ENTRY */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {selectedOrganisms.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                            <Pill size={48} className="mb-4 opacity-20" />
                            <p className="text-base font-bold text-slate-500">No Organisms Selected</p>
                            <p className="text-sm mt-1">Check organisms from the left list to build the susceptibility panel.</p>
                        </div>
                    ) : (
                        <>
                            {/* TOP TABS/BUTTONS FOR SELECTED ORGANISMS */}
                            <div className="p-3 border-b border-slate-200 bg-slate-50 shadow-sm z-10 shrink-0 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                                {selectedOrganisms.map((org, index) => (
                                    <div 
                                        key={org.id}
                                        onClick={() => setActiveOrganismId(org.id)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all shrink-0 border ${
                                            activeOrganismId === org.id 
                                                ? 'bg-white border-[#9575cd] text-[#7e57c2] shadow-sm' 
                                                : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] ${activeOrganismId === org.id ? 'bg-purple-100' : 'bg-white'}`}>
                                            {index + 1}
                                        </span>
                                        {org.name}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleToggleOrganism(org); }} 
                                            className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors text-slate-400"
                                            title="Remove Organism"
                                        >
                                            <X size={12}/>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Right Pane Table for the Active Organism Tab */}
                            {activeOrganismData && (
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead className="bg-white sticky top-0 z-20 shadow-sm outline outline-1 outline-slate-200">
                                            <tr>
                                                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-48">Antibiotic Name</th>
                                                <th className="px-2 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Result</th>
                                                <th className="px-2 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Value</th>
                                                <th className="px-2 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">Interpretation</th>
                                                <th className="px-2 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28">BreakPoint</th>
                                                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28">MIC (µg/ml)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {activeOrganismData.antibioticResults.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-16 text-center text-slate-400 text-sm font-medium">
                                                        No default antibiotics linked to this organism.<br/>
                                                        <span className="text-xs text-slate-400">Go to Organisms Master to map antibiotics to this organism.</span>
                                                    </td>
                                                </tr>
                                            ) : (
                                                activeOrganismData.antibioticResults.map((anti: any) => (
                                                    <tr key={anti.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50/30 border-r border-slate-100">
                                                            {anti.name}
                                                        </td>
                                                        <td className="px-2 py-2.5">
                                                            <input 
                                                                type="text" 
                                                                value={anti.result}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'result', e.target.value)}
                                                                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2.5">
                                                            <input 
                                                                type="text" 
                                                                value={anti.value}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'value', e.target.value)}
                                                                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2.5">
                                                            <select 
                                                                value={anti.interpretation}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'interpretation', e.target.value)}
                                                                className="w-full text-xs font-bold text-slate-700 border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] cursor-pointer bg-white transition-all shadow-sm"
                                                            >
                                                                <option value="">- Select -</option>
                                                                {masterInterpretations.filter(i => i.isActive).map(int => (
                                                                    <option key={int.id} value={int.name}>{int.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-2 py-2.5">
                                                            <input 
                                                                type="text" 
                                                                value={anti.breakPoint}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'breakPoint', e.target.value)}
                                                                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2.5">
                                                            <input 
                                                                type="text" 
                                                                value={anti.mic}
                                                                onChange={(e) => handleUpdateCell(activeOrganismData.id, anti.id, 'mic', e.target.value)}
                                                                className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
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
}
// --- BLOCK app/susceptibility-info/page.tsx CLOSE ---