"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Flame, LayoutList, LayoutGrid, ArrowDown, ArrowUp, Users } from 'lucide-react';
import DateRangeFilter from '@/app/results/entry/components/DateRangeFilter';
import { searchMasterTests } from '@/app/actions/patient-list';

export default function ListHeader({
    searchQuery, setSearchQuery, onDateChange,
    activeFilter, setActiveFilter, filtersList,
    filterCounts,
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
        <div className="shrink-0 z-20 w-full">
            {/* UNIFIED DESKTOP HEADER BAR: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
            <div className="hidden md:flex px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                {/* Left: 20px Title */}
                <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                    <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-sm"><Users size={16} /></div>
                    <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Patient List
                    </h2>
                </div>

                {/* Right Controls in exact order: 1. Tabs -> 2. Search -> 3. Adv Filter & Sort -> 4. Date Range -> 5. View Mode */}
                <div className="flex items-center gap-1.5 xl:gap-2 flex-1 justify-end min-w-0">
                    {/* 1. Filter Tabs */}
                    <div className="flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                        {filtersList.map((filter: string) => {
                            const count = filterCounts ? filterCounts[filter] : undefined;
                            let color = 'bg-slate-600';
                            if (filter === 'Pending') color = 'bg-amber-500';
                            else if (filter === 'Partial') color = 'bg-blue-500';
                            else if (filter === 'Completed') color = 'bg-green-600';
                            else if (filter === 'Printed') color = 'bg-indigo-600';
                            return (
                                <button 
                                    key={filter} 
                                    onClick={() => setActiveFilter(filter)} 
                                    className={`h-full whitespace-nowrap px-1.5 xl:px-2 rounded text-[11px] font-normal transition-all flex items-center gap-1 xl:gap-1.5 leading-none ${activeFilter === filter ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <span>{filter}</span>
                                    {count !== undefined && (
                                        <span className={`px-1 xl:px-1.5 py-0.5 rounded-full text-[9px] font-medium text-white ${color}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* 2. Patient Search Bar */}
                    <div className="relative w-36 lg:w-44 xl:w-52 min-w-[110px] shrink-0">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            id="searchQuery"
                            name="searchQuery"
                            aria-label="Search by Name or Bill Number"
                            type="text" 
                            placeholder="Search patient / bill..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 rounded-[5px] border border-slate-300 text-[11px] xl:text-[12px] font-normal text-slate-800 placeholder:text-[11px] xl:placeholder:text-[12px] placeholder:text-slate-400 bg-white focus:outline-none focus:border-[#9575cd] transition-all" 
                        />
                    </div>

                    {/* 3. Advanced Filter Button with Dropdown */}
                    <div className="relative shrink-0" ref={filterRef}>
                        <button 
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex items-center justify-center gap-1.5 h-[24px] xl:h-[26px] px-2 xl:px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-normal transition-all border outline-none shadow-sm shrink-0
                                ${showAdvancedFilters || activeAdvancedFiltersCount > 0 
                                    ? 'bg-purple-50 text-[#9575cd] border-[#9575cd]' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                            title="Advanced Filters"
                        >
                            <Filter size={12} className="shrink-0" />
                            <span className="hidden lg:inline leading-none">Filter</span>
                            {activeAdvancedFiltersCount > 0 && (
                                <span className="bg-[#9575cd] text-white text-[9px] px-1 py-0.5 rounded-full leading-none flex items-center justify-center font-bold">
                                    {activeAdvancedFiltersCount}
                                </span>
                            )}
                        </button>

                        {showAdvancedFilters && (
                            <div className="absolute right-0 top-full mt-1.5 w-[250px] bg-white rounded-lg shadow-xl border border-slate-200 p-3 animate-in fade-in zoom-in-95 duration-150 origin-top-right z-50">
                                <h3 className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5">Advanced Filters</h3>
                                
                                <div className="space-y-2 text-[11px]">
                                    <div className="relative flex flex-col gap-0.5">
                                        <label htmlFor="testSearch" className="text-[10px] font-medium text-slate-500 uppercase">Test Name:</label>
                                        <input 
                                            id="testSearch"
                                            name="testSearch"
                                            type="text" 
                                            placeholder="Search test..."
                                            value={advFilters.testSearch}
                                            onChange={e => { updateAdv('testSearch', e.target.value); setShowTestSuggestions(true); }}
                                            onFocus={() => { if(advFilters.testSearch.length >= 2) setShowTestSuggestions(true); }}
                                            onBlur={() => setTimeout(() => setShowTestSuggestions(false), 200)}
                                            className="h-[24px] px-2 text-[11px] border border-slate-300 rounded outline-none focus:border-[#9575cd]"
                                        />
                                        
                                        {showTestSuggestions && advFilters.testSearch.length >= 2 && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
                                                {isSearchingTests ? (
                                                    <div className="p-1.5 text-[10px] text-slate-500 text-center">Searching...</div>
                                                ) : testSuggestions.length > 0 ? (
                                                    testSuggestions.map(t => (
                                                        <div key={t.id} onClick={() => { updateAdv('testSearch', t.name); setShowTestSuggestions(false); }} className="px-2 py-1 text-[11px] text-slate-700 hover:bg-purple-50 hover:text-[#9575cd] cursor-pointer border-b border-slate-50 last:border-0">
                                                            {t.name} <span className="text-[9px] text-slate-400 ml-1">({t.code})</span>
                                                        </div>
                                                    ))
                                                ) : <div className="p-1.5 text-[10px] text-slate-500 text-center">No tests found</div>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-0.5">
                                        <label htmlFor="statusFilter" className="text-[10px] font-medium text-slate-500 uppercase">Status:</label>
                                        <select 
                                            id="statusFilter"
                                            name="statusFilter"
                                            value={advFilters.statusFilter} 
                                            onChange={e => updateAdv('statusFilter', e.target.value)} 
                                            className="h-[24px] px-1.5 text-[11px] border border-slate-300 rounded outline-none focus:border-[#9575cd] cursor-pointer bg-white"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Partial">Partial</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-0.5">
                                        <label htmlFor="refDocFilter" className="text-[10px] font-medium text-slate-500 uppercase">Referral Doctor:</label>
                                        <select 
                                            id="refDocFilter"
                                            name="refDocFilter"
                                            value={advFilters.refDocFilter} 
                                            onChange={e => updateAdv('refDocFilter', e.target.value)} 
                                            className="h-[24px] px-1.5 text-[11px] border border-slate-300 rounded outline-none focus:border-[#9575cd] cursor-pointer bg-white"
                                        >
                                            <option value="All">All Doctors</option>
                                            {uniqueDoctors.map((doc: string) => <option key={doc} value={doc}>{doc}</option>)}
                                        </select>
                                    </div>

                                    <label htmlFor="isUrgentFilter" className="flex items-center gap-1.5 cursor-pointer group bg-red-50 px-2 py-1 rounded border border-red-100 hover:border-red-200 transition-all mt-1">
                                        <input 
                                            id="isUrgentFilter"
                                            name="isUrgentFilter"
                                            type="checkbox" 
                                            checked={advFilters.isUrgentFilter} 
                                            onChange={e => updateAdv('isUrgentFilter', e.target.checked)} 
                                            className="w-3 h-3 accent-red-500 cursor-pointer" 
                                        />
                                        <span className="text-[10px] font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1"><Flame size={11} /> Urgent Tests Only</span>
                                    </label>
                                    
                                    <div className="pt-1.5 border-t border-slate-100 mt-2">
                                        <button onClick={resetAdv} className="w-full py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors">Reset Filters</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Sort Order Button */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center justify-center gap-1 h-[24px] xl:h-[26px] px-2 xl:px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-normal transition-all border outline-none shadow-sm bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shrink-0"
                        title={sortOrder === 'newest' ? 'Showing Newest First' : 'Showing Oldest First'}
                    >
                        {sortOrder === 'newest' ? <ArrowDown size={12} className="text-[#9575cd]" /> : <ArrowUp size={12} className="text-[#9575cd]" />}
                        <span className="hidden lg:inline leading-none whitespace-nowrap">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                    </button>

                    {/* 5. Date Range Filter */}
                    <DateRangeFilter 
                        align="end" 
                        onFilterChange={onDateChange} 
                        buttonClassName="flex items-center justify-between gap-1.5 px-2 xl:px-2.5 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 transition-all h-[24px] xl:h-[26px] group min-w-[110px] xl:min-w-[125px] text-[11px] xl:text-[12px] font-normal text-slate-700 whitespace-nowrap"
                    />

                    {/* 6. View Mode Toggle (List / Grid) */}
                    <div className="flex bg-slate-100 p-0.5 rounded-[5px] border border-slate-200 shrink-0 h-[24px] xl:h-[26px] items-center gap-0.5">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`h-full px-1.5 rounded transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white shadow-sm text-[#9575cd]' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <LayoutList size={13} />
                        </button>
                        <button 
                            onClick={() => setViewMode('grid')} 
                            className={`h-full px-1.5 rounded transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#9575cd]' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={13} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE HEADER (md:hidden) */}
            <div className="md:hidden flex flex-col gap-1.5 px-3 py-2 shrink-0 z-20 bg-white border-b border-slate-200">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd]"><Users size={14} /></div>
                        <h2 className="text-[16px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Patient List
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                            className="p-1 border border-slate-200 rounded text-slate-600"
                        >
                            {viewMode === 'list' ? <LayoutGrid size={13} /> : <LayoutList size={13} />}
                        </button>
                        <button 
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`p-1 border rounded ${showAdvancedFilters ? 'bg-purple-50 text-[#9575cd] border-[#9575cd]' : 'border-slate-200 text-slate-600'}`}
                        >
                            <Filter size={13} />
                        </button>
                    </div>
                </div>

                <div className="relative w-full">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search patient..." 
                        className="w-full pl-7 pr-2 h-[26px] bg-white border border-slate-200 rounded text-[11px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all" 
                    />
                </div>

                <div className="flex items-center gap-1.5 w-full">
                    <div className="flex-1">
                        <select 
                            value={activeFilter} 
                            onChange={(e) => setActiveFilter(e.target.value)} 
                            className="w-full h-[26px] bg-white border border-slate-200 rounded text-[10px] font-normal text-slate-700 px-1.5 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.25rem center', paddingRight: '1.25rem' }}
                        >
                            {filtersList.map((f: string) => (
                                <option key={f} value={f}>
                                    {f} {filterCounts && filterCounts[f] !== undefined ? `(${filterCounts[f]})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <DateRangeFilter onFilterChange={onDateChange} align="end" buttonClassName="w-full h-[26px] bg-white hover:bg-slate-50 border border-slate-200 rounded text-[10px] font-normal text-slate-700 px-1.5 flex justify-between items-center transition-colors shadow-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}
