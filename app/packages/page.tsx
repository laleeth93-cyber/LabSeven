// --- BLOCK app/packages/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Package, Search, Settings, Settings2, Loader2, Archive, LayoutGrid, List, Lock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPackages } from '@/app/actions/packages';
import PackageCartModal from './components/PackageCartModal';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 
import { usePermissions } from '@/app/context/PermissionContext';

export default function PackagesPage() {
    const { orgId, permissions, userRole, permsLoaded } = usePermissions();

    const [packages, setPackages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);

    // Mobile States
    const [mobileStatusFilter, setMobileStatusFilter] = useState<'All' | 'Configured' | 'Empty'>('All');
    const [mobileDeptFilter, setMobileDeptFilter] = useState('All');
    const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
    const [isGoToPopupOpen, setIsGoToPopupOpen] = useState(false);
    const goToRef = useRef<HTMLDivElement>(null);
    const ITEMS_PER_PAGE = 10;

    const canPerform = (action: string) => {
        if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
        if (permissions.length === 0) return true; 
        return permissions.some(p => p.module === 'Packages' && p.action === action);
    };

    // 🚨 FIXED: Bulletproof loading state
    const loadPackages = async () => {
        setIsLoading(true);
        try {
            const res = await getPackages();
            if (res && res.success && res.data) {
                setPackages(res.data);
            } else {
                setPackages([]);
            }
        } catch (error) {
            console.error("Vercel Timeout or Database Error:", error);
            setPackages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPackages();
    }, []);

    useEffect(() => {
        setMobileCurrentPage(1);
    }, [searchQuery, mobileStatusFilter, mobileDeptFilter]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (goToRef.current && !goToRef.current.contains(event.target as Node)) {
                setIsGoToPopupOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredPackages = packages.filter(pkg => 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        pkg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.department?.name && pkg.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Departments for mobile filter
    const uniqueDepartments = useMemo(() => {
        const depts = new Set<string>();
        packages.forEach(pkg => {
            if (pkg.department?.name) depts.add(pkg.department.name);
        });
        return Array.from(depts).sort();
    }, [packages]);

    // Mobile filtered & paginated packages
    const mobileFilteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || 
                pkg.name?.toLowerCase().includes(q) || 
                pkg.code?.toLowerCase().includes(q) || 
                (pkg.department?.name && pkg.department.name.toLowerCase().includes(q));

            const testCount = pkg.packageTests?.length || 0;
            let matchesStatus = true;
            if (mobileStatusFilter === 'Configured') matchesStatus = testCount > 0;
            if (mobileStatusFilter === 'Empty') matchesStatus = testCount === 0;

            let matchesDept = true;
            if (mobileDeptFilter !== 'All') {
                matchesDept = pkg.department?.name === mobileDeptFilter;
            }

            return matchesSearch && matchesStatus && matchesDept;
        });
    }, [packages, searchQuery, mobileStatusFilter, mobileDeptFilter]);

    const mobileTotalPages = Math.ceil(mobileFilteredPackages.length / ITEMS_PER_PAGE);
    const mobileStartIndex = (mobileCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedMobilePackages = mobileFilteredPackages.slice(mobileStartIndex, mobileStartIndex + ITEMS_PER_PAGE);

    const handleOpenModal = (pkg: any) => {
        setSelectedPackage(pkg);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#f1f5f9] font-sans overflow-hidden relative">
            
            {/* --- DESKTOP LAYOUT (100% UNTOUCHED) --- */}
            <div className="hidden md:flex flex-col h-full w-full p-4 md:p-6 overflow-hidden">
                <header className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Archive size={24}/></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-none tracking-tight">Laboratory Packages</h1>
                            <p className="text-xs text-slate-500 mt-1">Configure which existing tests belong to each package.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 md:w-72">
                            <input 
                                type="text" 
                                placeholder="Search packages..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm"
                            />
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 overflow-hidden flex flex-col ${viewMode === 'list' ? 'bg-white rounded-2xl shadow-sm border border-slate-200' : ''}`}>
                    <div className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'grid' ? 'pr-2' : ''}`}>
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <MusicBarLoader text="Loading Packages..." color="#6366f1" />
                            </div>
                        ) : filteredPackages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                                <Archive size={48} className="opacity-20 mb-2"/>
                                <p className="text-sm font-medium text-slate-600">No packages found.</p>
                                <p className="text-xs max-w-sm text-center text-slate-500">
                                    To create a new package, go to the <b>Test Library</b> tab, add a new record, and set its Type to <b>"Package"</b>. It will automatically appear here for configuration.
                                </p>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                                {filteredPackages.map(pkg => {
                                    const testCount = pkg.packageTests?.length || 0;
                                    const hasTests = testCount > 0;

                                    return (
                                        <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col overflow-hidden group">
                                            <div className={`h-1.5 w-full ${hasTests ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-300 transition-colors'}`}></div>
                                            
                                            <div className="p-5 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-3 gap-2">
                                                    <h3 className="text-base font-bold text-slate-800 leading-tight line-clamp-2" title={pkg.name}>
                                                        {pkg.name}
                                                    </h3>
                                                    <div className="text-lg font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0">
                                                        ₹{pkg.price}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                                                        {pkg.code}
                                                    </span>
                                                </div>

                                                <div className="flex-1"></div>

                                                <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-bold border ${hasTests ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                    <div className={`p-1.5 rounded-lg ${hasTests ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Package size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="uppercase tracking-wide text-[10px] opacity-80 mb-0.5">Configuration Status</div>
                                                        {hasTests ? `${testCount} Tests Included` : 'Empty Package'}
                                                    </div>
                                                </div>

                                                {canPerform('Edit') ? (
                                                    <button 
                                                        onClick={() => handleOpenModal(pkg)}
                                                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                                                            hasTests 
                                                            ? 'bg-purple-50 text-[#9575cd] border-purple-200 hover:border-[#9575cd] hover:bg-purple-100' 
                                                            : 'bg-[#9575cd] text-white border-[#9575cd] hover:bg-[#7e57c2] hover:shadow-md'
                                                        }`}
                                                    >
                                                        {hasTests ? <Settings2 size={16}/> : <Settings size={16}/>}
                                                        {hasTests ? 'Update Configuration' : 'Configure Tests'}
                                                    </button>
                                                ) : (
                                                    <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                                                        <Lock size={16}/> View Only
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10">
                                    <tr>
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-xs">Package Details</th>
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-xs text-center">Price</th>
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-xs">Included Tests</th>
                                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredPackages.map(pkg => {
                                        const testCount = pkg.packageTests?.length || 0;
                                        const hasTests = testCount > 0;

                                        return (
                                            <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-base">{pkg.name}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">{pkg.code}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center font-bold text-slate-700">
                                                    ₹{pkg.price}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit shadow-sm ${hasTests ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                            {hasTests ? <CheckBadge /> : <AlertBadge />} 
                                                            {hasTests ? `${testCount} Tests Configured` : 'Empty Package'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {canPerform('Edit') ? (
                                                        <button 
                                                            onClick={() => handleOpenModal(pkg)}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm border ${
                                                                hasTests 
                                                                ? 'bg-purple-50 text-[#9575cd] border-purple-200 hover:border-[#9575cd] hover:bg-purple-100' 
                                                                : 'bg-[#9575cd] text-white border-[#9575cd] hover:bg-[#7e57c2] hover:shadow-md'
                                                            }`}
                                                        >
                                                            {hasTests ? <Settings2 size={14}/> : <Settings size={14}/>}
                                                            {hasTests ? 'Update Configuration' : 'Configure Tests'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs font-bold italic">View Only</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MOBILE LAYOUT --- */}
            <div className="flex md:hidden flex-1 w-full h-full bg-white overflow-hidden flex-col relative">
                {/* Header (Search, Filters, Count) */}
                <header className="flex flex-col gap-1.5 px-3 py-2 shrink-0 z-20 bg-white border-b border-slate-100">
                    {/* Row 1: Search & Status Filter Switcher */}
                    <div className="flex items-center gap-1.5 w-full shrink-0">
                        <div className="relative flex-1">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search packages..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all"
                            />
                        </div>

                        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 shrink-0">
                            <button 
                                onClick={() => setMobileStatusFilter('All')} 
                                className={`h-5 px-1.5 rounded text-[9px] font-bold transition-all ${mobileStatusFilter === 'All' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
                            >
                                All
                            </button>
                            <button 
                                onClick={() => setMobileStatusFilter('Configured')} 
                                className={`h-5 px-1.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${mobileStatusFilter === 'Configured' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                Done
                            </button>
                            <button 
                                onClick={() => setMobileStatusFilter('Empty')} 
                                className={`h-5 px-1.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${mobileStatusFilter === 'Empty' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500'}`}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                Empty
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Department Filter Dropdown & Package Count */}
                    <div className="flex items-center gap-1.5 w-full py-0.5">
                        <div className="relative">
                            <select 
                                value={mobileDeptFilter} 
                                onChange={(e) => setMobileDeptFilter(e.target.value)} 
                                className="h-6 pl-2 pr-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors"
                            >
                                <option value="All">All Departments</option>
                                {uniqueDepartments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="ml-auto flex items-center shrink-0">
                            <span className="text-[9.5px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                                {mobileFilteredPackages.length === 0 ? '0 of 0' : `${mobileStartIndex + 1}-${Math.min(mobileStartIndex + ITEMS_PER_PAGE, mobileFilteredPackages.length)} of ${mobileFilteredPackages.length}`}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Mobile Cards List */}
                <div className="flex-1 min-h-0 overflow-y-auto w-full px-2.5 py-2 bg-white flex flex-col gap-2 pb-16 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40">
                            <MusicBarLoader text="Loading Packages..." />
                        </div>
                    ) : mobileFilteredPackages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <Archive size={32} className="mb-2 opacity-30" />
                            <p className="text-[11px] font-medium">No packages found.</p>
                        </div>
                    ) : (
                        paginatedMobilePackages.map(pkg => {
                            const testCount = pkg.packageTests?.length || 0;
                            const hasTests = testCount > 0;
                            return (
                                <div key={pkg.id} className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 flex flex-col gap-1.5 transition-all relative">
                                    <div className="flex items-start justify-between gap-1.5">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-bold text-slate-800 text-[11px] leading-tight truncate">{pkg.name}</span>
                                            <span className="text-[9.5px] text-slate-500 font-medium truncate">{pkg.department?.name || 'General Lab'}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 shrink-0">
                                            ₹{pkg.price}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[9px] pt-0.5">
                                        <span className="font-mono text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[8.5px] font-semibold">
                                            {pkg.code}
                                        </span>
                                        {hasTests ? (
                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[9px]">
                                                <CheckBadge /> {testCount} Tests Included
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 text-[9px]">
                                                <AlertBadge /> Empty Package
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-1 border-t border-slate-100">
                                        {canPerform('Edit') ? (
                                            <button 
                                                onClick={() => handleOpenModal(pkg)} 
                                                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all border ${
                                                    hasTests 
                                                    ? 'bg-purple-50 text-[#9575cd] border-purple-200 hover:bg-purple-100 active:scale-98' 
                                                    : 'bg-[#9575cd] text-white border-[#9575cd] hover:bg-[#7e57c2] active:scale-98'
                                                }`}
                                            >
                                                {hasTests ? <Settings2 size={12}/> : <Settings size={12}/>}
                                                {hasTests ? 'Update Configuration' : 'Configure Tests'}
                                            </button>
                                        ) : (
                                            <div className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed">
                                                <Lock size={11}/> View Only
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Mobile Locked Non-Moving Footer */}
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

                    {/* Go To Menu */}
                    <div className="relative" ref={goToRef}>
                        <button 
                            onClick={() => setIsGoToPopupOpen(!isGoToPopupOpen)} 
                            className={`h-6 px-3 flex items-center justify-center font-medium text-[9px] rounded transition-colors border ${isGoToPopupOpen ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                        >
                            Go to
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m18 15-6-6-6 6"/></svg>
                        </button>
                        
                        {isGoToPopupOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-in slide-in-from-bottom-2 fade-in duration-200 z-[60]">
                                <button onClick={() => window.location.href = '/tests?tab=Departments'} className="w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">Departments</button>
                                <button onClick={() => window.location.href = '/tests?tab=Test+Library'} className="w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">Test library</button>
                                <button onClick={() => window.location.href = '/tests?tab=Formats'} className="w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">Formats</button>
                                <button onClick={() => window.location.href = '/tests?tab=Parameters'} className="w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">Parameters</button>
                                <button onClick={() => window.location.href = '/tests?tab=Packages'} className="w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">Packages</button>
                                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PackageCartModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={loadPackages} 
                pkg={selectedPackage} 
            />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}

function CheckBadge() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
}
function AlertBadge() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
}
// --- BLOCK app/packages/page.tsx CLOSE ---