"use client";

import React from 'react';
import { Printer, FileText, CreditCard, DollarSign, RefreshCcw, Edit, Clock, CheckCircle, AlertCircle, Zap, Trash2, Info, ChevronLeft, ChevronRight, Activity, Send } from 'lucide-react';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 

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
    onSendWhatsappReport: (bill: any) => void;
    whatsappManualEnabled?: boolean;
    onOpenSmartReport: (bill: any) => void; 
    onOpenCultureReport?: (bill: any) => void; 
    onOpenRefund: (bill: any) => void;
    onDeleteBill: (bill: any) => void;
    onEditBill: (bill: any) => void;
}

export default function ListTable({ 
    bills, isLoading, viewMode, 
    currentPage = 1, totalPages = 1, totalItems = 0, onPageChange,
    onPrintBill, onPrintBarcode, onOpenClearDue, onOpenAudit, onOpenReport, onSendWhatsappReport, whatsappManualEnabled = true, onOpenSmartReport, onOpenCultureReport, onOpenRefund, onDeleteBill, onEditBill 
}: ListTableProps) {
    
    const ActionButton = ({ icon: Icon, onClick, tooltip, colorClass, disabled, label, className = '' }: any) => (
        <button 
            onClick={disabled ? undefined : onClick} 
            title={tooltip}
            disabled={disabled}
            className={`
                h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border transition-all inline-flex items-center justify-center gap-1 leading-none text-[10px] font-normal
                ${disabled 
                    ? 'text-slate-300 bg-slate-50 border-slate-200 cursor-not-allowed opacity-60' 
                    : `bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs ${colorClass}`
                } ${className}
            `}
        >
            <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" strokeWidth={2} />
            {label && <span className="hidden xl:inline text-[9px] font-medium">{label}</span>}
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
            <div className="h-full flex flex-col items-center justify-center">
                <MusicBarLoader text="Loading Patients..." />
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

    const renderPatientCard = (bill: any) => {
        const items = bill.items || [];
        const refDetails = getReferralDetails(bill.patient);
        const hasCultureTest = items.some((i: any) => i.test?.isCulture === true || i.test?.isCulture === 'true');
        const hasPrintableRoutine = items.some((i: any) => i.test?.isCulture !== true && i.test?.isCulture !== 'true' && i.status !== 'Pending');

        return (
            <div key={bill.id} className="bg-white rounded-lg md:rounded-2xl shadow-sm border border-slate-100 md:border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                
                {/* Header */}
                <div className="bg-transparent md:bg-slate-50 border-b-0 md:border-b border-slate-100 pt-2.5 px-2.5 pb-0 md:p-3 md:px-4 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500">{new Date(bill.date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="text-[9px] md:text-[11px] font-mono font-bold text-[#9575cd] bg-slate-50 md:bg-purple-50 px-1.5 py-0.5 md:px-2 rounded border border-slate-200 md:border-purple-100 shadow-sm md:shadow-sm">
                        #{String(bill.billNumber).slice(-6)}
                    </div>
                </div>

                <div className="p-2.5 md:p-4 space-y-2 md:space-y-3 flex-1">
                    {/* Patient & Financial Info */}
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 text-xs md:text-sm truncate">
                                {bill.patient?.designation} {bill.patient?.firstName} {bill.patient?.lastName}
                            </h3>
                            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">
                                {bill.patient?.ageY}Y {bill.patient?.ageM ? `${bill.patient?.ageM}M` : ''} / {bill.patient?.gender}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="font-bold text-slate-800 text-xs md:text-sm">₹{bill.netAmount}</span>
                            {bill.dueAmount > 0 ? (
                                <div className="text-[9px] md:text-[10px] font-bold text-red-600 mt-0.5">Due: ₹{bill.dueAmount}</div>
                            ) : (
                                <div className="text-[9px] md:text-[10px] font-bold text-green-600 mt-0.5 flex items-center justify-end gap-0.5"><CheckCircle size={10}/> Paid</div>
                            )}
                        </div>
                    </div>

                    {/* Meta: Doctor & Contact */}
                    <div className="bg-slate-50 rounded-lg p-2 md:p-2.5 border border-slate-100 flex flex-col gap-1 text-[10px] md:text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Doctor:</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                {refDetails.doc}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Phone:</span>
                            <span className="font-mono">{bill.patient?.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">PID:</span>
                            <span className="font-mono">{bill.patient?.patientId || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Test List with Status Pills */}
                    <div className="flex flex-wrap gap-1 md:gap-1.5 pt-1">
                        {items.map((item: any, idx: number) => {
                            let sCode = 'P'; let sColor = 'bg-amber-100 text-amber-700 border-amber-200';
                            if (item.status === 'Entered') { sCode = 'E'; sColor = 'bg-blue-100 text-blue-700 border-blue-200'; }
                            else if (item.status === 'Approved') { sCode = 'A'; sColor = 'bg-green-100 text-green-700 border-green-200'; }
                            else if (item.status === 'Printed') { sCode = 'Pr'; sColor = 'bg-indigo-100 text-indigo-700 border-indigo-200'; }

                            return (
                                <div key={idx} className="flex items-center text-[8px] md:text-[9px] bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex-1 min-w-[45%]">
                                    <span className="px-1 md:px-1.5 py-0.5 text-slate-600 font-medium truncate flex-1">{item.test?.name}</span>
                                    <span className={`px-1 md:px-1.5 py-0.5 font-bold border-l ${sColor} shrink-0`}>{sCode}</span>
                                </div>
                            );
                        })}
                        {items.length > 4 && (
                            <div className="flex items-center justify-center text-[8px] md:text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 md:px-2">
                                +{items.length - 4} more
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Grid */}
                <div className="pt-1 pb-2 md:p-2 border-t border-slate-100 bg-transparent md:bg-slate-50/50 flex flex-row flex-wrap justify-between gap-1 px-2">
                    <ActionButton icon={FileText} label="Report" onClick={() => onOpenReport(bill)} disabled={!hasPrintableRoutine} colorClass="text-purple-600 hover:bg-purple-50 border-purple-200" />
                    {whatsappManualEnabled && <ActionButton icon={Send} label="WA" onClick={() => onSendWhatsappReport(bill)} disabled={!hasPrintableRoutine} colorClass="text-emerald-600 hover:bg-emerald-50 border-emerald-200" />}
                    <ActionButton icon={Printer} label="Invoice" onClick={() => onPrintBill(bill)} colorClass="text-blue-600 hover:bg-blue-50 border-blue-200" />
                    <ActionButton icon={CreditCard} onClick={() => onPrintBarcode(bill)} tooltip="Barcode" colorClass="text-indigo-600 hover:bg-indigo-50 border-indigo-200" />
                    <ActionButton icon={Zap} onClick={() => onOpenSmartReport(bill)} tooltip="Smart Report" colorClass="text-amber-500 hover:bg-amber-50 border-amber-200" />
                    <ActionButton icon={DollarSign} onClick={() => onOpenClearDue(bill)} tooltip="Clear Due" colorClass="text-emerald-600 hover:bg-emerald-50 border-emerald-200" disabled={bill.dueAmount <= 0} />
                    <ActionButton icon={RefreshCcw} onClick={() => onOpenRefund(bill)} tooltip="Refund" colorClass="text-orange-600 hover:bg-orange-50 border-orange-200" disabled={bill.paidAmount <= 0} />
                    {hasCultureTest && onOpenCultureReport && <ActionButton icon={Activity} onClick={() => onOpenCultureReport(bill)} tooltip="Culture Report" colorClass="text-rose-500 hover:bg-rose-50 border-rose-200" />}
                    <ActionButton icon={Edit} onClick={() => onEditBill(bill)} tooltip="Edit Details" colorClass="text-teal-600 hover:bg-teal-50 border-teal-200" />
                    <ActionButton icon={Trash2} onClick={() => onDeleteBill(bill)} tooltip="Delete Bill" colorClass="text-rose-600 hover:bg-rose-50 border-rose-200" />
                </div>

            </div>
        );
    };

    return (
        <div className="flex flex-col h-full relative w-full overflow-hidden bg-white">
            
            {/* Table Area with space from header and edges matching Result Entry Worklist */}
            <div className="flex-1 overflow-hidden bg-white p-0 md:p-2.5 xl:p-3 flex flex-col min-h-0">
                
                {/* --- MOBILE VIEW: ALWAYS PATIENT CARDS (md:hidden) --- */}
                <div className="block md:hidden overflow-y-auto p-2 space-y-2 h-full custom-scrollbar">
                    {bills.map(bill => renderPatientCard(bill))}
                </div>

                {/* --- DESKTOP VIEW: TABLE OR GRID CONTROLLED BY DESKTOP VIEWMODE (hidden md:block) --- */}
                <div className="hidden md:flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden">
                    {viewMode === 'list' ? (
                        <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
                            <table className="w-full text-left text-sm border-collapse min-w-[1000px] md:min-w-[1450px] bg-white border-spacing-0">
                                <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                    <tr>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Patient ID</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Date & Bill No</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Patient Details</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Referred By</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-[240px]">Tests</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-right">Financials</th>
                                        
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center">Bill</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center">Barcode</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center">Report</th>
                                        {whatsappManualEnabled && <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center">WA</th>}
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center">Smart</th>
                                        
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center hidden md:table-cell">Culture</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center hidden md:table-cell">Refund</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center hidden md:table-cell">Due</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center hidden md:table-cell">Edit</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center hidden md:table-cell">Delete</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[10px] uppercase tracking-wider align-middle leading-none text-center hidden md:table-cell">Audit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.map(bill => {
                                        const items = bill.items || [];
                                        const refDetails = getReferralDetails(bill.patient);
                                        const hasCultureTest = items.some((i: any) => i.test?.isCulture === true || i.test?.isCulture === 'true');
                                        const hasPrintableRoutine = items.some((i: any) => i.test?.isCulture !== true && i.test?.isCulture !== 'true' && i.status !== 'Pending');

                                        return (
                                            <tr key={bill.id} className="hover:bg-purple-50/40 transition-colors">
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                                                    <div className="font-medium text-slate-800 text-[11px] leading-tight">{bill.patient.patientId}</div>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                                                    <div className="font-normal text-slate-700 text-[11px] leading-tight">{new Date(bill.date).toLocaleDateString('en-GB')}</div>
                                                    <div className="text-[10px] font-mono text-[#9575cd] bg-purple-50 px-1 py-0.2 rounded w-fit mt-0.5 border border-purple-100 leading-tight">#{String(bill.billNumber || '').slice(-4)}</div>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap max-w-[200px] overflow-hidden">
                                                    <div className="font-medium text-slate-800 text-[11px] truncate leading-tight" title={`${bill.patient.designation} ${bill.patient.firstName} ${bill.patient.lastName}`}>
                                                        {bill.patient.designation} {bill.patient.firstName} {bill.patient.lastName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight truncate">
                                                        {bill.patient.ageY}Y {bill.patient.ageM ? `${bill.patient.ageM}M` : ''} / {bill.patient.gender} | {bill.patient.phone || '-'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap max-w-[160px] overflow-hidden">
                                                    {refDetails.doc && refDetails.doc !== 'Self' && <div className="font-medium text-slate-700 text-[11px] truncate leading-tight">{refDetails.doc}</div>}
                                                    {refDetails.doc === 'Self' && !refDetails.hosp && !refDetails.lab && <div className="font-normal text-slate-600 text-[11px] leading-tight">Self</div>}
                                                    {refDetails.hosp && <div className={`text-[10px] font-medium text-[#9575cd] truncate leading-tight ${refDetails.doc ? 'mt-0.5' : ''}`}>{refDetails.hosp}</div>}
                                                    {refDetails.lab && <div className={`text-[10px] font-medium text-[#00acc1] truncate leading-tight ${refDetails.doc || refDetails.hosp ? 'mt-0.5' : ''}`}>{refDetails.lab}</div>}
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left max-w-[240px] overflow-hidden">
                                                    <div className="flex flex-wrap gap-1 max-w-[240px] overflow-hidden">
                                                        {items.map((item: any, idx: number) => {
                                                            let sCode = 'P'; let sColor = 'bg-amber-50 text-amber-700 border-amber-200';
                                                            if (item.status === 'Entered') { sCode = 'E'; sColor = 'bg-blue-50 text-blue-700 border-blue-200'; }
                                                            else if (item.status === 'Approved') { sCode = 'A'; sColor = 'bg-green-50 text-green-700 border-green-200'; }
                                                            else if (item.status === 'Printed') { sCode = 'Pr'; sColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'; }
                                                            return (
                                                                <div key={idx} className="inline-flex items-center text-[10px] bg-white border border-slate-200 rounded shadow-2xs overflow-hidden leading-tight" title={`${item.test?.name} - Status: ${item.status}`}>
                                                                    <span className="px-1 py-0.5 text-slate-700 font-normal whitespace-nowrap max-w-[100px] truncate flex items-center gap-0.5">
                                                                        {item.test?.name}
                                                                        {item.isUrgent && <span className="bg-red-500 text-white text-[7px] px-0.5 rounded uppercase font-bold">U</span>}
                                                                    </span>
                                                                    <span className={`px-1 py-0.5 font-bold border-l ${sColor} h-full flex items-center justify-center text-[9px]`}>{sCode}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-right align-middle whitespace-nowrap">
                                                    <div className="font-semibold text-slate-800 text-[11px] leading-tight">₹{bill.netAmount}</div>
                                                    {bill.dueAmount > 0 ? (
                                                        <div className="text-[10px] font-semibold text-red-600 mt-0.5 leading-tight">Due: ₹{bill.dueAmount}</div>
                                                    ) : (
                                                        <div className="text-[10px] font-medium text-green-600 mt-0.5 flex items-center justify-end gap-0.5 leading-tight"><CheckCircle size={9}/> Paid</div>
                                                    )}
                                                </td>
                                                
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap"><ActionButton icon={Printer} onClick={() => onPrintBill(bill)} tooltip="Print Bill" colorClass="text-blue-600 hover:bg-blue-50 border-blue-200" /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap"><ActionButton icon={CreditCard} onClick={() => onPrintBarcode(bill)} tooltip="Print Barcode" colorClass="text-indigo-600 hover:bg-indigo-50 border-indigo-200" /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap"><ActionButton icon={FileText} onClick={() => onOpenReport(bill)} disabled={!hasPrintableRoutine} tooltip={hasPrintableRoutine ? "Print Report" : "No routine results ready"} colorClass="text-purple-600 hover:bg-purple-50 border-purple-200" /></td>
                                                {whatsappManualEnabled && <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap"><ActionButton icon={Send} onClick={() => onSendWhatsappReport(bill)} disabled={!hasPrintableRoutine} tooltip={hasPrintableRoutine ? "Send via WhatsApp" : "No routine results ready"} colorClass="text-emerald-600 hover:bg-emerald-50 border-emerald-200" /></td>}
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap"><ActionButton icon={Zap} onClick={() => onOpenSmartReport(bill)} tooltip="Smart Report" colorClass="text-amber-500 hover:text-amber-600 hover:bg-amber-50 border-amber-200" /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap hidden md:table-cell">
                                                    {hasCultureTest && onOpenCultureReport ? <ActionButton icon={Activity} onClick={() => onOpenCultureReport(bill)} tooltip="Culture Report" colorClass="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200" /> : <span className="text-[10px] text-slate-300">-</span>}
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap hidden md:table-cell"><ActionButton icon={RefreshCcw} onClick={() => onOpenRefund(bill)} disabled={bill.paidAmount <= 0} tooltip="Refund" colorClass="text-orange-600 hover:bg-orange-50 border-orange-200" /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap hidden md:table-cell"><ActionButton icon={DollarSign} onClick={() => onOpenClearDue(bill)} tooltip={bill.dueAmount > 0 ? "Clear Due" : "No Due Pending"} colorClass="text-emerald-600 hover:bg-emerald-50 border-emerald-200" disabled={bill.dueAmount <= 0} /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap hidden md:table-cell"><ActionButton icon={Edit} onClick={() => onEditBill(bill)} tooltip="Edit Details" colorClass="text-teal-600 hover:bg-teal-50 border-teal-200" /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap hidden md:table-cell"><ActionButton icon={Trash2} onClick={() => onDeleteBill(bill)} tooltip="Delete Bill" colorClass="text-rose-600 hover:bg-rose-50 border-rose-200" /></td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap hidden md:table-cell"><ActionButton icon={Clock} onClick={() => onOpenAudit(bill)} tooltip="Audit Log" colorClass="text-slate-700 hover:bg-slate-100 border-slate-300" /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-y-auto h-full p-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 custom-scrollbar">
                            {bills.map(bill => renderPatientCard(bill))}
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER BAR: 34px / 36px */}
            <div className="bg-white md:bg-slate-50 border-t border-slate-200 px-2.5 xl:px-3 py-1 md:py-0 min-h-[34px] h-[34px] xl:min-h-[36px] xl:h-[36px] flex items-center justify-between shrink-0 gap-2 md:gap-4 w-full">
                
                <div className="hidden md:flex items-center gap-3 shrink-0 overflow-x-auto">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-black uppercase tracking-wider whitespace-nowrap"><Info size={13} className="text-[#9575cd]" /> Status:</div>
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px] font-normal text-slate-600"><span className="w-3.5 h-3.5 flex items-center justify-center rounded bg-amber-100 text-amber-700 font-bold border border-amber-200 text-[9px]">P</span>Pending</div>
                        <div className="flex items-center gap-1 text-[11px] font-normal text-slate-600"><span className="w-3.5 h-3.5 flex items-center justify-center rounded bg-blue-100 text-blue-700 font-bold border border-blue-200 text-[9px]">E</span>Entered</div>
                        <div className="flex items-center gap-1 text-[11px] font-normal text-slate-600"><span className="w-3.5 h-3.5 flex items-center justify-center rounded bg-green-100 text-green-700 font-bold border border-green-200 text-[9px]">A</span>Approved</div>
                        <div className="flex items-center gap-1 text-[11px] font-normal text-slate-600"><span className="w-3.5 h-3.5 flex items-center justify-center rounded bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[9px]">Pr</span>Printed</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end text-[11px] xl:text-[12px] font-normal">
                    <div className="text-slate-500 whitespace-nowrap">
                        Showing <span className="font-medium text-slate-800">{totalItems === 0 ? 0 : ((currentPage - 1) * 10) + 1}</span> to <span className="font-medium text-slate-800">{Math.min(currentPage * 10, totalItems)}</span> of <span className="font-medium text-slate-800">{totalItems}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => onPageChange?.(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="h-[22px] px-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs flex items-center justify-center"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-medium text-slate-700 min-w-[60px] text-center whitespace-nowrap text-[11px]">
                            Page {currentPage} / {totalPages || 1}
                        </span>
                        <button 
                            onClick={() => onPageChange?.(currentPage + 1)} 
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-[22px] px-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs flex items-center justify-center"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
