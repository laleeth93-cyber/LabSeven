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
        
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white md:bg-slate-50/20 py-0 md:py-4 px-0 md:px-6">
            
            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left whitespace-nowrap min-w-[750px]">
                    <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                        <tr>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Bill Number</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Bill Date</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Patient Name</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Age / Gender</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Test Name</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Phone</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {bills.map((bill: any) => (
                            <tr key={bill.id} className="hover:bg-blue-50/60 transition-colors group">
                                
                                <td className="px-5 py-3.5">
                                    <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded text-sm md:text-xs">
                                        #{bill.billNumber}
                                    </span>
                                </td>

                                <td className="px-5 py-3.5">
                                    <span className="text-slate-600 font-medium text-sm md:text-xs">
                                        {bill.date ? new Date(bill.date).toLocaleDateString('en-GB', { 
                                            day: '2-digit', 
                                            month: 'short', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : '-'}
                                    </span>
                                </td>

                                <td className="px-5 py-3.5">
                                    <div className="font-bold text-slate-800 text-base md:text-sm">
                                        {bill.patient.firstName} {bill.patient.lastName}
                                    </div>
                                </td>

                                <td className="px-5 py-3.5">
                                    <span className="text-slate-600 font-medium text-sm md:text-xs">
                                        {bill.patient.ageY} Y / {bill.patient.gender.charAt(0)}
                                    </span>
                                </td>

                                <td className="px-5 py-3.5">
                                    <div className="flex flex-wrap gap-1.5 max-w-[200px] md:max-w-[300px]" title={bill.items?.map((i: any) => i.test?.name).join(', ')}>
                                        {bill.items?.length > 0 ? bill.items.map((i: any) => (
                                            <span key={i.id} className={`inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 rounded border text-[11px] md:text-[10px] font-medium ${i.status === 'Entered' ? 'bg-blue-100 text-blue-700 border-blue-200' : i.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : i.status === 'Printed' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                <span className="font-bold opacity-75">
                                                    {i.status === 'Entered' ? 'E' : i.status === 'Approved' ? 'A' : i.status === 'Printed' ? 'Pr' : 'P'}
                                                </span>
                                                {i.test?.name}
                                            </span>
                                        )) : <span className="text-slate-500 text-sm md:text-xs">-</span>}
                                    </div>
                                </td>

                                <td className="px-5 py-3.5">
                                    <span className="text-slate-500 font-mono text-sm md:text-xs">
                                        {bill.patient.phone || '-'}
                                    </span>
                                </td>

                                <td className="px-5 py-3.5 text-right">
                                    <button 
                                        onClick={() => onSelect(bill.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#9575cd] text-white text-sm md:text-xs font-bold rounded-md hover:bg-[#8565bd] hover:shadow-md transition-all active:scale-95"
                                    >
                                        Enter Results
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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