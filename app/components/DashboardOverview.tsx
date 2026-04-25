"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    getKPIs, getRevenueData, getPatientData, getTestTrendData, 
    getTestStatusData, getTopTestsData, getTopReferralsData, 
    getOutsourceData, getReferralList, getSpecificReferralTrendData,
    getSelfVsReferralData 
} from '@/app/actions/dashboard';
import { Loader2, TrendingUp, Users, Activity, AlertCircle, Building2, Calendar, Stethoscope, TestTube, ChevronDown, Search, FileText, UserPlus } from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import DateRangeFilter from '@/app/results/entry/components/DateRangeFilter';

const getTodayRange = () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    return { from, to };
};

// 🚨 FIX: Added globalDateRange prop to sync with master dashboard filter
function ChartWidget({ title, icon: Icon, fetcher, renderChart, alignPopover = "end", initialData, globalDateRange }: any) {
    const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>(getTodayRange());
    
    // Instantly use Server Data!
    const [data, setData] = useState<any>(initialData);
    const [loading, setLoading] = useState(!initialData);
    
    // Flag to ensure we don't trigger the fetcher on the first load
    const isFirstRender = useRef(true);
    
    // 🚨 FIX: Listen for Global Master Date Range changes to update this widget
    const prevGlobalRange = useRef(globalDateRange);
    useEffect(() => {
        const prev = prevGlobalRange.current;
        if (
            prev?.from?.getTime() !== globalDateRange?.from?.getTime() || 
            prev?.to?.getTime() !== globalDateRange?.to?.getTime()
        ) {
            setDateRange({ from: globalDateRange?.from, to: globalDateRange?.to });
            prevGlobalRange.current = globalDateRange;
        }
    }, [globalDateRange]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // SKIP the initial fetch!
        }

        let active = true;
        setLoading(true);
        const fromStr = dateRange.from?.toISOString();
        const toStr = dateRange.to?.toISOString();

        fetcher(fromStr, toStr).then((res: any) => {
            if (active) { setData(res); setLoading(false); }
        }).catch(() => {
            if (active) setLoading(false);
        });
        
        return () => { active = false; };
    }, [dateRange, fetcher]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full relative group">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-6 shrink-0 gap-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Icon size={16} className="text-[#9575cd] shrink-0"/> {title}
                </h3>
                <div className={`w-full xl:w-[240px] z-20 ${alignPopover === 'left' ? '[&>div>div]:!left-0 [&>div>div]:!right-auto origin-top-left' : ''}`}>
                    <DateRangeFilter align={alignPopover === 'left' ? 'start' : 'end'} onFilterChange={(range) => setDateRange({ from: range.from, to: range.to })} />
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-[250px] relative z-10">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl">
                        <Loader2 className="animate-spin text-[#9575cd]" size={28}/>
                    </div>
                )}
                {!loading && (!data || data.length === 0) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-20 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm">No data available for this timeframe</p>
                    </div>
                )}
                {!loading && data && data.length > 0 && renderChart(data)}
            </div>
        </div>
    );
}

