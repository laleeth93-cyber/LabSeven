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
        
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/20 py-2 sm:py-4 px-2 sm:px-6">
            
            <div className="w-full overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left whitespace-nowrap min-w-[650px]">
                    <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                        <tr>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Patient Name</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Bill Number</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Age / Gender</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider">Phone</th>
                            <th className="px-5 py-4 font-bold text-slate-500 text-sm md:text-xs uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {bills.map((bill: any) => (
                            <tr key={bill.id} className="hover:bg-blue-50/60 transition-colors group">
                                
                                <td className="px-5 py-3.5">
                                    <div className="font-bold text-slate-800 text-base md:text-sm">
                                        {bill.patient.firstName} {bill.patient.lastName}
                                    </div>
                                </td>
                                
                                <td className="px-5 py-3.5">
                                    <span className="font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded text-sm md:text-xs">
                                        #{bill.billNumber}
                                    </span>
                                </td>

                                <td className="px-5 py-3.5">
                                    <span className="text-slate-600 font-medium text-sm md:text-xs">
                                        {bill.patient.ageY} Y / {bill.patient.gender.charAt(0)}
                                    </span>
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
                                <td colSpan={5} className="px-5 py-16 text-center">
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
    </div>
  );
}