"use client";

import React from 'react';
import { User, TestTube2, Check, Barcode } from 'lucide-react';

interface WorklistPanelProps {
  bills: any[];
  selectedBillId: number | null;
  onSelect: (id: number) => void;
  selectedTestIds: number[];
  onToggleTest: (id: number) => void;
  activeTab: string;
  onHoverBill?: (id: number) => void; // 🚨 NEW PROP
}

export default function WorklistPanel({ bills, selectedBillId, onSelect, selectedTestIds = [], onToggleTest, activeTab, onHoverBill }: WorklistPanelProps) {
  
  const selectedBill = bills.find(b => b.id === selectedBillId);

  const displayedItems = selectedBill ? selectedBill.items.filter((item: any) => {
      if (activeTab === 'Pending') return item.status === 'Pending';
      if (activeTab === 'Partial') return item.status === 'Entered';
      if (activeTab === 'Completed') return item.status === 'Approved' || item.status === 'Printed';
      return true; 
  }) : [];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      
      <div className="h-[90px] bg-white border-b border-slate-200 flex flex-col justify-center shrink-0 relative overflow-hidden px-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#9575cd]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {selectedBill ? (
          <div className="flex flex-col justify-center z-10 animate-in fade-in slide-in-from-bottom-1 duration-300 h-full w-full">
            <h2 className="text-lg font-bold text-slate-800 leading-tight mb-1.5 truncate">
                {selectedBill.patient.firstName} {selectedBill.patient.lastName}
            </h2>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 leading-tight">
                <span className="whitespace-nowrap">
                    Age: <span className="font-bold text-slate-700">{selectedBill.patient.ageY} Y</span>
                </span>
                <span className="whitespace-nowrap">
                    Gender: <span className="font-bold text-slate-700">{selectedBill.patient.gender}</span>
                </span>
                <span className="whitespace-nowrap">
                    Bill No: <span className="font-bold text-slate-700 font-mono">{selectedBill.billNumber}</span>
                </span>
                <span className="whitespace-nowrap">
                    Patient ID: <span className="font-bold text-slate-700 font-mono">{selectedBill.patient.patientId || '-'}</span>
                </span>
                <span className="whitespace-nowrap">
                    Ph No: <span className="font-bold text-slate-700 font-mono">{selectedBill.patient.phone || '-'}</span>
                </span>
                <span className="whitespace-nowrap">
                    Ref: <span className="font-bold text-slate-700 truncate max-w-[100px] inline-block align-bottom" title={selectedBill.patient?.refDoctor || "Self"}>
                        {selectedBill.patient?.refDoctor || "Self"}
                    </span>
                </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-slate-400 gap-2 z-10 opacity-70">
            <User size={18} className="text-slate-300"/>
            <p className="text-xs font-medium">Select a patient to view details</p>
          </div>
        )}
      </div>

      <div className="flex-1 flex min-h-0 bg-white">
        
        <div className="w-[60%] flex flex-col border-r border-slate-100">
            <div className="h-9 px-3 bg-white border-b border-slate-100 sticky top-0 z-10 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patients</span>
                <span className="text-[9px] font-bold bg-slate-50 border border-slate-200 px-1.5 rounded text-slate-400">{bills.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                {bills.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 mt-4">No records found</div>
                ) : (
                    bills.map((bill: any) => {
                        const isSelected = selectedBillId === bill.id;
                        return (
                        <div 
                            key={bill.id} 
                            onClick={() => onSelect(bill.id)}
                            onMouseEnter={() => onHoverBill && onHoverBill(bill.id)} // 🚨 HOVER TRIGGER
                            className={`px-3 py-2 border-b border-slate-50 cursor-pointer transition-all duration-200 group flex items-center justify-between h-10 ${
                                isSelected 
                                    ? 'bg-blue-50/80 border-l-4 border-l-blue-500 shadow-sm' 
                                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                            }`}
                        >
                            <div className="grid grid-cols-[minmax(0,1fr)_60px_110px] gap-3 items-center w-full">
                                <div className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {bill.patient.firstName} {bill.patient.lastName}
                                </div>
                                <div className={`text-[10px] font-medium text-center border-l pl-2 whitespace-nowrap overflow-hidden transition-colors ${
                                    isSelected ? 'border-blue-200 text-blue-600' : 'border-slate-100 text-slate-500'
                                }`}>
                                    {bill.patient.ageY}Y/{bill.patient.gender.charAt(0)}
                                </div>
                                <div className={`text-[10px] font-mono text-right border-l pl-2 whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
                                    isSelected ? 'border-blue-200 text-blue-600' : 'border-slate-100 text-slate-400'
                                }`}>
                                    #{bill.billNumber}
                                </div>
                            </div>
                        </div>
                        );
                    })
                )}
            </div>
        </div>

        <div className="w-[40%] flex flex-col bg-slate-50/30">
            <div className="h-9 px-3 bg-white border-b border-slate-100 sticky top-0 z-10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tests</span>
                {selectedTestIds.length > 0 && (
                  <span className="text-[9px] font-bold text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded">{selectedTestIds.length} Selected</span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                {selectedBill ? (
                    <div className="divide-y divide-slate-100">
                        {displayedItems.length > 0 ? displayedItems.map((item: any) => {
                            const isSelected = selectedTestIds.includes(item.id);
                            return (
                                <div 
                                  key={item.id} 
                                  onClick={() => onToggleTest && onToggleTest(item.id)}
                                  className={`flex items-start gap-2 p-2 transition-colors cursor-pointer select-none ${
                                    isSelected ? 'bg-purple-50 shadow-sm' : 'hover:bg-white'
                                  }`}
                                >
                                    <div className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                        isSelected 
                                        ? 'bg-[#9575cd] border-[#9575cd] text-white' 
                                        : 'border-slate-300 bg-white hover:border-[#9575cd]'
                                    }`}>
                                        {isSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold leading-tight truncate text-slate-700">
                                            {item.test.name}
                                        </p>
                                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-mono">
                                            <Barcode size={10} />
                                            <span>{item.status}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                             <div className="p-4 text-center text-xs text-slate-400">No {activeTab} tests</div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-1 opacity-60">
                        <TestTube2 size={16} />
                        <span className="text-[9px] font-medium text-center">Select Patient</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}