// --- BLOCK app/list/components/ListHeader.tsx OPEN ---
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Flame, LayoutList, LayoutGrid, ArrowDown, ArrowUp } from 'lucide-react';
import DateRangeFilter from '@/app/results/entry/components/DateRangeFilter';
import { searchMasterTests } from '@/app/actions/patient-list';

export default function ListHeader({
    searchQuery, setSearchQuery, onDateChange,
    activeFilter, setActiveFilter, filtersList,
    advFilters, setAdvFilters, uniqueDoctors,
    viewMode, setViewMode,
    sortOrder, setSortOrder
}: any) {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [testSuggestions, setTestSuggestions] = useState<any[]>([]);
    const [showTestSuggestions, setShowTestSuggestions] = useState(false);
    const [isSearchingTests, setIsSearchingTests] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    let activeAdvancedFiltersCount = 0;
    if (advFilters.testSearch.trim() !== '') activeAdvancedFiltersCount++;
    if (advFilters.statusFilter !== 'All') activeAdvancedFiltersCount++;
    if (advFilters.refDocFilter !== 'All') activeAdvancedFiltersCount++;
    if (advFilters.isUrgentFilter) activeAdvancedFiltersCount++;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowAdvancedFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (advFilters.testSearch.length >= 2 && showTestSuggestions) {
                setIsSearchingTests(true);
                const results = await searchMasterTests(advFilters.testSearch);
                setTestSuggestions(results);
                setIsSearchingTests(false);
            } else {
                setTestSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [advFilters.testSearch, showTestSuggestions]);

    const updateAdv = (key: string, val: any) => setAdvFilters({ ...advFilters, [key]: val });
    const resetAdv = () => {
        setAdvFilters({ testSearch: '', statusFilter: 'All', refDocFilter: 'All', isUrgentFilter: false });
        setShowAdvancedFilters(false);
    };

    return (
        <>
            <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-col xl:flex-row xl:items-center justify-between shrink-0 gap-4 relative z-30 w-full">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-none tracking-tight">Patient & Bill List</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage patients, bills, reports, and dues.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
                    
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#9575cd]' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <LayoutList size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#9575cd]' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center justify-center md:justify-start gap-2 h-10 px-3 rounded-lg text-sm font-bold transition-all border outline-none shadow-sm bg-white text-slate-600 border-slate-300 hover:bg-slate-50 w-full md:w-auto shrink-0"
                        title={sortOrder === 'newest' ? 'Showing Newest First' : 'Showing Oldest First'}
                    >
                        {sortOrder === 'newest' ? <ArrowDown size={16} className="text-[#9575cd]" /> : <ArrowUp size={16} className="text-[#9575cd]" />}
                        <span className="inline whitespace-nowrap">{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                    </button>

                    <div className="flex-shrink-0 z-40 w-full md:w-auto">
                        <DateRangeFilter 
                            onFilterChange={onDateChange} 
                            buttonClassName="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 px-3 md:px-4 h-10 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-all group min-w-[140px]"
                        />
                    </div>

                    <div className="relative z-40 w-full md:w-auto" ref={filterRef}>
                        <button 
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex w-full md:w-auto items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-bold transition-all border outline-none shadow-sm shrink-0
                                ${showAdvancedFilters || activeAdvancedFiltersCount > 0 
                                    ? 'bg-purple-50 text-[#9575cd] border-[#9575cd]' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                            {activeAdvancedFiltersCount > 0 && (
                                <span className="bg-[#9575cd] text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none flex items-center justify-center">
                                    {activeAdvancedFiltersCount}
                                </span>
                            )}
                        </button>

                        {showAdvancedFilters && (
                            <div className="absolute right-0 top-full mt-2 w-full md:w-72 min-w-[280px] bg-white rounded-xl shadow-xl border border-slate-200 p-5 animate-in fade-in zoom-in-95 duration-200">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Advanced Filters</h3>
                                
                                <div className="space-y-4">
                                    <div className="relative flex flex-col gap-1">
                                        <label htmlFor="testSearch" className="text-[10px] font-bold text-slate-500 uppercase">Test Name:</label>
                                        <input 
                                            id="testSearch"
                                            name="testSearch"
                                            type="text" 
                                            placeholder="Search test..."
                                            value={advFilters.testSearch}
                                            onChange={e => { updateAdv('testSearch', e.target.value); setShowTestSuggestions(true); }}
                                            onFocus={() => { if(advFilters.testSearch.length >= 2) setShowTestSuggestions(true); }}
                                            onBlur={() => setTimeout(() => setShowTestSuggestions(false), 200)}
                                            className="h-9 px-3 text-sm border border-slate-300 rounded outline-none focus:border-[#9575cd]"
                                        />
                                        
                                        {showTestSuggestions && advFilters.testSearch.length >= 2 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                                {isSearchingTests ? (
                                                    <div className="p-2 text-xs text-slate-500 text-center">Searching...</div>
                                                ) : testSuggestions.length > 0 ? (
                                                    testSuggestions.map(t => (
                                                        <div key={t.id} onClick={() => { updateAdv('testSearch', t.name); setShowTestSuggestions(false); }} className="px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-[#9575cd] cursor-pointer border-b border-slate-50 last:border-0">
                                                            {t.name} <span className="text-[10px] text-slate-400 ml-1">({t.code})</span>
                                                        </div>
                                                    ))
                                                ) : <div className="p-2 text-xs text-slate-500 text-center">No tests found</div>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="statusFilter" className="text-[10px] font-bold text-slate-500 uppercase">Status:</label>
                                        <select 
                                            id="statusFilter"
                                            name="statusFilter"
                                            value={advFilters.statusFilter} 
                                            onChange={e => updateAdv('statusFilter', e.target.value)} 
                                            className="h-9 px-2 text-sm border border-slate-300 rounded outline-none focus:border-[#9575cd] cursor-pointer bg-white"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Partial">Partial</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label htmlFor="refDocFilter" className="text-[10px] font-bold text-slate-500 uppercase">Referral Doctor:</label>
                                        <select 
                                            id="refDocFilter"
                                            name="refDocFilter"
                                            value={advFilters.refDocFilter} 
                                            onChange={e => updateAdv('refDocFilter', e.target.value)} 
                                            className="h-9 px-2 text-sm border border-slate-300 rounded outline-none focus:border-[#9575cd] cursor-pointer bg-white"
                                        >
                                            <option value="All">All Doctors</option>
                                            {uniqueDoctors.map((doc: string) => <option key={doc} value={doc}>{doc}</option>)}
                                        </select>
                                    </div>

                                    <label htmlFor="isUrgentFilter" className="flex items-center gap-2 cursor-pointer group bg-red-50 px-3 py-2.5 rounded-lg border border-red-100 hover:border-red-300 transition-all mt-2">
                                        <input 
                                            id="isUrgentFilter"
                                            name="isUrgentFilter"
                                            type="checkbox" 
                                            checked={advFilters.isUrgentFilter} 
                                            onChange={e => updateAdv('isUrgentFilter', e.target.checked)} 
                                            className="w-4 h-4 accent-red-500 cursor-pointer" 
                                        />
                                        <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1"><Flame size={14} /> Urgent Tests Only</span>
                                    </label>
                                    
                                    <div className="pt-3 border-t border-slate-100 mt-4">
                                        <button onClick={resetAdv} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">Reset Filters</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full md:w-64 shrink-0 mt-1 md:mt-0">
                        <input 
                            id="searchQuery"
                            name="searchQuery"
                            aria-label="Search by Name or Bill Number"
                            type="text" 
                            placeholder="Search by Name, Bill No..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] outline-none shadow-sm"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    </div>
                </div>
            </header>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 shrink-0 z-20 w-full">
                {filtersList.map((filter: string) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shadow-sm ${
                            activeFilter === filter 
                            ? 'bg-[#9575cd] text-white border border-[#9575cd]' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-[#9575cd]'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
        </>
    );
}
// --- BLOCK app/list/components/ListHeader.tsx CLOSE ---