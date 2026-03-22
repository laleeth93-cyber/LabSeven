// --- BLOCK app/results/entry/components/CultureSensitivityModal.tsx OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Bug, Pill, CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMicrobiologyMaster, getOrganismsPaginated } from '@/app/actions/microbiology';

interface CultureSensitivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cultureData: any) => void;
    initialData?: any;
}

export default function CultureSensitivityModal({ isOpen, onClose, onSave, initialData }: CultureSensitivityModalProps) {
    // --- LOADING STATES ---
    const [isLoading, setIsLoading] = useState(true);
    const [isTableLoading, setIsTableLoading] = useState(false);
    
    // --- MASTER DATA ---
    const [masterInterpretations, setMasterInterpretations] = useState<any[]>([]);
    const [masterAntibiotics, setMasterAntibiotics] = useState<any[]>([]);
    const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

    // --- LEFT PANE (PAGINATED ORGANISMS) STATE ---
    const [organisms, setOrganisms] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    // --- RIGHT PANE (SELECTED ORGANISMS) STATE ---
    const [selectedOrganisms, setSelectedOrganisms] = useState<any[]>([]);
    const [activeOrganismId, setActiveOrganismId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadBackgroundMasters();
            loadOrganisms(1, ""); // Load first page
        }
    }, [isOpen]);

    // Debounced Search for Organisms
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            loadOrganisms(1, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    async function loadBackgroundMasters() {
        setIsLoading(true);
        try {
            const [intRes, antiRes, tempRes] = await Promise.all([
                getMicrobiologyMaster('interpretation'),
                getMicrobiologyMaster('antibiotic'),
                getMicrobiologyMaster('susceptibilityInfo')
            ]);

            if (intRes.success) setMasterInterpretations(intRes.data || []);
            if (antiRes.success) setMasterAntibiotics(antiRes.data || []);
            if (tempRes.success) setSavedTemplates(tempRes.data || []);

            // Load initial data if editing an existing result
            if (initialData && initialData.organisms) {
                setSelectedOrganisms(initialData.organisms);
                if (initialData.organisms.length > 0) setActiveOrganismId(initialData.organisms[0].id);
            } else {
                setSelectedOrganisms([]);
                setActiveOrganismId(null);
            }
        } catch (error) {
            console.error("Error loading microbiology masters:", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadOrganisms(page: number, search: string) {
        setIsTableLoading(true);
        try {
            const res = await getOrganismsPaginated(page, 20, search);
            if (res.success) {
                setOrganisms(res.data || []);
                setCurrentPage(page);
                setTotalPages(res.totalPages || 1);
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            setIsTableLoading(false); 
        }
    }

    // Toggle Organism Checkbox (Matches Configuration Screen Logic)
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
            // Add it: Check for saved template, otherwise load defaults
            const existingTemplate = savedTemplates.find(t => t.code === org.code);
            let activePanelData = [];

            if (existingTemplate && existingTemplate.details) {
                try {
                    activePanelData = JSON.parse(existingTemplate.details);
                } catch (e) { console.error("Error parsing saved template data"); }
            }

            if (activePanelData.length === 0) {
                activePanelData = (org.antibiotics || []).map((linkedAnti: any) => {
                    const fullAnti = masterAntibiotics.find(a => a.id === linkedAnti.id) || linkedAnti;
                    return {
                        id: fullAnti.id, name: fullAnti.name, result: '', value: '', interpretation: '', breakPoint: '', mic: ''
                    };
                });
            }

            const newOrg = { id: org.id, code: org.code, name: org.name, antibioticResults: activePanelData };
            setSelectedOrganisms([...selectedOrganisms, newOrg]);
            setActiveOrganismId(org.id);
        }
    };

    const handleUpdateAntibiotic = (orgId: number, antiId: number, field: string, value: string) => {
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
        onSave({ organisms: selectedOrganisms });
        onClose();
    };

    if (!isOpen) return null;

    const activeOrganismData = selectedOrganisms.find(o => o.id === activeOrganismId);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#f1f5f9] rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-300">
                
                {/* Header */}
                <header className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Bug className="text-[#9575cd]" size={20}/> Culture & Susceptibility Entry
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Select organisms to apply their susceptibility profiles.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20}/>
                    </button>
                </header>

                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white">
                        <Loader2 className="animate-spin text-[#9575cd]" size={32} />
                        <p className="text-sm font-medium">Loading Master Data...</p>
                    </div>
                ) : (
                    <div className="flex-1 flex overflow-hidden p-4 gap-4">
                        
                        {/* PARTITION 1: LEFT SIDE - PAGINATED ORGANISM LIST */}
                        <div className="w-[320px] border border-slate-200 rounded-xl bg-white flex flex-col shrink-0 shadow-sm overflow-hidden">
                            
                            {/* Search Box */}
                            <div className="p-3 border-b border-slate-200 bg-slate-50 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search organisms..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* COMPACT CHECKBOX LIST */}
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
                                                    className={`w-full text-left px-4 py-2.5 border-b border-slate-50 transition-colors flex items-center gap-3 cursor-pointer group ${
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

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                                    <span className="text-[10px] font-bold text-slate-500">
                                        Pg {currentPage} / {totalPages}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => loadOrganisms(currentPage - 1, searchTerm)} 
                                            disabled={currentPage === 1 || isTableLoading}
                                            className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            <ChevronLeft size={14}/>
                                        </button>
                                        <button 
                                            onClick={() => loadOrganisms(currentPage + 1, searchTerm)} 
                                            disabled={currentPage >= totalPages || isTableLoading}
                                            className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            <ChevronRight size={14}/>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PARTITION 2: RIGHT SIDE - ANTIBIOTIC TABS AND TABLE */}
                        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
                            {selectedOrganisms.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                                    <Pill size={48} className="mb-4 opacity-20" />
                                    <p className="text-base font-bold text-slate-500">No Organisms Selected</p>
                                    <p className="text-sm mt-1">Check organisms from the left list to enter results.</p>
                                </div>
                            ) : (
                                <>
                                    {/* TOP TABS FOR SELECTED ORGANISMS */}
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

                                    {/* TABLE FOR ACTIVE ORGANISM */}
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
                                                                No default antibiotics linked to this organism.
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
                                                                        onChange={(e) => handleUpdateAntibiotic(activeOrganismData.id, anti.id, 'result', e.target.value)}
                                                                        className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                                        placeholder="-"
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-2.5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={anti.value}
                                                                        onChange={(e) => handleUpdateAntibiotic(activeOrganismData.id, anti.id, 'value', e.target.value)}
                                                                        className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                                        placeholder="-"
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-2.5">
                                                                    <select 
                                                                        value={anti.interpretation}
                                                                        onChange={(e) => handleUpdateAntibiotic(activeOrganismData.id, anti.id, 'interpretation', e.target.value)}
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
                                                                        onChange={(e) => handleUpdateAntibiotic(activeOrganismData.id, anti.id, 'breakPoint', e.target.value)}
                                                                        className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                                        placeholder="-"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={anti.mic}
                                                                        onChange={(e) => handleUpdateAntibiotic(activeOrganismData.id, anti.id, 'mic', e.target.value)}
                                                                        className="w-full text-xs font-medium border border-slate-200 hover:border-slate-300 rounded px-2 py-1.5 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] focus:bg-white outline-none bg-white transition-all shadow-sm"
                                                                        placeholder="-"
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
                )}

                {/* Footer Controls */}
                <footer className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="px-8 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2" 
                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                    >
                        <CheckCircle size={16}/> Save Results to Bill
                    </button>
                </footer>
            </div>
        </div>
    );
}
// --- BLOCK app/results/entry/components/CultureSensitivityModal.tsx CLOSE ---