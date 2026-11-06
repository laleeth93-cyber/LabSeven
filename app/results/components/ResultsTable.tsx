// --- BLOCK app/results/components/ResultsTable.tsx OPEN ---
"use client";

import React from 'react';
import { Edit, RefreshCw, ExternalLink, Calendar } from 'lucide-react';

export default function ResultsTable({ sortedData, onResetDate }: any) {
  
  const getRowClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-[#f0fdf4] hover:bg-[#dcfce7] border-l-4 border-l-green-400';
      case 'Pending': return 'bg-[#eff6ff] hover:bg-[#dbeafe] border-l-4 border-l-blue-400';
      case 'Partial': return 'bg-[#faf5ff] hover:bg-[#f3e8ff] border-l-4 border-l-purple-400';
      default: return 'bg-white border-l-4 border-l-transparent';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Completed</span>;
      case 'Pending': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><RefreshCw size={10} className="animate-spin-slow"/> Pending</span>;
      case 'Partial': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">Partial</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm border-collapse min-w-[750px] bg-white border-spacing-0">
          <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
            <tr>
              {['Bill Date', 'ID', 'Patient Info', 'Referral', 'Tests', 'Barcode', 'Status', 'Action'].map((h) => (
                <th key={h} style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className={`border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none ${h === 'Action' ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {sortedData.length > 0 ? (
              sortedData.map((row: any) => (
                <tr key={row.id} className={`hover:bg-slate-50 transition-colors ${getRowClass(row.status)}`}>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle"><div className="font-bold text-slate-700 text-[11px]">{row.billDate}</div><div className="text-[10px] text-slate-500">{row.billTime}</div></td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle font-mono text-slate-600 text-[11px]">{row.id}</td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle"><div className="font-bold text-slate-800 text-[11px]">{row.patientName}</div><div className="text-[10px] text-slate-500">{row.ageGender}</div></td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-slate-600 text-[11px]">{row.referral}</td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {row.tests.map((t: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] text-slate-600">
                          {t.name} <span className={`w-3 h-3 flex items-center justify-center rounded text-[8px] text-white ${t.code === 'C' ? 'bg-green-500' : 'bg-blue-500'}`}>{t.code}</span>
                          {t.isOutsource && <ExternalLink size={9} className="text-purple-500"/>}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle font-mono text-[11px] text-slate-700">{row.barcode}</td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle">{getStatusBadge(row.status)}</td>
                  <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left">
                    <button onClick={() => alert('Opening Entry')} className="h-[20px] inline-flex items-center gap-1 px-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-[10px] font-medium rounded shadow-2xs leading-none">
                      <Edit size={11}/> Enter Results
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Calendar size={32} className="text-slate-300 mb-2" />
                  <span>No records found for the selected date range.</span>
                  <button onClick={onResetDate} className="text-[#9575cd] font-bold hover:underline">Reset to Today</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// --- BLOCK app/results/components/ResultsTable.tsx CLOSE ---