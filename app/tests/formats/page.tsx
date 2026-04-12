// --- BLOCK app/tests/formats/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Settings2, AlertCircle, CheckCircle2 } from 'lucide-react'; // 🚨 Removed Loader2
import { getTestsForFormats, getTestById } from '@/app/actions/tests';
import { getDepartments } from '@/app/actions/department';
import { getMasterData } from '@/app/actions/masters';
import { getParameters } from '@/app/actions/parameters'; 

import TestListPanel from './components/TestListPanel';
import FormatEditor from './components/FormatEditor';
import MusicBarLoader from '@/app/components/MusicBarLoader'; // 🚨 NEW: Imported our custom loader!

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

  // 🚨 REPLACED: Uses the new MusicBarLoader for the main page load
  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
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
    <div className="h-full w-full bg-[#f1f5f9] p-4 md:p-6 flex flex-col font-sans text-slate-600 overflow-hidden">
      <style>{scrollbarStyles}</style>
      
      <div className="flex-1 w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200 ring-1 ring-slate-100">
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 relative">
              <div className="flex items-center gap-4">
                  <div className="p-1.5 bg-[#9575cd] rounded-lg text-white shadow-sm"><Settings2 size={18}/></div>
                  <div>
                    <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">Test Formats</h1>
                    <span className="text-[10px] text-slate-400 font-medium">Report templates & layout</span>
                  </div>
              </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
              <aside className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                  <div className="flex p-2 bg-slate-100 border-b border-slate-200 shrink-0">
                      <button 
                          onClick={() => setSidebarTab('pending')}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${sidebarTab === 'pending' ? 'bg-white shadow-sm text-amber-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      >
                          <AlertCircle size={14}/> Pending ({pendingList.length})
                      </button>
                      <button 
                          onClick={() => setSidebarTab('completed')}
                          className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all flex items-center justify-center gap-1.5 ${sidebarTab === 'completed' ? 'bg-white shadow-sm text-green-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                      >
                          <CheckCircle2 size={14}/> Completed ({completedList.length})
                      </button>
                  </div>
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

              <main className="flex-1 bg-white flex flex-col items-center p-4 min-h-0 relative">
                 <div className="absolute inset-0 bg-[#f8fafc] opacity-50 z-0 pointer-events-none"></div>
                 
                 {/* 🚨 REPLACED: Uses MusicBarLoader for the side panel loading! */}
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
    </div>
  );
}
// --- BLOCK app/tests/formats/page.tsx CLOSE ---