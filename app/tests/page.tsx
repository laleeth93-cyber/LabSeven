// --- BLOCK app/tests/page.tsx OPEN ---
"use client";

import React, { useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation'; 
import { Plus, Trash2, Search, Filter, Loader2, FileText, FlaskConical, Edit, ChevronDown, LayoutGrid, Archive, MoreHorizontal, Settings, Beaker, CheckCircle2, Network, Microscope, AlertTriangle, CheckCircle } from 'lucide-react';
import { getTests, deleteTest, toggleTestStatus } from '@/app/actions/tests';

// Import other page components
import ParametersListPage from '../parameters/page';
import TestConfigurationPage from './configuration/page';
import TestFormatsPage from './formats/page';
import PackagesPage from '../packages/page';
import DepartmentPage from '../department/page'; 

export default function TestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Department');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam) {
        if (tabParam === 'Test Library') setActiveTab('Test Library');
        else if (tabParam === 'Configuration') setActiveTab('Configuration');
        else if (tabParam === 'Formats') setActiveTab('Formats');
        else if (tabParam === 'Packages') setActiveTab('Packages');
        else if (tabParam === 'Parameters') setActiveTab('Parameters');
        else setActiveTab('Department');
    } else {
        setActiveTab('Department');
    }
  }, [tabParam]);

  const tabs = [
    { label: 'Department', icon: <Network size={14}/>, color: 'bg-teal-500' },
    { label: 'Test Library', icon: <FlaskConical size={14}/>, color: 'bg-blue-500' },
    { label: 'Configuration', icon: <Beaker size={14}/>, color: 'bg-amber-500' },
    { label: 'Formats', icon: <CheckCircle2 size={14}/>, color: 'bg-green-500' },
    { label: 'Parameters', icon: <Settings size={14}/>, color: 'bg-purple-500' },
    { label: 'Packages', icon: <Archive size={14}/>, color: 'bg-indigo-500' },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-[#f1f5f9] font-sans">
      <div className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm px-6 pt-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button 
                    key={tab.label}
                    onClick={() => {
                        setActiveTab(tab.label);
                        router.replace(`/tests?tab=${tab.label}`, { scroll: false });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                        activeTab === tab.label ? 'border-[#9575cd] text-[#9575cd] bg-purple-50/50 rounded-t-md' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-md'
                    }`}
                >
                    {tab.icon}{tab.label}
                </button>
            ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
          {activeTab === 'Department' && <div className="h-full overflow-hidden"><DepartmentPage /></div>}
          {activeTab === 'Test Library' && <TestsLibraryView initialType="All" />}
          {activeTab === 'Configuration' && <div className="h-full overflow-hidden"><TestConfigurationPage /></div>}
          {activeTab === 'Formats' && <div className="h-full overflow-hidden"><TestFormatsPage /></div>}
          {activeTab === 'Parameters' && <div className="h-full overflow-hidden"><ParametersListPage /></div>}
          {activeTab === 'Packages' && <div className="h-full overflow-hidden"><PackagesPage /></div>}
      </div>
    </div>
  );
}

function TestsLibraryView({ initialType = 'All' }: { initialType?: string }) {
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterType, setFilterType] = useState(initialType); 
  const [filterStatus, setFilterStatus] = useState('All'); 

  const [isPending, startTransition] = useTransition();
  const filterRef = useRef<HTMLDivElement>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => { loadTests(); }, []);
  useEffect(() => { setFilterType(initialType); }, [initialType]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setShowFilters(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    const res = await getTests();
    if (res.success) setTests(res.data || []);
    setIsLoading(false);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    
    startTransition(async () => {
      await deleteTest(deleteConfirmId);
      setDeleteConfirmId(null);
      
      setSuccessMessage("Deleted Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => { setShowSuccessPopup(false); loadTests(); }, 1500);
    });
  };

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    setTests(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
    
    startTransition(async () => {
      await toggleTestStatus(id, currentStatus);
      
      setSuccessMessage(!currentStatus ? "Enabled Successfully!" : "Disabled Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 1500);
    });
  };

  const stats = {
    total: tests.length,
    test: tests.filter(t => t.type === 'Test').length,
    package: tests.filter(t => t.type === 'Package').length,
    other: tests.filter(t => t.type === 'Other').length,
    outsource: tests.filter(t => t.isOutsourced === true).length
  };

  const filteredTests = tests.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase())) || (t.displayName && t.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    let matchesDept = true;
    if (filterDepartment !== 'All') { const deptName = t.department?.name || t.department || ''; matchesDept = deptName === filterDepartment; }
    let matchesType = true;
    if (filterType === 'Outsource') matchesType = t.isOutsourced === true; else if (filterType !== 'All') matchesType = t.type === filterType;
    let matchesStatus = true;
    if (filterStatus === 'Active') matchesStatus = t.isActive === true;
    if (filterStatus === 'Inactive') matchesStatus = t.isActive === false;
    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  const activeFilterCount = (filterDepartment !== 'All' ? 1 : 0) + (filterType !== 'All' ? 1 : 0) + (filterStatus !== 'All' ? 1 : 0);

  const colWidths = { code: "w-24", name: "flex-1 min-w-[150px]", display: "flex-1 min-w-[150px]", dept: "w-32", price: "w-24", type: "w-24", status: "w-20", action: "w-20" };

  return (
    <div className="flex flex-col w-full h-full p-6 relative">
      <div className="mb-6 shrink-0">
         <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-slate-800">
                 {initialType === 'Package' ? <Archive className="text-[#9575cd]" size={24}/> : <FlaskConical className="text-[#9575cd]" size={24}/>}
                 <h1 className="text-xl font-bold tracking-tight">{initialType === 'Package' ? 'Packages Library' : 'Tests Overview'}</h1>
             </div>
             <Link href="/tests/add"><button className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"><Plus size={16} /> ADD NEW TEST</button></Link>
         </div>

         {initialType !== 'Package' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="Total Tests" count={stats.total} icon={<LayoutGrid size={18} />} color="text-slate-600" bg="bg-white" border="border-slate-200" isActive={filterType === 'All'} onClick={() => setFilterType('All')} />
                <StatCard label="Tests" count={stats.test} icon={<FlaskConical size={18} />} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" isActive={filterType === 'Test'} onClick={() => setFilterType('Test')} />
                <StatCard label="Packages" count={stats.package} icon={<Archive size={18} />} color="text-purple-600" bg="bg-purple-50" border="border-purple-100" isActive={filterType === 'Package'} onClick={() => setFilterType('Package')} />
                <StatCard label="Others" count={stats.other} icon={<MoreHorizontal size={18} />} color="text-orange-600" bg="bg-orange-50" border="border-orange-100" isActive={filterType === 'Other'} onClick={() => setFilterType('Other')} />
                <StatCard label="Outsourced" count={stats.outsource} icon={<Microscope size={18} />} color="text-teal-600" bg="bg-teal-50" border="border-teal-100" isActive={filterType === 'Outsource'} onClick={() => setFilterType('Outsource')} />
            </div>
         )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden w-full h-full">
          <div className="px-6 py-4 flex items-center gap-4 shrink-0 bg-white border-b border-slate-50">
              <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] outline-none" />
              </div>
              <div className="relative" ref={filterRef}>
                  <button onClick={() => setShowFilters(!showFilters)} className={`h-10 px-4 border rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${showFilters || activeFilterCount > 0 ? 'bg-purple-50 border-[#9575cd] text-[#9575cd]' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <Filter size={14}/> FILTER {activeFilterCount > 0 && <span className="bg-[#9575cd] text-white text-[9px] px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
                      <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}/>
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                         <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Status</label>
                            <div className="space-y-1">
                                {['All', 'Active', 'Inactive'].map(s => (
                                    <label key={s} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                        <input type="radio" checked={filterStatus === s} onChange={() => setFilterStatus(s)} className="accent-[#9575cd]" />
                                        <span className="text-sm text-slate-700">{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                            <button onClick={() => { setFilterDepartment('All'); setFilterType(initialType); setFilterStatus('All'); setShowFilters(false); }} className="w-full py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded">Reset</button>
                        </div>
                    </div>
                  )}
              </div>
          </div>

          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 shrink-0 gap-4">
              <div className={`${colWidths.code} text-[10px] font-bold text-slate-500 uppercase`}>Code</div>
              <div className={`${colWidths.name} text-[10px] font-bold text-slate-500 uppercase`}>Test Name</div>
              <div className={`${colWidths.display} text-[10px] font-bold text-slate-500 uppercase`}>Display Name</div>
              <div className={`${colWidths.dept} text-[10px] font-bold text-slate-500 uppercase`}>Department</div>
              <div className={`${colWidths.price} text-[10px] font-bold text-slate-500 uppercase`}>Price</div>
              <div className={`${colWidths.type} text-center text-[10px] font-bold text-slate-500 uppercase`}>Type</div>
              <div className={`${colWidths.status} text-center text-[10px] font-bold text-slate-500 uppercase`}>Status</div>
              <div className={`${colWidths.action} text-center text-[10px] font-bold text-slate-500 uppercase`}>Action</div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-[#9575cd]" size={24} /></div>
              ) : filteredTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400"><FileText size={48} className="mb-2 opacity-20"/><p className="text-sm">No items found.</p></div>
              ) : (
                  filteredTests.map((test) => (
                      <div key={test.id} className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group gap-4">
                          <div className={`${colWidths.code} text-xs font-semibold text-slate-700 font-mono truncate`}>{test.code}</div>
                          <div className={`${colWidths.name} text-sm font-medium text-slate-800 truncate`}>{test.name}</div>
                          <div className={`${colWidths.display} text-xs text-slate-500 truncate`}>{test.displayName || '-'}</div>
                          <div className={`${colWidths.dept} text-xs text-slate-600 font-medium truncate`}>{test.department?.name || test.department || '-'}</div>
                          <div className={`${colWidths.price} text-xs font-bold text-slate-700`}>{Number(test.price)?.toFixed(2)}</div>
                          <div className={`${colWidths.type} flex justify-center`}><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${test.type === 'Package' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{test.type || 'Test'}</span></div>
                          <div className={`${colWidths.status} flex justify-center`}><button onClick={() => handleToggleStatus(test.id, test.isActive)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${test.isActive ? 'bg-green-500' : 'bg-slate-300'}`}><span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${test.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div>
                          <div className={`${colWidths.action} flex justify-center items-center gap-2`}>
                              <Link href={`/tests/edit/${test.id}`}><button className="p-1.5 hover:bg-purple-50 rounded text-slate-400 hover:text-[#9575cd]"><Edit size={14} /></button></Link>
                              <button onClick={() => handleDeleteClick(test.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>

      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Test?</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this test? This action cannot be undone.</p>
            <div className="flex gap-3">
               <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                 {isPending ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, count, icon, color, bg, border, isActive, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full text-left transition-all duration-200 ${bg} border ${border} ${isActive ? 'shadow-md opacity-100' : 'shadow-none hover:shadow-sm opacity-60 hover:opacity-100'} rounded-lg p-4 flex items-center justify-between cursor-pointer active:scale-[0.98]`}>
        <div><p className={`text-[11px] font-bold uppercase ${color} opacity-80 mb-1`}>{label}</p><p className={`text-2xl font-black ${color}`}>{count}</p></div>
        <div className={`p-3 rounded-full bg-white bg-opacity-60 ${color}`}>{icon}</div>
    </button>
  );
}
// --- BLOCK app/tests/page.tsx CLOSE ---