"use client";

import React from 'react';

interface WorklistPanelProps {
  bills: any[];
  onSelect: (id: number) => void;
  activeTab: string;
}

export default function WorklistPanel({ bills, onSelect, activeTab }: WorklistPanelProps) {
  
  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
        
        <div className="flex-1 overflow-hidden bg-white p-0 md:p-2.5 xl:p-3 flex flex-col min-h-0">
            
            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden">
                <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
                    <table className="w-full text-left text-sm border-collapse whitespace-nowrap min-w-[750px] bg-white border-spacing-0">
                    <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                        <tr>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-24">Bill Number</th>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-36">Bill Date</th>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left max-w-[200px]">Patient Name</th>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-24">Age / Gender</th>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left max-w-[200px]">Test Name</th>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-28">Phone</th>
                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {bills.map((bill: any) => (
                            <tr key={bill.id} className="hover:bg-purple-50/50 transition-colors group">
                                
                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap overflow-hidden">
                                    <span className="font-mono font-normal text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px] inline-block leading-tight">
                                        #{bill.billNumber}
                                    </span>
                                </td>

                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap overflow-hidden">
                                    <span className="text-slate-600 font-normal text-[11px] leading-tight block">
                                        {bill.date ? new Date(bill.date).toLocaleDateString('en-GB', { 
                                            day: '2-digit', 
                                            month: 'short', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </span>
                                </td>

                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap overflow-hidden max-w-[200px]">
                                    <div className="font-normal text-slate-800 text-[12px] truncate leading-tight" title={`${bill.patient.firstName} ${bill.patient.lastName}`}>
                                        {bill.patient.firstName} {bill.patient.lastName}
                                    </div>
                                </td>

                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap overflow-hidden">
                                    <span className="text-slate-600 font-normal text-[11px] leading-tight block">
                                        {bill.patient.ageY} Y / {bill.patient.gender?.charAt(0) || 'U'}
                                    </span>
                                </td>

                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left max-w-[200px] overflow-hidden">
                                    <div className="flex flex-wrap gap-1 max-w-[200px] overflow-hidden" title={bill.items?.map((i: any) => i.test?.name).join(', ')}>
                                        {bill.items?.length > 0 ? bill.items.map((i: any) => (
                                            <span key={i.id} className={`inline-flex items-center gap-1 whitespace-nowrap px-1 py-0 rounded border text-[10px] font-normal leading-tight ${i.status === 'Entered' ? 'bg-blue-50 text-blue-700 border-blue-200' : i.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : i.status === 'Printed' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                <span className="font-bold opacity-75">
                                                    {i.status === 'Entered' ? 'E' : i.status === 'Approved' ? 'A' : i.status === 'Printed' ? 'Pr' : 'P'}
                                                </span>
                                                <span className="truncate max-w-[120px]">{i.test?.name}</span>
                                            </span>
                                        )) : <span className="text-slate-500 text-[11px]">-</span>}
                                    </div>
                                </td>

                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap overflow-hidden">
                                    <span className="text-slate-500 font-mono font-normal text-[11px] leading-tight block">
                                        {bill.patient.phone || '-'}
                                    </span>
                                </td>

                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                                    <button 
                                        onClick={() => onSelect(bill.id)}
                                        className="h-[18px] inline-flex items-center gap-1 px-1.5 bg-[#9575cd] text-white text-[10px] font-normal rounded hover:bg-[#8565bd] hover:shadow transition-all active:scale-95 leading-none shadow-xs"
                                    >
                                        <span>Results</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {bills.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-5 py-16 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mb-3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                        <p className="text-base md:text-sm font-medium">No pending results found.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            </div>

            {/* MOBILE VIEW: Cards */}
            <div className="md:hidden flex flex-col gap-3 px-3 py-3 bg-white h-full w-full">
                {bills.map((bill: any) => (
                    <div key={bill.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2.5 relative">
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 text-[13px]">{bill.patient.firstName} {bill.patient.lastName}</span>
                                <span className="text-slate-500 text-[10px] font-medium mt-0.5">{bill.patient.ageY} Y / {bill.patient.gender.charAt(0)} • {bill.patient.phone || 'No Phone'}</span>
                            </div>
                            <span className="font-mono font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded text-[9px] border border-slate-200 shrink-0">
                                #{String(bill.billNumber).slice(-6)}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {bill.items?.length > 0 ? bill.items.map((i: any) => (
                                <span key={i.id} className={`inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 rounded border text-[9px] font-medium ${i.status === 'Entered' ? 'bg-blue-50 text-blue-600 border-blue-200' : i.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-200' : i.status === 'Printed' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    <span className="font-bold opacity-75">
                                        {i.status === 'Entered' ? 'E' : i.status === 'Approved' ? 'A' : i.status === 'Printed' ? 'Pr' : 'P'}
                                    </span>
                                    {i.test?.name}
                                </span>
                            )) : <span className="text-slate-400 text-[10px]">-</span>}
                        </div>

                        <div className="flex items-center justify-between mt-0.5 pt-2 border-t border-slate-100">
                            <span className="text-slate-400 font-medium text-[9px] tracking-wide">
                                {bill.date ? new Date(bill.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                            </span>
                            <button onClick={() => onSelect(bill.id)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-[#9575cd] border border-purple-200 text-[10px] font-semibold rounded-md active:scale-95 transition-all">
                                Results
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                ))}

                {bills.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                        <span className="text-[13px] font-bold text-slate-500">No pending results found.</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}