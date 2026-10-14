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
        <div className="flex flex-col w-full h-auto md:h-full animate-in fade-in duration-300 pb-2">
            
            {/* Header Banner */}
            <div className="p-2.5 md:p-5 pb-2 md:pb-4 border-b border-slate-100 bg-white rounded-xl md:rounded-none md:sticky md:top-0 z-10 shrink-0 mb-2.5 md:mb-0">
                <h2 className="text-[11px] md:text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-[#9575cd] md:w-5 md:h-5" />
                    Delta Report Configurations
                </h2>
                <p className="text-[8.5px] md:text-xs text-slate-400 font-medium mt-0.5 leading-none">
                    Customize the look and feel of historical variance analysis reports.
                </p>
            </div>

            <div className="w-full md:flex-1 md:overflow-y-auto p-0 md:p-5 space-y-2.5 md:space-y-6 custom-scrollbar">
                
                {/* --- THEME COLORS --- */}
                <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                        <Palette size={14} className="text-[#9575cd]" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Theme Colors</h3>
                            <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Color accents for graphs and data.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Primary Color</label>
                            <div className="flex items-center gap-1.5 w-full h-6 md:h-8 px-1.5 border border-slate-200 rounded md:rounded-lg focus-within:border-[#9575cd] bg-white">
                                <input type="color" value={deltaSettings?.primaryColor || '#9575cd'} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                <input type="text" value={deltaSettings?.primaryColor || '#9575cd'} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-full text-[9.5px] md:text-xs outline-none bg-transparent uppercase font-mono text-slate-700 font-bold" maxLength={7} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Abnormal Color</label>
                            <div className="flex items-center gap-1.5 w-full h-6 md:h-8 px-1.5 border border-slate-200 rounded md:rounded-lg focus-within:border-[#9575cd] bg-white">
                                <input type="color" value={deltaSettings?.alertColor || '#e11d48'} onChange={(e) => handleChange('alertColor', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                <input type="text" value={deltaSettings?.alertColor || '#e11d48'} onChange={(e) => handleChange('alertColor', e.target.value)} className="w-full text-[9.5px] md:text-xs outline-none bg-transparent uppercase font-mono text-slate-700 font-bold" maxLength={7} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TYPOGRAPHY --- */}
                <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                        <Baseline size={14} className="text-[#9575cd]" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Typography & Sizes</h3>
                            <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Font family and text scales.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Family</label>
                            <select value={deltaSettings?.fontFamily || 'Helvetica'} onChange={(e) => handleChange('fontFamily', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700">
                                <option value="Helvetica">Helvetica (Clean)</option>
                                <option value="Times-Roman">Times New Roman</option>
                                <option value="Courier">Courier (Mono)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Heading Size</label>
                            <select value={deltaSettings?.headingSize || '12'} onChange={(e) => handleChange('headingSize', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700">
                                <option value="10">Small (10pt)</option>
                                <option value="12">Medium (12pt)</option>
                                <option value="14">Large (14pt)</option>
                                <option value="16">XL (16pt)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Param Size</label>
                            <select value={deltaSettings?.paramNameSize || '11'} onChange={(e) => handleChange('paramNameSize', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700">
                                <option value="9">Small (9pt)</option>
                                <option value="10">Standard (10pt)</option>
                                <option value="11">Medium (11pt)</option>
                                <option value="12">Large (12pt)</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Result Size</label>
                            <select value={deltaSettings?.resultValueSize || '12'} onChange={(e) => handleChange('resultValueSize', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700">
                                <option value="10">Standard (10pt)</option>
                                <option value="12">Large (12pt)</option>
                                <option value="14">XL (14pt)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- GRAPH STYLES --- */}
                <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                        <TrendingUp size={14} className="text-[#9575cd]" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Graph Styles</h3>
                            <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Chart formatting and legends.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:gap-4 mb-2.5">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Graph Style</label>
                            <select value={deltaSettings?.graphStyle || 'lollipop'} onChange={(e) => handleChange('graphStyle', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700">
                                <option value="lollipop">Lollipop Chart</option>
                                <option value="line">Connected Line</option>
                                <option value="area">Filled Area</option>
                                <option value="step">Step-Line</option>
                                <option value="bar">Solid Bar</option>
                                <option value="scatter">Scatter Plot</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Node Radius</label>
                            <select value={deltaSettings?.nodeRadius || '3'} onChange={(e) => handleChange('nodeRadius', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700">
                                <option value="0">None (0px)</option>
                                <option value="2">Small (2px)</option>
                                <option value="3">Standard (3px)</option>
                                <option value="5">Large (5px)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                        <div 
                            onClick={() => handleChange('showFooterNotes', deltaSettings?.showFooterNotes === false ? true : false)}
                            className={`px-2 py-1.5 md:px-4 md:py-3 rounded-md md:rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                                deltaSettings?.showFooterNotes !== false 
                                    ? 'border-[#9575cd] bg-purple-50/20' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <div>
                                <span className={`font-bold text-[9px] md:text-xs block ${
                                    deltaSettings?.showFooterNotes !== false ? 'text-[#5e35b1]' : 'text-slate-700'
                                }`}>
                                    Show Legend / Footer Notes
                                </span>
                                <span className="text-[8px] md:text-[10px] text-slate-400 block leading-tight mt-0.5">
                                    Print explanatory notes about clinical shifts at the bottom.
                                </span>
                            </div>
                            <span className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                deltaSettings?.showFooterNotes !== false 
                                    ? 'bg-[#9575cd] text-white' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                                {deltaSettings?.showFooterNotes !== false ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}