"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { getPendingWorklist, getResultEntryData } from '@/app/actions/result-entry';
import WorklistPanel from './components/WorklistPanel';
import ResultEntryForm from './components/ResultEntryForm';
import DateRangeFilter from './components/DateRangeFilter';
import EntryDateTimePicker from './components/EntryDateTimePicker'; 
import MusicBarLoader from '@/app/components/MusicBarLoader';

import { usePermissions } from '@/app/context/PermissionContext';

import PatientReportModal from '@/app/list/components/PatientReportModal';
import SmartReportModal from '@/app/list/components/SmartReportModal';

const globalBillCache: Record<number, any> = {};
const globalBillPromises: Record<number, Promise<any> | undefined> = {};

export default function ClientResultEntry({ initialBills, initialFirstBillData }: { initialBills: any[], initialFirstBillData: any }) {
  
  if (initialFirstBillData && !globalBillCache[initialFirstBillData.id]) {
      globalBillCache[initialFirstBillData.id] = initialFirstBillData;
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

  const [isMobileWorklistOpen, setIsMobileWorklistOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [selectedBillData, setSelectedBillData] = useState<any>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSmartReportModalOpen, setIsSmartReportModalOpen] = useState(false);

  const [isBillLoading, setIsBillLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Pending'); 
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
    refreshWorklist();
    if (selectedBillId) {
        const billRes = await getResultEntryData(selectedBillId);
        if (billRes.success) { globalBillCache[selectedBillId] = billRes.data; setSelectedBillData(billRes.data); }
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
      setIsMobileWorklistOpen(false); 
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
  if (!canSee('Result Entry')) return <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f1f5f9] p-6 text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><h2 className="text-xl font-bold text-slate-700">Access Restricted</h2><p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view the Result Entry module.</p></div>;

  return (
    <div className="h-full w-full flex flex-col font-sans bg-slate-50 md:bg-[#f1f5f9] overflow-hidden relative">
      
      {isReportModalOpen && selectedBillData && (
          <PatientReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} billId={selectedBillData.id} />
      )}
      {isSmartReportModalOpen && selectedBillData && (
          <SmartReportModal isOpen={isSmartReportModalOpen} onClose={() => setIsSmartReportModalOpen(false)} bill={selectedBillData} />
      )}

      {/* Desktop Header */}
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
                    <button key={tab.label} onClick={() => { setActiveTab(tab.label); setSelectedBillId(null); }} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${ activeTab === tab.label ? 'border-[#9575cd] text-[#9575cd] bg-purple-50/50 rounded-t-md' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-md' }`}>
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

      {/* Mobile Ultra-Slim Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-4 w-full">
              <button onClick={() => setIsMobileFiltersOpen(true)} className="p-2.5 text-slate-500 bg-slate-50 border border-slate-200 rounded-lg shadow-sm hover:bg-slate-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              </button>
              <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Result Entry Form</span>
                  <h1 className="text-base font-bold text-slate-800 truncate">
                      {selectedBillData ? `${selectedBillData.patient.firstName} ${selectedBillData.patient.lastName}` : "Ready for Input"}
                  </h1>
              </div>
          </div>
      </header>

      {/* Mobile Filter Bottom Sheet */}
      {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px] flex items-end md:hidden">
              <div className="bg-white w-full rounded-t-2xl p-5 flex flex-col gap-5 animate-in slide-in-from-bottom-full duration-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">Filters & Search</h2>
                      <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                  </div>
                  <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search patient..." className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#9575cd] focus:bg-white" />
                  </div>
                  <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Status</span>
                      <div className="grid grid-cols-2 gap-3">
                          {tabs.map(tab => (
                              <button key={tab.label} onClick={() => { setActiveTab(tab.label); setIsMobileFiltersOpen(false); }} className={`px-4 py-3 text-sm font-bold rounded-xl border transition-all ${activeTab === tab.label ? 'bg-purple-50 border-[#9575cd] text-[#9575cd]' : 'bg-white border-slate-200 text-slate-600'}`}>
                                  {tab.label} <span className="text-slate-400 font-normal">({tab.count})</span>
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Filters</span>
                      <DateRangeFilter onFilterChange={setDateRange} />
                      <EntryDateTimePicker date={entryDateTime} onChange={handleManualDateChange} align="left" />
                  </div>
                  <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full py-4 text-base bg-slate-800 text-white font-bold rounded-xl mt-3 shadow-md">Apply Filters</button>
              </div>
          </div>
      )}

      {/* Mobile Worklist Full Screen Overlay */}
      {isMobileWorklistOpen && (
          <div className="fixed inset-0 z-[60] bg-white flex flex-col md:hidden animate-in slide-in-from-bottom-8 fade-in duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0 shadow-sm">
                  <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9575cd]"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Select Patient
                  </h2>
                  <button onClick={() => setIsMobileWorklistOpen(false)} className="p-2 text-slate-500 hover:bg-slate-200 bg-white border border-slate-200 shadow-sm rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
              </div>
              <div className="flex-1 overflow-hidden bg-white">
                  <WorklistPanel 
                      bills={filteredBills} 
                      onSelect={handleSelectBill} 
                      activeTab={activeTab} 
                  />
              </div>
          </div>
      )}

      {/* Floating Action Button (FAB) */}
      {!isMobileWorklistOpen && (
          <button 
              onClick={() => setIsMobileWorklistOpen(true)} 
              className="md:hidden fixed bottom-6 right-6 z-40 bg-[#9575cd] hover:bg-[#8565bd] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(149,117,205,0.4)] flex items-center justify-center transition-transform active:scale-95 border-2 border-white"
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {!selectedBillId && <span className="font-bold pr-2 pl-2 text-base">Pick Patient</span>}
          </button>
      )}

      {/* ========================================= */}
      {/* TOGGLE LAYOUT: FULL WIDTH OR SPLIT SCREEN */}
      {/* ========================================= */}
      <div className="flex flex-1 overflow-hidden p-2 md:p-4 gap-4 bg-transparent">
        
        {!selectedBillId ? (
            /* STATE 1: FULL WIDTH PRIMARY PAGE */
            <div className="w-full h-full bg-white md:rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
                <WorklistPanel 
                    bills={filteredBills} 
                    onSelect={(id: number) => setSelectedBillId(id)} 
                    activeTab={activeTab}
                />
            </div>
        ) : (
            /* STATE 2: RESULT ENTRY FORM (Toggles between 100% and 70%) */
            <>
                <div className={`w-full ${isSidebarOpen ? 'xl:w-[70%]' : ''} h-full bg-white md:rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative transition-all duration-300`}>
                    <div className="flex flex-col h-full overflow-hidden">
                        
                        {/* Inner Toolbar */}
                        <div className="p-3 md:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-3 shrink-0">
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
                                        
                                        {/* THE LIST TOGGLE BUTTON */}
                                        <div className="hidden xl:block h-6 md:h-5 w-px bg-slate-300 mx-1"></div>
                                        <button 
                                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                            className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${isSidebarOpen ? 'bg-purple-100 text-[#9575cd]' : 'hover:bg-slate-100 text-slate-500'}`}
                                            title="Toggle Patient List Sidebar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                            <span className="text-sm font-bold">List</span>
                                        </button>
                                    </div>
                                ) : (<span className="font-bold text-[#9575cd]">Loading...</span>)}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-slate-50/50">
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
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* THE SIDEBAR (Only visible when toggled open via the 'List' button) */}
                {isSidebarOpen && (
                    <div className="hidden xl:flex xl:w-[30%] h-full flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        
                        {/* Top 50%: Excel Patient List */}
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
                                            <th className="border-b border-slate-200 px-3 py-2 text-sm md:text-xs font-bold text-slate-500 bg-slate-50">Age/Sex</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBills.map((b: any) => (
                                            <tr key={b.id} onClick={() => handleSelectBill(b.id)} className={`cursor-pointer transition-colors ${selectedBillId === b.id ? 'bg-blue-100/50' : 'hover:bg-slate-50'}`}>
                                                <td className="border-b border-r border-slate-100 px-3 py-2 text-base md:text-sm font-mono text-slate-600">{b.billNumber}</td>
                                                <td className="border-b border-r border-slate-100 px-3 py-2 text-base md:text-sm font-semibold text-slate-800 truncate max-w-[150px]">{b.patient.firstName} {b.patient.lastName}</td>
                                                <td className="border-b border-slate-100 px-3 py-2 text-base md:text-sm text-slate-600">{b.patient.ageY}Y / {b.patient.gender.charAt(0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bottom 50%: Excel Test Selection */}
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