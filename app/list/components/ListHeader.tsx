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
            <header className="bg-white md:rounded-2xl shadow-none md:shadow-sm border-b-0 md:border border-slate-200 pt-1 pb-2 px-0 md:p-4 mb-0 md:mb-4 flex flex-col xl:flex-row xl:items-center justify-between shrink-0 gap-3 md:gap-4 relative z-30 w-full">
                <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-slate-800 leading-none tracking-tight">Patient & Bill List</h1>
                    <p className="text-xs text-slate-500 mt-1">Manage patients, bills, reports, and dues.</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full xl:w-auto">
                    
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

                    <div className="relative w-full md:w-64 shrink-0 order-1 md:order-4">
                        <input 
                            id="searchQuery"
                            name="searchQuery"
                            aria-label="Search by Name or Bill Number"
                            type="text" 
                            placeholder="Search by Name, Bill No..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-6 md:h-10 pl-7 md:pl-10 pr-2 md:pr-4 border border-slate-200 md:border-slate-300 rounded md:rounded-lg text-[11px] md:text-sm font-medium focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] outline-none shadow-sm"
                        />
                        <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 md:w-4 md:h-4"/>
                    </div>

                    <div className="flex flex-row items-center gap-2 w-full md:w-auto order-2 md:order-2">
                        
                        <div className="flex-1 md:hidden z-40 min-w-0">
                            <select 
                                value={activeFilter} 
                                onChange={(e) => setActiveFilter(e.target.value)} 
                                className="w-full h-6 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 px-1.5 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.25rem center', paddingRight: '1.25rem' }}
                            >
                                {filtersList.map((filter: string) => (
                                    <option key={filter} value={filter}>{filter}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 md:flex-none z-40 min-w-0">
                            <DateRangeFilter 
                                onFilterChange={onDateChange} 
                                buttonClassName="w-full md:w-auto flex items-center justify-center md:justify-start gap-1 md:gap-2 px-1.5 md:px-4 h-6 md:h-10 bg-white border border-slate-200 md:border-slate-300 rounded md:rounded-lg shadow-sm hover:bg-slate-50 transition-all group min-w-0 md:min-w-[140px] text-[10px] md:text-sm font-bold"
                            />
                        </div>

                        <div className="relative z-40 shrink-0" ref={filterRef}>
                            <button 
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`flex items-center justify-center gap-1.5 h-6 md:h-10 px-2 md:px-4 rounded md:rounded-lg text-[10px] md:text-sm font-bold transition-all border outline-none shadow-sm shrink-0
                                    ${showAdvancedFilters || activeAdvancedFiltersCount > 0 
                                        ? 'bg-purple-50 text-[#9575cd] border-[#9575cd]' 
                                        : 'bg-white text-slate-600 border-slate-200 md:border-slate-300 hover:bg-slate-50'}`}
                            >
                                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="hidden md:inline">Filter</span>
                                {activeAdvancedFiltersCount > 0 && (
                                    <span className="bg-[#9575cd] text-white text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded-full leading-none flex items-center justify-center">
                                        {activeAdvancedFiltersCount}
                                    </span>
                                )}
                            </button>

                            {showAdvancedFilters && (
                                <div className="absolute right-0 top-full mt-2 w-[240px] md:w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 md:p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <h3 className="text-[10px] md:text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 md:mb-3 border-b border-slate-100 pb-1.5 md:pb-2">Advanced Filters</h3>
                                    
                                    <div className="space-y-2.5 md:space-y-3">
                                        <div className="relative flex flex-col gap-0.5 md:gap-1">
                                            <label htmlFor="testSearch" className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Test Name:</label>
                                            <input 
                                                id="testSearch"
                                                name="testSearch"
                                                type="text" 
                                                placeholder="Search test..."
                                                value={advFilters.testSearch}
                                                onChange={e => { updateAdv('testSearch', e.target.value); setShowTestSuggestions(true); }}
                                                onFocus={() => { if(advFilters.testSearch.length >= 2) setShowTestSuggestions(true); }}
                                                onBlur={() => setTimeout(() => setShowTestSuggestions(false), 200)}
                                                className="h-7 md:h-8 px-2 md:px-3 text-xs md:text-sm border border-slate-300 rounded outline-none focus:border-[#9575cd]"
                                            />
                                            
                                            {showTestSuggestions && advFilters.testSearch.length >= 2 && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-40 overflow-y-auto">
                                                    {isSearchingTests ? (
                                                        <div className="p-1.5 text-[10px] text-slate-500 text-center">Searching...</div>
                                                    ) : testSuggestions.length > 0 ? (
                                                        testSuggestions.map(t => (
                                                            <div key={t.id} onClick={() => { updateAdv('testSearch', t.name); setShowTestSuggestions(false); }} className="px-2 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-[#9575cd] cursor-pointer border-b border-slate-50 last:border-0">
                                                                {t.name} <span className="text-[9px] text-slate-400 ml-1">({t.code})</span>
                                                            </div>
                                                        ))
                                                    ) : <div className="p-1.5 text-[10px] text-slate-500 text-center">No tests found</div>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-0.5 md:gap-1">
                                            <label htmlFor="statusFilter" className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Status:</label>
                                            <select 
                                                id="statusFilter"
                                                name="statusFilter"
                                                value={advFilters.statusFilter} 
                                                onChange={e => updateAdv('statusFilter', e.target.value)} 
                                                className="h-7 md:h-8 px-1.5 md:px-2 text-xs md:text-sm border border-slate-300 rounded outline-none focus:border-[#9575cd] cursor-pointer bg-white"
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Partial">Partial</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-0.5 md:gap-1">
                                            <label htmlFor="refDocFilter" className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">Referral Doctor:</label>
                                            <select 
                                                id="refDocFilter"
                                                name="refDocFilter"
                                                value={advFilters.refDocFilter} 
                                                onChange={e => updateAdv('refDocFilter', e.target.value)} 
                                                className="h-7 md:h-8 px-1.5 md:px-2 text-xs md:text-sm border border-slate-300 rounded outline-none focus:border-[#9575cd] cursor-pointer bg-white"
                                            >
                                                <option value="All">All Doctors</option>
                                                {uniqueDoctors.map((doc: string) => <option key={doc} value={doc}>{doc}</option>)}
                                            </select>
                                        </div>

                                        <label htmlFor="isUrgentFilter" className="flex items-center gap-1.5 md:gap-2 cursor-pointer group bg-red-50 px-2 md:px-3 py-1.5 md:py-2 rounded border border-red-100 hover:border-red-300 transition-all mt-1 md:mt-2">
                                            <input 
                                                id="isUrgentFilter"
                                                name="isUrgentFilter"
                                                type="checkbox" 
                                                checked={advFilters.isUrgentFilter} 
                                                onChange={e => updateAdv('isUrgentFilter', e.target.checked)} 
                                                className="w-3 h-3 md:w-3.5 md:h-3.5 accent-red-500 cursor-pointer" 
                                            />
                                            <span className="text-[10px] md:text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1"><Flame size={12} className="md:w-3.5 md:h-3.5" /> Urgent Tests Only</span>
                                        </label>
                                        
                                        <div className="pt-2 md:pt-3 border-t border-slate-100 mt-2 md:mt-3">
                                            <button onClick={resetAdv} className="w-full py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">Reset Filters</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center justify-center gap-2 h-6 w-8 md:h-10 md:w-auto md:px-3 rounded md:rounded-lg text-[10px] md:text-sm font-bold transition-all border outline-none shadow-sm bg-white text-slate-600 border-slate-200 md:border-slate-300 hover:bg-slate-50 shrink-0"
                            title={sortOrder === 'newest' ? 'Showing Newest First' : 'Showing Oldest First'}
                        >
                            {sortOrder === 'newest' ? <ArrowDown className="text-[#9575cd] w-3.5 h-3.5 md:w-4 md:h-4" /> : <ArrowUp className="text-[#9575cd] w-3.5 h-3.5 md:w-4 md:h-4" />}
                            <span className="hidden md:inline whitespace-nowrap">{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2 shrink-0 z-20 w-full">
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