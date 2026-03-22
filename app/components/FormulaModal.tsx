// BLOCK app/components/FormulaModal.tsx OPEN
"use client";

import React, { useState, useEffect } from 'react';
import { X, Calculator, ChevronRight, CheckCircle2, AlertTriangle, Eraser, Play } from 'lucide-react';

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

    useEffect(() => {
        if (isOpen) {
            setFormula(initialFormula || '');
            setValidationMsg(null);
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

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#f8fafc]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Formula Builder</h3>
                            <p className="text-[11px] text-slate-500">Calculate value for <span className="font-bold text-purple-600">{targetParamName}</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    
                    {/* LEFT: FORMULA EDITOR */}
                    <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                        
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

                {/* FOOTER */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 rounded-b-xl">
                    <div>
                        <button 
                            onClick={validateFormula}
                            className="px-4 py-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Play size={14} className="text-blue-500 fill-current"/> Validate
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            Save Formula
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
// BLOCK app/components/FormulaModal.tsx CLOSE