// --- BLOCK app/packages/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import Link from 'next/link';
import { Package, Search, Settings, Settings2, Loader2, Archive, LayoutGrid, List, Lock, ChevronDown, ChevronLeft, ChevronRight, Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { getPackages } from '@/app/actions/packages';
import { deleteTest } from '@/app/actions/tests';
import PackageCartModal from './components/PackageCartModal';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 
import { usePermissions } from '@/app/context/PermissionContext';

export default function PackagesPage() {
    const { orgId, permissions, userRole, permsLoaded } = usePermissions();

    const [packages, setPackages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Configured' | 'Empty'>('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);

    const [isPending, startTransition] = useTransition();
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Mobile States
    const [mobileCurrentPage, setMobileCurrentPage] = useState(1);
    const [isGoToPopupOpen, setIsGoToPopupOpen] = useState(false);
    const goToRef = useRef<HTMLDivElement>(null);

    const canPerform = (action: string) => {
        if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
        if (permissions.length === 0) return true; 
        return permissions.some(p => p.module === 'Packages' && p.action === action);
    };

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
            console.error("Database Error:", error);
            setPackages([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPackages();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
        setMobileCurrentPage(1);
    }, [searchQuery, statusFilter, deptFilter]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (goToRef.current && !goToRef.current.contains(event.target as Node)) {
                setIsGoToPopupOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const confirmDelete = () => {
        if (!deleteConfirmId) return;
        startTransition(async () => {
            await deleteTest(deleteConfirmId);
            setDeleteConfirmId(null);
            setSuccessMessage("Package Deleted Successfully!");
            setShowSuccessPopup(true);
            setTimeout(() => { 
                setShowSuccessPopup(false); 
                loadPackages(); 
            }, 1500);
        });
    };

    // Departments list for dropdown
    const uniqueDepartments = useMemo(() => {
        const depts = new Set<string>();
        packages.forEach(pkg => {
            if (pkg.department?.name) depts.add(pkg.department.name);
        });
        return Array.from(depts).sort();
    }, [packages]);

    // Filtered packages
    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            const q = searchQuery.toLowerCase();
            const matchesSearch = !q || 
                pkg.name?.toLowerCase().includes(q) || 
                pkg.code?.toLowerCase().includes(q) || 
                (pkg.department?.name && pkg.department.name.toLowerCase().includes(q));

            const testCount = pkg.packageTests?.length || 0;
            let matchesStatus = true;
            if (statusFilter === 'Configured') matchesStatus = testCount > 0;
            if (statusFilter === 'Empty') matchesStatus = testCount === 0;

            let matchesDept = true;
            if (deptFilter !== 'All') {
                matchesDept = pkg.department?.name === deptFilter;
            }

            return matchesSearch && matchesStatus && matchesDept;
        });
    }, [packages, searchQuery, statusFilter, deptFilter]);

    const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPackages = filteredPackages.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const mobileTotalPages = Math.ceil(filteredPackages.length / 10);
    const mobileStartIndex = (mobileCurrentPage - 1) * 10;
    const paginatedMobilePackages = filteredPackages.slice(mobileStartIndex, mobileStartIndex + 10);

    const handleOpenModal = (pkg: any) => {
        setSelectedPackage(pkg);
        setIsModalOpen(true);
    };

    return (
        <div className="flex flex-col w-full h-full relative font-sans overflow-hidden bg-white">
            
            {/* --- DESKTOP LAYOUT --- */}
            <div className="hidden md:flex flex-col h-full overflow-hidden bg-white">
                
                {/* TOOLBAR / HEADER: 38px / 42px */}
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-2 z-10 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    {/* Left: Title & Status Filter Pills */}
                    <div className="flex items-center gap-2 xl:gap-3 shrink-0">
                        <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                                <Archive size={15}/>
                            </div>
                            <span className="text-[14px] xl:text-[15px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                Packages
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 leading-tight">
                                {filteredPackages.length} Total
                            </span>
                        </div>

                        {/* Status Filter Pills */}
                        <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-[5px] border border-slate-200 h-[24px] xl:h-[26px]">
                            {[
                                { id: 'All', label: 'All', count: packages.length },
                                { id: 'Configured', label: 'Configured', count: packages.filter(p => (p.packageTests?.length || 0) > 0).length },
                                { id: 'Empty', label: 'Empty', count: packages.filter(p => (p.packageTests?.length || 0) === 0).length },
                            ].map(chip => (
                                <button
                                    key={chip.id}
                                    onClick={() => { setStatusFilter(chip.id as any); setCurrentPage(1); }}
                                    className={`h-full px-2 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1 leading-none ${
                                        statusFilter === chip.id
                                            ? 'bg-white shadow-2xs text-[#9575cd] font-medium'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span>{chip.label}</span>
                                    <span className={`text-[9px] px-1 py-0.2 rounded-full leading-none ${
                                        statusFilter === chip.id ? 'bg-purple-100 text-[#9575cd] font-semibold' : 'bg-slate-200/70 text-slate-500'
                                    }`}>{chip.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Search, Dept Filter, View Mode, Add Package */}
                    <div className="flex items-center gap-1.5 xl:gap-2">
                        <div className="relative w-36 lg:w-44 xl:w-52 shrink-0">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search packages..." 
                                value={searchQuery} 
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                                className="w-full pl-7 pr-2.5 h-[24px] xl:h-[26px] bg-white border border-slate-300 rounded-[5px] text-[11px] xl:text-[12px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#9575cd] transition-all" 
                            />
                        </div>

                        {uniqueDepartments.length > 0 && (
                            <div className="relative shrink-0">
                                <select 
                                    value={deptFilter} 
                                    onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                                    className="h-[24px] xl:h-[26px] pl-2 pr-6 bg-white border border-slate-300 rounded-[5px] text-[11px] xl:text-[12px] font-normal text-slate-700 outline-none focus:border-[#9575cd] appearance-none cursor-pointer"
                                >
                                    <option value="All">All Departments</option>
                                    {uniqueDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}

                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-100 p-0.5 rounded-[5px] border border-slate-200 h-[24px] xl:h-[26px] shrink-0">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`h-full px-1.5 rounded transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white text-[#9575cd] shadow-2xs font-medium' : 'text-slate-400 hover:text-slate-600'}`}
                                title="List View"
                            >
                                <List size={13} />
                            </button>
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`h-full px-1.5 rounded transition-all flex items-center justify-center ${viewMode === 'grid' ? 'bg-white text-[#9575cd] shadow-2xs font-medium' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={13} />
                            </button>
                        </div>

                        {/* Add Package Button */}
                        {canPerform('Add') && (
                            <Link href="/tests/add?type=Package">
                                <button className="h-[24px] xl:h-[26px] px-2.5 bg-[#9575cd] hover:bg-[#8565bd] text-white text-[11px] xl:text-[12px] font-medium rounded-[5px] shadow-sm flex items-center gap-1 transition-all active:scale-95 leading-none shrink-0">
                                    <Plus size={13} strokeWidth={2.5}/>
                                    <span>Add Package</span>
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden bg-white p-0 md:p-2.5 xl:p-3 flex flex-col min-h-0">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <MusicBarLoader text="Loading Packages..." />
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
                            <Archive size={36} className="opacity-20 mb-1"/>
                            <p className="text-[12px] font-medium text-slate-600">No packages found.</p>
                            <p className="text-[11px] max-w-sm text-center text-slate-400">
                                Click the &quot;Add Package&quot; button above to create a new package.
                            </p>
                        </div>
                    ) : viewMode === 'list' ? (
                        /* TABLE / LIST VIEW */
                        <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
                            <table className="w-full text-left text-sm border-collapse min-w-[700px] bg-white border-spacing-0">
                                <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                    <tr>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-28">Code</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left min-w-[180px]">Package Name</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left w-36">Department</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-right w-24">Price</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-40">Included Tests</th>
                                        <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-44">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPackages.map(pkg => {
                                        const testCount = pkg.packageTests?.length || 0;
                                        const hasTests = testCount > 0;

                                        return (
                                            <tr key={pkg.id} className="hover:bg-purple-50/40 transition-colors">
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                                                    <span className="font-mono text-[11px] font-medium text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 leading-tight inline-block">
                                                        {pkg.code}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                                                    <span className="font-medium text-slate-800 text-[11px] leading-tight">
                                                        {pkg.name}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-left whitespace-nowrap">
                                                    <span className="text-slate-600 text-[11px] leading-tight">
                                                        {pkg.department?.name || 'General Lab'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-right whitespace-nowrap font-medium text-slate-800 text-[11px]">
                                                    ₹{pkg.price}
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium ${
                                                        hasTests 
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {hasTests ? <CheckBadge /> : <AlertBadge />}
                                                        {hasTests ? `${testCount} Tests Included` : 'Empty Package'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center whitespace-nowrap">
                                                    <div className="inline-flex items-center justify-center gap-1 leading-none align-middle">
                                                        {canPerform('Edit') && (
                                                            <button 
                                                                onClick={() => handleOpenModal(pkg)}
                                                                className="h-[20px] md:h-[22px] px-1.5 rounded border border-purple-200 hover:border-[#9575cd] bg-purple-50 hover:bg-purple-100 text-[#9575cd] text-[10px] font-medium shadow-2xs transition-all inline-flex items-center gap-1 leading-none"
                                                                title="Configure tests in package"
                                                            >
                                                                <Settings2 size={11} strokeWidth={2} className="shrink-0" />
                                                                <span>Configure</span>
                                                            </button>
                                                        )}
                                                        {canPerform('Edit') ? (
                                                            <Link href={`/tests/edit/${pkg.id}`}>
                                                                <button 
                                                                    className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-teal-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none"
                                                                    title="Edit Package Details"
                                                                >
                                                                    <Edit className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 block" strokeWidth={2} />
                                                                </button>
                                                            </Link>
                                                        ) : <span className="text-slate-300 text-xs">-</span>}
                                                        {canPerform('Delete') ? (
                                                            <button 
                                                                onClick={() => setDeleteConfirmId(pkg.id)}
                                                                disabled={isPending}
                                                                className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none disabled:opacity-50"
                                                                title="Delete Package"
                                                            >
                                                                <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 block" strokeWidth={2} />
                                                            </button>
                                                        ) : <span className="text-slate-300 text-xs">-</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* GRID VIEW */
                        <div className="overflow-y-auto custom-scrollbar flex-1 w-full h-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 xl:gap-3 pb-2">
                                {paginatedPackages.map(pkg => {
                                    const testCount = pkg.packageTests?.length || 0;
                                    const hasTests = testCount > 0;

                                    return (
                                        <div key={pkg.id} className="bg-white rounded-[6px] border border-slate-200 shadow-2xs hover:shadow-xs hover:border-[#9575cd]/50 transition-all flex flex-col p-2.5 xl:p-3 gap-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-[12px] xl:text-[13px] font-semibold text-slate-800 leading-tight truncate" title={pkg.name}>
                                                        {pkg.name}
                                                    </h3>
                                                    <span className="text-[10px] text-slate-500 font-normal truncate block mt-0.5">
                                                        {pkg.department?.name || 'General Lab'}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                                    ₹{pkg.price}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                                                <span className="font-mono text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 text-[9.5px] font-medium">
                                                    {pkg.code}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium ${
                                                    hasTests ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                    {hasTests ? `${testCount} Tests` : 'Empty'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 pt-1 mt-auto">
                                                {canPerform('Edit') && (
                                                    <button 
                                                        onClick={() => handleOpenModal(pkg)}
                                                        className="flex-1 h-[22px] xl:h-[24px] px-2 rounded-[5px] border border-purple-200 hover:border-[#9575cd] bg-purple-50 hover:bg-purple-100 text-[#9575cd] text-[10px] xl:text-[11px] font-medium shadow-2xs transition-all flex items-center justify-center gap-1 leading-none"
                                                    >
                                                        <Settings2 size={11} strokeWidth={2} />
                                                        <span>Configure</span>
                                                    </button>
                                                )}
                                                {canPerform('Edit') && (
                                                    <Link href={`/tests/edit/${pkg.id}`}>
                                                        <button 
                                                            className="h-[22px] xl:h-[24px] px-1.5 rounded-[5px] border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50 text-teal-600 shadow-2xs transition-all flex items-center justify-center"
                                                            title="Edit Details"
                                                        >
                                                            <Edit className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2} />
                                                        </button>
                                                    </Link>
                                                )}
                                                {canPerform('Delete') && (
                                                    <button 
                                                        onClick={() => setDeleteConfirmId(pkg.id)}
                                                        className="h-[22px] xl:h-[24px] px-1.5 rounded-[5px] border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition-all flex items-center justify-center"
                                                        title="Delete Package"
                                                    >
                                                        <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER BAR: 30px / 34px */}
                <div className="bg-white md:bg-slate-50 border-t border-slate-200 px-2.5 xl:px-3 py-1 md:py-0 min-h-[30px] h-[30px] xl:min-h-[34px] xl:h-[34px] flex items-center justify-between shrink-0 gap-2 w-full text-[11px] text-slate-500 font-normal">
                    <div>
                        Showing <span className="font-semibold text-slate-700">{filteredPackages.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + ITEMS_PER_PAGE, filteredPackages.length)}</span> of <span className="font-semibold text-slate-700">{filteredPackages.length}</span> packages
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                            className="h-[22px] px-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xs text-[10px]"
                        >
                            <ChevronLeft size={12} className="mr-0.5" /> Prev
                        </button>
                        <span className="text-[11px] font-medium text-slate-700 px-1">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-[22px] px-2 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xs text-[10px]"
                        >
                            Next <ChevronRight size={12} className="ml-0.5" />
                        </button>
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
                                onClick={() => setStatusFilter('All')} 
                                className={`h-5 px-1.5 rounded text-[9px] font-bold transition-all ${statusFilter === 'All' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'}`}
                            >
                                All
                            </button>
                            <button 
                                onClick={() => setStatusFilter('Configured')} 
                                className={`h-5 px-1.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${statusFilter === 'Configured' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'}`}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                Done
                            </button>
                            <button 
                                onClick={() => setStatusFilter('Empty')} 
                                className={`h-5 px-1.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${statusFilter === 'Empty' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500'}`}
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                Empty
                            </button>
                        </div>
                    </div>

                    {/* Row 2: Department Filter Dropdown & Package Count & Add */}
                    <div className="flex items-center gap-1.5 w-full py-0.5">
                        <div className="relative">
                            <select 
                                value={deptFilter} 
                                onChange={(e) => setDeptFilter(e.target.value)} 
                                className="h-6 pl-2 pr-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors"
                            >
                                <option value="All">All Departments</option>
                                {uniqueDepartments.map((dept) => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {canPerform('Add') && (
                            <Link href="/tests/add?type=Package">
                                <button className="h-6 bg-[#9575cd] text-white px-2 rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                                    <Plus size={11} strokeWidth={2.5}/> Add
                                </button>
                            </Link>
                        )}

                        <div className="ml-auto flex items-center shrink-0">
                            <span className="text-[9.5px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                                {filteredPackages.length === 0 ? '0 of 0' : `${mobileStartIndex + 1}-${Math.min(mobileStartIndex + 10, filteredPackages.length)} of ${filteredPackages.length}`}
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
                    ) : filteredPackages.length === 0 ? (
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
                                        <span className="font-mono text-[#9575cd] bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded text-[8.5px] font-semibold">
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

                                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                                        {canPerform('Edit') ? (
                                            <button 
                                                onClick={() => handleOpenModal(pkg)} 
                                                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[9.5px] font-semibold border bg-purple-50 text-[#9575cd] border-purple-200 hover:bg-purple-100 active:scale-98"
                                            >
                                                <Settings2 size={11}/> Configure
                                            </button>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[9.5px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                                                <Lock size={11}/> View Only
                                            </div>
                                        )}
                                        {canPerform('Edit') && (
                                            <Link href={`/tests/edit/${pkg.id}`} className="text-teal-600 inline-flex items-center gap-0.5 text-[9.5px] font-medium p-1">
                                                <Edit size={11} strokeWidth={2}/> Edit
                                            </Link>
                                        )}
                                        {canPerform('Delete') && (
                                            <button onClick={() => setDeleteConfirmId(pkg.id)} className="text-rose-600 inline-flex items-center gap-0.5 text-[9.5px] font-medium p-1">
                                                <Trash2 size={11} strokeWidth={2}/> Delete
                                            </button>
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

            {/* DELETE MODAL */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150 border border-slate-200">
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border-[3px] border-red-100">
                            <AlertTriangle className="text-red-500" size={28} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">Delete Package?</h3>
                        <p className="text-xs text-slate-500 mb-5 font-normal">Are you sure you want to delete this package? This action cannot be undone.</p>
                        <div className="flex gap-2.5">
                            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-1.5 text-xs font-normal text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors">Cancel</button>
                            <button onClick={confirmDelete} disabled={isPending} className="flex-1 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-[5px] shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                                {isPending ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>} Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS POPUP */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-xs w-full mx-4 border border-slate-100">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-[3px] border-emerald-100">
                            <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-base font-bold text-slate-800 tracking-tight text-center">{successMessage}</h2>
                    </div>
                </div>
            )}

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
    return <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
}
function AlertBadge() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
}
// --- BLOCK app/packages/page.tsx CLOSE ---
