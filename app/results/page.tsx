// --- BLOCK app/results/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Calendar, ArrowRight, ChevronDown, Check, Filter } from 'lucide-react';
import ResultsTable from './components/ResultsTable';
import FilterSidebar from './components/FilterSidebar';

// --- MOCK DATA ---
const MOCK_DATA = [
  { id: '260128009', billDate: '04-02-2026', billTime: '09:57 PM', patientName: 'Lalith', ageGender: '31 Year, Male', referral: 'Self', tests: [{ name: 'Complete Blood Count (CBC)', code: 'P' }, { name: 'URIC ACID', code: 'P' }], barcode: '004955', status: 'Pending', b2b: 'Apollo B2B', isUrgent: false },
  { id: '260121005', billDate: '04-02-2026', billTime: '06:21 PM', patientName: 'K.AVINASH', ageGender: '18 Year, Male', referral: 'Dr. Smith', tests: [{ name: 'COMPLETE URINE EXAMINATION', code: 'C' }], barcode: '004954', status: 'Completed', b2b: 'MedPlus', isUrgent: true },
  { id: '241207008', billDate: '04-02-2026', billTime: '12:02 PM', patientName: 'V.RADHA KRISHNA', ageGender: '66 Year, Male', referral: 'Self', tests: [{ name: 'POST PRANDIAL BLOOD SUGAR', code: 'C' }, { name: 'SERUM CREATININE', code: 'C' }], barcode: '004953', status: 'Completed', b2b: 'Client A', isUrgent: false },
  { id: '260204006', billDate: '04-02-2026', billTime: '09:00 AM', patientName: 'N.SHANKAR RAO', ageGender: '63 Year, Male', referral: 'Dr. Rajesh', tests: [{ name: 'BLOOD SUGAR FASTING & PP', code: 'C' }, { name: 'Glycosylated Hemoglobin(HbA1c)', code: 'P', isOutsource: true }, { name: 'LIPID PROFILE', code: 'C' }], barcode: '004945', status: 'Partial', b2b: 'Apollo B2B', isUrgent: true }
];

