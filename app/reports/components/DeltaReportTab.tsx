// --- app/reports/components/DeltaReportTab.tsx Block Open ---
import React from 'react';
import { Palette, Baseline, TrendingUp } from 'lucide-react';

interface DeltaReportTabProps {
    deltaSettings: any;
    setDeltaSettings: (settings: any) => void;
}

export default function DeltaReportTab({ deltaSettings, setDeltaSettings }: DeltaReportTabProps) {
    const handleChange = (field: string, value: any) => {
        setDeltaSettings((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="p-5 pb-4 border-b border-slate-200 bg-white sticky top-0 z-10 shrink-0">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#9575cd]" />
                    Delta Report Configurations
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                    Customize the look and feel of your historical variance analysis reports.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                
                {/* --- THEME COLORS --- */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Palette size={16} className="text-slate-400" /> Theme Colors
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <input type="color" value={deltaSettings?.primaryColor || '#9575cd'} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                <input type="text" value={deltaSettings?.primaryColor || '#9575cd'} onChange={(e) => handleChange('primaryColor', e.target.value)} className="flex-1 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#9575cd]" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Alert / Abnormal Color</label>
                            <div className="flex items-center gap-3">
                                <input type="color" value={deltaSettings?.alertColor || '#e11d48'} onChange={(e) => handleChange('alertColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                <input type="text" value={deltaSettings?.alertColor || '#e11d48'} onChange={(e) => handleChange('alertColor', e.target.value)} className="flex-1 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#9575cd]" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- TYPOGRAPHY --- */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <Baseline size={16} className="text-slate-400" /> Typography & Sizes
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Font Family</label>
                            <select value={deltaSettings?.fontFamily || 'Helvetica'} onChange={(e) => handleChange('fontFamily', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9575cd]">
                                <option value="Helvetica">Helvetica (Clean)</option>
                                <option value="Times-Roman">Times New Roman (Classic)</option>
                                <option value="Courier">Courier (Monospace)</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Test Heading Size</label>
                            <select value={deltaSettings?.headingSize || '12'} onChange={(e) => handleChange('headingSize', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9575cd]">
                                <option value="10">Small (10pt)</option>
                                <option value="12">Medium (12pt)</option>
                                <option value="14">Large (14pt)</option>
                                <option value="16">Extra Large (16pt)</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Parameter Name Size</label>
                            <select value={deltaSettings?.paramNameSize || '11'} onChange={(e) => handleChange('paramNameSize', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9575cd]">
                                <option value="9">Small (9pt)</option>
                                <option value="10">Standard (10pt)</option>
                                <option value="11">Medium (11pt)</option>
                                <option value="12">Large (12pt)</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Result Value Size</label>
                            <select value={deltaSettings?.resultValueSize || '12'} onChange={(e) => handleChange('resultValueSize', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9575cd]">
                                <option value="10">Standard (10pt)</option>
                                <option value="12">Large (12pt)</option>
                                <option value="14">Extra Large (14pt)</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* --- GRAPH SETTINGS --- */}
                <section>
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <TrendingUp size={16} className="text-slate-400" /> Graph Styles
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Graph Style</label>
                            <select value={deltaSettings?.graphStyle || 'lollipop'} onChange={(e) => handleChange('graphStyle', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9575cd]">
                                <option value="lollipop">Lollipop Chart (Default)</option>
                                <option value="line">Connected Line Trend</option>
                                <option value="area">Filled Area Chart</option>
                                <option value="step">Step-Line Chart</option>
                                <option value="bar">Solid Bar Chart</option>
                                <option value="scatter">Scatter Plot (Dots Only)</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Data Point (Node) Radius</label>
                            <select value={deltaSettings?.nodeRadius || '3'} onChange={(e) => handleChange('nodeRadius', e.target.value)} className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#9575cd]">
                                <option value="0">None (0px)</option>
                                <option value="2">Small (2px)</option>
                                <option value="3">Standard (3px)</option>
                                <option value="5">Large (5px)</option>
                            </select>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-bold text-slate-800">Show Legend / Footer Notes</label>
                                <p className="text-[11px] text-slate-500 mt-1">Print explanatory notes about clinical shifts at the bottom of the page.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={deltaSettings?.showFooterNotes !== false} onChange={(e) => handleChange('showFooterNotes', e.target.checked)} />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9575cd]"></div>
                            </label>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
// --- app/reports/components/DeltaReportTab.tsx Block Close ---