// 🚨 FIX: Added globalDateRange prop to sync with master dashboard filter
function SpecificReferralWidget({ initialRefs, initialRefData, globalDateRange }: { initialRefs: string[], initialRefData: any, globalDateRange: any }) {
    const [dateRange, setDateRange] = useState<{from: Date | null, to: Date | null}>(getTodayRange());
    const [referrals, setReferrals] = useState<string[]>(initialRefs);
    const [selectedRef, setSelectedRef] = useState<string>(initialRefs.length > 0 ? initialRefs[0] : '');
    
    // Instantly use Server Data!
    const [data, setData] = useState<any>(initialRefData);
    const [loading, setLoading] = useState(!initialRefData);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    // 🚨 FIX: Listen for Global Master Date Range changes to update this widget
    const prevGlobalRange = useRef(globalDateRange);
    useEffect(() => {
        const prev = prevGlobalRange.current;
        if (
            prev?.from?.getTime() !== globalDateRange?.from?.getTime() || 
            prev?.to?.getTime() !== globalDateRange?.to?.getTime()
        ) {
            setDateRange({ from: globalDateRange?.from, to: globalDateRange?.to });
            prevGlobalRange.current = globalDateRange;
        }
    }, [globalDateRange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!selectedRef) return;

        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // SKIP the initial fetch!
        }

        let active = true;
        setLoading(true);
        const fromStr = dateRange.from?.toISOString();
        const toStr = dateRange.to?.toISOString();

        getSpecificReferralTrendData(fromStr, toStr, selectedRef).then((res: any) => {
            if (active) { setData(res); setLoading(false); }
        }).catch(() => {
            if (active) setLoading(false);
        });
        
        return () => { active = false; };
    }, [dateRange, selectedRef]);

    const filteredRefs = referrals.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col h-full relative group">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center mb-6 shrink-0 gap-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Users size={16} className="text-[#9575cd] shrink-0"/> Specific Referral Performance:
                    </h3>
                    <div className="relative w-full sm:w-72" ref={searchRef}>
                        <div 
                            className="flex items-center justify-between bg-purple-50 border border-purple-100 hover:border-purple-200 transition-colors rounded-lg px-3 py-1.5 cursor-pointer text-xs font-bold text-[#5e35b1]"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                        >
                            <span className="truncate">{selectedRef || "Select a referral..."}</span>
                            <ChevronDown size={14} className="text-purple-400 shrink-0 ml-2" />
                        </div>
                        {isSearchOpen && (
                            <div className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden flex flex-col max-h-72">
                                <div className="p-2 border-b border-slate-100 bg-slate-50 shrink-0">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                                        <input 
                                            autoFocus type="text" placeholder="Search name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded outline-none focus:border-[#9575cd]"
                                        />
                                    </div>
                                </div>
                                <ul className="flex-1 overflow-y-auto custom-scrollbar">
                                    {filteredRefs.map(r => (
                                        <li key={r} onClick={() => { setSelectedRef(r); setIsSearchOpen(false); setSearchQuery(''); }} className={`px-3 py-2.5 text-xs cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${r === selectedRef ? 'bg-purple-100 text-[#5e35b1] font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                            {r}
                                        </li>
                                    ))}
                                    {filteredRefs.length === 0 && <li className="px-3 py-4 text-xs text-slate-400 text-center italic">No matching referrals found</li>}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full xl:w-[240px] z-20">
                    <DateRangeFilter onFilterChange={(range) => setDateRange({ from: range.from, to: range.to })} />
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-[300px] relative z-10">
                {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-[#9575cd]" size={28}/></div>}
                {!loading && (!data || data.length === 0) && <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-20 rounded-xl border border-slate-100"><p className="text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm">No referral data found for {selectedRef || 'this entity'} in the timeframe.</p></div>}
                {!loading && data && data.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any, name: any) => [name === 'revenue' ? `₹${value}` : value, name === 'revenue' ? 'Revenue' : 'Patients Referred']} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <Bar yAxisId="right" dataKey="patients" name="patients" fill="#38bdf8" radius={[4,4,0,0]} barSize={30} />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="#9575cd" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

export default function DashboardOverview({ initialData }: { initialData: any }) {
    
    // Master KPI Date Range State
    const [kpiRange, setKpiRange] = useState<{from: Date | null, to: Date | null}>(getTodayRange());
    
    // Instantly use Server Data!
    const [kpiData, setKpiData] = useState<any>(initialData.kpiData);
    const [kpiLoading, setKpiLoading] = useState(!initialData.kpiData);
    const isFirstKpiRender = useRef(true);

    useEffect(() => {
        if (isFirstKpiRender.current) {
            isFirstKpiRender.current = false;
            return; // SKIP initial fetch
        }

        setKpiLoading(true);
        const fromStr = kpiRange.from?.toISOString();
        const toStr = kpiRange.to?.toISOString();
        getKPIs(fromStr, toStr).then(res => { setKpiData(res); setKpiLoading(false); });
    }, [kpiRange]);

    const KPICard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 transition-transform group-hover:scale-150 ${bgClass}`}></div>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl ${bgClass} ${colorClass} bg-opacity-20`}><Icon size={20} /></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                {kpiLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : value}
            </h3>
            <p className="text-sm font-bold text-slate-500 mt-1">{title}</p>
        </div>
    );

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar pb-10 pr-2 animate-in fade-in duration-500 font-sans">
            
            {/* KPI HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-[70]">
                <div>
                    <h2 className="text-2xl font-bold text-[#263238]">Dashboard Overview</h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time modular laboratory performance metrics.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                    <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">KPI Date Range:</span>
                    <div className="w-full sm:w-[260px]">
                        <DateRangeFilter onFilterChange={(range) => setKpiRange({ from: range.from, to: range.to })} />
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 relative z-10">
                <KPICard title="Bills Generated" value={kpiData?.totalBills || 0} icon={FileText} colorClass="text-indigo-600" bgClass="bg-indigo-500" />
                <KPICard title="Total Revenue" value={`₹${(kpiData?.totalRevenue || 0).toLocaleString('en-IN')}`} icon={TrendingUp} colorClass="text-emerald-600" bgClass="bg-emerald-500" />
                <KPICard title="Patient Visits" value={kpiData?.totalPatients || 0} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-500" />
                <KPICard title="Tests Conducted" value={kpiData?.totalTests || 0} icon={Activity} colorClass="text-[#9575cd]" bgClass="bg-[#9575cd]" />
                <KPICard title="Pending Dues" value={`₹${(kpiData?.totalDue || 0).toLocaleString('en-IN')}`} icon={AlertCircle} colorClass="text-rose-600" bgClass="bg-rose-500" />
                <KPICard title="Outsourced Tests" value={kpiData?.outsourced || 0} icon={Building2} colorClass="text-amber-600" bgClass="bg-amber-500" />
            </div>

            {/* CHARTS GRID 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartWidget 
                    title="Patient Demographics Trend" icon={Users} fetcher={getPatientData} 
                    initialData={initialData.patientData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar dataKey="new" name="New Patients" stackId="a" fill="#34d399" barSize={20} radius={[0,0,4,4]} />
                                <Bar dataKey="returning" name="Returning Patients" stackId="a" fill="#38bdf8" radius={[4,4,0,0]} />
                                <Line type="monotone" dataKey="total" name="Total Patients" stroke="#9575cd" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                />
                <ChartWidget 
                    title="Revenue Generation Trend" icon={TrendingUp} fetcher={getRevenueData} 
                    initialData={initialData.revenueData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => [`₹${val}`, 'Revenue']} />
                                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <ChartWidget 
                    title="Tests Volume Trend" icon={TestTube} fetcher={getTestTrendData} 
                    initialData={initialData.testTrendData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => [val, 'Tests Conducted']} />
                                <Line type="monotone" dataKey="tests" name="Total Tests" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <ChartWidget 
                    title="Top 5 Most Ordered Tests" icon={Activity} fetcher={getTopTestsData} 
                    initialData={initialData.topTestsData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                                <Bar dataKey="count" fill="#9575cd" radius={[0, 4, 4, 0]} barSize={20} name="Test Count">
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#7e57c2' : '#b39ddb'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                />
            </div>

            <div className="mb-6 w-full h-[400px]">
                <SpecificReferralWidget 
                    initialRefs={initialData.referralList} 
                    initialRefData={initialData.specificReferralData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range 
                />
            </div>

            {/* CHARTS GRID 2 - 4 COLUMNS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <ChartWidget 
                    title="Top Referring Entities" icon={Stethoscope} fetcher={getTopReferralsData} 
                    alignPopover="left"
                    initialData={initialData.topReferralsData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any, name: any, props: any) => [`${value} Patients (₹${props.payload.revenue.toLocaleString('en-IN')} Rev)`, 'Performance']}/>
                                <Bar dataKey="patients" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={20} name="Patients Referred">
                                    {data.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#0284c7' : '#7dd3fc'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                />
                
                <ChartWidget 
                    title="Self vs Referred" icon={UserPlus} fetcher={getSelfVsReferralData} 
                    alignPopover="left"
                    initialData={initialData.selfVsReferralData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                    {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => [val, 'Patients']} />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                />

                <ChartWidget 
                    title="In-House vs Outsourced" icon={Building2} fetcher={getOutsourceData} 
                    initialData={initialData.outsourceData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                    {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                />
                <ChartWidget 
                    title="Test Status Pipeline" icon={Activity} fetcher={getTestStatusData} 
                    initialData={initialData.testStatusData}
                    globalDateRange={kpiRange} // 🚨 FIX: Syncing Master Date Range
                    renderChart={(data: any) => (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                    {data.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                />
            </div>

            <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }`}</style>
        </div>
    );
}