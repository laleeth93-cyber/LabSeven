// --- BLOCK app/tests/formats/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Settings2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTests } from '@/app/actions/tests';
import { getDepartments } from '@/app/actions/department';
import { getMasterData } from '@/app/actions/masters';
import { getParameters } from '@/app/actions/parameters'; 

import TestListPanel from './components/TestListPanel';
import FormatEditor from './components/FormatEditor';

interface TestData {
  id: number;
  name: string;
  code: string;
  department: any;
  isCulture: boolean; 
  specimen: any;
  method: any;
  vacutainer: any;
  template: string | null;
  printNextPage: boolean;
  reportTitle: string | null;
  colCaption1?: string | null; 
  colCaption2?: string | null;
  colCaption3?: string | null;
  colCaption4?: string | null;
  colCaption5?: string | null;
  parameters: any[];
  isConfigured: boolean; 
  [key: string]: any; 
}

export default function TestFormatsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [allTests, setAllTests] = useState<TestData[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [availableParams, setAvailableParams] = useState<any[]>([]); 
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
        const [tRes, dRes, sRes, pRes] = await Promise.all([
          getTests(), 
          getDepartments(), 
          getMasterData('specimen'), 
          getParameters()
        ]);
        
        if (tRes.success) setAllTests(tRes.data as TestData[]);
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
      const res = await getTests();
      if(res.success) setAllTests(res.data as TestData[]);
  };

  const { pendingList, completedList } = useMemo<{ pendingList: TestData[]; completedList: TestData[] }>(() => {
    const pending: TestData[] = [];
    const completed: TestData[] = [];
    
    allTests.forEach((test) => {
      const isFormatConfigured = 
        (test.template && test.template !== 'Default') || 
        test.printNextPage === true || 
        (test.reportTitle && test.reportTitle.trim() !== '') || 
        (test.parameters && test.parameters.length > 0);
      
      if (isFormatConfigured) completed.push(test);
      else pending.push(test);
    });

    return { pendingList: pending, completedList: completed };
  }, [allTests]);

  const selectedTest = useMemo(() => {
    const test = allTests.find(t => t.id === selectedTestId);
    if (!test) return undefined;

    const deptName = test.department?.name || (typeof test.department === 'string' ? test.department : '');

    return {
      ...test,
      reportTitle: test.reportTitle || `Department of ${deptName}`.trim(),
      colCaption1: test.colCaption1 || 'PARAMETER',
      colCaption2: test.colCaption2 || 'Result',
      colCaption3: test.colCaption3 || 'UOM',
      colCaption4: test.colCaption4 || 'BIO.REF.RANGE',
      colCaption5: test.colCaption5 || 'Method'
    };
  }, [allTests, selectedTestId]);

  if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-500 gap-2"><Loader2 className="animate-spin"/> Loading...</div>;

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
              <aside className="w-64 bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0">
                 <TestListPanel 
                    title={`Pending Format: ${pendingList.length}`} 
                    icon={<AlertCircle size={14}/>} 
                    colorClass="text-amber-700" 
                    dotColor="bg-amber-500" 
                    tests={pendingList} 
                    departments={departments} 
                    selectedTestId={selectedTestId} 
                    onSelectTest={(t: TestData) => setSelectedTestId(t.id)} 
                 />
              </aside>

              <main className="flex-1 bg-white flex flex-col items-center p-4 min-h-0 relative">
                 <div className="absolute inset-0 bg-[#f8fafc] opacity-50 z-0 pointer-events-none"></div>
                 {!selectedTestId || !selectedTest ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 z-10">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200"><Settings2 size={32} className="text-slate-300"/></div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Select a test to format</p>
                        <p className="text-[10px] text-slate-400">(Choose a test from the left panel to begin)</p>
                    </div>
                 ) : (
                    <FormatEditor 
                        test={selectedTest} 
                        specimens={specimens} 
                        availableParams={availableParams} 
                        onSaveComplete={refreshData} 
                    />
                 )}
              </main>

              <aside className="w-64 bg-slate-50/50 border-l border-slate-200 flex flex-col shrink-0">
                 <TestListPanel 
                    title={`Formatted: ${completedList.length}`} 
                    icon={<CheckCircle2 size={14}/>} 
                    colorClass="text-green-700" 
                    dotColor="bg-green-500" 
                    tests={completedList} 
                    departments={departments} 
                    selectedTestId={selectedTestId} 
                    onSelectTest={(t: TestData) => setSelectedTestId(t.id)} 
                 />
              </aside>
          </div>
      </div>
    </div>
  );
}
// --- BLOCK app/tests/formats/page.tsx CLOSE ---