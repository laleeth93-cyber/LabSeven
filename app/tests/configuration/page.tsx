// --- BLOCK app/tests/configuration/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { 
  Save, Loader2, Search, FlaskConical, Clock, Beaker, Tag, 
  CheckCircle2, AlertCircle, ArrowRight, Filter, LayoutDashboard, CheckCircle 
} from 'lucide-react';
import { getTests } from '@/app/actions/tests';
import { getMasterData } from '@/app/actions/masters';
import { getDepartments } from '@/app/actions/department';
import { updateTestConfiguration } from '@/app/actions/test-config';

interface TestData {
  id: number; name: string; code: string; department: any; type: string; isOutsourced: boolean; 
  method: any; specimen: any; vacutainer: any; sampleVolume: string | null; barcodeCopies: number | null;
  minDays: number | null; minHours: number | null; minMinutes: number | null; maxDays: number | null; maxHours: number | null; maxMinutes: number | null;
  isConfigured: boolean; 
}

export default function TestConfigurationPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [allTests, setAllTests] = useState<TestData[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [vacutainers, setVacutainers] = useState<any[]>([]);

  const [pendingDeptFilter, setPendingDeptFilter] = useState('All');
  const [completedDeptFilter, setCompletedDeptFilter] = useState('All');
  const [pendingSearch, setPendingSearch] = useState('');
  const [completedSearch, setCompletedSearch] = useState('');
  
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedTestName, setSelectedTestName] = useState('');
  const [selectedTestCode, setSelectedTestCode] = useState('');
  
  const [formData, setFormData] = useState({
    method: '', specimen: '', vacutainer: '', sampleVolume: '', barcodeCopies: 1,
    minDays: 0, minHours: 0, minMinutes: 0, maxDays: 0, maxHours: 0, maxMinutes: 0,
  });

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [tRes, dRes, mRes, sRes, vRes] = await Promise.all([
      getTests(), getDepartments(), getMasterData('method'), getMasterData('specimen'), getMasterData('vacutainer')
    ]);

    if (tRes.success) setAllTests((tRes.data as TestData[]).filter(t => t.type === 'Test' && !t.isOutsourced));
    if (dRes.success) setDepartments(dRes.data);
    if (mRes.success) setMethods(mRes.data);
    if (sRes.success) setSpecimens(sRes.data);
    if (vRes.success) setVacutainers(vRes.data);
    setIsLoading(false);
  }

  const getDeptName = (dept: any) => typeof dept === 'string' ? dept : (dept?.name || '');
  const getMissingFields = (test: TestData) => {
     const missing = [];
     if (!test.method) missing.push('Method');
     if (!test.specimen) missing.push('Specimen');
     if (!test.vacutainer) missing.push('Container');
     return missing.length > 0 ? missing.join(', ') : '';
  };

  const { pendingList, completedList } = useMemo(() => {
    const pending: TestData[] = []; const completed: TestData[] = [];
    allTests.forEach((test) => {
      const deptName = getDeptName(test.department);
      const matchesSearch = (search: string) => test.name.toLowerCase().includes(search.toLowerCase()) || test.code.toLowerCase().includes(search.toLowerCase());
      const matchesDept = (filter: string) => filter === 'All' || deptName === filter;

      if (test.isConfigured) {
        if (matchesSearch(completedSearch) && matchesDept(completedDeptFilter)) completed.push(test);
      } else {
        if (matchesSearch(pendingSearch) && matchesDept(pendingDeptFilter)) pending.push(test);
      }
    });
    return { pendingList: pending, completedList: completed };
  }, [allTests, pendingSearch, completedSearch, pendingDeptFilter, completedDeptFilter]);

  const handleSelectTest = (test: TestData) => {
    setSelectedTestId(test.id); setSelectedTestName(test.name); setSelectedTestCode(test.code);
    setFormData({
        method: test.method?.id?.toString() || '', specimen: test.specimen?.id?.toString() || '', vacutainer: test.vacutainer?.id?.toString() || '',
        sampleVolume: test.sampleVolume || '', barcodeCopies: test.barcodeCopies || 1,
        minDays: test.minDays || 0, minHours: test.minHours || 0, minMinutes: test.minMinutes || 0,
        maxDays: test.maxDays || 0, maxHours: test.maxHours || 0, maxMinutes: test.maxMinutes || 0,
    });
  };

  const handleSave = () => {
    if (!selectedTestId) return;
    startTransition(async () => {
      const res = await updateTestConfiguration(selectedTestId, formData);
      if (res.success) {
        setAllTests(prev => prev.map(t => t.id === selectedTestId ? { 
            ...t, ...formData, isConfigured: true, 
            method: methods.find(m => m.id.toString() === formData.method) || t.method, 
            specimen: specimens.find(s => s.id.toString() === formData.specimen) || t.specimen, 
            vacutainer: vacutainers.find(v => v.id.toString() === formData.vacutainer) || t.vacutainer 
        } : t));
        setSuccessMessage("Configured Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 1500);
      } else alert("Error: " + res.message);
    });
  };

  const labelClass = "text-[9px] font-bold text-slate-500 uppercase mb-1 block tracking-tight";
  const inputClass = "w-full text-[11px] font-medium border border-slate-300 rounded px-2 h-8 bg-white focus:ring-1 focus:ring-[#9575cd] focus:border-[#9575cd] outline-none transition-all placeholder:text-slate-400";
  const selectClass = "w-full text-[11px] font-medium border border-slate-300 rounded px-2 h-8 bg-white focus:ring-1 focus:ring-[#9575cd] focus:border-[#9575cd] outline-none transition-all cursor-pointer appearance-none";
  const timeInputClass = "w-full text-[11px] text-center font-bold text-slate-700 border border-slate-300 rounded px-1 h-8 focus:ring-1 focus:ring-[#9575cd] focus:border-[#9575cd] outline-none";

  if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-500 gap-2"><Loader2 className="animate-spin"/> Loading...</div>;

  return (
    <div className="h-full w-full bg-[#f1f5f9] p-4 md:p-6 flex flex-col font-sans text-slate-600 overflow-hidden relative">

      {showSuccessPopup && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100"><CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} /></div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
            {selectedTestName && <p className="text-slate-500 text-sm mt-1 text-center font-medium">{selectedTestName}</p>}
          </div>
        </div>
      )}

      <div className="flex-1 w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-slate-200 ring-1 ring-slate-100">
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30 relative">
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#9575cd] rounded-lg text-white shadow-sm"><LayoutDashboard size={18}/></div>
                      <div>
                        <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-none">Test Configuration</h1>
                        <span className="text-[10px] text-slate-400 font-medium">Map clinical details & turnaround times</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  {/* 🚨 THE RESET BUTTON HAS BEEN PERMANENTLY REMOVED FROM HERE */}
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                      <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-md flex items-center gap-1.5 border border-amber-200"><AlertCircle size={12}/> <span>Pending: {pendingList.length}</span></div>
                      <div className="px-3 py-1 bg-green-50 text-green-700 rounded-md flex items-center gap-1.5 border border-green-200"><CheckCircle2 size={12}/> <span>Done: {completedList.length}</span></div>
                  </div>
              </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
              <aside className="w-64 bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0 z-20">
                 <div className="p-3 border-b border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-slate-700 mb-1"><span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Pending Tests</span></div>
                    <div className="relative"><select value={pendingDeptFilter} onChange={(e) => setPendingDeptFilter(e.target.value)} className="w-full text-[10px] font-bold border border-slate-200 rounded px-2 h-7 bg-white focus:border-[#9575cd] outline-none appearance-none cursor-pointer text-slate-600 shadow-sm"><option value="All">All Departments</option>{departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}</select><Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div>
                    <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="Search pending..." value={pendingSearch} onChange={(e) => setPendingSearch(e.target.value)} className="w-full pl-6 pr-2 h-7 text-[10px] border border-slate-200 rounded bg-white focus:border-[#9575cd] outline-none shadow-sm"/></div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {pendingList.length === 0 && <div className="text-center py-8 text-[10px] text-slate-400 px-4">All tests configured!</div>}
                    {pendingList.map(test => (
                        <button key={test.id} onClick={() => handleSelectTest(test)} className={`w-full text-left px-3 py-2 rounded-md border text-[10px] transition-all flex flex-col gap-0.5 group relative ${selectedTestId === test.id ? 'bg-[#9575cd] border-[#9575cd] text-white shadow-md' : 'bg-white border-slate-200 hover:border-[#b39ddb] hover:bg-purple-50 text-slate-600 shadow-sm'}`}>
                            <div className="flex justify-between items-center w-full"><span className="font-bold truncate w-[90%] leading-tight">{test.name}</span>{selectedTestId === test.id && <ArrowRight size={10} className="text-white"/>}</div>
                            <div className={`flex justify-between w-full text-[9px] ${selectedTestId === test.id ? 'text-purple-100' : 'text-slate-400'}`}><span className="text-red-400 font-bold truncate max-w-[65%]">Missing: {getMissingFields(test)}</span><span className="uppercase tracking-tighter opacity-80">{getDeptName(test.department).substring(0, 3)}</span></div>
                        </button>
                    ))}
                 </div>
              </aside>

              <main className="flex-1 flex flex-col items-center p-4 z-10 min-h-0 relative bg-white">
                 <div className="absolute inset-0 bg-[#f8fafc] opacity-50 z-0 pointer-events-none"></div>
                 {!selectedTestId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 z-10"><div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200"><FlaskConical size={32} className="text-slate-300"/></div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Select a test to configure</p></div>
                 ) : (
                    <div className="w-full h-full bg-white rounded-xl shadow-lg shadow-slate-200/40 flex flex-col overflow-hidden border border-slate-200 z-10 animate-in zoom-in-95 duration-200">
                         <div className="p-6 pb-4 bg-white shrink-0">
                            <div className="flex items-center justify-between gap-4 mb-4"><div className="flex items-center gap-3"><div className="p-1.5 rounded-lg bg-purple-50 text-[#9575cd] shadow-sm"><Beaker size={20} /></div><div><h2 className="text-lg font-bold text-slate-700 tracking-tight">Parameters & Clinical</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{selectedTestCode} • {selectedTestName}</p></div></div><button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 px-5 py-1.5 rounded-[5px] text-white font-medium text-[12px] capitalize shadow-md hover:opacity-90 active:scale-95 transition-transform disabled:opacity-70" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>{isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="opacity-80" />} {isPending ? 'Saving...' : 'Mark as Configured'}</button></div>
                            <div className="h-[0.5px] w-full bg-purple-100"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="w-full border-2 border-dashed rounded-lg p-6 border-slate-200 hover:border-purple-200 transition-colors space-y-8">
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center text-[#9575cd]"><Beaker size={12}/></div>Clinical Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        <div><label className={labelClass}>Method</label><select value={formData.method || ''} onChange={(e) => setFormData({...formData, method: e.target.value})} className={selectClass}><option value="">-- Method --</option>{methods.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
                                        <div><label className={labelClass}>Specimen</label><select value={formData.specimen || ''} onChange={(e) => setFormData({...formData, specimen: e.target.value})} className={selectClass}><option value="">-- Specimen --</option>{specimens.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                        <div><label className={labelClass}>Container</label><select value={formData.vacutainer || ''} onChange={(e) => setFormData({...formData, vacutainer: e.target.value})} className={selectClass}><option value="">-- Container --</option>{vacutainers.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                                        <div><label className={labelClass}>Volume</label><input type="text" placeholder="2 ml" value={formData.sampleVolume || ''} onChange={(e) => setFormData({...formData, sampleVolume: e.target.value})} className={inputClass} /></div>
                                        <div><label className={labelClass}>Barcodes</label><div className="relative"><input type="number" min="0" max="5" value={formData.barcodeCopies || 1} onChange={(e) => setFormData({...formData, barcodeCopies: parseInt(e.target.value)})} className={inputClass} /><Tag size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2"><div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center text-[#9575cd]"><Clock size={12}/></div>Turnaround Time</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 group hover:border-[#9575cd] transition-colors"><label className="text-[9px] font-bold text-slate-600 uppercase mb-2 block flex items-center gap-1.5"><Clock size={10}/> Report Available (Min)</label><div className="flex gap-2"><div className="flex-1"><input type="number" value={formData.minDays || 0} onChange={(e) => setFormData({...formData, minDays: parseInt(e.target.value)})} className={timeInputClass} /><span className="text-[8px] text-center block mt-1 text-slate-400 font-bold uppercase">Days</span></div><div className="flex-1"><input type="number" value={formData.minHours || 0} onChange={(e) => setFormData({...formData, minHours: parseInt(e.target.value)})} className={timeInputClass} /><span className="text-[8px] text-center block mt-1 text-slate-400 font-bold uppercase">Hrs</span></div><div className="flex-1"><input type="number" value={formData.minMinutes || 0} onChange={(e) => setFormData({...formData, minMinutes: parseInt(e.target.value)})} className={timeInputClass} /><span className="text-[8px] text-center block mt-1 text-slate-400 font-bold uppercase">Mins</span></div></div></div>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 group hover:border-red-400 transition-colors"><label className="text-[9px] font-bold text-slate-600 uppercase mb-2 block flex items-center gap-1.5"><AlertCircle size={10}/> Deadline (Max)</label><div className="flex gap-2"><div className="flex-1"><input type="number" value={formData.maxDays || 0} onChange={(e) => setFormData({...formData, maxDays: parseInt(e.target.value)})} className={timeInputClass} /><span className="text-[8px] text-center block mt-1 text-slate-400 font-bold uppercase">Days</span></div><div className="flex-1"><input type="number" value={formData.maxHours || 0} onChange={(e) => setFormData({...formData, maxHours: parseInt(e.target.value)})} className={timeInputClass} /><span className="text-[8px] text-center block mt-1 text-slate-400 font-bold uppercase">Hrs</span></div><div className="flex-1"><input type="number" value={formData.maxMinutes || 0} onChange={(e) => setFormData({...formData, maxMinutes: parseInt(e.target.value)})} className={timeInputClass} /><span className="text-[8px] text-center block mt-1 text-slate-400 font-bold uppercase">Mins</span></div></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}
              </main>

              <aside className="w-64 bg-slate-50/50 border-l border-slate-200 flex flex-col shrink-0 z-20">
                 <div className="p-3 border-b border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-slate-700 mb-1"><span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Configured</span></div>
                    <div className="relative"><select value={completedDeptFilter} onChange={(e) => setCompletedDeptFilter(e.target.value)} className="w-full text-[10px] font-bold border border-slate-200 rounded px-2 h-7 bg-white focus:border-[#9575cd] outline-none appearance-none cursor-pointer text-slate-600 shadow-sm"><option value="All">All Departments</option>{departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}</select><Filter size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/></div>
                    <div className="relative"><Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/><input type="text" placeholder="Search done..." value={completedSearch} onChange={(e) => setCompletedSearch(e.target.value)} className="w-full pl-6 pr-2 h-7 text-[10px] border border-slate-200 rounded bg-white focus:border-[#9575cd] outline-none shadow-sm"/></div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {completedList.map(test => (
                        <button key={test.id} onClick={() => handleSelectTest(test)} className={`w-full text-left px-3 py-2 rounded-md border text-[10px] transition-all flex flex-col gap-0.5 group relative ${selectedTestId === test.id ? 'bg-[#9575cd] border-[#9575cd] text-white shadow-md' : 'bg-white border-slate-200 hover:border-[#b39ddb] hover:bg-purple-50 text-slate-600 shadow-sm'}`}>
                            <div className="flex justify-between items-center w-full"><span className="font-bold truncate w-[90%] leading-tight">{test.name}</span>{selectedTestId !== test.id && <CheckCircle2 size={10} className="text-green-500"/>}</div>
                            <div className={`flex justify-between w-full text-[9px] ${selectedTestId === test.id ? 'text-purple-100' : 'text-slate-400'}`}><span>{test.specimen?.name || '-'}</span><span className="uppercase tracking-tighter opacity-80">{getDeptName(test.department).substring(0, 3)}</span></div>
                        </button>
                    ))}
                 </div>
              </aside>

          </div>
      </div>
    </div>
  );
}
// --- BLOCK app/tests/configuration/page.tsx CLOSE ---