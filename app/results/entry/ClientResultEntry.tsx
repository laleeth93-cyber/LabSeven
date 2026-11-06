"use client";

import React, { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { getPendingWorklist, getResultEntryData } from '@/app/actions/result-entry';
import WorklistPanel from './components/WorklistPanel';
import ResultEntryForm from './components/ResultEntryForm';
import DateRangeFilter from './components/DateRangeFilter';
import EntryDateTimePicker from './components/EntryDateTimePicker'; 
import MusicBarLoader from '@/app/components/MusicBarLoader';
import { List, Search } from 'lucide-react';
import { usePermissions } from '@/app/context/PermissionContext';

import PatientReportModal from '@/app/list/components/PatientReportModal';
import SmartReportModal from '@/app/list/components/SmartReportModal';



export default function ClientResultEntry({ 
    initialBills, 
    initialFirstBillData,
    initialBillId 
}: { 
    initialBills: any[], 
    initialFirstBillData: any,
    initialBillId?: number | null
}) {
  
  

  

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
      if (data && data.items) {
          setSelectedTestIds(data.items.map((i: any) => i.id));
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
    setIsBillLoading(true);
    try {
        const res = await getResultEntryData(billId);
        if (res && res.success && res.data) {
            setSelectedBillData(res.data);
            setupTestIds(res.data);
        } else {
            setSelectedBillData(null);
            setSelectedTestIds([]);
        }
    } catch (error) {
        setSelectedBillData(null);
        setSelectedTestIds([]);
    } finally {
        setIsBillLoading(false);
    }
  };

  const handleSaveSuccess = async (stayOnCurrent: boolean = false) => {
    if (selectedBillId) {
        
    }

    await refreshWorklist();

    if (stayOnCurrent) {
        if (selectedBillId) {
            const billRes = await getResultEntryData(selectedBillId);
            if (billRes && billRes.success && billRes.data) { 
                 
                setSelectedBillData(billRes.data); 
                if (billRes.data.items) {
                    setSelectedTestIds(billRes.data.items.map((i: any) => i.id));
                }
            }
        }
        return;
    }

    const currentIndex = filteredBills.findIndex((b: any) => b.id === selectedBillId);
    let nextBillId = null;
    
    if (currentIndex !== -1 && currentIndex < filteredBills.length - 1) {
        nextBillId = filteredBills[currentIndex + 1].id;
    }

    if (nextBillId) {
        setSelectedBillId(nextBillId);
    } else if (selectedBillId) {
        const billRes = await getResultEntryData(selectedBillId);
        if (billRes && billRes.success && billRes.data) { 
             
            setSelectedBillData(billRes.data); 
            if (billRes.data.items) {
                setSelectedTestIds(billRes.data.items.map((i: any) => i.id));
            }
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

  if (!permsLoaded) return <div className="h-full flex items-center justify-center bg-[#f1f5f9]"><MusicBarLoader text="Authenticating..." /></div>;
  if (!canSee('Result Entry')) return <div className="h-full w-full flex flex-col items-center justify-center bg-[#f1f5f9] p-6 text-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 mb-4"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><h2 className="text-xl font-bold text-slate-700">Access Restricted</h2><p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view the Result Entry module.</p></div>;

  return (
    <div className="h-full w-full flex flex-col font-sans bg-slate-50 md:bg-transparent overflow-hidden relative" style={{ fontFamily: "'Roboto', Arial, sans-serif", WebkitFontSmoothing: 'subpixel-antialiased', MozOsxFontSmoothing: 'auto', textRendering: 'optimizeLegibility' }}>
      
      {PatientReportModal && isReportModalOpen && selectedBillData && (
          <PatientReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} billId={selectedBillData.id} />
      )}
      {SmartReportModal && isSmartReportModalOpen && selectedBillData && (
          <SmartReportModal isOpen={isSmartReportModalOpen} onClose={() => setIsSmartReportModalOpen(false)} bill={selectedBillData} />
      )}

      <div className="flex flex-1 overflow-hidden p-0 gap-0 relative">
        {!selectedBillId ? (
            <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
                {/* UNIFIED HEADER: 20px Title, All/Pending Filter Tabs, Search Bar, Date Range, Date & Time Picker */}
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    {/* Left: 20px Title */}
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-sm"><List size={16} /></div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>Result Entry</h2>
                    </div>

                    {/* Controls in exact specified order: 1. Tabs -> 2. Search -> 3. Date Range -> 4. Date & Time */}
                    <div className="hidden md:flex items-center gap-1.5 xl:gap-2 flex-1 justify-end min-w-0">
                        {/* 1. All / Pending / Partial / Completed Filter Tabs */}
                        <div className="flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                            {tabs.map(tab => (
                                <button 
                                    key={tab.label} 
                                    onClick={() => setActiveTab(tab.label)} 
                                    className={`h-full whitespace-nowrap px-1.5 xl:px-2 rounded text-[11px] font-normal transition-all flex items-center gap-1 xl:gap-1.5 leading-none ${activeTab === tab.label ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`px-1 xl:px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white ${tab.color}`}>{tab.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* 2. Patient Search Bar */}
                        <div className="relative w-36 lg:w-44 xl:w-52 min-w-[110px] shrink-0">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                placeholder="Search patient..." 
                                className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 rounded-[5px] border border-slate-300 text-[11px] xl:text-[12px] font-normal text-slate-800 placeholder:text-[11px] xl:placeholder:text-[12px] placeholder:text-slate-400 bg-white focus:outline-none focus:border-[#9575cd] transition-all" 
                            />
                        </div>

                        {/* 3. Date Range Filter */}
                        <DateRangeFilter 
                            onFilterChange={setDateRange} 
                            align="end" 
                            buttonClassName="flex items-center justify-between gap-1.5 px-2 xl:px-2.5 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 transition-all h-[24px] xl:h-[26px] group min-w-[110px] xl:min-w-[125px] text-[11px] xl:text-[12px] font-normal text-slate-700 whitespace-nowrap" 
                        />

                        {/* 4. Date and Time Picker */}
                        <EntryDateTimePicker 
                            date={entryDateTime} 
                            onChange={handleManualDateChange} 
                            align="right" 
                            label=""
                            triggerClassName="flex items-center justify-between bg-white border border-slate-300 rounded shadow-sm h-[24px] xl:h-[26px] px-2 xl:px-2.5 gap-1.5 cursor-pointer transition-all group select-none hover:border-[#9575cd] [&_span:last-child]:!text-[11px] xl:[&_span:last-child]:!text-[12px] [&_svg]:!w-3.5 [&_svg]:!h-3.5 whitespace-nowrap" 
                        />
                    </div>
                </div>

                {/* Mobile Header Inside Card */}
                <header className="md:hidden flex flex-col gap-1.5 px-3 py-2 shrink-0 z-20 bg-white border-b border-slate-200">
                    <div className="relative w-full">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Search patient..." 
                            className="w-full pl-7 pr-2 h-[26px] bg-white border border-slate-200 rounded text-[11px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all" 
                        />
                    </div>
                    <div className="flex items-center gap-1.5 w-full">
                        <div className="flex-1">
                            <select 
                                value={activeTab} 
                                onChange={(e) => setActiveTab(e.target.value)} 
                                className="w-full h-[26px] bg-white border border-slate-200 rounded text-[10px] font-normal text-slate-700 px-1.5 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.25rem center', paddingRight: '1.25rem' }}
                            >
                                {tabs.map(tab => (
                                    <option key={tab.label} value={tab.label}>{tab.label} ({tab.count})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <DateRangeFilter onFilterChange={setDateRange} align="end" buttonClassName="w-full h-[26px] bg-white hover:bg-slate-50 border border-slate-200 rounded text-[10px] font-normal text-slate-700 px-1.5 flex justify-between items-center transition-colors shadow-sm" />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden">
                    <WorklistPanel 
                        bills={filteredBills} 
                        onSelect={(id: number) => setSelectedBillId(id)} 
                        activeTab={activeTab}
                    />
                </div>
            </div>
        ) : (
            <>
                <div className={`w-full ${isSidebarOpen ? 'lg:w-[70%]' : ''} h-full bg-white md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative transition-all duration-300`}>
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
                        
                        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-2 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                            {/* Left: Back button & Title */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={handleBackToList} 
                                    className="flex items-center gap-1.5 h-[24px] xl:h-[26px] px-2 xl:px-2.5 bg-white border border-slate-300 text-slate-700 text-[11px] xl:text-[12px] font-normal rounded-[5px] shadow-sm hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    <span>Back to List</span>
                                </button>
                                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
                                <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none hidden sm:block" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    Result Entry
                                </h2>
                            </div>

                            {/* Right: Patient details pill & Sidebar toggle */}
                            <div className="flex items-center gap-2 shrink-0">
                                {selectedBillData ? (
                                    <div className="flex items-center gap-1.5 xl:gap-2 h-[24px] xl:h-[26px] bg-white px-2 xl:px-2.5 rounded-[5px] border border-slate-200 text-[11px] xl:text-[12px] shadow-sm">
                                        <span className="text-slate-500 hidden md:inline font-normal">Patient:</span>
                                        <span className="font-medium text-[#9575cd] truncate max-w-[140px] xl:max-w-[200px]">{selectedBillData.patient.firstName} {selectedBillData.patient.lastName}</span>
                                        <span className="text-slate-500 font-normal bg-slate-100 px-1 py-0.5 rounded text-[10px]">{selectedBillData.patient.ageY}Y / {selectedBillData.patient.gender?.charAt(0) || 'U'}</span>
                                        <span className="text-slate-500 font-mono text-[10px] hidden lg:inline">#{selectedBillData.patient.patientId || selectedBillData.billNumber}</span>
                                    </div>
                                ) : (
                                    <span className="text-[12px] text-slate-400">Loading...</span>
                                )}

                                <button 
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={`hidden lg:flex items-center gap-1 h-[24px] xl:h-[26px] px-2 xl:px-2.5 rounded-[5px] border text-[11px] xl:text-[12px] font-normal transition-all shadow-sm ${isSidebarOpen ? 'bg-purple-100 text-[#9575cd] border-purple-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                    title="Toggle Patient List Sidebar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                                    <span>List</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white md:bg-slate-50/50">
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
                        <div className="flex-1 bg-white rounded-[10px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shrink-0 min-h-[34px] h-[34px]">
                                <span className="text-[11px] font-semibold text-black uppercase tracking-wider">Remaining Patients</span>
                                <span className="bg-white border border-slate-200 text-slate-600 text-sm md:text-xs px-2.5 py-0.5 rounded font-bold">{filteredBills.length}</span>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left text-sm border-collapse whitespace-nowrap bg-white border-spacing-0">
                                    <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                        <tr>
                                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Bill No</th>
                                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Patient Name</th>
                                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Age/Sex</th>
                                            <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Tests</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBills.map((b: any) => (
                                            <tr key={b.id} onClick={() => handleSelectBill(b.id)} className={`cursor-pointer transition-colors ${selectedBillId === b.id ? 'bg-blue-100/50' : 'hover:bg-slate-50'}`}>
                                                <td className="border-b border-[#d9d9d9] align-middle px-2 py-1.5 text-[11px] font-mono text-slate-600">{b.billNumber}</td>
                                                <td className="border-b border-[#d9d9d9] align-middle px-2 py-1.5 text-[11px] font-normal text-slate-800 truncate max-w-[150px]">{b.patient.firstName} {b.patient.lastName}</td>
                                                <td className="border-b border-[#d9d9d9] align-middle px-2 py-1.5 text-[11px] text-slate-600">{b.patient.ageY}Y / {b.patient.gender.charAt(0)}</td>
                                                <td className="border-b border-[#d9d9d9] align-middle px-2 py-1.5 text-[11px] text-slate-600 max-w-[200px]" title={b.items?.map((i: any) => i.test?.name).join(', ')}>
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

                        <div className="flex-1 bg-white rounded-[10px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between shrink-0 min-h-[34px] h-[34px]">
                                <span className="text-[11px] font-semibold text-black uppercase tracking-wider">Test Selection</span>
                                {selectedTestIds.length > 0 && <span className="bg-[#9575cd]/10 text-[#9575cd] text-sm md:text-xs font-bold px-2.5 py-0.5 rounded">{selectedTestIds.length} Selected</span>}
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                {!selectedBillData ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                         <span className="text-sm md:text-xs font-medium">Select a patient above to view tests</span>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm border-collapse whitespace-nowrap bg-white border-spacing-0">
                                        <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                            <tr>
                                                <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] w-8 text-center text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </th>
                                                <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Test Name</th>
                                                <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBillData.items.map((item: any) => {
                                                const isSelected = selectedTestIds.includes(item.id);
                                                return (
                                                    <tr key={item.id} onClick={() => handleTestToggle(item.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-purple-50/50' : 'hover:bg-slate-50'}`}>
                                                        <td className="border-b border-[#d9d9d9] align-middle px-1 py-1 text-center">
                                                            <input type="checkbox" checked={isSelected} readOnly className="accent-[#9575cd] pointer-events-none w-4 h-4" />
                                                        </td>
                                                        <td className="border-b border-[#d9d9d9] align-middle px-2 py-1.5 text-[11px] font-normal text-slate-700 truncate max-w-[150px]">{item.test.name}</td>
                                                        <td className="border-b border-[#d9d9d9] align-middle px-2 py-1.5 text-[11px] text-slate-500">{item.status}</td>
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