export default function ResultsDashboard() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Grouped Filter State for cleaner code
  const [filters, setFilters] = useState({
    test: '', machine: '', b2b: '', doctor: '', hospital: '', centre: '', urgent: false, sortOrder: 'desc'
  });

  const activeFilterCount = Object.values(filters).filter(v => v === true || (typeof v === 'string' && v.trim() !== '' && v !== 'desc' && v !== 'asc')).length;

  const clearAllFilters = () => {
    setFilters({ test: '', machine: '', b2b: '', doctor: '', hospital: '', centre: '', urgent: false, sortOrder: 'desc' });
    setShowFilters(false);
  };

  // Date Logic
  const getLocalInputDate = (date: Date = new Date()) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getLocalInputDate();
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [tempFromDate, setTempFromDate] = useState(todayStr);
  const [tempToDate, setTempToDate] = useState(todayStr);
  const [showDatePopover, setShowDatePopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setShowDatePopover(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDatePopover) { setTempFromDate(fromDate); setTempToDate(toDate); }
  }, [showDatePopover, fromDate, toDate]);

  const tabs = [
    { label: 'All', count: 20, color: 'bg-[#9575cd]' }, 
    { label: 'Pending', count: 3, color: 'bg-orange-500' },
    { label: 'Partial', count: 4, color: 'bg-purple-500' },
    { label: 'Completed', count: 13, color: 'bg-green-500' },
    { label: 'Delivered', count: 0, color: 'bg-slate-500' }
  ];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const setPreset = (days: number, type: 'days' | 'month' | 'yesterday' = 'days') => {
    const end = new Date(); const start = new Date(); 
    if (type === 'yesterday') { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
    else if (type === 'month') { start.setDate(1); }
    else { start.setDate(start.getDate() - days); }
    setTempFromDate(getLocalInputDate(start));
    setTempToDate(getLocalInputDate(end));
  };

  const handleApplyDate = () => {
    setFromDate(tempFromDate); setToDate(tempToDate); setShowDatePopover(false);
  };

  const handleResetToToday = () => {
    setFromDate(todayStr); setToDate(todayStr); setTempFromDate(todayStr); setTempToDate(todayStr);
  };

  // Data Processing
  const filteredData = MOCK_DATA.filter(item => {
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch = item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.includes(searchTerm) || item.barcode.includes(searchTerm);
    
    const [day, month, year] = item.billDate.split('-').map(Number);
    const billDateObj = new Date(year, month - 1, day);
    const start = new Date(fromDate); start.setHours(0,0,0,0);
    const end = new Date(toDate); end.setHours(23,59,59,999);
    const matchesDate = billDateObj >= start && billDateObj <= end;

    const matchesTest = filters.test ? item.tests.some(t => t.name.toLowerCase().includes(filters.test.toLowerCase())) : true;
    const matchesDoctor = filters.doctor ? item.referral.toLowerCase().includes(filters.doctor.toLowerCase()) : true;
    const matchesB2B = filters.b2b ? (item as any).b2b === filters.b2b : true;
    const matchesUrgent = filters.urgent ? (item as any).isUrgent === true : true;

    return matchesTab && matchesSearch && matchesDate && matchesTest && matchesDoctor && matchesB2B && matchesUrgent;
  });

  const sortedData = [...filteredData].sort((a, b) => filters.sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id));
  const allTestNames = Array.from(new Set(MOCK_DATA.flatMap(item => item.tests.map(t => t.name))));

  return (
    <div className="h-full flex flex-col relative bg-[#eceff1]">
      
      <FilterSidebar 
        showFilters={showFilters} setShowFilters={setShowFilters} 
        filters={filters} setFilters={setFilters} 
        clearAllFilters={clearAllFilters} allTestNames={allTestNames}
      />

      <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button key={tab.label} onClick={() => setActiveTab(tab.label)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.label ? 'bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <span className={`w-2 h-2 rounded-full ${tab.color}`}></span>
                    {tab.label}
                    <span className="ml-1 bg-white border border-slate-200 px-1.5 rounded text-[10px] text-slate-600 font-bold">{tab.count}</span>
                    </button>
                ))}
              </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 z-20">
              <div className="relative w-full md:w-80">
                  <input type="text" placeholder="Search patient, ID, or barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#9575cd] bg-white transition-colors shadow-sm" />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="relative" ref={popoverRef}>
                    <button onClick={() => setShowDatePopover(!showDatePopover)} className={`flex items-center gap-3 px-4 py-2 bg-white border rounded-md text-sm font-medium shadow-sm transition-all w-72 justify-between group ${showDatePopover ? 'border-[#9575cd] ring-2 ring-purple-100' : 'border-slate-300 hover:border-[#b39ddb]'}`}>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Calendar size={16} className="text-slate-400 group-hover:text-[#9575cd]" />
                        <span className="font-semibold text-slate-700">{formatDateDisplay(fromDate)}</span>
                        <ArrowRight size={14} className="text-slate-300"/>
                        <span className="font-semibold text-slate-700">{formatDateDisplay(toDate)}</span>
                      </div>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${showDatePopover ? 'rotate-180' : ''}`} />
                    </button>

                    {showDatePopover && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 flex overflow-hidden w-[550px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="w-40 bg-slate-50 border-r border-slate-100 p-2 flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2 tracking-wider">Quick Select</span>
                          {[
                            { label: 'Today', days: 0, type: 'days' }, { label: 'Yesterday', days: 1, type: 'yesterday' }, { label: 'Last 7 Days', days: 7, type: 'days' }, { label: 'Last 30 Days', days: 30, type: 'days' }, { label: 'This Month', days: 0, type: 'month' }
                          ].map((preset: any) => (
                            <button key={preset.label} onClick={() => setPreset(preset.days, preset.type)} className="text-left px-3 py-2 text-sm text-slate-600 rounded-md hover:bg-white hover:shadow-sm hover:text-[#9575cd] transition-all font-medium">{preset.label}</button>
                          ))}
                        </div>

                        <div className="flex-1 p-5 flex flex-col justify-between">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Custom Range</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500">From Date</label><input type="date" value={tempFromDate} onChange={(e) => setTempFromDate(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#9575cd] focus:outline-none bg-slate-50 hover:bg-white transition-colors" /></div>
                                    <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500">To Date</label><input type="date" value={tempToDate} onChange={(e) => setTempToDate(e.target.value)} className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[#9575cd] focus:outline-none bg-slate-50 hover:bg-white transition-colors" /></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                <button onClick={() => setShowDatePopover(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">Cancel</button>
                                <button onClick={handleApplyDate} className="px-6 py-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-md shadow-sm shadow-purple-200 flex items-center gap-2 transition-transform active:scale-95"><Check size={16}/> Apply</button>
                            </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setShowFilters(true)} className={`relative flex items-center gap-2 px-3 py-2 border text-slate-700 rounded-md text-xs font-bold shadow-sm hover:bg-slate-50 h-[38px] transition-colors ${showFilters ? 'bg-purple-50 border-[#9575cd] text-[#9575cd]' : 'bg-white border-slate-300'}`}>
                        <Filter size={14} /> Filters
                        {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#9575cd] text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in duration-200">{activeFilterCount}</span>}
                  </button>

                  <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-bold shadow-sm hover:bg-slate-50 h-[38px]"><Download size={14} /> Export</button>
              </div>
          </div>

          <ResultsTable sortedData={sortedData} onResetDate={handleResetToToday} />

      </div>
    </div>
  );
}
// --- BLOCK app/results/page.tsx CLOSE ---