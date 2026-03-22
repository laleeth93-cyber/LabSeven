// --- BLOCK app/tests/formats/components/FormatEditor.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import { 
  Save, Loader2, Settings2, Trash2, Plus, FileText, Calculator, Target, CheckCircle, Bug, Search
} from 'lucide-react';
import { updateTestConfiguration } from '@/app/actions/test-config';
import RichTextEditorModal from '@/app/components/RichTextEditorModal';
import FormulaModal from '@/app/components/FormulaModal';
import CountTargetModal from '@/app/components/CountTargetModal';

function SequenceInput({ value, onCommit }: { value: number, onCommit: (val: number) => void }) {
    const [localValue, setLocalValue] = useState<string>(value.toString());
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { if (!isEditing) setLocalValue(value.toString()); }, [value, isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        setTimeout(() => {
            const num = parseInt(localValue);
            if (!isNaN(num) && num !== value) onCommit(num);
            else setLocalValue(value.toString());
        }, 50);
    };

    return (
        <input 
            type="number" value={localValue} 
            onChange={(e) => setLocalValue(e.target.value)} 
            onFocus={() => setIsEditing(true)} onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-12 text-[10px] text-center border border-slate-200 rounded px-1 h-6 focus:border-[#9575cd] outline-none font-bold text-slate-700"
        />
    );
}

interface FormatEditorProps {
    test: any;
    specimens: any[];
    availableParams: any[];
    onSaveComplete: () => void;
}

export default function FormatEditor({ test, specimens, availableParams = [], onSaveComplete }: FormatEditorProps) {
    const [isPending, startTransition] = useTransition();
    
    const [tableRows, setTableRows] = useState<any[]>([]); 
    const [formData, setFormData] = useState<any>({});
    
    const [newRowType, setNewRowType] = useState('Parameter');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedItemToAdd, setSelectedItemToAdd] = useState<any>(null); 
    const [newRowSubtitle, setNewRowSubtitle] = useState('');

    const [showInterpretationModal, setShowInterpretationModal] = useState(false);
    const [showFormulaModal, setShowFormulaModal] = useState(false);
    const [showCountModal, setShowCountModal] = useState(false);
    const [activeFormulaRowIndex, setActiveFormulaRowIndex] = useState<number | null>(null);

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (test) {
            // Parse culture columns from Database or use defaults
            let parsedCultureCols = ['Result', 'Value', 'Interpretation', 'BreakPoint', 'MIC'];
            if (test.cultureColumns) {
                try {
                    parsedCultureCols = JSON.parse(test.cultureColumns);
                } catch(e) {
                    parsedCultureCols = test.cultureColumns.split(',');
                }
            }

            setFormData({
                resultType: test.resultType || 'Parameter',
                template: test.template || 'Default',
                printNextPage: test.printNextPage || false,
                billingOnly: test.billingOnly || false,
                reportTitle: test.reportTitle || '',
                specimen: test.specimen?.id?.toString() || '',
                colCaption1: test.colCaption1 || 'PARAMETER',
                colCaption2: test.colCaption2 || 'Result',
                colCaption3: test.colCaption3 || 'UOM',
                colCaption4: test.colCaption4 || 'BIO.REF.RANGE',
                colCaption5: test.colCaption5 || 'Method',
                labEquiName: test.labEquiName || '',
                isFormulaNeeded: test.isFormulaNeeded || false,
                isCountNeeded: test.isCountNeeded || false,
                targetCount: test.targetCount || '',
                isInterpretationNeeded: test.isInterpretationNeeded || false,
                interpretation: test.interpretation || '',
                cultureColumns: parsedCultureCols // ADD STATE
            });

            const mappedParams = (test.parameters || []).map((tp: any) => {
                let code = '-';
                let name = 'Subtitle';

                if (tp.parameter) {
                    code = tp.parameter.code;
                    name = tp.parameter.name;
                } else if (tp.isCultureField) { 
                    code = 'CULT-INFO';
                    name = 'Susceptibility Info';
                }

                return {
                    uiId: Math.random().toString(36).substr(2, 9), 
                    parameterId: tp.parameterId,
                    isCultureField: tp.isCultureField || false,
                    code: code,
                    name: name,
                    isActive: tp.isActive ?? true, 
                    order: tp.order,
                    isHeading: tp.isHeading || false,
                    headingText: tp.headingText || '',
                    formula: tp.formula || '',
                    isCountDependent: tp.isCountDependent || false
                };
            }).sort((a: any, b: any) => a.order - b.order);
            
            setTableRows(mappedParams);
            setNewRowType('Parameter'); 
            setSearchQuery('');
            setSelectedItemToAdd(null);
            setNewRowSubtitle('');
        }
    }, [test]);

    const handleSave = () => {
        if (!test?.id) return;
        startTransition(async () => {
            const payload = {
                ...formData,
                cultureColumns: JSON.stringify(formData.cultureColumns || []), // Save as JSON String
                parameters: tableRows.map(row => ({
                    parameterId: row.parameterId,
                    order: row.order,
                    isHeading: row.isHeading,
                    headingText: row.headingText,
                    isActive: row.isActive,
                    formula: row.formula,
                    isCountDependent: row.isCountDependent,
                    isCultureField: row.isCultureField 
                }))
            };
            const res = await updateTestConfiguration(test.id, payload);
            if (res.success) {
                setShowSuccessPopup(true);
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    onSaveComplete(); 
                }, 1500);
            } else {
                alert("Error: " + res.message);
            }
        });
    };

    const handleRowChange = (index: number, field: string, value: any) => {
        setTableRows(prev => {
            const newRows = [...prev];
            newRows[index] = { ...newRows[index], [field]: value };
            return newRows;
        });
    };

    const handleOrderCommit = (oldIndex: number, newOrderVal: number) => {
        if (isNaN(newOrderVal) || newOrderVal < 1) return;
        let targetIndex = newOrderVal - 1;
        if (targetIndex >= tableRows.length) targetIndex = tableRows.length - 1;
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex === oldIndex) return;
  
        setTableRows(prev => {
            const newRows = [...prev];
            const [movedItem] = newRows.splice(oldIndex, 1);
            newRows.splice(targetIndex, 0, movedItem);
            return newRows.map((row, idx) => ({ ...row, order: idx + 1 }));
        });
    };

    const handleAddNewRow = () => {
        if (newRowType === 'Culture Block') {
            if (tableRows.some(row => row.isCultureField)) {
                return alert("Susceptibility Info is already added to this test.");
            }
            
            setTableRows(prev => [...prev, {
                uiId: Math.random().toString(36).substr(2, 9),
                parameterId: null,
                isCultureField: true,
                code: 'CULT-INFO', 
                name: 'Susceptibility Info',
                isActive: true, 
                order: prev.length + 1, 
                isHeading: false, 
                headingText: '', 
                formula: '', 
                isCountDependent: false
            }]);
            
            setNewRowType('Parameter');
        } 
        else if (newRowType === 'Parameter') {
            if (!selectedItemToAdd) return alert(`Please select a parameter from the search dropdown first.`);
            
            if (tableRows.some(row => !row.isHeading && row.parameterId === selectedItemToAdd.id)) {
                return alert("Parameter already exists in this format.");
            }
            
            setTableRows(prev => [...prev, {
                uiId: Math.random().toString(36).substr(2, 9),
                parameterId: selectedItemToAdd.id,
                isCultureField: false,
                code: selectedItemToAdd.code, 
                name: selectedItemToAdd.name,
                isActive: true, 
                order: prev.length + 1, 
                isHeading: false, 
                headingText: '', 
                formula: '', 
                isCountDependent: false
            }]);
            
            setSelectedItemToAdd(null);
            setSearchQuery('');
            setShowDropdown(false);
        } else {
            if (!newRowSubtitle.trim()) return alert("Enter subtitle.");
            setTableRows(prev => [...prev, {
                uiId: Math.random().toString(36).substr(2, 9),
                parameterId: null, isCultureField: false,
                code: '-', name: 'Subtitle',
                isActive: true, order: prev.length + 1, isHeading: true, headingText: newRowSubtitle, formula: '', isCountDependent: false
            }]);
            setNewRowSubtitle('');
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery) return availableParams.slice(0, 50); 
        const lowerQ = searchQuery.toLowerCase();
        return availableParams.filter(p => {
            const matchCode = p.code && p.code.toLowerCase().includes(lowerQ);
            const matchName = p.name && p.name.toLowerCase().includes(lowerQ);
            return matchCode || matchName; 
        }).slice(0, 50);
    }, [searchQuery, availableParams]);

    const inputClass = "w-full text-[10px] font-medium border border-slate-300 rounded px-2 h-7 bg-white focus:ring-1 focus:ring-[#9575cd] outline-none transition-all placeholder:text-slate-400 text-slate-700";
    
    const nameColWidth = formData.isFormulaNeeded ? "w-[20%]" : "w-[30%]";
    const searchColWidth = formData.isFormulaNeeded ? "w-[35%]" : "w-[45%]";

    return (
        <>
            <div className="w-full h-full bg-white rounded-xl shadow-lg shadow-slate-200/40 flex flex-col overflow-hidden border border-slate-200 z-10 animate-in zoom-in-95 duration-200">
                
                {/* HEADER BAR */}
                <div className="p-6 pb-4 bg-white shrink-0">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg shadow-sm ${test?.isCulture ? 'bg-rose-50 text-rose-500' : 'bg-purple-50 text-[#9575cd]'}`}>
                                {test?.isCulture ? <Bug size={20} /> : <Settings2 size={20} />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-700 tracking-tight">
                                    {test?.isCulture ? 'Culture Format Configuration' : 'Format Configuration'}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{test?.code} • {test?.name}</p>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-5 py-1.5 rounded-[5px] text-white font-medium text-[12px] shadow-md hover:opacity-90 bg-[#9575cd]">
                            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="opacity-80" />}
                            {isPending ? 'Saving...' : 'Save Format'}
                        </button>
                    </div>
                    <div className="h-[0.5px] w-full bg-purple-100"></div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="w-full border-b border-dashed border-slate-200 p-3 bg-slate-50/30 overflow-y-auto max-h-[40%] custom-scrollbar">
                        <div className="w-full flex flex-col justify-center">
                            <div className="grid grid-cols-3 gap-3 mb-2 shrink-0">
                                <div><label className="text-[9px] font-bold text-slate-500 block mb-0.5">Report Title</label><input type="text" value={formData.reportTitle} onChange={e => setFormData({...formData, reportTitle: e.target.value})} className={inputClass} placeholder="REPORT TITLE"/></div>
                                <div><label className="text-[9px] font-bold text-slate-500 block mb-0.5">Specimen</label><select value={formData.specimen} onChange={e => setFormData({...formData, specimen: e.target.value})} className={inputClass}><option value="">-- Override --</option>{specimens.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                <div><label className="text-[9px] font-bold text-slate-500 block mb-0.5">Lab Equipment</label><input type="text" value={formData.labEquiName} onChange={e => setFormData({...formData, labEquiName: e.target.value})} className={inputClass} /></div>
                            </div>
                            
                            {!test?.isCulture && (
                                <div className="grid grid-cols-5 gap-2 mb-2 shrink-0">
                                    {[1,2,3,4,5].map(num => <div key={num}><label className="text-[9px] font-bold text-slate-500 block mb-0.5">Col {num}</label><input type="text" value={formData[`colCaption${num}`] || ''} onChange={e => setFormData({...formData, [`colCaption${num}`]: e.target.value})} className={inputClass} /></div>)}
                                </div>
                            )}

                            <div className="flex items-center gap-4 shrink-0 mt-1">
                                {!test?.isCulture && (
                                    <>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isFormulaNeeded} onChange={e => setFormData({...formData, isFormulaNeeded: e.target.checked})} className="text-[#9575cd] rounded"/> <span className="text-[11px] font-bold text-slate-600">Formula Needed</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.isCountNeeded} onChange={e => setFormData({...formData, isCountNeeded: e.target.checked})} className="text-[#9575cd] rounded"/> <span className="text-[11px] font-bold text-slate-600">Count Target</span></label>
                                        {formData.isCountNeeded && (
                                            <button onClick={() => setShowCountModal(true)} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-purple-200 rounded hover:bg-purple-50 text-[10px] font-bold text-purple-700 shadow-sm transition-colors">
                                                <Target size={12} className="text-purple-600"/> Target: {formData.targetCount || 'Not Set'}
                                            </button>
                                        )}
                                        <div className="h-4 w-px bg-slate-300 mx-2"></div>
                                    </>
                                )}

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.isInterpretationNeeded} 
                                        onChange={e => setFormData({...formData, isInterpretationNeeded: e.target.checked})} 
                                        className="text-[#9575cd] rounded"
                                    /> 
                                    <span className="text-[11px] font-bold text-slate-600">Interpretation Needed</span>
                                </label>

                                {formData.isInterpretationNeeded && (
                                    <button onClick={() => setShowInterpretationModal(true)} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-[10px] font-bold text-slate-600 shadow-sm"><FileText size={12} className="text-[#9575cd]"/> Set Interpretation</button>
                                )}
                                
                                {formData.isInterpretationNeeded && formData.interpretation && <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Added</span>}
                            </div>

                            {/* NEW CULTURE COLUMNS CONFIGURATION */}
                            {test?.isCulture && (
                                <div className="mt-3 p-3 bg-white border border-rose-100 rounded-lg shadow-sm">
                                    <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-2">Display Columns for Antibiotic Table</label>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="text-[10px] font-medium text-slate-500 italic mr-2">(Antibiotic Name is always shown)</span>
                                        {['Result', 'Value', 'Interpretation', 'BreakPoint', 'MIC'].map(col => (
                                            <label key={col} className="flex items-center gap-1.5 cursor-pointer hover:bg-rose-50 px-2 py-1 rounded transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.cultureColumns?.includes(col)}
                                                    onChange={(e) => {
                                                        const current = formData.cultureColumns || [];
                                                        const newCols = e.target.checked 
                                                            ? [...current, col] 
                                                            : current.filter((c: string) => c !== col);
                                                        setFormData({...formData, cultureColumns: newCols});
                                                    }}
                                                    className="w-3.5 h-3.5 rounded text-rose-500 border-slate-300 focus:ring-rose-500 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-bold text-slate-700">{col}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* TABLE AREA */}
                    <div className="flex-1 w-full flex flex-col bg-white relative p-2 min-h-0">
                        <div className="px-6 py-2 bg-[#f3e8ff] border-b border-purple-100 flex items-center gap-2 shadow-sm shrink-0 z-10 rounded-t-lg">
                            <div className="w-[15%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider">Type</div>
                            <div className="w-[15%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider">Code</div>
                            <div className={`${nameColWidth} text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider`}>Name</div>
                            <div className="w-[20%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider">Subtitle</div>
                            {formData.isFormulaNeeded && <div className="w-[10%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider text-center">Formula</div>}
                            <div className="w-[10%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider text-center">Seq</div>
                            <div className="w-[5%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider text-center">Status</div>
                            <div className="w-[5%] text-[9px] font-bold text-[#7e22ce] uppercase tracking-wider text-center">Del</div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto z-0 pb-12 custom-scrollbar">
                            {tableRows.map((row, idx) => (
                                <div key={row.uiId} className={`flex items-center gap-2 px-6 py-2 border-b border-slate-50 hover:bg-slate-50 group ${row.isCountDependent ? 'bg-purple-50/30' : ''}`}>
                                    <div className="w-[15%]">
                                        <select value={row.isHeading ? 'Sub Title' : (row.isCultureField ? 'Culture Block' : 'Parameter')} onChange={e => handleRowChange(idx, 'isHeading', e.target.value === 'Sub Title')} className="w-full text-[10px] border border-slate-200 rounded px-1 h-6 bg-white outline-none">
                                            {row.isCultureField ? (
                                                <option value="Culture Block">Culture Block</option>
                                            ) : (
                                                <option value="Parameter">Parameter</option>
                                            )}
                                            <option value="Sub Title">Sub Title</option>
                                        </select>
                                    </div>
                                    <div className="w-[15%] flex items-center gap-1">
                                        <span className={`text-[10px] font-mono truncate ${row.isCultureField ? 'text-rose-500 font-bold' : 'text-slate-600'}`}>{row.code}</span>
                                    </div>
                                    <div className={`${nameColWidth} text-[11px] font-medium text-slate-700 truncate flex items-center gap-2`}>
                                        {row.name} 
                                        {row.isCultureField && <span className="bg-rose-100 text-rose-600 text-[8px] px-1 py-0.5 rounded shadow-sm">CULTURE INFO</span>}
                                        {row.isCountDependent && <span title="Part of Count Target" className="flex items-center"><Target size={12} className="text-purple-500" /></span>}
                                    </div>
                                    <div className="w-[20%]"><input type="text" value={row.headingText || ''} onChange={e => handleRowChange(idx, 'headingText', e.target.value)} disabled={!row.isHeading} className={`w-full text-[10px] border border-slate-200 rounded px-2 h-6 outline-none ${!row.isHeading ? 'bg-slate-50' : 'bg-white'}`} placeholder="-"/></div>
                                    {formData.isFormulaNeeded && (
                                        <div className="w-[10%] flex justify-center">
                                            <button 
                                                onClick={() => {setActiveFormulaRowIndex(idx); setShowFormulaModal(true);}} 
                                                disabled={row.isHeading || row.isCultureField} 
                                                className={`p-1 rounded transition-colors ${row.formula ? 'text-purple-600 bg-purple-50 ring-1 ring-purple-100' : 'text-slate-300 hover:text-purple-600'}`}
                                            >
                                                <Calculator size={14}/>
                                            </button>
                                        </div>
                                    )}
                                    <div className="w-[10%] text-center"><SequenceInput value={row.order} onCommit={v => handleOrderCommit(idx, v)}/></div>
                                    <div className="w-[5%] flex justify-center"><button onClick={() => handleRowChange(idx, 'isActive', !row.isActive)} className={`w-8 h-4 rounded-full flex items-center p-0.5 ${row.isActive ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${row.isActive ? 'translate-x-4' : 'translate-x-0'}`}/></button></div>
                                    <div className="w-[5%] flex justify-center"><button onClick={() => setTableRows(p => p.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button></div>
                                </div>
                            ))}
                            <div className="h-12 w-full"></div>
                        </div>

                        {/* ADD ROW FOOTER */}
                        <div ref={searchContainerRef} className="absolute bottom-2 left-2 right-2 flex items-center gap-2 px-6 py-3 border-t border-slate-100 bg-purple-50/90 backdrop-blur-sm z-20 rounded-b-lg">
                            <div className="w-[15%]">
                                <select value={newRowType} onChange={e => setNewRowType(e.target.value)} className="w-full text-[10px] border border-slate-200 rounded px-1 h-7 bg-white outline-none">
                                    <option value="Parameter">Parameter</option>
                                    <option value="Sub Title">Sub Title</option>
                                    {test?.isCulture && <option value="Culture Block">Susceptibility Block</option>}
                                </select>
                            </div>
                            
                            {newRowType === 'Culture Block' ? (
                                <div className={`${searchColWidth} flex items-center`}>
                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded w-full text-center border border-rose-100">
                                        Click (+) to add Susceptibility Info block
                                    </span>
                                </div>
                            ) : (
                                <div className={`${searchColWidth} relative`}>
                                    <div className="relative flex items-center">
                                        <Search className="absolute left-2 text-slate-400" size={12} />
                                        <input 
                                            type="text" 
                                            placeholder={newRowType !== 'Sub Title' ? (selectedItemToAdd?.name || "Search Parameters...") : "-"} 
                                            value={searchQuery} 
                                            onFocus={() => setShowDropdown(true)}
                                            onChange={e => { setSearchQuery(e.target.value); if(e.target.value==='') setSelectedItemToAdd(null); setShowDropdown(true); }} 
                                            disabled={newRowType === 'Sub Title'} 
                                            className="w-full text-[10px] border border-slate-200 rounded pl-7 pr-2 h-7 bg-white outline-none focus:ring-1 focus:ring-[#9575cd]"
                                        />
                                    </div>
                                    {showDropdown && newRowType === 'Parameter' && (
                                        <div className="absolute bottom-full left-0 mb-1 w-full bg-white border shadow-xl rounded-md z-50 max-h-56 overflow-y-auto custom-scrollbar">
                                            {filteredItems.length === 0 ? (
                                                <div className="p-3 text-[10px] text-slate-400 text-center">No matches found</div>
                                            ) : (
                                                filteredItems.map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        onMouseDown={() => {
                                                            setSelectedItemToAdd(p); 
                                                            setSearchQuery(p.name); 
                                                            setShowDropdown(false);
                                                        }} 
                                                        className="px-3 py-2.5 hover:bg-purple-50 cursor-pointer text-[10px] border-b border-slate-50 flex justify-between items-center transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2 truncate">
                                                            <span className="font-mono text-slate-400 shrink-0">{p.code}</span>
                                                            <span className="truncate font-semibold text-slate-700">{p.name}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="w-[20%]"><input type="text" placeholder="Subtitle..." value={newRowSubtitle} onChange={e => setNewRowSubtitle(e.target.value)} disabled={newRowType !== 'Sub Title'} className="w-full text-[10px] border border-slate-200 rounded px-2 h-7 bg-white outline-none"/></div>
                            {formData.isFormulaNeeded && <div className="w-[10%]"></div>}
                            <div className="w-[10%] text-center text-[10px] text-slate-400 font-bold">Auto</div>
                            <div className="w-[10%] flex justify-center"><button onClick={handleAddNewRow} className="bg-[#9575cd] text-white p-1 rounded hover:opacity-90"><Plus size={14}/></button></div>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALS OUTSIDE THE OVERFLOW CONTAINER */}
            <RichTextEditorModal isOpen={showInterpretationModal} onClose={() => setShowInterpretationModal(false)} onSave={(content) => { setFormData({...formData, interpretation: content}); setShowInterpretationModal(false); }} initialContent={formData.interpretation || ''} title="Test Interpretation" />
            <FormulaModal isOpen={showFormulaModal} onClose={() => setShowFormulaModal(false)} onSave={(f) => { if(activeFormulaRowIndex !== null) handleRowChange(activeFormulaRowIndex, 'formula', f); setShowFormulaModal(false); }} targetParamName={activeFormulaRowIndex !== null ? tableRows[activeFormulaRowIndex]?.name : ''} availableParams={tableRows.filter(r => !r.isHeading).map(r => ({id: r.parameterId, code: r.code, name: r.name}))} initialFormula={activeFormulaRowIndex !== null ? tableRows[activeFormulaRowIndex]?.formula : ''} />
            
            <CountTargetModal 
                isOpen={showCountModal} 
                onClose={() => setShowCountModal(false)}
                initialTargetCount={formData.targetCount}
                availableParams={tableRows.filter(r => !r.isHeading).map(r => ({
                    uiId: r.uiId,
                    code: r.code,
                    name: r.name,
                    isCountDependent: r.isCountDependent
                }))}
                onSave={(count, selectedUiIds) => {
                    setFormData((prev: any) => ({ ...prev, targetCount: count }));
                    setTableRows((prev: any[]) => prev.map((row: any) => ({
                        ...row,
                        isCountDependent: selectedUiIds.includes(row.uiId)
                    })));
                    setShowCountModal(false);
                }}
            />

            {/* --- SUCCESS POPUP OVERLAY --- */}
            {showSuccessPopup && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                    <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Format Saved!</h2>
                  <p className="text-slate-500 text-sm mt-1 text-center font-medium">{test.name}</p>
                </div>
              </div>
            )}
        </>
    );
}
// --- BLOCK app/tests/formats/components/FormatEditor.tsx CLOSE ---