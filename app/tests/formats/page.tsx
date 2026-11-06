// --- BLOCK app/tests/formats/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Settings2, AlertCircle, CheckCircle2, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTestsForFormats, getTestById } from '@/app/actions/tests';
import { getDepartments } from '@/app/actions/department';
import { getMasterData } from '@/app/actions/masters';
import { getParameters } from '@/app/actions/parameters'; 

import TestListPanel from './components/TestListPanel';
import FormatEditor from './components/FormatEditor';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function TestFormatsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); 
  
  const [allTests, setAllTests] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [availableParams, setAvailableParams] = useState<any[]>([]); 
  
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedTestFull, setSelectedTestFull] = useState<any>(null); 
  
  const [sidebarTab, setSidebarTab] = useState<'pending' | 'completed'>('pending');

  // Mobile-specific State
  const [mobileTab, setMobileTab] = useState<'pending' | 'completed'>('pending');
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const [mobileDeptFilter, setMobileDeptFilter] = useState('All');
  const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setIsLoading(true);
    try {
        const [tRes, dRes, sRes, pRes] = await Promise.all([
          getTestsForFormats(), 
          getDepartments(), 
          getMasterData('specimen'), 
          getParameters()
        ]);
        
        if (tRes.success) setAllTests(tRes.data);
        if (dRes.success) setDepartments(dRes.data);
        if (sRes.success) setSpecimens(sRes.data);
        if (pRes.success) setAvailableParams(pRes.data);
    } catch (err) {
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setMobileCurrentPage(1);
  }, [mobileSearchTerm, mobileDeptFilter, mobileTab]);


  const refreshData = async () => {
      const res = await getTestsForFormats();
      if(res.success) setAllTests(res.data);
      
      if (selectedTestId) {
          const fullRes = await getTestById(selectedTestId);
          if (fullRes.success) setSelectedTestFull(fullRes.data);
      }
  };

  const { pendingList, completedList } = useMemo(() => {
    const pending: any[] = [];
    const completed: any[] = [];
    
    allTests.forEach((test) => {
      const isFormatConfigured = 
        (test.template && test.template !== 'Default') || 
        test.printNextPage === true || 
        (test.reportTitle && test.reportTitle.trim() !== '') || 
        (test._count && test._count.parameters > 0) || 
        (test.parameters && test.parameters.length > 0);
      
      if (isFormatConfigured) completed.push(test);
      else pending.push(test);
    });

    return { pendingList: pending, completedList: completed };
  }, [allTests]);

  const handleSelectTest = async (test: any) => {
      setSelectedTestId(test.id);
      setIsLoadingDetails(true);
      
      const res = await getTestById(test.id);
      if (res.success && res.data) {
          setSelectedTestFull(res.data);
      }
      setIsLoadingDetails(false);
  };

  const activeTest = useMemo(() => {
    if (!selectedTestFull) return undefined;
    const deptName = selectedTestFull.department?.name || '';
    return {
      ...selectedTestFull,
      reportTitle: selectedTestFull.reportTitle || `Department of ${deptName}`.trim(),
      colCaption1: selectedTestFull.colCaption1 || 'PARAMETER',
      colCaption2: selectedTestFull.colCaption2 || 'Result',
      colCaption3: selectedTestFull.colCaption3 || 'UOM',
      colCaption4: selectedTestFull.colCaption4 || 'BIO.REF.RANGE',
      colCaption5: selectedTestFull.colCaption5 || 'Method'
    };
  }, [selectedTestFull]);

  const getDeptName = (dept: any) => {
    if (!dept) return '';
    if (typeof dept === 'string') return dept;
    return dept.name || '';
  };

  // Mobile Filtered & Paginated List
  const currentMobileList = mobileTab === 'pending' ? pendingList : completedList;
  const filteredMobileList = currentMobileList.filter(test => {
    const deptName = getDeptName(test.department);
    const matchesDept = mobileDeptFilter === 'All' || deptName === mobileDeptFilter;
    const matchesSearch = (test.name || '').toLowerCase().includes(mobileSearchTerm.toLowerCase()) || 
                          (test.code || '').toLowerCase().includes(mobileSearchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const mobileTotalPages = Math.ceil(filteredMobileList.length / ITEMS_PER_PAGE);
  const mobileStartIndex = (mobileCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMobileList = filteredMobileList.slice(mobileStartIndex, mobileStartIndex + ITEMS_PER_PAGE);

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-white">
      <MusicBarLoader text="Loading Formats..." />
    </div>
  );

  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar { width: 2px; height: 2px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `;

  return (
    <div className="h-full w-full bg-white flex flex-col font-sans text-slate-700 overflow-hidden relative">
      <style>{scrollbarStyles}</style>
      
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex flex-1 w-full bg-white overflow-hidden flex-col">
          <header className="px-2.5 xl:px-3 py-1.5 md:py-0 bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-2 z-10 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
              {/* Left: Title, Total & Pending/Configured Filter */}
              <div className="flex items-center gap-2 xl:gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                      <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs"><CheckCircle2 size={15}/></div>
                      <span className="text-[14px] xl:text-[15px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                          Test Formats
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 leading-tight">
                          {allTests.length} Total
                      </span>
                  </div>

                  {/* Pending / Configured Filter Pills */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-[5px] border border-slate-200 h-[24px] xl:h-[26px]">
                      <button 
                          onClick={() => setSidebarTab('pending')}
                          className={`h-full px-2 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${sidebarTab === 'pending' ? 'bg-white shadow-2xs text-amber-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                          <AlertCircle size={12}/>
                          <span>Pending</span>
                          <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-100 text-amber-700 font-bold">{pendingList.length}</span>
                      </button>
                      <button 
                          onClick={() => setSidebarTab('completed')}
                          className={`h-full px-2 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${sidebarTab === 'completed' ? 'bg-white shadow-2xs text-green-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                          <CheckCircle2 size={12}/>
                          <span>Configured</span>
                          <span className="text-[9px] px-1 py-0.2 rounded-full bg-green-100 text-green-700 font-bold">{completedList.length}</span>
                      </button>
                  </div>
              </div>

              <div></div>
          </header>

          <div className="flex-1 flex overflow-hidden">
              <aside className="w-64 lg:w-72 xl:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
                  
                  <div className="flex-1 overflow-hidden bg-white">
                      {sidebarTab === 'pending' ? (
                          <TestListPanel 
                              title="Pending Configuration" 
                              icon={<AlertCircle size={14}/>} 
                              colorClass="text-amber-700" 
                              dotColor="bg-amber-500" 
                              tests={pendingList} 
                              departments={departments} 
                              selectedTestId={selectedTestId} 
                              onSelectTest={handleSelectTest} 
                          />
                      ) : (
                          <TestListPanel 
                              title="Configured Tests" 
                              icon={<CheckCircle2 size={14}/>} 
                              colorClass="text-green-700" 
                              dotColor="bg-green-500" 
                              tests={completedList} 
                              departments={departments} 
                              selectedTestId={selectedTestId} 
                              onSelectTest={handleSelectTest} 
                          />
                      )}
                  </div>
              </aside>

              <main className="flex-1 bg-slate-50/50 flex flex-col p-2 md:p-2.5 xl:p-3 min-h-0 relative overflow-hidden">
                 <div className="absolute inset-0 bg-[#f8fafc] opacity-50 z-0 pointer-events-none"></div>
                 
                 {isLoadingDetails ? (
                     <div className="flex-1 flex flex-col items-center justify-center z-10 w-full h-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                         <MusicBarLoader text="Loading Configuration..." />
                     </div>
                 ) : !selectedTestId || !activeTest ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 z-10 w-full h-full border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200"><Settings2 size={32} className="text-slate-300"/></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Select a test to format</p>
                        <p className="text-[10px] text-slate-400">(Choose a test from the left panel to begin)</p>
                    </div>
                 ) : (
                    <FormatEditor 
                        test={activeTest} 
                        specimens={specimens} 
                        availableParams={availableParams} 
                        onSaveComplete={refreshData} 
                    />
                 )}
              </main>

          </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden flex-1 w-full h-full bg-white overflow-hidden flex-col relative">
        {selectedTestId && activeTest ? (
          <FormatEditor 
            test={activeTest} 
            specimens={specimens} 
            availableParams={availableParams} 
            onSaveComplete={refreshData} 
            onBack={() => { setSelectedTestId(null); setSelectedTestFull(null); }}
          />
        ) : isLoadingDetails ? (
          <div className="flex-1 w-full bg-white flex flex-col items-center justify-center p-6">
            <MusicBarLoader text="Loading Configuration..." />
          </div>
        ) : (
          <div className="w-full h-full bg-white rounded-none border-0 overflow-hidden flex flex-col relative">
            {/* Header inside card (Search, Filter and Tabs) */}
            <header className="flex flex-col gap-1.5 px-2.5 py-2 shrink-0 z-20 bg-white border-b border-slate-100">
              {/* Row 1: Search & Department Filter */}
              <div className="flex items-center gap-1.5 w-full shrink-0">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search tests..." 
                    value={mobileSearchTerm} 
                    onChange={(e) => setMobileSearchTerm(e.target.value)} 
                    className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all"
                  />
                </div>

                <div className="relative">
                  <select 
                    value={mobileDeptFilter} 
                    onChange={(e) => setMobileDeptFilter(e.target.value)} 
                    className="h-6 pl-2 pr-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 2: Status Switcher & Quick Count */}
              <div className="flex items-center justify-between w-full py-0.5">
                <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                  <button 
                    onClick={() => setMobileTab('pending')}
                    className={`h-5 px-2 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
                      mobileTab === 'pending' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    Pending ({pendingList.length})
                  </button>
                  <button 
                    onClick={() => setMobileTab('completed')}
                    className={`h-5 px-2 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
                      mobileTab === 'completed' ? 'bg-white text-green-700 shadow-2xs' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Configured ({completedList.length})
                  </button>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="text-[9.5px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                    {filteredMobileList.length === 0 ? '0 of 0' : `${mobileStartIndex + 1}-${Math.min(mobileStartIndex + ITEMS_PER_PAGE, filteredMobileList.length)} of ${filteredMobileList.length}`}
                  </span>
                </div>
              </div>
            </header>

            {/* Mobile Cards List inside card */}
            <div className="flex-1 min-h-0 overflow-y-auto w-full px-2.5 py-2 bg-white flex flex-col gap-2 pb-16 custom-scrollbar">
              {filteredMobileList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                  <Settings2 size={32} className="mb-2 opacity-30"/>
                  <p className="text-[11px] font-medium">No tests found matching filter.</p>
                </div>
              ) : (
                paginatedMobileList.map((test: any) => {
                  const isFormatConfigured = completedList.some(c => c.id === test.id);
                  const paramCount = test._count?.parameters || test.parameters?.length || 0;
                  return (
                    <div 
                      key={test.id} 
                      onClick={() => handleSelectTest(test)}
                      className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 flex flex-col gap-1.5 active:bg-purple-50/50 cursor-pointer transition-all relative group"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-slate-800 text-[11px] truncate group-hover:text-[#9575cd] transition-colors">{test.name}</span>
                          <span className="text-[9.5px] text-slate-500 font-medium truncate">{getDeptName(test.department) || 'General'}</span>
                        </div>
                        <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8.5px] font-semibold shrink-0">
                          {test.code}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px]">
                        <div className="flex items-center gap-1.5">
                          {isFormatConfigured ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              <CheckCircle2 size={10} /> Configured ({paramCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              <AlertCircle size={10} /> Needs Setup
                            </span>
                          )}
                          {test.isCulture && (
                            <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                              Culture
                            </span>
                          )}
                        </div>

                        <span className="text-[#9575cd] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Format <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Fixed Footer */}
            <div className="shrink-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between border-t border-slate-100 shadow-sm rounded-none">
              <button 
                onClick={() => window.history.back()} 
                className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5"><path d="m15 18-6-6 6-6"/></svg> Back
              </button>

              {/* Page No & Direction Icons in Footer */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                <button 
                  onClick={() => setMobileCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={mobileCurrentPage === 1}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all shadow-2xs"
                  title="Previous Page"
                >
                  <ChevronLeft size={11} />
                </button>
                <span className="text-[9.5px] font-bold text-slate-700 min-w-[34px] text-center select-none">
                  {mobileCurrentPage} / {mobileTotalPages || 1}
                </span>
                <button 
                  onClick={() => setMobileCurrentPage(p => Math.min(mobileTotalPages, p + 1))} 
                  disabled={mobileCurrentPage === mobileTotalPages || mobileTotalPages === 0}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all shadow-2xs"
                  title="Next Page"
                >
                  <ChevronRight size={11} />
                </button>
              </div>
              
              {/* Record Count Badge */}
              <div className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[9px] rounded shrink-0">
                {filteredMobileList.length === 0 ? '0 of 0' : `${mobileStartIndex + 1}-${Math.min(mobileStartIndex + ITEMS_PER_PAGE, filteredMobileList.length)} of ${filteredMobileList.length}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// --- BLOCK app/tests/formats/page.tsx CLOSE ---