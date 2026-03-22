"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare, Square, Calculator } from 'lucide-react';

interface ParameterOption {
    uiId: string;
    code: string;
    name: string;
    isCountDependent: boolean;
}

interface CountTargetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (targetCount: number, selectedUiIds: string[]) => void;
    initialTargetCount?: number | string | null;
    availableParams: ParameterOption[];
}

export default function CountTargetModal({ isOpen, onClose, onSave, initialTargetCount, availableParams }: CountTargetModalProps) {
    // Safely handle undefined/null with optional chaining
    const [targetCount, setTargetCount] = useState<string>(initialTargetCount?.toString() || '100');
    const [selectedUiIds, setSelectedUiIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Safely handle undefined/null here as well
            setTargetCount(initialTargetCount?.toString() || '100');
            const initiallySelected = availableParams.filter(p => p.isCountDependent).map(p => p.uiId);
            setSelectedUiIds(initiallySelected);
        }
    }, [isOpen, initialTargetCount, availableParams]);

    if (!isOpen) return null;

    const toggleParam = (uiId: string) => {
        setSelectedUiIds(prev => 
            prev.includes(uiId) 
                ? prev.filter(id => id !== uiId)
                : [...prev, uiId]
        );
    };

    const handleSave = () => {
        const count = parseInt(targetCount);
        if (isNaN(count) || count <= 0) {
            alert("Please enter a valid target count.");
            return;
        }
        if (selectedUiIds.length === 0) {
            alert("Please select at least one parameter to count.");
            return;
        }
        onSave(count, selectedUiIds);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Calculator size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Count Target Settings</h3>
                            <p className="text-[10px] text-slate-500">Total sum validation for results</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 flex-1 flex flex-col min-h-0 space-y-5">
                    
                    {/* Target Count Input */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Target Count</label>
                        <input 
                            type="number" 
                            value={targetCount} 
                            onChange={(e) => setTargetCount(e.target.value)}
                            className="w-full h-9 border border-slate-300 rounded-md px-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            placeholder="e.g. 100"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">The sum of selected parameters must equal this number.</p>
                    </div>

                    {/* Parameter List */}
                    <div className="flex-1 flex flex-col min-h-0 border border-slate-200 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                            <span>Available Parameters</span>
                            <span>{selectedUiIds.length} Selected</span>
                        </div>
                        <div className="overflow-y-auto max-h-[250px] p-2 space-y-1">
                            {availableParams.length === 0 ? (
                                <div className="text-center text-[11px] text-slate-400 py-4 italic">No parameters added to format yet.</div>
                            ) : (
                                availableParams.map(param => (
                                    <div 
                                        key={param.uiId} 
                                        onClick={() => toggleParam(param.uiId)}
                                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border ${selectedUiIds.includes(param.uiId) ? 'bg-purple-50 border-purple-200' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                    >
                                        <div className={`text-${selectedUiIds.includes(param.uiId) ? 'purple-600' : 'slate-300'}`}>
                                            {selectedUiIds.includes(param.uiId) ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <span className={`text-xs font-semibold ${selectedUiIds.includes(param.uiId) ? 'text-purple-800' : 'text-slate-700'}`}>{param.name}</span>
                                            <span className="text-[9px] text-slate-400">{param.code}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-4 py-1.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-5 py-1.5 rounded bg-[#9575cd] hover:bg-purple-600 text-white text-xs font-bold transition-colors shadow-sm">
                        <Save size={14} /> Apply Settings
                    </button>
                </div>
            </div>
        </div>
    );
}