// --- BLOCK app/list/components/ListTable.tsx OPEN ---
"use client";

import React from 'react';
// 🚨 FIXED: Added 'Bug' to the imports!
import { Printer, FileText, Barcode, Banknote, RefreshCcw, Edit, History, CheckCircle2, Loader2, AlertCircle, Sparkles, Trash2, Info, ChevronLeft, ChevronRight, Bug } from 'lucide-react';

interface ListTableProps {
    bills: any[];
    isLoading: boolean;
    viewMode: 'list' | 'grid';
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    onPrintBill: (bill: any) => void;
    onPrintBarcode: (bill: any) => void;
    onOpenClearDue: (bill: any) => void;
    onOpenAudit: (bill: any) => void;
    onOpenReport: (bill: any) => void;
    onOpenSmartReport: (bill: any) => void; 
    onOpenCultureReport?: (bill: any) => void; 
    onOpenRefund: (bill: any) => void;
    onDeleteBill: (bill: any) => void;
    onEditBill: (bill: any) => void;
}

export default function ListTable({ 
    bills, isLoading, viewMode, 
    currentPage = 1, totalPages = 1, totalItems = 0, onPageChange,
    onPrintBill, onPrintBarcode, onOpenClearDue, onOpenAudit, onOpenReport, onOpenSmartReport, onOpenCultureReport, onOpenRefund, onDeleteBill, onEditBill 
}: ListTableProps) {
    
    const ActionButton = ({ icon: Icon, onClick, tooltip, colorClass, disabled, label }: any) => (
        <button 
            onClick={disabled ? undefined : onClick} 
            title={tooltip}
            disabled={disabled}
            className={`p-1.5 rounded border transition-all shadow-sm flex items-center justify-center flex-1 w-full gap-1.5 ${disabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : `border-transparent hover:border-slate-200 bg-white ${colorClass}`}`}
        >
            <Icon size={16} />
            {label && <span className="text-[10px] font-bold hidden xl:inline">{label}</span>}
        </button>
    );

    const getReferralDetails = (patient: any) => {
        const refStr = patient?.refDoctor || '';
        if (!refStr || refStr.toLowerCase() === 'self') return { doc: 'Self', hosp: '', lab: '' };
        let doc = refStr; let hosp = ''; let lab = '';
        const hospMatch = doc.match(/\(([^)]+)\)/);
        if (hospMatch) { hosp = hospMatch[1].trim(); doc = doc.replace(hospMatch[0], ''); }
        const labMatch = doc.match(/-\s*(.+)$/);
        if (labMatch) { lab = labMatch[1].trim(); doc = doc.replace(labMatch[0], ''); }
        doc = doc.trim();
        if (!doc && !hosp && !lab) doc = 'Self';
        return { doc, hosp, lab };
    };

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="animate-spin text-[#9575cd]" size={32}/>
                <p className="text-sm font-medium">Loading Patients...</p>
            </div>
        );
    }

    if (bills.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                <AlertCircle size={48} className="opacity-20 mb-2"/>
                <p className="text-sm font-medium">No records found for current filters.</p>
            </div>
        );
    }

    const LegendBar = () => (
        <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-wrap items-center gap-6 shrink-0 w-full overflow-x-auto whitespace-nowrap custom-scrollbar">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider"><Info size={14} className="text-[#9575cd]" /> Test Status Indicators:</div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className="w-5 h-5 flex items-center justify-center rounded bg-amber-100 text-amber-700 font-bold border border-amber-200 text-[10px]">P</span>Pending</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className="w-5 h-5 flex items-center justify-center rounded bg-blue-100 text-blue-700 font-bold border border-blue-200 text-[10px]">E</span>Entered</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className="w-5 h-5 flex items-center justify-center rounded bg-green-100 text-green-700 font-bold border border-green-200 text-[10px]">A</span>Approved</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600"><span className="w-5 h-5 flex items-center justify-center rounded bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px]">Pr</span>Printed</div>
            </div>
        </div>
    );

    const PaginationBar = () => {
        return (
            <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 w-full overflow-x-auto whitespace-nowrap custom-scrollbar">
                <div className="text-xs font-medium text-slate-500">
                    Showing <span className="font-bold text-slate-700">{totalItems === 0 ? 0 : ((currentPage - 1) * 10) + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * 10, totalItems)}</span> of <span className="font-bold text-slate-700">{totalItems}</span> patients
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onPageChange?.(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700 min-w-[80px] text-center">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <button 
                        onClick={() => onPageChange?.(currentPage + 1)} 
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full relative w-full overflow-hidden bg-slate-50/50">
            
            <div className="flex-1 overflow-x-auto overflow-y-auto w-full custom-scrollbar">
                
                {/* --- TABLE VIEW --- */}
                {viewMode === 'list' ? (
                    <table className="w-full text-left text-sm border-collapse min-w-[1000px] md:min-w-[1500px] bg-white">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] align-top">Patient ID</th>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] align-top">Date & Bill No</th>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] align-top">Patient Details</th>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] align-top">Referred By</th>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] align-top w-[250px] md:w-[300px]">Tests</th>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] align-top text-right">Financials</th>
                                
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center border-l border-slate-200">Bill</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center">Barcode</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center">Report</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center">Smart</th>
                                
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center hidden md:table-cell">Culture</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center hidden md:table-cell">Refund</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center hidden md:table-cell">Due</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center hidden md:table-cell">Edit</th>
                                <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] align-top text-center hidden md:table-cell">Delete</th>
                                <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] align-top text-center hidden md:table-cell">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bills.map(bill => {
                                const items = bill.items || [];
                                const refDetails = getReferralDetails(bill.patient);
                                const hasCultureTest = items.some((i: any) => i.test?.isCulture === true || i.test?.isCulture === 'true');
                                const hasPrintableRoutine = items.some((i: any) => i.test?.isCulture !== true && i.test?.isCulture !== 'true' && i.status !== 'Pending');

                                return (
                                    <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 align-top"><div className="font-bold text-slate-800">{bill.patient.patientId}</div></td>
                                        <td className="py-3 px-4 align-top">
                                            <div className="font-bold text-slate-700">{new Date(bill.date).toLocaleDateString('en-GB')}</div>
                                            <div className="text-[11px] font-mono text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded w-fit mt-1 border border-purple-100">{String(bill.billNumber || '').slice(-4)}</div>
                                        </td>
                                        <td className="py-3 px-4 align-top">
                                            <div className="font-bold text-slate-800">{bill.patient.designation} {bill.patient.firstName} {bill.patient.lastName}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{bill.patient.ageY}Y {bill.patient.ageM}M / {bill.patient.gender} | {bill.patient.phone}</div>
                                        </td>
                                        <td className="py-3 px-4 align-top">
                                            {refDetails.doc && refDetails.doc !== 'Self' && <div className="font-bold text-slate-700">{refDetails.doc}</div>}
                                            {refDetails.doc === 'Self' && !refDetails.hosp && !refDetails.lab && <div className="font-bold text-slate-700">Self</div>}
                                            {refDetails.hosp && <div className={`text-[10px] font-bold text-[#9575cd] ${refDetails.doc ? 'mt-0.5' : ''}`}>{refDetails.hosp}</div>}
                                            {refDetails.lab && <div className={`text-[10px] font-bold text-[#00acc1] ${refDetails.doc || refDetails.hosp ? 'mt-0.5' : ''}`}>{refDetails.lab}</div>}
                                        </td>
                                        <td className="py-3 px-4 align-top">
                                            <div className="flex flex-wrap gap-1.5">
                                                {items.map((item: any, idx: number) => {
                                                    let sCode = 'P'; let sColor = 'bg-amber-100 text-amber-700 border-amber-200';
                                                    if (item.status === 'Entered') { sCode = 'E'; sColor = 'bg-blue-100 text-blue-700 border-blue-200'; }
                                                    else if (item.status === 'Approved') { sCode = 'A'; sColor = 'bg-green-100 text-green-700 border-green-200'; }
                                                    else if (item.status === 'Printed') { sCode = 'Pr'; sColor = 'bg-indigo-100 text-indigo-700 border-indigo-200'; }
                                                    return (
                                                        <div key={idx} className="flex items-center text-[10px] bg-white border border-slate-200 rounded shadow-sm overflow-hidden" title={`${item.test.name} - Status: ${item.status}`}>
                                                            <span className="px-2 py-0.5 text-slate-700 font-medium whitespace-normal break-words flex items-center gap-1">{item.test.name}{item.isUrgent && <span className="bg-red-500 text-white text-[8px] px-1 rounded uppercase font-black">Urgent</span>}</span>
                                                            <span className={`px-1.5 py-0.5 font-bold border-l ${sColor} h-full flex items-center justify-center`}>{sCode}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right align-top">
                                            {/* 🚨 FIXED ENCODING SYMBOLS HERE */}
                                            <div className="font-bold text-slate-800">₹{bill.netAmount}</div>
                                            {bill.dueAmount > 0 ? (
                                                <div className="text-[10px] font-bold text-red-600 mt-0.5">Due: ₹{bill.dueAmount}</div>
                                            ) : (
                                                <div className="text-[10px] font-bold text-green-600 mt-0.5 flex items-center justify-end gap-1"><CheckCircle2 size={10}/> Paid</div>
                                            )}
                                        </td>
                                        
                                        <td className="py-3 px-2 align-top text-center border-l border-slate-100"><ActionButton icon={Printer} onClick={() => onPrintBill(bill)} tooltip="Print Bill" colorClass="text-blue-600 hover:bg-blue-50 border-blue-100" /></td>
                                        <td className="py-3 px-2 align-top text-center"><ActionButton icon={Barcode} onClick={() => onPrintBarcode(bill)} tooltip="Print Barcode" colorClass="text-indigo-600 hover:bg-indigo-50 border-indigo-100" /></td>
                                        <td className="py-3 px-2 align-top text-center"><ActionButton icon={FileText} onClick={() => onOpenReport(bill)} disabled={!hasPrintableRoutine} tooltip={hasPrintableRoutine ? "Print Report" : "No routine results ready"} colorClass="text-purple-600 hover:bg-purple-50 border-purple-100" /></td>
                                        <td className="py-3 px-2 align-top text-center"><ActionButton icon={Sparkles} onClick={() => onOpenSmartReport(bill)} tooltip="Smart Report" colorClass="text-amber-500 hover:text-amber-600 hover:bg-amber-50 border-amber-100" /></td>

                                        <td className="py-3 px-2 align-top text-center hidden md:table-cell">
                                            {hasCultureTest && onOpenCultureReport ? <ActionButton icon={Bug} onClick={() => onOpenCultureReport(bill)} tooltip="Culture Report" colorClass="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100" /> : <span className="text-[10px] text-slate-300">-</span>}
                                        </td>
                                        <td className="py-3 px-2 align-top text-center hidden md:table-cell"><ActionButton icon={RefreshCcw} onClick={() => onOpenRefund(bill)} disabled={bill.paidAmount <= 0} tooltip="Refund" colorClass="text-orange-600 hover:bg-orange-50 border-orange-100" /></td>
                                        <td className="py-3 px-2 align-top text-center hidden md:table-cell"><ActionButton icon={Banknote} onClick={() => onOpenClearDue(bill)} tooltip={bill.dueAmount > 0 ? "Clear Due" : "No Due Pending"} colorClass="text-emerald-600 hover:bg-emerald-50 border-emerald-100" disabled={bill.dueAmount <= 0} /></td>
                                        <td className="py-3 px-2 align-top text-center hidden md:table-cell"><ActionButton icon={Edit} onClick={() => onEditBill(bill)} tooltip="Edit Details" colorClass="text-teal-600 hover:bg-teal-50 border-teal-100" /></td>
                                        <td className="py-3 px-2 align-top text-center hidden md:table-cell"><ActionButton icon={Trash2} onClick={() => onDeleteBill(bill)} tooltip="Delete Bill" colorClass="text-rose-600 hover:bg-rose-50 border-rose-100" /></td>
                                        <td className="py-3 px-4 align-top text-center hidden md:table-cell"><ActionButton icon={History} onClick={() => onOpenAudit(bill)} tooltip="Audit Log" colorClass="text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm" /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    /* --- GRID VIEW --- */
                    <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {bills.map(bill => {
                            const items = bill.items || [];
                            const refDetails = getReferralDetails(bill.patient);
                            const hasCultureTest = items.some((i: any) => i.test?.isCulture === true || i.test?.isCulture === 'true');
                            const hasPrintableRoutine = items.some((i: any) => i.test?.isCulture !== true && i.test?.isCulture !== 'true' && i.status !== 'Pending');

                            return (
                                <div key={bill.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                    
                                    {/* Header */}
                                    <div className="bg-slate-50 border-b border-slate-100 p-3 px-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500">{new Date(bill.date).toLocaleDateString('en-GB')}</span>
                                        </div>
                                        <div className="text-[11px] font-mono font-bold text-[#9575cd] bg-purple-50 px-2 py-0.5 rounded border border-purple-100 shadow-sm">
                                            {bill.billNumber}
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 flex-1 flex flex-col gap-4">
                                        
                                        {/* Patient Info */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 font-bold border border-slate-200">
                                                {bill.patient.firstName?.charAt(0)}{bill.patient.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 leading-tight">{bill.patient.designation} {bill.patient.firstName} {bill.patient.lastName}</span>
                                                <span className="text-[11px] text-slate-500 mt-0.5">{bill.patient.ageY}Y {bill.patient.ageM}M / {bill.patient.gender} | ID: {bill.patient.patientId}</span>
                                                <span className="text-[11px] font-medium text-[#9575cd] mt-0.5">Ref: {refDetails.doc === 'Self' ? 'Self' : refDetails.doc}</span>
                                            </div>
                                        </div>

                                        {/* Financials Summary */}
                                        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Net Amount</span>
                                                {/* 🚨 FIXED ENCODING SYMBOLS HERE TOO */}
                                                <span className="text-sm font-black text-slate-800">₹{bill.netAmount}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                                                {bill.dueAmount > 0 ? (
                                                    <span className="text-xs font-black text-red-500">Due: ₹{bill.dueAmount}</span>
                                                ) : (
                                                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Paid</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tests Pills */}
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {items.slice(0, 4).map((item: any, idx: number) => {
                                                let sCode = 'P'; let sColor = 'bg-amber-100 text-amber-700 border-amber-200';
                                                if (item.status === 'Entered') { sCode = 'E'; sColor = 'bg-blue-100 text-blue-700 border-blue-200'; }
                                                else if (item.status === 'Approved') { sCode = 'A'; sColor = 'bg-green-100 text-green-700 border-green-200'; }
                                                else if (item.status === 'Printed') { sCode = 'Pr'; sColor = 'bg-indigo-100 text-indigo-700 border-indigo-200'; }
                                                return (
                                                    <div key={idx} className="flex items-center text-[9px] bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex-1 min-w-[45%]">
                                                        <span className="px-1.5 py-0.5 text-slate-600 font-medium truncate flex-1">{item.test.name}</span>
                                                        <span className={`px-1.5 py-0.5 font-bold border-l ${sColor} shrink-0`}>{sCode}</span>
                                                    </div>
                                                );
                                            })}
                                            {items.length > 4 && (
                                                <div className="flex items-center justify-center text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-2">
                                                    +{items.length - 4} more
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Grid */}
                                    <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1">
                                        <div className="w-full flex gap-1 mb-1">
                                            <ActionButton icon={FileText} label="Report" onClick={() => onOpenReport(bill)} disabled={!hasPrintableRoutine} colorClass="text-purple-600 hover:bg-purple-50 border-purple-100" />
                                            <ActionButton icon={Printer} label="Invoice" onClick={() => onPrintBill(bill)} colorClass="text-blue-600 hover:bg-blue-50 border-blue-100" />
                                            <ActionButton icon={Barcode} onClick={() => onPrintBarcode(bill)} tooltip="Barcode" colorClass="text-indigo-600 hover:bg-indigo-50 border-indigo-100" />
                                            <ActionButton icon={Sparkles} onClick={() => onOpenSmartReport(bill)} tooltip="Smart Report" colorClass="text-amber-500 hover:bg-amber-50 border-amber-100" />
                                        </div>
                                        <div className="w-full flex gap-1">
                                            <ActionButton icon={Banknote} onClick={() => onOpenClearDue(bill)} tooltip="Clear Due" colorClass="text-emerald-600 hover:bg-emerald-50 border-emerald-100" disabled={bill.dueAmount <= 0} />
                                            <ActionButton icon={RefreshCcw} onClick={() => onOpenRefund(bill)} tooltip="Refund" colorClass="text-orange-600 hover:bg-orange-50 border-orange-100" disabled={bill.paidAmount <= 0} />
                                            {hasCultureTest && onOpenCultureReport && <ActionButton icon={Bug} onClick={() => onOpenCultureReport(bill)} tooltip="Culture Report" colorClass="text-rose-500 hover:bg-rose-50 border-rose-100" />}
                                            <ActionButton icon={Edit} onClick={() => onEditBill(bill)} tooltip="Edit Details" colorClass="text-teal-600 hover:bg-teal-50 border-teal-100" />
                                            <ActionButton icon={Trash2} onClick={() => onDeleteBill(bill)} tooltip="Delete Bill" colorClass="text-rose-600 hover:bg-rose-50 border-rose-100" />
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <PaginationBar />
            <LegendBar />
        </div>
    );
}
// --- BLOCK app/list/components/ListTable.tsx CLOSE ---