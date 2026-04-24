"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { getPendingWorklist, getResultEntryData } from '@/app/actions/result-entry';
import WorklistPanel from './components/WorklistPanel';
import ResultEntryForm from './components/ResultEntryForm';
import DateRangeFilter from './components/DateRangeFilter';
import EntryDateTimePicker from './components/EntryDateTimePicker'; 
import { Printer, Search, Users, FileEdit, Lock } from 'lucide-react';
import MusicBarLoader from '@/app/components/MusicBarLoader';

import { usePermissions } from '@/app/context/PermissionContext';

// 🚨 Report Modal Imports
import PatientReportModal from '@/app/list/components/PatientReportModal';
import SmartReportModal from '@/app/list/components/SmartReportModal';

const globalBillCache: Record<number, any> = {};
const globalBillPromises: Record<number, Promise<any> | undefined> = {};

export default function ClientResultEntry({ initialBills, initialFirstBillData }: { initialBills: any[], initialFirstBillData: any }) {
  
  if (initialFirstBillData && !globalBillCache[initialFirstBillData.id]) {
      globalBillCache[initialFirstBillData.id] = initialFirstBillData;
  }

  const { orgId, permissions, userRole, permsLoaded } = usePermissions();

  const canSee = (screenName: string) => {
      if (orgId === 1) return true;
      if (!permsLoaded) return false;
      if (permissions.length === 0) return true; 
      return permissions.some(p => p.module === screenName && p.action === 'Access');
  };

  const { data: fetchRes, isLoading, mutate: refreshWorklist } = useSWR(
      (permsLoaded && canSee('Result Entry')) ? 'pending-worklist-entry' : null,
      async () => await getPendingWorklist(),
      { fallbackData: { success: true, data: initialBills }, revalidateOnFocus: false, keepPreviousData: true }
  );

  const bills = fetchRes?.success && fetchRes?.data ? fetchRes.data : [];

  const [activeMobileTab, setActiveMobileTab] = useState<'worklist' | 'form'>('worklist');
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [selectedBillData, setSelectedBillData] = useState<any>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

  // Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSmartReportModalOpen, setIsSmartReportModalOpen] = useState(false);

  const [isBillLoading, setIsBillLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null; label: string }>({
    from: null, to: null, label: 'All'
  });

  const [isManualTime, setIsManualTime] = useState(false);
  
  const getLocalISOString = () => {
    const now = new Date();
    return (new Date(now.getTime() - now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
  };

  const [entryDateTime, setEntryDateTime] = useState(getLocalISOString());

  const prefetchBill = (billId: number) => { return; };

  useEffect(() => {
    if (isManualTime) return; 
    const interval = setInterval(() => setEntryDateTime(getLocalISOString()), 1000); 
    return () => clearInterval(interval);
  }, [isManualTime]);

  const handleManualDateChange = (newDate: string) => {
      setIsManualTime(true); setEntryDateTime(newDate);
  };

  const setupTestIds = (data: any) => {
      if (data.items) {
          const items = data.items;
          let idsToSelect: number[] = [];
          if (activeTab === 'Pending') idsToSelect = items.filter((i: any) => i.status === 'Pending').map((i: any) => i.id);
          else if (activeTab === 'Partial') idsToSelect = items.filter((i: any) => i.status === 'Entered').map((i: any) => i.id);
          else if (activeTab === 'Completed') idsToSelect = items.filter((i: any) => i.status === 'Approved' || i.status === 'Printed').map((i: any) => i.id);
          else idsToSelect = items.map((i: any) => i.id);
          setSelectedTestIds(idsToSelect);
      }
  };

  useEffect(() => {
    if (selectedBillId) fetchBillDetails(selectedBillId);
    else { setSelectedBillData(null); setSelectedTestIds([]); }
  }, [selectedBillId]);

  const fetchBillDetails = async (billId: number) => {
    if (globalBillCache[billId]) {
        setSelectedBillData(globalBillCache[billId]);
        setupTestIds(globalBillCache[billId]);
        return;
    }

    setIsBillLoading(true);

    try {
        if (globalBillPromises[billId] !== undefined) {
            const data = await globalBillPromises[billId];
            if (data) {
                setSelectedBillData(data);
                setupTestIds(data);
            }
        } else {
            const res = await getResultEntryData(billId);
            if (res && res.success && res.data) {
                globalBillCache[billId] = res.data; 
                setSelectedBillData(res.data);
                setupTestIds(res.data);
            } else {
                setSelectedBillData(null);
                setSelectedTestIds([]);
            }
        }
    } catch (error) {
        console.error("Failed to fetch bill details", error);
        setSelectedBillData(null);
        setSelectedTestIds([]);
    } finally {
        setIsBillLoading(false);
    }
  };

  const handleSaveSuccess = async () => {
    refreshWorklist();
    if (selectedBillId) {
        const billRes = await getResultEntryData(selectedBillId);
        if (billRes.success) {
            globalBillCache[selectedBillId] = billRes.data; 
            setSelectedBillData(billRes.data);
        }
    }
  };

  const handleTestToggle = (testId: number) => {
    setSelectedTestIds(prev => prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]);
  };

  const handleSelectBill = (id: number) => {
      setSelectedBillId(id); setActiveMobileTab('form');
  };

  const filteredBills = useMemo(() => {
    let filtered = bills;
    if (activeTab !== 'All') {
      filtered = filtered.filter((bill: any) => {
        const items = bill.items || [];
        if (items.length === 0) return false;
        if (activeTab === 'Pending') return items.some((i: any) => i.status === 'Pending');
        if (activeTab === 'Partial') return items.some((i: any) => i.status === 'Entered');
        if (activeTab === 'Completed') return items.some((i: any) => i.status === 'Approved' || i.status === 'Printed');
        return true;
      });
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter((bill: any) => 
        bill.patient.firstName.toLowerCase().includes(lowerSearch) || bill.billNumber.toLowerCase().includes(lowerSearch) || (bill.patient.phone && bill.patient.phone.includes(lowerSearch))
      );
    }
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter((bill: any) => {
         const billDate = new Date(bill.date);
         const bDate = new Date(billDate.getFullYear(), billDate.getMonth(), billDate.getDate());
         const from = dateRange.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()) : null;
         const to = dateRange.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()) : null;
         if(from && to) return bDate >= from && bDate <= to;
         return true;
      });
    }
    return filtered;
  }, [bills, searchTerm, activeTab, dateRange]);

  const tabs = useMemo(() => {
    const getCount = (type: string) => {
        return bills.filter((b: any) => {
            const items = b.items || [];
            if (type === 'Pending') return items.some((i: any) => i.status === 'Pending');
            if (type === 'Partial') return items.some((i: any) => i.status === 'Entered');
            if (type === 'Completed') return items.some((i: any) => i.status === 'Approved' || i.status === 'Printed');
            return false;
        }).length;
    };
    return [
        { label: 'All', count: bills.length, color: 'bg-slate-500' },
        { label: 'Pending', count: getCount('Pending'), color: 'bg-amber-500' },
        { label: 'Partial', count: getCount('Partial'), color: 'bg-purple-500' },
        { label: 'Completed', count: getCount('Completed'), color: 'bg-green-500' }, 
    ];
  }, [bills]);

  if (!permsLoaded) return <div className="h-screen flex items-center justify-center bg-[#f1f5f9]"><MusicBarLoader text="Authenticating..." /></div>;
  if (!canSee('Result Entry')) return <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f1f5f9] p-6 text-center"><Lock className="text-slate-300 mb-4" size={48} /><h2 className="text-xl font-bold text-slate-700">Access Restricted</h2><p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view the Result Entry module.</p></div>;

  return (
    <div className="h-full w-full flex flex-col font-sans bg-[#f1f5f9] overflow-hidden">
      
      {/* 🚨 FIXED: Changed `bill` to `billId` */}
      {isReportModalOpen && selectedBillData && (
          <PatientReportModal
              isOpen={isReportModalOpen}
              onClose={() => setIsReportModalOpen(false)}
              billId={selectedBillData.id}
          />
      )}
      {isSmartReportModalOpen && selectedBillData && (
          <SmartReportModal
              isOpen={isSmartReportModalOpen}
              onClose={() => setIsSmartReportModalOpen(false)}
              bill={selectedBillData}
          />
      )}

      <header className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm">
        <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">Result Entry</h1>
            <div className="relative group w-full sm:w-auto">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#9575cd] transition-colors"/>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search patient..." className="pl-9 pr-3 h-9 w-full sm:w-64 text-sm md:text-xs font-medium bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#9575cd] focus:bg-white transition-all placeholder:text-slate-400" />
            </div>
        </div>
        <div className="px-4 md:px-6 pb-0 flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-t border-slate-50 pt-2 md:pt-3">
            <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar w-full xl:w-auto pb-1">
                {tabs.map(tab => (
                    <button key={tab.label} onClick={() => { setActiveTab(tab.label); setSelectedBillId(null); setActiveMobileTab('worklist'); }} className={`flex items-center gap-2 px-3 md:px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${ activeTab === tab.label ? 'border-[#9575cd] text-[#9575cd] bg-purple-50/50 rounded-t-md' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-md' }`}>
                        {tab.label} <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${tab.color}`}>{tab.count}</span>
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto pb-2 md:pb-0">
                <div className="flex-1 sm:flex-none h-8"><EntryDateTimePicker date={entryDateTime} onChange={handleManualDateChange} align="right" /></div>
                <div className="h-5 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="w-full sm:w-auto mt-2 sm:mt-0"><DateRangeFilter onFilterChange={setDateRange} /></div>
            </div>
        </div>
      </header>

      <div className="md:hidden flex px-2 pt-2 bg-white border-b border-slate-200 shrink-0 gap-2">
         <button onClick={() => setActiveMobileTab('worklist')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeMobileTab === 'worklist' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}><Users size={16} /> Worklist</button>
         <button onClick={() => setActiveMobileTab('form')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeMobileTab === 'form' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}><FileEdit size={16} /> Enter Results {selectedBillId && <span className="bg-emerald-500 text-white text-[10px] w-2 h-2 rounded-full ml-1 animate-pulse"></span>}</button>
      </div>

      <div className="flex flex-1 overflow-hidden p-2 md:p-4 flex-col md:flex-row gap-0 md:gap-4 relative">
        <div className={`w-full md:w-[40%] h-full bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-col ${activeMobileTab === 'worklist' ? 'flex' : 'hidden md:flex'}`}>
            <WorklistPanel bills={filteredBills} selectedBillId={selectedBillId} onSelect={handleSelectBill} selectedTestIds={selectedTestIds} onToggleTest={handleTestToggle} activeTab={activeTab} onHoverBill={prefetchBill} />
        </div>
        <div className={`w-full md:w-[60%] h-full bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-col relative ${activeMobileTab === 'form' ? 'flex' : 'hidden md:flex'}`}>
            {selectedBillId ? (
               isBillLoading ? <div className="flex-1 flex items-center justify-center"><MusicBarLoader text="Loading Test Data..." /></div> : 
               <ResultEntryForm 
                   bill={selectedBillData} 
                   onSaveSuccess={handleSaveSuccess} 
                   filterTestIds={selectedTestIds} 
                   entryDateTime={entryDateTime} 
                   onPrint={() => setIsReportModalOpen(true)}
                   onDeltaPrint={() => setIsSmartReportModalOpen(true)}
               />
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100"><Printer size={32} className="text-slate-300 opacity-50"/></div>
                  <h3 className="text-slate-600 font-bold text-base md:text-lg">No Patient Selected</h3>
                  <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-xs text-center">Select a patient from the Worklist to start entering test results.</p>
                  <button onClick={() => setActiveMobileTab('worklist')} className="mt-6 md:hidden px-6 py-2.5 bg-[#9575cd] text-white font-bold rounded-lg shadow-md text-sm">Go to Patient Worklist</button>
               </div>
            )}
        </div>
      </div>
    </div>
  );
}