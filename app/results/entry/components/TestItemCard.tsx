"use client";

import React from 'react';
import { MessageSquare, StickyNote, RotateCcw, Save, CheckCircle2, Loader2, Barcode, History, FileWarning, FileText, ChevronDown, Bug, MousePointer2 } from 'lucide-react';
import { getDisplayRange, getMatchedRange } from './ResultEntryUtils';

export default function TestItemCard({
    item, bill, results = {}, flags = {}, hasHistory = [], savingItemId,
    parameters = [], isParamsLoading = false, // 🐛 FIX: Changed from testParams to parameters to match parent
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

    if (item.test.isCountNeeded && parameters && parameters.length > 0) {
        const countParams = parameters.filter((tp: any) => tp?.isCountDependent && !tp?.isHeading && tp?.parameter);
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
    <div className="md:border-b md:border-slate-200 md:rounded-lg overflow-hidden md:shadow-sm transition-all md:hover:shadow-md mb-0 md:mb-6 bg-white w-full max-w-full">
        <div className="bg-white px-3 md:px-4 py-2.5 md:py-2 md:border-b md:border-slate-100 flex justify-between items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-slate-800 text-[10px] md:text-base truncate">{item.test.name}</span>
                <span className={`text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded font-bold uppercase shrink-0 ${item.status === 'Approved' ? 'bg-green-100 text-green-700' : item.status === 'Printed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{item.status || 'Pending'}</span>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onOpenNote && onOpenNote(item)} className="p-1.5 md:px-3 md:py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-purple-50 flex items-center gap-1">
                    <MessageSquare size={12} className="md:w-[14px] md:h-[14px]" /> <span className="hidden md:inline">Note</span>
                </button>
                {isApproved ? (
                    <button onClick={() => onSaveItem && onSaveItem(item, 'Entered')} disabled={isRowSaving || isParamsLoading} className="p-1.5 md:px-3 md:py-1.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded hover:bg-red-100 flex items-center gap-1">
                        {isRowSaving ? <Loader2 size={12} className="animate-spin md:w-[14px] md:h-[14px]"/> : <RotateCcw size={12} className="md:w-[14px] md:h-[14px]" />} <span className="hidden md:inline">Unapprove</span>
                    </button>
                ) : (
                    <>
                        <button onClick={() => onSaveItem && onSaveItem(item, 'Entered')} disabled={isRowSaving || isParamsLoading} className="p-1.5 md:px-3 md:py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-blue-50 flex items-center gap-1">
                            {isRowSaving ? <Loader2 size={12} className="animate-spin md:w-[14px] md:h-[14px]"/> : <Save size={12} className="md:w-[14px] md:h-[14px]" />} <span className="hidden md:inline">Save</span>
                        </button>
                        <button onClick={() => onSaveItem && onSaveItem(item, 'Approved')} disabled={isRowSaving || isParamsLoading} className="p-1.5 md:px-3 md:py-1.5 bg-[#9575cd] text-white border border-[#9575cd] text-[10px] font-bold rounded hover:bg-[#7e57c2] flex items-center gap-1">
                            {isRowSaving ? <Loader2 size={12} className="animate-spin md:w-[14px] md:h-[14px]"/> : <CheckCircle2 size={12} className="md:w-[14px] md:h-[14px]" />} <span className="hidden md:inline">Approve</span>
                        </button>
                    </>
                )}
            </div>
        </div>
        
        {isParamsLoading ? (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center bg-slate-50 w-full">
                <Loader2 size={24} className="text-[#9575cd] animate-spin mb-2" />
                <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Format...</span>
            </div>
        ) : (!parameters || parameters.length === 0) ? (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center text-center w-full bg-amber-50">
                <FileWarning size={24} className="text-amber-600 mb-2" />
                <h4 className="text-xs md:text-sm font-bold text-amber-800">Format Missing</h4>
                <p className="text-[10px] md:text-xs text-amber-600">Please configure the parameters for this test.</p>
            </div>
        ) : (
            <div className="p-0 bg-white w-full">
                
                {/* DESKTOP TABLE */}
                <div className="hidden md:block w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs md:text-sm border-collapse min-w-[850px]">
                        <thead>
                            <tr className="text-slate-500 bg-slate-50/50 text-left">
                                <th className="py-2 md:py-3 px-2 md:px-4 border border-slate-200 w-[25%] font-bold uppercase tracking-wider text-[10px] md:text-[11px]">Parameter</th>
                                <th className="py-2 md:py-3 px-2 md:px-4 border border-slate-200 w-[25%] font-bold uppercase tracking-wider text-[10px] md:text-[11px]">Result</th>
                                <th className="py-2 md:py-3 px-1 md:px-2 border border-slate-200 w-[8%] font-bold uppercase tracking-wider text-[10px] md:text-[11px] text-center">Flag</th>
                                <th className="py-2 md:py-3 px-2 md:px-4 border border-slate-200 w-[10%] font-bold uppercase tracking-wider text-[10px] md:text-[11px] text-center">Units</th>
                                <th className="py-2 md:py-3 px-2 md:px-4 border border-slate-200 w-[17%] font-bold uppercase tracking-wider text-[10px] md:text-[11px] text-center">Ref. Range</th>
                                <th className="py-2 md:py-3 px-2 md:px-4 border border-slate-200 w-[15%] font-bold uppercase tracking-wider text-[10px] md:text-[11px]">Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parameters.map((tp: any, index: number) => {
                                if (!tp) return null;

                                if (tp.isHeading) return (
                                    <tr key={`heading-${index}`} className="bg-slate-100">
                                        <td colSpan={6} className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px] md:text-[11px] text-center">{tp.headingText || '-'}</td>
                                    </tr>
                                );

                                if (tp.isCultureField) {
                                    const cultureVal = results[`${item.id}--999`];
                                    let activeOrgCount = 0;
                                    if (cultureVal) try { activeOrgCount = Array.isArray(JSON.parse(cultureVal)?.organisms) ? JSON.parse(cultureVal).organisms.length : 0; } catch(e){}
                                    return (
                                        <tr key={`culture-${index}`} className={`hover:bg-rose-50/30 transition-colors group ${isApproved ? 'opacity-70 pointer-events-none' : ''}`}>
                                            <td className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 font-medium text-slate-700">
                                                <div className="flex items-center gap-1 text-rose-600 font-bold"><Bug size={14} className="md:w-4 md:h-4"/><span className="text-xs md:text-sm">Susceptibility Info</span></div>
                                            </td>
                                            <td className="py-1 md:py-3 px-2 md:px-4 border border-slate-200 relative group/cult">
                                                <input readOnly value={activeOrgCount > 0 ? `${activeOrgCount} Organisms` : ''} placeholder="Click to Configure" onClick={() => onOpenCultureModal && onOpenCultureModal(item.id)} className="w-full h-7 md:h-8 border rounded px-2 outline-none font-bold cursor-pointer text-rose-600 bg-rose-50 border-rose-200 placeholder:text-rose-300 placeholder:font-normal text-[11px] md:text-xs" />
                                                <div onClick={() => onOpenCultureModal && onOpenCultureModal(item.id)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 group-hover/cult:opacity-100 cursor-pointer text-rose-500 transition-opacity"><MousePointer2 size={14} className="md:w-4 md:h-4"/></div>
                                            </td>
                                            <td colSpan={4} className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 text-center text-slate-400 italic text-[10px] md:text-xs">Culture Template System</td>
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
                                    <td className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 font-medium text-slate-700 text-[11px] md:text-xs">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="truncate">{tp.parameter.name}</span>
                                            {isLastCountParam && hasAnyCountValueEntered && (
                                                <span className={`shrink-0 text-[9px] md:text-[10px] font-bold px-1 py-0.5 rounded ${currentTotalSum === targetCount ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`} title={`Target: ${targetCount}`}>{currentTotalSum}</span>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className="py-1 px-2 md:px-4 border border-slate-200 relative">
                                        <div className="flex items-center gap-1 md:gap-1.5">
                                            {tp.parameter.inputType === 'Big' ? (
                                                <button onClick={() => onOpenResultEditor && onOpenResultEditor(item.id, tp.parameter)} disabled={isApproved} className={`w-full h-7 md:h-8 border border-slate-300 rounded px-2 flex items-center justify-end ${isApproved ? 'bg-slate-50' : 'bg-white'}`}><FileText size={14} className={`md:w-[18px] md:h-[18px] ${results[`${item.id}-${tp.parameter.id}`] ? "text-green-500" : "text-slate-400"}`}/></button>
                                            ) : isMultiValue && options.length > 0 ? (
                                                <div className="relative w-full">
                                                    {!currentVal && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] md:text-xs pointer-events-none z-10">Auto suggest</span>}
                                                    <select value={currentVal || ''} onChange={(e) => onInputChange && onInputChange(item.id, tp.parameter, e.target.value, parameters)} disabled={isApproved} className={`w-full h-7 md:h-8 border rounded pl-2 pr-6 md:pr-8 outline-none appearance-none bg-transparent relative z-0 text-[11px] md:text-xs ${isApproved ? 'bg-slate-50' : ''} ${!currentVal ? 'text-slate-400' : (isCurrentValAbnormal ? 'text-red-600 font-bold' : 'text-slate-800 font-normal')}`}>
                                                        <option value="">&nbsp;</option>
                                                        {options.map((opt: string, idx: number) => <option key={idx} value={opt} className={`text-slate-800 ${abnormalValues.includes(opt.trim().toLowerCase()) ? 'font-bold' : ''}`}>{opt}</option>)}
                                                    </select>
                                                    <ChevronDown size={14} className="md:w-4 md:h-4 absolute right-1 md:right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"/>
                                                </div>
                                            ) : (
                                                <input type="text" value={results[`${item.id}-${tp.parameter.id}`] || ''} onChange={(e) => onInputChange && onInputChange(item.id, tp.parameter, e.target.value, parameters)} disabled={isApproved} className={`w-full h-7 md:h-8 border rounded px-2 outline-none font-bold text-slate-800 text-[11px] md:text-xs ${isApproved ? 'bg-slate-50 border-slate-100 text-slate-500' : 'border-slate-300 focus:border-[#9575cd] focus:ring-1'}`}/>
                                            )}
                                            <button onClick={() => historyExists && onViewHistory && onViewHistory(tp.parameter.id, tp.parameter.name)} disabled={!historyExists} className={`shrink-0 p-1 md:p-1 rounded ${historyExists ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-200'}`}><History size={14} className="md:w-[18px] md:h-[18px]" /></button>
                                        </div>
                                    </td>

                                    <td className="py-1.5 md:py-3 px-1 md:px-2 border border-slate-200 text-center">
                                        {flags[`${item.id}-${tp.parameter.id}`] === 'High' && <span className="text-red-600 font-bold bg-red-50 px-1 md:px-2 py-0.5 rounded border border-red-100 text-[9px] md:text-[10px]">H</span>}
                                        {flags[`${item.id}-${tp.parameter.id}`] === 'Low' && <span className="text-blue-600 font-bold bg-blue-50 px-1 md:px-2 py-0.5 rounded border border-blue-100 text-[9px] md:text-[10px]">L</span>}
                                        {flags[`${item.id}-${tp.parameter.id}`] === 'Abnormal' && <span className="text-red-600 font-bold bg-red-50 px-1 md:px-2 py-0.5 rounded border border-red-100 text-[9px] md:text-[10px]">A</span>}
                                    </td>
                                    <td className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 text-center text-slate-600 font-medium text-[11px] md:text-xs">{tp.parameter.unit}</td>
                                    <td className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 text-center align-middle text-slate-600 font-medium">
                                        <div dangerouslySetInnerHTML={{ __html: displayRange }} className="whitespace-pre-wrap leading-tight text-[10px] md:text-[11px] inline-block text-left" />
                                    </td>
                                    <td className="py-1.5 md:py-3 px-2 md:px-4 border border-slate-200 text-slate-600 italic truncate max-w-[120px] md:max-w-[150px] text-[10px] md:text-xs">{tp.parameter.method || '-'}</td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE STACKED VIEW */}
                <div className="md:hidden flex flex-col">
                    {parameters.map((tp: any, index: number) => {
                        if (!tp) return null;

                        if (tp.isHeading) return (
                            <div key={`mob-heading-${index}`} className="bg-white px-2 py-1.5 font-bold uppercase tracking-wider text-[9px] text-slate-800 text-center">
                                {tp.headingText || '-'}
                            </div>
                        );

                        if (tp.isCultureField) {
                            const cultureVal = results[`${item.id}--999`];
                            let activeOrgCount = 0;
                            if (cultureVal) try { activeOrgCount = Array.isArray(JSON.parse(cultureVal)?.organisms) ? JSON.parse(cultureVal).organisms.length : 0; } catch(e){}
                            return (
                                <div key={`mob-culture-${index}`} className={`p-2 flex flex-col gap-1.5 ${isApproved ? 'opacity-70 pointer-events-none' : ''}`}>
                                    <div className="flex items-center gap-1.5 text-rose-600 font-medium"><Bug size={12}/><span className="text-[10px]">Susceptibility Info</span></div>
                                    <div className="relative group/cult">
                                        <input readOnly value={activeOrgCount > 0 ? `${activeOrgCount} Organisms` : ''} placeholder="Click to Configure" onClick={() => onOpenCultureModal && onOpenCultureModal(item.id)} className="w-full h-6 border rounded px-2 outline-none font-medium cursor-pointer text-rose-600 bg-rose-50 border-rose-200 placeholder:text-rose-300 placeholder:font-normal text-[10px]" />
                                        <div onClick={() => onOpenCultureModal && onOpenCultureModal(item.id)} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 cursor-pointer text-rose-500"><MousePointer2 size={12}/></div>
                                    </div>
                                    <span className="text-[8px] text-slate-400 italic">Culture Template System</span>
                                </div>
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
                        <div key={`mob-param-${tp.parameter.id}`} className="flex flex-col gap-1 p-2 hover:bg-slate-50/50">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                                    <span className="font-medium text-slate-700 text-[9px] shrink-0">{tp.parameter.name}</span>
                                    {displayRange && (
                                        <div dangerouslySetInnerHTML={{ __html: displayRange.replace(/<br\s*\/?>/gi, ' ') }} className="text-[8px] text-slate-400 truncate" />
                                    )}
                                </div>
                                {isLastCountParam && hasAnyCountValueEntered && (
                                    <span className={`shrink-0 text-[8px] font-medium px-1.5 py-0.5 rounded ${currentTotalSum === targetCount ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`} title={`Target: ${targetCount}`}>{currentTotalSum}</span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                                <div className="w-28 relative flex items-center gap-1.5">
                                    {tp.parameter.inputType === 'Big' ? (
                                        <button onClick={() => onOpenResultEditor && onOpenResultEditor(item.id, tp.parameter)} disabled={isApproved} className={`flex-1 h-6 border border-slate-300 rounded px-2 flex items-center justify-end ${isApproved ? 'bg-slate-50' : 'bg-white'}`}><FileText size={12} className={`${results[`${item.id}-${tp.parameter.id}`] ? "text-green-500" : "text-slate-400"}`}/></button>
                                    ) : isMultiValue && options.length > 0 ? (
                                        <div className="relative flex-1">
                                            {!currentVal && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] pointer-events-none z-10">Select</span>}
                                            <select value={currentVal || ''} onChange={(e) => onInputChange && onInputChange(item.id, tp.parameter, e.target.value, parameters)} disabled={isApproved} className={`w-full h-6 border rounded pl-2 pr-5 outline-none appearance-none bg-transparent relative z-0 text-[9px] font-medium ${isApproved ? 'bg-slate-50' : ''} ${!currentVal ? 'text-slate-400' : (isCurrentValAbnormal ? 'text-red-600 font-bold' : 'text-slate-800')}`}>
                                                <option value="">&nbsp;</option>
                                                {options.map((opt: string, idx: number) => <option key={idx} value={opt} className={`text-slate-800 ${abnormalValues.includes(opt.trim().toLowerCase()) ? 'font-bold' : ''}`}>{opt}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"/>
                                        </div>
                                    ) : (
                                        <input type="text" value={results[`${item.id}-${tp.parameter.id}`] || ''} onChange={(e) => onInputChange && onInputChange(item.id, tp.parameter, e.target.value, parameters)} disabled={isApproved} className={`flex-1 min-w-0 w-full h-6 border rounded px-2 outline-none font-medium text-slate-800 text-[9px] ${isApproved ? 'bg-slate-50 border-slate-100 text-slate-500' : 'border-slate-300 focus:border-[#9575cd] focus:ring-1'}`}/>
                                    )}
                                    <button onClick={() => historyExists && onViewHistory && onViewHistory(tp.parameter.id, tp.parameter.name)} disabled={!historyExists} className={`shrink-0 p-1 rounded ${historyExists ? 'text-blue-500 hover:bg-blue-50' : 'text-slate-200'}`}><History size={12} /></button>
                                </div>
                                
                                <div className="flex flex-col items-start shrink-0 min-w-[3rem]">
                                    <div className="flex items-center gap-1">
                                        {flags[`${item.id}-${tp.parameter.id}`] && flags[`${item.id}-${tp.parameter.id}`] !== 'Normal' && (
                                            <span className={`text-[8px] font-medium px-1 rounded ${flags[`${item.id}-${tp.parameter.id}`] === 'High' ? 'bg-red-50 text-red-600' : flags[`${item.id}-${tp.parameter.id}`] === 'Low' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                {flags[`${item.id}-${tp.parameter.id}`] === 'Abnormal' ? 'A' : flags[`${item.id}-${tp.parameter.id}`][0]}
                                            </span>
                                        )}
                                        <span className="text-[9px] text-slate-500 font-medium truncate">{tp.parameter.unit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        )}
    </div>
    );
}