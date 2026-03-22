// --- Packages Page OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, Settings, Settings2, Loader2, Archive, LayoutGrid, List } from 'lucide-react';
import { getPackages } from '@/app/actions/packages';
import PackageCartModal from './components/PackageCartModal';

export default function PackagesPage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);

    const loadPackages = async () => {
        setIsLoading(true);
        const res = await getPackages();
        if (res.success && res.data) {
            setPackages(res.data);
        } else {
            setPackages([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadPackages();
    }, []);

    const filteredPackages = packages.filter(pkg => 
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        pkg.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.department?.name && pkg.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleOpenModal = (pkg: any) => {
        setSelectedPackage(pkg);
        setIsModalOpen(true);
    };

    return (
        <div className="h-full w-full bg-[#f1f5f9] p-4 md:p-6 flex flex-col font-sans">
            
            {/* Header */}
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

                    {/* View Toggles */}
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

            {/* Main Content Area */}
            <div className={`flex-1 overflow-hidden flex flex-col ${viewMode === 'list' ? 'bg-white rounded-2xl shadow-sm border border-slate-200' : ''}`}>
                <div className={`flex-1 overflow-y-auto custom-scrollbar ${viewMode === 'grid' ? 'pr-2' : ''}`}>
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="animate-spin text-indigo-500" size={32}/>
                            <p className="text-sm font-medium">Loading Packages...</p>
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
                        // --- GRID VIEW ---
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6">
                            {filteredPackages.map(pkg => {
                                const testCount = pkg.packageTests?.length || 0;
                                const hasTests = testCount > 0;

                                return (
                                    <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col overflow-hidden group">
                                        {/* Card Header (Gradient Line) */}
                                        <div className={`h-1.5 w-full ${hasTests ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-300 transition-colors'}`}></div>
                                        
                                        <div className="p-5 flex flex-col flex-1">
                                            {/* Top Section */}
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <h3 className="text-base font-bold text-slate-800 leading-tight line-clamp-2" title={pkg.name}>
                                                    {pkg.name}
                                                </h3>
                                                <div className="text-lg font-black text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0">
                                                    ₹{pkg.price}
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                                                    {pkg.code}
                                                </span>
                                                {pkg.department?.name && (
                                                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full shadow-sm truncate max-w-[120px]" title={pkg.department.name}>
                                                        {pkg.department.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1"></div>

                                            {/* Status Area */}
                                            <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-xs font-bold border ${hasTests ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                <div className={`p-1.5 rounded-lg ${hasTests ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <div className="uppercase tracking-wide text-[10px] opacity-80 mb-0.5">Configuration Status</div>
                                                    {hasTests ? `${testCount} Tests Included` : 'Empty Package'}
                                                </div>
                                            </div>

                                            {/* Action Button - Reverted to default purple */}
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // --- LIST VIEW ---
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
                                                        {pkg.department?.name ? (
                                                            <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full shadow-sm">
                                                                {pkg.department.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-medium text-slate-400 italic">No Department</span>
                                                        )}
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
                                                {/* Action Button - Reverted to default purple */}
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
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Package Cart Modal */}
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
// --- Packages Page CLOSE ---