"use client";

import React from 'react';
import { MessageSquare, StickyNote, RotateCcw, Save, CheckCircle2, Loader2, Barcode, History, FileWarning, FileText, ChevronDown, Bug, MousePointer2 } from 'lucide-react';
import { getDisplayRange, getMatchedRange } from './ResultEntryUtils';

export default function TestItemCard({
    item, bill, results = {}, flags = {}, hasHistory = [], savingItemId,
    testParams = [], isParamsLoading = false, // 🚨 CRASH PROTECTION: Default arrays
    onOpenNote, onSaveItem, onOpenResultEditor, onInputChange, onViewHistory, onOpenCultureModal
}: any) {
    
    // 🚨 CRASH PROTECTION: If item or test is randomly missing, don't crash the page
    if (!item || !item.test) return null; 

    const isRowSaving = savingItemId === item.id;
    const isApproved = item.status === 'Approved' || item.status === 'Printed';

    let lastCountParamId: number | null = null;
    let currentTotalSum = 0;
    let hasAnyCountValueEntered = false;
    const targetCount = item.test.targetCount || 0;

    if (item.test.isCountNeeded && testParams && testParams.length > 0) {
        const countParams = testParams.filter((tp: any) => tp?.isCountDependent && !tp?.isHeading && tp?.parameter);
        if (countParams.length > 0) {
            lastCountParamId = countParams[countParams.length - 1].parameter.id;
            countParams.forEach((tp: any) => {
                const rawVal = results[`${item.id}-${tp.parameter.id}`];
                if (rawVal !== undefined && rawVal !== '') hasAnyCountValueEntered = true;
                currentTotalSum += parseFloat(rawVal) || 0;
            });
        }
    }

    return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm transition-all hover:shadow-md mb-6 bg-white w-full max-w-full">
        <div className="bg-slate-50 px-3 sm:px-4 py-3 sm:py-2 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="font-bold text-slate-800 text-sm md:text-base">{item.test.name}</span>
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm shrink-0">
                    <Barcode size={12} className="opacity-50" /> <span>{String(bill?.billNumber || '').slice(-4)}</span> 
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${item.status === 'Approved' ? 'bg-green-100 text-green-700' : item.status === 'Printed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{item.status || 'Pending'}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={() => onOpenNote && onOpenNote(item)} className="flex-1 sm:flex-none justify-center px-3 py-2 md:py-1.5 bg-white border border-slate-200 text-slate-600 text-xs md:text-[10px] font-bold rounded hover:bg-purple-50 flex items-center gap-1.5"><MessageSquare size={14} className="md:w-3 md:h-3" /> Note</button>
                {isApproved ? (
                    <button onClick={() => onSaveItem && onSaveItem(item, 'Entered')} disabled={isRowSaving || isParamsLoading} className="flex-1 sm:flex-none justify-center px-3 py-2 md:py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs md:text-[10px] font-bold rounded hover:bg-red-100 flex items-center gap-1.5">{isRowSaving ? <Loader2 size={14} className="animate-spin md:w-3 md:h-3"/> : <RotateCcw size={14} className="md:w-3 md:h-3" />} Unapprove</button>
                ) : (
                    <>
                        <button onClick={() => onSaveItem && onSaveItem(item, 'Entered')} disabled={isRowSaving || isParamsLoading} className="flex-1 sm:flex-none justify-center px-3 py-2 md:py-1.5 bg-white border border-slate-200 text-slate-600 text-xs md:text-[10px] font-bold rounded hover:bg-blue-50 flex items-center gap-1.5">{isRowSaving ? <Loader2 size={14} className="animate-spin md:w-3 md:h-3"/> : <Save size={14} className="md:w-3 md:h-3" />} Save</button>
                        <button onClick={() => onSaveItem && onSaveItem(item, 'Approved')} disabled={isRowSaving || isParamsLoading} className="flex-1 sm:flex-none justify-center px-3 py-2 md:py-1.5 bg-[#9575cd] text-white border border-[#9575cd] text-xs md:text-[10px] font-bold rounded hover:bg-[#7e57c2] flex items-center gap-1.5">{isRowSaving ? <Loader2 size={14} className="animate-spin md:w-3 md:h-3"/> : <CheckCircle2 size={14} className="md:w-3 md:h-3" />} Approve</button>
                    </>
                )}
            </div>
        </div>
        
        {isParamsLoading ? (
            <div className="p-8 flex flex-col items-center justify-center bg-slate-50 w-full">
                <Loader2 size={24} className="text-[#9575cd] animate-spin mb-2" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Format...</span>
            </div>
        ) : (!testParams || testParams.length === 0) ? (
            <div className="p-8 flex flex-col items-center justify-center text-center w-full bg-amber-50">
                <FileWarning size={24} className="text-amber-600 mb-2" />
                <h4 className="text-sm font-bold text-amber-800">Format Missing</h4>
                <p className="text-xs text-amber-600">Please configure the parameters for this test.</p>
            </div>
        ) : (
            <div className="p-0 bg-white w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs md:text-sm border-collapse min-w-[850px]">
                    <thead>
                        <tr className="text-slate-500 bg-slate-50/50 text-left">
                            <th className="py-3 px-4 border border-slate-200 w-[25%] font-bold uppercase tracking-wider text-[11px]">Parameter</th>
                            <th className="py-3 px-4 border border-slate-200 w-[25%] font-bold uppercase tracking-wider text-[11px]">Result</th>
                            <th className="py-3 px-2 border border-slate-200 w-[8%] font-bold uppercase tracking-wider text-[11px] text-center">Flag</th>
                            <th className="py-3 px-4 border border-slate-200 w-[10%] font-bold uppercase tracking-wider text-[11px] text-center">Units</th>
                            <th className="py-3 px-4 border border-slate-200 w-[17%] font-bold uppercase tracking-wider text-[11px] text-center">Ref. Range</th>
                            <th className="py-3 px-4 border border-slate-200 w-[15%] font-bold uppercase tracking-wider text-[11px]">Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {testParams.map((tp: any, index: number) => {
                            if (!tp) return null;

                            if (tp.isHeading) return (
                                <tr key={`heading-${index}`} className="bg-slate-100">
                                    <td colSpan={6} className="py-3 px-4 border border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[11px] text-center">{tp.headingText || '-'}</td>
                                </tr>
                            );

                            if (tp.isCultureField) {
                                const cultureVal = results[`${item.id}--999`];
                                let activeOrgCount = 0;
                                if (cultureVal) try { activeOrgCount = Array.isArray(JSON.parse(cultureVal)?.organisms) ? JSON.parse(cultureVal).organisms.length : 0; } catch(e){}
                                return (
                                    <tr key={`culture-${index}`} className={`hover:bg-rose-50/30 transition-colors group ${isApproved ? 'opacity-70 pointer-events-none' : ''}`}>
                                        <td className="py-3 px-4 border border-slate-200 font-medium text-slate-700">
                                            <div className="flex items-center gap-2 text-rose-600 font-bold"><Bug size={16} /><span className="text-sm">Susceptibility Info</span></div>
                                        </td>
                                        <td className="py-3 px-4 border border-slate-200 relative group/cult">
                                            <input readOnly value={activeOrgCount > 0 ? `${activeOrgCount} Organisms` : ''} placeholder="Click to Configure" onClick={() => onOpenCultureModal && onOpenCultureModal(item.id)} className="w-full h-10 md:h-8 border rounded px-3 outline-none font-bold cursor-pointer text-rose-600 bg-rose-50 border-rose-200 placeholder:text-rose-300 placeholder:font-normal text-sm md:text-xs" />
                                            <div onClick={() => onOpenCultureModal && onOpenCultureModal(item.id)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 group-hover/cult:opacity-100 cursor-pointer text-rose-500 transition-opacity"><MousePointer2 size={16}/></div>
                                        </td>
                                        <td colSpan={4} className="py-3 px-4 border border-slate-200 text-center text-slate-400 italic text-xs">Culture Template System</td>
                                    </tr>
                                );
                            }

                            if (!tp.parameter) return null;

                            const isLastCountParam = lastCountParamId === tp.parameter.id;
                            const historyExists = hasHistory.includes(tp.parameter.id);
                            const displayRange = getDisplayRange(tp.parameter, bill?.patient);
                            const isMultiValue = tp.parameter.isMultiValue;
                            const options = tp.parameter.options || [];
                            const currentVal = results[`${item.id}-${tp.parameter.id}`];

                            const activeRange = getMatchedRange(tp.parameter, bill?.patient);
                            const abnormalValues = activeRange?.abnormalValue ? activeRange.abnormalValue.split(',').map((v: string) => v.trim().toLowerCase()) : [];
                            const isCurrentValAbnormal = currentVal && abnormalValues.includes(currentVal.trim().toLowerCase());

                            return (
                            <tr key={`param-${tp.parameter.id}`} className="hover:bg-slate-50/30 transition-colors">
                                <td className="py-3 px-4 border border-slate-200 font-medium text-slate-700 text-sm md:text-xs">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="truncate">{tp.parameter.name}</span>
                                        {isLastCountParam && hasAnyCountValueEntered && (
                                            <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${currentTotalSum === targetCount ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`} title={`Target: ${targetCount}`}>{currentTotalSum}</span>
                                        )}
                                    </div>
                                </td>
                                
                                <td className="py-2 md:py-1 px-4 border border-slate-200 relative">
                                    <div className="flex items-center gap-2 md:gap-1.5">
                                        {tp.parameter.inputType === 'Big' ? (
                                            <button onClick={() => onOpenResultEditor && onOpenResultEditor(item.id, tp.parameter)} disabled={isApproved} className={`w-full h-10 md:h-8 border border-slate-300 rounded px-3 flex items-center justify-end ${isApproved ? 'bg-slate-50' : 'bg-white'}`}><FileText size={18} className={`${results[`${item.id}-${tp.parameter.id}`] ? "text-green-500" : "text-slate-400"}`}/></button>
                                        ) : isMultiValue && options.length > 0 ? (
                                            <div className="relative w-full">
                                                {!currentVal && <span className="absolute left-3 md:left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none z-10">Auto suggest</span>}
                                                <select value={currentVal || ''} onChange={(e) => onInputChange && onInputChange(item.id, tp.parameter, e.target.value, testParams)} disabled={isApproved} className={`w-full h-10 md:h-8 border rounded pl-3 pr-8 outline-none appearance-none bg-transparent relative z-0 text-sm md:text-xs ${isApproved ? 'bg-slate-50' : ''} ${!currentVal ? 'text-slate-400' : (isCurrentValAbnormal ? 'text-red-600 font-bold' : 'text-slate-800 font-normal')}`}>
                                                    <option value="">&nbsp;</option>
                                                    {options.map((opt: string, idx: number) => <option key={idx} value={opt} className={`text-slate-800 ${abnormalValues.includes(opt.trim().toLowerCase()) ? 'font-bold' : ''}`}>{opt}</option>)}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"/>
                                            </div>
                                        ) : (
                                            <input type="text" value={results[`${item.id}-${tp.parameter.id}`] || ''} onChange={(e) => onInputChange && onInputChange(item.id, tp.parameter, e.target.value, testParams)} disabled={isApproved} className={`w-full h-10 md:h-8 border rounded px-3 md:px-2 outline-none font-bold text-slate-800 text-sm md:text-xs ${isApproved ? 'bg-slate-50 border-slate-100 text-slate-500' : 'border-slate-300 focus:border-[#9575cd] focus:ring-1'}`}/>
                                        )}
                                        <button onClick={() => historyExists && onViewHistory && onViewHistory(tp.parameter.id, tp.parameter.name)} disabled={!historyExists} className={`shrink-0 p-2 md:p-1 rounded-full ${historyExists ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-200'}`}><History size={18} /></button>
                                    </div>
                                </td>

                                <td className="py-3 px-2 border border-slate-200 text-center">
                                    {flags[`${item.id}-${tp.parameter.id}`] === 'High' && <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 text-[10px]">H</span>}
                                    {flags[`${item.id}-${tp.parameter.id}`] === 'Low' && <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">L</span>}
                                    {flags[`${item.id}-${tp.parameter.id}`] === 'Abnormal' && <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 text-[10px]">A</span>}
                                </td>
                                <td className="py-3 px-4 border border-slate-200 text-center text-slate-600 font-medium text-sm md:text-xs">{tp.parameter.unit}</td>
                                <td className="py-3 px-4 border border-slate-200 text-center align-middle text-slate-600 font-medium">
                                    <div dangerouslySetInnerHTML={{ __html: displayRange }} className="whitespace-pre-wrap leading-tight text-[11px] inline-block text-left" />
                                </td>
                                <td className="py-3 px-4 border border-slate-200 text-slate-600 italic truncate max-w-[150px] text-sm md:text-xs">{tp.parameter.method || '-'}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
    </div>
    );
}