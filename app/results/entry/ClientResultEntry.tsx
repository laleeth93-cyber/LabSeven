"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { getPendingWorklist, getResultEntryData } from '@/app/actions/result-entry';
import WorklistPanel from './components/WorklistPanel';
import ResultEntryForm from './components/ResultEntryForm';
import DateRangeFilter from './components/DateRangeFilter';
import EntryDateTimePicker from './components/EntryDateTimePicker'; 
import MusicBarLoader from '@/app/components/MusicBarLoader';
import { List } from 'lucide-react';
import { usePermissions } from '@/app/context/PermissionContext';

import PatientReportModal from '@/app/list/components/PatientReportModal';
import SmartReportModal from '@/app/list/components/SmartReportModal';

const globalBillCache: Record<number, any> = {};
const globalBillPromises: Record<number, Promise<any> | undefined> = {};

export default function ClientResultEntry({ 
    initialBills, 
    initialFirstBillData,
    initialBillId 
}: { 
    initialBills: any[], 
    initialFirstBillData: any,
    initialBillId?: number | null
}) {
  
  if (initialFirstBillData && !globalBillCache[initialFirstBillData.id]) {
      globalBillCache[initialFirstBillData.id] = initialFirstBillData;
  }

  // FORCE FRESH FETCH ON DIRECT NAVIGATION:
  // If the user navigates directly to a bill (e.g., from the invoice modal after adding a test),
  // we must bypass the stale client cache to load the newly added tests.
  const hasClearedCache = React.useRef(false);
  if (initialBillId && !hasClearedCache.current) {
      delete globalBillCache[initialBillId];
      hasClearedCache.current = true;
  }

  const { orgId, permissions, permsLoaded } = usePermissions();

  const canSee = (screenName: string) => {
      if (orgId === 1) return true;
      if (!permsLoaded) return false;
      if (permissions.length === 0) return true; 
      return permissions.some(p => p.module === screenName && p.action === 'Access');
  };

  const { data: fetchRes, mutate: refreshWorklist } = useSWR(
      (permsLoaded && canSee('Result Entry')) ? 'pending-worklist-entry' : null,
      async () => await getPendingWorklist(),
      { fallbackData: { success: true, data: initialBills }, revalidateOnFocus: false, keepPreviousData: true }
  );

  const bills = fetchRes?.success && fetchRes?.data ? fetchRes.data : [];

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedBillId, setSelectedBillId] = useState<number | null>(initialBillId || null);
  const [selectedBillData, setSelectedBillData] = useState<any>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSmartReportModalOpen, setIsSmartReportModalOpen] = useState(false);

  const [isBillLoading, setIsBillLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null; label: string }>(() => {
      const today = new Date();
      return { from: today, to: today, label: 'Today' };
  });

  const [isManualTime, setIsManualTime] = useState(false);
  
  const getLocalISOString = () => {
    const now = new Date();
    return (new Date(now.getTime() - now.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
  };

  const [entryDateTime, setEntryDateTime] = useState(getLocalISOString());

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

  // NEW: Automatically update test IDs if tab changes while a patient is open
  useEffect(() => {
    if (selectedBillData) {
        setupTestIds(selectedBillData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
            if (data) { setSelectedBillData(data); setupTestIds(data); }
        } else {
            const res = await getResultEntryData(billId);
            if (res && res.success && res.data) {
                globalBillCache[billId] = res.data; 
                setSelectedBillData(res.data);
                setupTestIds(res.data);
            } else { setSelectedBillData(null); setSelectedTestIds([]); }
        }
    } catch (error) {
        setSelectedBillData(null); setSelectedTestIds([]);
    } finally { setIsBillLoading(false); }
  };

  const handleSaveSuccess = async () => {
    const currentIndex = filteredBills.findIndex((b: any) => b.id === selectedBillId);
    let nextBillId = null;
    
    if (currentIndex !== -1 && currentIndex < filteredBills.length - 1) {
        nextBillId = filteredBills[currentIndex + 1].id;
    }

    await refreshWorklist();

    if (nextBillId) {
        setSelectedBillId(nextBillId);
    } else if (selectedBillId) {
        const billRes = await getResultEntryData(selectedBillId);
        if (billRes.success) { 
            globalBillCache[selectedBillId] = billRes.data; 
            setSelectedBillData(billRes.data); 
        }
    }
  };

  const handleBackToList = () => {
      setSelectedBillId(null);
  };

  const handleTestToggle = (testId: number) => {
      setSelectedTestIds(prev => prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]);
  };

  const handleSelectBill = (id: number) => {
      setSelectedBillId(id);
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

  const currentPatientIndex = useMemo(() => filteredBills.findIndex((b: any) => b.id === selectedBillId), [filteredBills, selectedBillId]);
  const isFirstPatient = currentPatientIndex <= 0;
  const isLastPatient = currentPatientIndex === -1 || currentPatientIndex >= filteredBills.length - 1;

  const handlePrevPatient = () => {
      if (!isFirstPatient) {
          setSelectedBillId(filteredBills[currentPatientIndex - 1].id);
      }
  };

  const handleNextPatient = () => {
      if (!isLastPatient) {
          setSelectedBillId(filteredBills[currentPatientIndex + 1].id);
      }
  };

  if (!permsLoaded) return <div className="h-screen flex items-center justify-center bg-[#f1f5f9]"><MusicBarLoader text="Authenticating..." /></div>;
  if (!canSee('Result Entry')) return <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f1f5f9] p-6 text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><h2 className="text-xl font-bold text-slate-700">Access Restricted</h2><p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view the Result Entry module.</p></div>;

  return (
    <div className="h-full w-full flex flex-col font-sans bg-slate-50 md:bg-[#f1f5f9] overflow-hidden relative">
      
      {PatientReportModal && isReportModalOpen && selectedBillData && (
          <PatientReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} billId={selectedBillData.id} />
      )}
      {SmartReportModal && isSmartReportModalOpen && selectedBillData && (
          <SmartReportModal isOpen={isSmartReportModalOpen} onClose={() => setIsSmartReportModalOpen(false)} bill={selectedBillData} />
      )}

      <header className="hidden md:block bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm relative">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">Result Entry</h1>
            <div className="relative group w-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#9575cd] transition-colors"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search patient..." className="pl-10 pr-4 h-10 w-72 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9575cd] focus:bg-white transition-all" />
            </div>
        </div>
        <div className="px-6 pb-0 flex items-center justify-between gap-4 border-t border-slate-50 pt-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {tabs.map(tab => (
                    // FIX IS HERE: Removed setSelectedBillId(null) from the onClick event below
                    <button key={tab.label} onClick={() => setActiveTab(tab.label)} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${ activeTab === tab.label ? 'border-[#9575cd] text-[#9575cd] bg-purple-50/50 rounded-t-md' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-md' }`}>
                        {tab.label} <span className={`px-2 py-0.5 rounded text-xs text-white ${tab.color}`}>{tab.count}</span>
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3 pb-0">
                <div className="h-9"><EntryDateTimePicker date={entryDateTime} onChange={handleManualDateChange} align="right" /></div>
                <div className="h-6 w-[1px] bg-slate-200"></div>
                <div><DateRangeFilter onFilterChange={setDateRange} /></div>
            </div>
        </div>
      </header>





      <div className="flex flex-1 overflow-hidden p-2 md:p-4 gap-4 bg-transparent">
        {!selectedBillId ? (
            <div className="w-full h-full bg-white rounded-none md:rounded-xl shadow-sm border-0 md:border md:border-slate-200 overflow-hidden flex flex-col relative">
                {/* Mobile Header Inside Card */}
                <header className="md:hidden flex flex-col gap-1.5 px-3 py-2 shrink-0 z-20 bg-white">
                    <div className="relative w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Search patient..." 
                            className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all" 
                        />
                    </div>
                    <div className="flex items-center gap-1.5 w-full">
                        <div className="flex-1">
                            <select 
                                value={activeTab} 
                                onChange={(e) => setActiveTab(e.target.value)} 
                                className="w-full h-6 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 px-1.5 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.25rem center', paddingRight: '1.25rem' }}
                            >
                                {tabs.map(tab => (
                                    <option key={tab.label} value={tab.label}>{tab.label} ({tab.count})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <DateRangeFilter onFilterChange={setDateRange} buttonClassName="w-full h-6 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 px-1.5 flex justify-between items-center transition-colors shadow-sm" />
                        </div>
                    </div>
                </header>

                <WorklistPanel 
                    bills={filteredBills} 
                    onSelect={(id: number) => setSelectedBillId(id)} 
                    activeTab={activeTab}
                />
            </div>
        ) : (
            <>
                <div className={`w-full ${isSidebarOpen ? 'lg:w-[70%]' : ''} h-full bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-200 overflow-hidden flex flex-col relative transition-all duration-300`}>
                    {/* Mobile Header Inside Card */}
                    <header className="md:hidden flex items-center justify-between px-2 py-2 shrink-0 z-20 bg-white">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <button onClick={handlePrevPatient} disabled={isFirstPatient} className="shrink-0 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </button>
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {selectedBillData && (
                                    <>
                                        <h1 className="text-[11px] font-bold text-[#9575cd] truncate">
                                            {selectedBillData.patient.firstName} {selectedBillData.patient.lastName}
                                        </h1>
                                        <span className="text-slate-300 text-[10px] shrink-0">|</span>
                                        <span className="text-[10px] text-slate-500 font-normal shrink-0">
                                            {selectedBillData.patient.age || 0}{selectedBillData.patient.ageUnit || 'Y'}/{selectedBillData.patient.gender?.charAt(0) || 'U'}
                                        </span>
                                        <span className="text-slate-300 text-[10px] shrink-0">|</span>
                                        <span className="text-[10px] text-slate-500 font-normal shrink-0">
                                            {String(selectedBillData.billNumber).slice(-6)}
                                        </span>
                                    </>
                                )}
                            </div>
                            <button onClick={handleNextPatient} disabled={isLastPatient} className="shrink-0 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </button>
                        </div>
                    </header>

                    <div className="flex flex-col h-full overflow-hidden">
                        
                        <div className="hidden md:flex p-3 md:p-4 bg-white md:bg-slate-50 border-b-0 md:border-b border-slate-200 flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-3 shrink-0">
                            <button onClick={handleBackToList} className="flex items-center justify-center sm:justify-start gap-2 text-base md:text-sm font-bold text-slate-700 bg-white border border-slate-300 px-5 py-2.5 md:py-2 rounded-lg shadow-sm hover:bg-slate-100 transition-colors shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                Back to List
                            </button>

                            <div className="flex items-center justify-center sm:justify-end gap-3 md:gap-2 text-base md:text-sm bg-white px-4 md:px-3 py-2.5 md:py-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
                                <span className="text-slate-500 hidden md:inline">Entering Results for:</span>
                                {selectedBillData ? (
                                    <div className="flex items-center gap-2.5 md:gap-2">
                                        <span className="font-bold text-[#9575cd] text-base md:text-sm truncate">{selectedBillData.patient.firstName} {selectedBillData.patient.lastName}</span>
                                        <span className="text-slate-600 text-sm md:text-xs px-2.5 py-1 md:py-0.5 bg-slate-100 rounded-md font-bold border border-slate-200">{selectedBillData.patient.ageY} Y / {selectedBillData.patient.gender.charAt(0)}</span>
                                        <span className="text-slate-500 text-sm md:text-xs font-mono border-l border-slate-300 pl-2.5 md:pl-2">ID: <span className="font-bold text-slate-700">{selectedBillData.patient.patientId || '-'}</span></span>
                                        
                                        <div className="hidden lg:block h-6 md:h-5 w-px bg-slate-300 mx-1"></div>
                                        <button 
                                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                            className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${isSidebarOpen ? 'bg-purple-100 text-[#9575cd]' : 'hover:bg-slate-100 text-slate-500'}`}
                                            title="Toggle Patient List Sidebar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                            <span className="text-sm font-bold">List</span>
                                        </button>
                                    </div>
                                ) : (<span className="font-bold text-[#9575cd]">Loading...</span>)}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white md:bg-slate-50/50">
                            {isBillLoading ? (
                                <div className="h-full flex items-center justify-center"><MusicBarLoader text="Loading Test Data..." /></div>
                            ) : (
                                <ResultEntryForm 
                                    bill={selectedBillData} 
                                    onSaveSuccess={handleSaveSuccess} 
                                    filterTestIds={selectedTestIds} 
                                    entryDateTime={entryDateTime} 
                                    onPrint={() => setIsReportModalOpen(true)}
                                    onDeltaPrint={() => setIsSmartReportModalOpen(true)}
                                    onBackToList={handleBackToList}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {isSidebarOpen && (
                    <div className="hidden lg:flex lg:w-[30%] h-full flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                                <span className="text-sm md:text-xs font-bold text-slate-600 uppercase tracking-wider">Remaining Patients</span>
                                <span className="bg-white border border-slate-200 text-slate-600 text-sm md:text-xs px-2.5 py-0.5 rounded font-bold">{filteredBills.length}</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="border-b border-r border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Bill No</th>
                                            <th className="border-b border-r border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Patient Name</th>
                                            <th className="border-b border-r border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Age/Sex</th>
                                            <th className="border-b border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Tests</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBills.map((b: any) => (
                                            <tr key={b.id} onClick={() => handleSelectBill(b.id)} className={`cursor-pointer transition-colors ${selectedBillId === b.id ? 'bg-blue-100/50' : 'hover:bg-slate-50'}`}>
                                                <td className="border-b border-r border-slate-100 px-3 py-2 text-base md:text-sm font-mono text-slate-600">{b.billNumber}</td>
                                                <td className="border-b border-r border-slate-100 px-3 py-2 text-base md:text-sm font-semibold text-slate-800 truncate max-w-[150px]">{b.patient.firstName} {b.patient.lastName}</td>
                                                <td className="border-b border-r border-slate-100 px-3 py-2 text-base md:text-sm text-slate-600">{b.patient.ageY}Y / {b.patient.gender.charAt(0)}</td>
                                                <td className="border-b border-slate-100 px-3 py-2 text-base md:text-sm text-slate-600 max-w-[200px]" title={b.items?.map((i: any) => i.test?.name).join(', ')}>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {b.items?.length > 0 ? b.items.map((i: any) => (
                                                            <span key={i.id} className={`inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 rounded border text-[11px] md:text-[10px] font-medium ${i.status === 'Entered' ? 'bg-blue-100 text-blue-700 border-blue-200' : i.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : i.status === 'Printed' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                                <span className="font-bold opacity-75">
                                                                    {i.status === 'Entered' ? 'E' : i.status === 'Approved' ? 'A' : i.status === 'Printed' ? 'Pr' : 'P'}
                                                                </span>
                                                                {i.test?.name}
                                                            </span>
                                                        )) : <span className="text-slate-500">-</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
                                <span className="text-sm md:text-xs font-bold text-slate-600 uppercase tracking-wider">Test Selection</span>
                                {selectedTestIds.length > 0 && <span className="bg-[#9575cd]/10 text-[#9575cd] text-sm md:text-xs font-bold px-2.5 py-0.5 rounded">{selectedTestIds.length} Selected</span>}
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                {!selectedBillData ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                         <span className="text-sm md:text-xs font-medium">Select a patient above to view tests</span>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="border-b border-r border-slate-200 px-3 py-2 w-10 text-center bg-slate-50">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </th>
                                                <th className="border-b border-r border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Test Name</th>
                                                <th className="border-b border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBillData.items.map((item: any) => {
                                                const isSelected = selectedTestIds.includes(item.id);
                                                return (
                                                    <tr key={item.id} onClick={() => handleTestToggle(item.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-purple-50/50' : 'hover:bg-slate-50'}`}>
                                                        <td className="border-b border-r border-slate-100 px-3 py-2 text-center">
                                                            <input type="checkbox" checked={isSelected} readOnly className="accent-[#9575cd] pointer-events-none w-4 h-4" />
                                                        </td>
                                                        <td className="border-b border-r border-slate-100 px-3 py-2 text-base md:text-sm font-semibold text-slate-700 truncate max-w-[150px]">{item.test.name}</td>
                                                        <td className="border-b border-slate-100 px-3 py-2 text-base md:text-sm text-slate-500">{item.status}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}