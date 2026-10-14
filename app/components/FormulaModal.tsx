// BLOCK app/components/FormulaModal.tsx OPEN
"use client";

import React, { useState, useEffect } from 'react';
import { X, Calculator, ChevronRight, CheckCircle2, AlertTriangle, Eraser, Play, Search } from 'lucide-react';

interface Parameter {
    id: number;
    code: string;
    name: string;
}

interface FormulaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formula: string) => void;
    targetParamName: string;
    availableParams: Parameter[];
    initialFormula: string;
}

export default function FormulaModal({ isOpen, onClose, onSave, targetParamName, availableParams, initialFormula }: FormulaModalProps) {
    const [formula, setFormula] = useState(initialFormula || '');
    const [validationMsg, setValidationMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [mobileTab, setMobileTab] = useState<'editor' | 'params'>('editor');
    const [paramSearch, setParamSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormula(initialFormula || '');
            setValidationMsg(null);
            setMobileTab('editor');
            setParamSearch('');
        }
    }, [isOpen, initialFormula]);

    if (!isOpen) return null;

    const insertText = (text: string) => {
        setFormula(prev => prev + text);
        setValidationMsg(null); // Clear validation on edit
    };

    const handleClear = () => {
        setFormula('');
        setValidationMsg(null);
    };

    const handleBackspace = () => {
        setFormula(prev => prev.slice(0, -1));
        setValidationMsg(null);
    };

    const validateFormula = () => {
        if (!formula.trim()) {
            setValidationMsg({ text: "Formula cannot be empty", type: 'error' });
            return false;
        }

        try {
            // 1. Replace all parameter codes [CODE] with a dummy number '1'
            // Regex matches anything enclosed in brackets
            let testExpression = formula.replace(/\[.*?\]/g, '1');

            // 2. Check for leftover invalid characters (like letters or malformed brackets)
            // Allowed: digits, dot, operators (+ - * /), parentheses, and spaces
            const allowedCharsRegex = /^[0-9\.\+\-\*\/\(\)\s]*$/;
            
            if (!allowedCharsRegex.test(testExpression)) {
                 if (testExpression.includes('[') || testExpression.includes(']')) {
                     throw new Error("Unclosed or malformed parameter brackets []");
                 }
                 throw new Error("Formula contains invalid characters or text");
            }

            // 3. Syntax Check via Evaluation
            // We use the Function constructor to safely evaluate the math expression string
            try {
                // "use strict" ensures no global variable leakage
                const func = new Function(`"use strict"; return (${testExpression})`);
                const result = func();
                
                if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
                    throw new Error("Calculation results in an invalid number (e.g. division by zero)");
                }
            } catch (e) {
                throw new Error("Syntax Error (Check operators and parentheses)");
            }

            setValidationMsg({ text: "Formula is valid!", type: 'success' });
            return true;

        } catch (err: any) {
            setValidationMsg({ text: err.message, type: 'error' });
            return false;
        }
    };

    const handleSave = () => {
        // Auto-validate before saving
        if (validateFormula()) {
            onSave(formula);
        }
    };

        const filteredParams = availableParams.filter(p => 
            p.code.toLowerCase().includes(paramSearch.toLowerCase()) || 
            p.name.toLowerCase().includes(paramSearch.toLowerCase())
        );

        return (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl shadow-2xl w-[305px] max-w-[calc(100vw-24px)] md:w-full md:max-w-2xl border border-purple-100 flex flex-col max-h-[80vh] md:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                    
                    {/* DESKTOP HEADER (UNTOUCHED) */}
                    <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#f8fafc] shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0">
                                <Calculator size={20} />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-800 leading-tight">Formula Builder</h3>
                                <p className="text-[11px] text-slate-500 truncate leading-tight">
                                    Calculate value for <span className="font-bold text-purple-600 truncate">{targetParamName}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* MOBILE HEADER (SMALL & CUTE) */}
                    <div className="flex md:hidden items-center justify-between px-2.5 py-1.5 border-b border-slate-100 bg-[#f8fafc] shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Calculator size={12} className="text-[#9575cd] shrink-0" />
                            <span className="text-[10.5px] font-bold text-slate-800 shrink-0">Formula</span>
                            <span className="text-[8.5px] font-mono text-purple-700 bg-purple-50 border border-purple-100 px-1 py-0.2 rounded truncate max-w-[130px]">
                                {targetParamName}
                            </span>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="w-4.5 h-4.5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 shrink-0 transition-colors"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    {/* DESKTOP BODY (UNTOUCHED DESKTOP RATIO) */}
                    <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
                        
                        {/* LEFT: FORMULA EDITOR */}
                        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                            
                            {/* Display Screen */}
                            <div className="flex flex-col gap-2 relative">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Formula Expression</label>
                                    <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1"><Eraser size={10}/> Clear</button>
                                </div>
                                
                                <textarea 
                                    value={formula}
                                    onChange={(e) => { setFormula(e.target.value); setValidationMsg(null); }}
                                    className={`w-full h-32 p-3 text-sm font-mono bg-slate-50 border rounded-lg outline-none resize-none text-slate-700 transition-all ${
                                        validationMsg?.type === 'error' 
                                            ? 'border-red-300 focus:ring-2 focus:ring-red-100' 
                                            : (validationMsg?.type === 'success' 
                                                ? 'border-green-300 focus:ring-2 focus:ring-green-100' 
                                                : 'border-slate-200 focus:ring-2 focus:ring-purple-500')
                                    }`}
                                    placeholder="e.g. ([PAR-001] + [PAR-002]) / 2"
                                />
                                
                                {/* VALIDATION MESSAGE OVERLAY */}
                                {validationMsg && (
                                    <div className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-1 ${
                                        validationMsg.type === 'success' 
                                            ? 'bg-green-50 text-green-700 border border-green-200' 
                                            : 'bg-red-50 text-red-600 border border-red-200'
                                    }`}>
                                        {validationMsg.type === 'success' ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}
                                        {validationMsg.text}
                                    </div>
                                )}
                            </div>

                            {/* Operators */}
                            <div className="grid grid-cols-4 gap-2">
                                {['+', '-', '*', '/', '(', ')', '.', '100'].map(op => (
                                    <button 
                                        key={op} 
                                        onClick={() => insertText(` ${op} `)}
                                        className="h-10 bg-white border border-slate-200 rounded hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 font-bold text-slate-600 transition-all shadow-sm"
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>

                        </div>

                        {/* RIGHT: PARAMETER LIST */}
                        <div className="w-64 border-l border-slate-100 bg-slate-50 flex flex-col">
                            <div className="p-3 border-b border-slate-100">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase">Available Parameters</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {availableParams.length === 0 ? (
                                    <p className="text-[10px] text-slate-400 text-center mt-10">No other parameters available</p>
                                ) : (
                                    availableParams.map(param => (
                                        <button 
                                            key={param.id}
                                            onClick={() => insertText(`[${param.code}]`)}
                                            className="w-full text-left px-3 py-2 bg-white border border-slate-200 rounded hover:border-purple-300 hover:shadow-sm group transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-purple-600 font-mono bg-purple-50 px-1 rounded">[{param.code}]</span>
                                                <ChevronRight size={12} className="text-slate-300 group-hover:text-purple-400"/>
                                            </div>
                                            <div className="text-[10px] text-slate-600 truncate mt-1">{param.name}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* MOBILE BODY (REDUCED & COMPACT) */}
                    <div className="flex md:hidden flex-1 min-h-0 flex-col overflow-hidden">
                        {/* Segmented Tab Header */}
                        <div className="flex items-center border-b border-slate-100 bg-slate-50/70 p-0.5 shrink-0 gap-1">
                            <button
                                type="button"
                                onClick={() => setMobileTab('editor')}
                                className={`flex-1 py-0.5 px-2 text-[8.5px] font-bold rounded transition-all flex items-center justify-center gap-1 ${
                                    mobileTab === 'editor' 
                                        ? 'bg-white text-purple-700 shadow-2xs border border-purple-100' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Calculator size={10} /> Keypad
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileTab('params')}
                                className={`flex-1 py-0.5 px-2 text-[8.5px] font-bold rounded transition-all flex items-center justify-center gap-1 ${
                                    mobileTab === 'params' 
                                        ? 'bg-white text-purple-700 shadow-2xs border border-purple-100' 
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <span className="font-mono text-[7.5px] bg-purple-50 text-purple-600 px-1 rounded font-bold">[{availableParams.length}]</span> Params
                            </button>
                        </div>

                        {mobileTab === 'editor' ? (
                            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                                {/* Display Screen */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Expression</label>
                                        <button 
                                            type="button"
                                            onClick={handleClear} 
                                            className="text-[8px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 active:scale-95"
                                        >
                                            <Eraser size={8} /> Clear
                                        </button>
                                    </div>

                                    <textarea 
                                        value={formula}
                                        onChange={(e) => { setFormula(e.target.value); setValidationMsg(null); }}
                                        className={`w-full h-14 p-1.5 text-[10.5px] font-mono bg-slate-50 border rounded-md outline-none resize-none text-slate-700 transition-all ${
                                            validationMsg?.type === 'error' 
                                                ? 'border-red-300 focus:ring-1 focus:ring-red-100' 
                                                : (validationMsg?.type === 'success' 
                                                    ? 'border-green-300 focus:ring-1 focus:ring-green-100' 
                                                    : 'border-slate-200 focus:ring-1 focus:ring-purple-400')
                                        }`}
                                        placeholder="e.g. ([PAR-001] + [PAR-002]) / 2"
                                    />

                                    {/* Validation Message Overlay */}
                                    {validationMsg && (
                                        <div className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1 shadow-2xs animate-in fade-in duration-150 ${
                                            validationMsg.type === 'success' 
                                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                                : 'bg-red-50 text-red-600 border border-red-200'
                                        }`}>
                                            {validationMsg.type === 'success' ? <CheckCircle2 size={9} className="shrink-0" /> : <AlertTriangle size={9} className="shrink-0" />}
                                            <span className="truncate">{validationMsg.text}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Insert Parameter Strip */}
                                {availableParams.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider">Quick Insert:</span>
                                            <button 
                                                type="button"
                                                onClick={() => setMobileTab('params')}
                                                className="text-[7.5px] font-bold text-purple-600 hover:underline"
                                            >
                                                All ({availableParams.length}) →
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar">
                                            {availableParams.map(param => (
                                                <button
                                                    key={param.id}
                                                    type="button"
                                                    onClick={() => insertText(`[${param.code}]`)}
                                                    className="h-5 px-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/70 rounded text-[8px] font-bold whitespace-nowrap shrink-0 flex items-center gap-0.5 active:scale-95 transition-all shadow-2xs"
                                                >
                                                    <span className="font-mono">[{param.code}]</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Math Operators Keypad */}
                                <div>
                                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 block">Math Keys:</span>
                                    <div className="grid grid-cols-5 gap-1">
                                        {['+', '-', '*', '/', '(', ')', '.', '100', '0'].map(op => (
                                            <button 
                                                key={op}
                                                type="button"
                                                onClick={() => insertText(` ${op} `)}
                                                className="h-6 bg-white border border-slate-200 rounded hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 font-bold text-[10px] text-slate-700 transition-all shadow-2xs active:scale-95 flex items-center justify-center"
                                            >
                                                {op}
                                            </button>
                                        ))}
                                        <button 
                                            type="button"
                                            onClick={handleBackspace}
                                            className="h-6 bg-slate-50 border border-slate-200 rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-bold text-[10px] text-slate-600 transition-all shadow-2xs active:scale-95 flex items-center justify-center"
                                            title="Backspace"
                                        >
                                            ⌫
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 min-h-0 flex flex-col p-1.5 space-y-1">
                                {/* Parameter Search Input */}
                                <div className="relative shrink-0">
                                    <input 
                                        type="text"
                                        value={paramSearch}
                                        onChange={e => setParamSearch(e.target.value)}
                                        placeholder="Search parameter..."
                                        className="w-full h-6 pl-6 pr-1.5 text-[8.5px] bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-[#9575cd]"
                                    />
                                    <Search size={10} className="absolute left-2 top-1.5 text-slate-400" />
                                </div>

                                {/* Available Parameters List */}
                                <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 custom-scrollbar">
                                    {filteredParams.length === 0 ? (
                                        <p className="text-[9px] text-slate-400 text-center py-4">No parameters found</p>
                                    ) : (
                                        filteredParams.map(param => (
                                            <button 
                                                key={param.id}
                                                type="button"
                                                onClick={() => {
                                                    insertText(`[${param.code}]`);
                                                    setMobileTab('editor');
                                                }}
                                                className="w-full text-left p-1 bg-white border border-slate-100 hover:border-purple-200 rounded hover:bg-purple-50/40 flex items-center justify-between gap-1 active:scale-98 transition-all"
                                            >
                                                <div className="min-w-0 flex-1 flex items-center gap-1">
                                                    <span className="text-[8px] font-bold text-purple-600 font-mono bg-purple-50 px-1 py-0.2 rounded border border-purple-100 shrink-0">
                                                        [{param.code}]
                                                    </span>
                                                    <span className="text-[8.5px] text-slate-700 font-medium truncate">{param.name}</span>
                                                </div>
                                                <span className="text-[7.5px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">
                                                    +
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP FOOTER (UNTOUCHED) */}
                    <div className="hidden md:flex p-4 border-t border-slate-100 bg-slate-50 justify-between gap-3 shrink-0">
                        <div>
                            <button 
                                type="button"
                                onClick={validateFormula}
                                className="px-4 py-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Play size={14} className="text-blue-500 fill-current"/> Validate
                            </button>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                            <button 
                                type="button"
                                onClick={handleSave}
                                className="px-6 py-2 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                Save Formula
                            </button>
                        </div>
                    </div>

                    {/* MOBILE FOOTER (COMPACT & REDUCED) */}
                    <div className="flex md:hidden p-1.5 border-t border-slate-100 bg-slate-50 items-center justify-between gap-1 shrink-0">
                        <button 
                            type="button"
                            onClick={validateFormula}
                            className="h-5.5 px-2 text-[8px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded shadow-2xs flex items-center gap-1 active:scale-95"
                        >
                            <Play size={8} className="text-blue-500 fill-current"/> Validate
                        </button>
                        <div className="flex items-center gap-1">
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="h-5.5 px-2 text-[8px] font-bold text-slate-500 hover:bg-slate-200/60 rounded"
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleSave}
                                className="h-5.5 px-2.5 text-[8px] font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded shadow-2xs active:scale-95"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        );
}
// BLOCK app/components/FormulaModal.tsx CLOSE