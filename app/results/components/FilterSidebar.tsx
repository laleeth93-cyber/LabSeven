// --- BLOCK app/results/components/FilterSidebar.tsx OPEN ---
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Search, FlaskConical, Activity, Briefcase, User, Building2, MapPin, Flame, ArrowUpDown, SlidersHorizontal } from 'lucide-react';

interface FilterSidebarProps {
  showFilters: boolean;
  setShowFilters: (val: boolean) => void;
  filters: any;
  setFilters: (val: any) => void;
  clearAllFilters: () => void;
  allTestNames: string[];
}

export default function FilterSidebar({ showFilters, setShowFilters, filters, setFilters, clearAllFilters, allTestNames }: FilterSidebarProps) {
  
  const [testSuggestions, setTestSuggestions] = useState<string[]>([]);
  const [showTestSuggestions, setShowTestSuggestions] = useState(false);
  const testInputRef = useRef<HTMLDivElement>(null);

  const handleTestInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev: any) => ({ ...prev, test: value }));

    if (value.trim().length > 0) {
      const matches = allTestNames.filter((name: string) => 
        name.toLowerCase().includes(value.toLowerCase())
      );
      setTestSuggestions(matches);
      setShowTestSuggestions(true);
    } else {
      setShowTestSuggestions(false);
    }
  };

  const selectTestSuggestion = (name: string) => {
    setFilters((prev: any) => ({ ...prev, test: name }));
    setShowTestSuggestions(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (testInputRef.current && !testInputRef.current.contains(event.target as Node)) {
        setShowTestSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {showFilters && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-50 transition-opacity" onClick={() => setShowFilters(false)}></div>
      )}
      
      <div className={`fixed top-0 right-0 h-full w-[340px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm shrink-0">
           <div className="flex items-center gap-2 text-slate-800">
             <SlidersHorizontal size={16} className="text-[#9575cd]"/>
             <h2 className="font-bold text-base text-slate-800">Filters</h2>
           </div>
           <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors">
             <X size={18} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            
            <div className="space-y-1.5 relative" ref={testInputRef}>
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                 <FlaskConical size={13} className="text-[#9575cd]" /> Test Name / Code
               </label>
               <div className="relative">
                 <input type="text" value={filters.test} onChange={handleTestInputChange} onFocus={() => { if(filters.test) setShowTestSuggestions(true) }} placeholder="Search specific test..." className="w-full h-9 text-xs font-medium border border-slate-300 rounded-md pl-8 pr-3 py-2 focus:ring-1 focus:ring-[#9575cd] outline-none bg-white placeholder:text-slate-400 hover:border-[#b39ddb] transition-colors" />
                 <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                 {filters.test && (
                   <button onClick={() => { updateFilter('test', ''); setShowTestSuggestions(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500">
                     <X size={12} />
                   </button>
                 )}
               </div>
               {showTestSuggestions && testSuggestions.length > 0 && (
                 <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                   {testSuggestions.map((suggestion, index) => (
                     <button key={index} onClick={() => selectTestSuggestion(suggestion)} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#f3e5f5] hover:text-[#7e57c2] transition-colors border-b border-slate-50 last:border-0">
                       {suggestion}
                     </button>
                   ))}
                 </div>
               )}
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide"><Activity size={13} className="text-[#9575cd]" /> Machine Value</label>
               <input type="text" value={filters.machine} onChange={(e) => updateFilter('machine', e.target.value)} placeholder="Enter value..." className="w-full h-9 text-xs font-medium border border-slate-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-[#9575cd] outline-none bg-white placeholder:text-slate-400 hover:border-[#b39ddb] transition-colors" />
            </div>

            <div className="h-px bg-slate-100 my-1"></div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide"><Briefcase size={13} className="text-[#9575cd]" /> B2B Client / Center</label>
               <select value={filters.b2b} onChange={(e) => updateFilter('b2b', e.target.value)} className="w-full h-9 text-xs font-medium border border-slate-300 rounded-md px-2 focus:ring-1 focus:ring-[#9575cd] outline-none bg-white cursor-pointer text-slate-700 hover:border-[#b39ddb] transition-colors">
                 <option value="">Select B2B Center</option>
                 <option value="Apollo B2B">Apollo B2B</option>
                 <option value="MedPlus">MedPlus</option>
                 <option value="Client A">Client A</option>
               </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide"><User size={13} className="text-[#9575cd]" /> Referral Doctor</label>
              <select value={filters.doctor} onChange={(e) => updateFilter('doctor', e.target.value)} className="w-full h-9 text-xs font-medium border border-slate-300 rounded-md px-2 focus:ring-1 focus:ring-[#9575cd] outline-none bg-white cursor-pointer text-slate-700 hover:border-[#b39ddb] transition-colors">
                 <option value="">Select Doctor</option>
                 <option value="Self">Self</option>
                 <option value="Dr. Smith">Dr. Smith</option>
                 <option value="Dr. Rajesh">Dr. Rajesh</option>
              </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide"><Building2 size={13} className="text-[#9575cd]" /> Referral Hospital</label>
               <select value={filters.hospital} onChange={(e) => updateFilter('hospital', e.target.value)} className="w-full h-9 text-xs font-medium border border-slate-300 rounded-md px-2 focus:ring-1 focus:ring-[#9575cd] outline-none bg-white cursor-pointer text-slate-700 hover:border-[#b39ddb] transition-colors">
                 <option value="">Select Hospital</option>
                 <option value="City Hospital">City Hospital</option>
                 <option value="General Hospital">General Hospital</option>
               </select>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide"><MapPin size={13} className="text-[#9575cd]" /> Collection Centre</label>
               <select value={filters.centre} onChange={(e) => updateFilter('centre', e.target.value)} className="w-full h-9 text-xs font-medium border border-slate-300 rounded-md px-2 focus:ring-1 focus:ring-[#9575cd] outline-none bg-white cursor-pointer text-slate-700 hover:border-[#b39ddb] transition-colors">
                 <option value="">Select Centre</option>
                 <option value="Main Branch">Main Branch</option>
                 <option value="North Wing">North Wing</option>
               </select>
            </div>

            <div className="h-px bg-slate-100 my-1"></div>

            <div className={`border rounded-md p-2.5 transition-colors ${filters.urgent ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
               <label className="flex items-center gap-3 cursor-pointer select-none">
                 <div className="relative flex items-center">
                    <input type="checkbox" checked={filters.urgent} onChange={(e) => updateFilter('urgent', e.target.checked)} className="peer w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                 </div>
                 <div className="flex items-center gap-2 text-red-700">
                    <Flame size={14} className={filters.urgent ? "fill-red-500" : "text-slate-400"} />
                    <span className={`text-xs font-bold uppercase tracking-wide ${filters.urgent ? 'text-red-700' : 'text-slate-500'}`}>Urgent / STAT Only</span>
                 </div>
               </label>
            </div>

            <div className="space-y-1.5">
               <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide"><ArrowUpDown size={13} className="text-[#9575cd]" /> Sort by Bill ID</label>
               <div className="flex bg-slate-100 rounded-md p-1 gap-1">
                 <button onClick={() => updateFilter('sortOrder', 'asc')} className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all flex items-center justify-center gap-1 ${filters.sortOrder === 'asc' ? 'bg-white shadow-sm text-[#9575cd] ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>Ascending</button>
                 <button onClick={() => updateFilter('sortOrder', 'desc')} className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-all flex items-center justify-center gap-1 ${filters.sortOrder === 'desc' ? 'bg-white shadow-sm text-[#9575cd] ring-1 ring-purple-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>Descending</button>
               </div>
            </div>

        </div>

        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
            <button onClick={clearAllFilters} className="flex-1 py-2 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-md shadow-sm hover:bg-slate-50 hover:text-slate-800 hover:border-slate-400 transition-all text-xs">Reset</button>
            <button onClick={() => setShowFilters(false)} className="flex-1 py-2 px-4 bg-[#9575cd] text-white font-bold rounded-md shadow-md shadow-purple-200 hover:bg-[#7e57c2] hover:shadow-lg transition-all text-xs transform active:scale-95">Apply Filters</button>
        </div>

      </div>
    </>
  );
}
// --- BLOCK app/results/components/FilterSidebar.tsx CLOSE ---