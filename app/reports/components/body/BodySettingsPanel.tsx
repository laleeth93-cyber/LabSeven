import React from 'react';
import { Table, Settings2 } from 'lucide-react';

interface BodySettingsPanelProps {
    bodySettings: any;
    handleToggleBody: (field: string) => void;
    handleBodySettingChange: (field: string, value: any) => void;
}

export default function BodySettingsPanel({ bodySettings, handleToggleBody, handleBodySettingChange }: BodySettingsPanelProps) {
    
    const pW = parseFloat(bodySettings.colWidthParam) || 0;
    const rW = parseFloat(bodySettings.colWidthResult) || 0;
    const fW = bodySettings.showFlagCol !== false ? (parseFloat(bodySettings.colWidthFlag) || 0) : 0;
    const uW = bodySettings.showUnitCol !== false ? (parseFloat(bodySettings.colWidthUnit) || 0) : 0;
    const refW = bodySettings.showRefRangeCol !== false ? (parseFloat(bodySettings.colWidthRef) || 0) : 0;
    const mW = (bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column') ? (parseFloat(bodySettings.colWidthMethod) || 0) : 0;
    
    const totalWidth = pW + rW + fW + uW + refW + mW;
    const isCustomActive = pW > 0 || rW > 0 || fW > 0 || uW > 0 || refW > 0 || mW > 0;
    const isValid = totalWidth === 100;

    const getRowHeightVal = (val: any) => {
        const str = String(val ?? '6').toLowerCase().trim();
        if (str === 'py-0') return 0;
        if (str === 'py-px') return 1;
        if (str === 'py-0.5') return 2;
        if (str === 'py-1') return 4;
        if (str === 'py-1.5') return 6;
        if (str === 'py-2') return 8;
        
        const parsed = parseInt(str.replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    };
    
    const getLineHeightVal = (val: any) => {
        const str = String(val || '1.5');
        const parsed = parseFloat(str.replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? 1.5 : parsed;
    };

    const rowHeightValue = getRowHeightVal(bodySettings.bodyRowHeight);
    const lineHeightValue = getLineHeightVal(bodySettings.bodyLineHeight);

    return (
        <div className="w-full flex flex-col gap-2.5 md:gap-5 pb-2">
            
            {/* Table Content & Columns Toggle Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <Table size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Table Content & Columns</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Toggle and configure visible columns in the results table.</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-2.5">
                    <div className={`px-2 py-1 md:p-2.5 rounded-md md:rounded-lg border transition-all flex flex-col gap-1 ${bodySettings.showMethodCol ? 'border-[#9575cd] bg-purple-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => handleToggleBody('showMethodCol')}>
                            <p className={`font-bold text-[9px] md:text-xs ${bodySettings.showMethodCol ? 'text-[#5e35b1]' : 'text-slate-700'}`}>Method</p>
                            <span className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                bodySettings.showMethodCol 
                                    ? 'bg-[#9575cd] text-white' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                                {bodySettings.showMethodCol ? 'ON' : 'OFF'}
                            </span>
                        </div>
                        {bodySettings.showMethodCol && (
                            <div className="pt-1 border-t border-[#9575cd]/20 flex flex-col gap-0.5">
                                <label className="flex items-center gap-1 text-[8px] md:text-[9px] font-semibold text-slate-600 cursor-pointer">
                                    <input type="radio" checked={bodySettings.methodDisplayStyle === 'column'} onChange={() => handleBodySettingChange('methodDisplayStyle', 'column')} className="accent-[#9575cd] w-2 h-2" />
                                    Discrete Column
                                </label>
                                <label className="flex items-center gap-1 text-[8px] md:text-[9px] font-semibold text-slate-600 cursor-pointer">
                                    <input type="radio" checked={bodySettings.methodDisplayStyle === 'beneath'} onChange={() => handleBodySettingChange('methodDisplayStyle', 'beneath')} className="accent-[#9575cd] w-2 h-2" />
                                    Sub-text of Parameter
                                </label>
                            </div>
                        )}
                    </div>
                    
                    {[
                        { key: 'showFlagCol', label: 'Flag Column' },
                        { key: 'showUnitCol', label: 'Units Column' },
                        { key: 'showRefRangeCol', label: 'Bio. Ref Interval' },
                        { key: 'showDepartmentName', label: 'Department Name' },
                        { key: 'showTestName', label: 'Test Name' },
                    ].map((item) => {
                        const isChecked = bodySettings[item.key as keyof typeof bodySettings] ?? (item.key !== 'showFlagCol');
                        const finalChecked = bodySettings[item.key] === undefined ? true : isChecked;
                        return (
                            <div key={item.key} onClick={() => handleToggleBody(item.key)} className={`px-2 py-1 md:p-2.5 rounded-md md:rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-1 ${finalChecked ? 'border-[#9575cd] bg-purple-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <p className={`font-bold text-[9px] md:text-xs truncate ${finalChecked ? 'text-[#5e35b1]' : 'text-slate-700'}`}>{item.label}</p>
                                <span className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                    finalChecked 
                                        ? 'bg-[#9575cd] text-white' 
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                    {finalChecked ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Table Design & Typography Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <Settings2 size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Table Design & Typography</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Customize borders, fonts, colors, and layout of the results table.</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 md:gap-4">
                    
                    {/* Individual Column Widths */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2 flex justify-between items-center">
                            <span>Individual Column Widths</span>
                            <span className="text-[8px] text-slate-400 normal-case font-medium">Sum must equal 100%</span>
                        </div>
                        
                        <div className={`p-2 md:p-3 rounded-lg border transition-colors ${isCustomActive ? (isValid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200') : 'bg-white border-slate-200'}`}>
                            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 mb-2">
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight">Param %</label>
                                    <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthParam || ''} onChange={(e) => handleBodySettingChange('colWidthParam', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight">Result %</label>
                                    <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthResult || ''} onChange={(e) => handleBodySettingChange('colWidthResult', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white" />
                                </div>
                                {bodySettings.showFlagCol !== false && (
                                    <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight">Flag %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthFlag || ''} onChange={(e) => handleBodySettingChange('colWidthFlag', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                                {bodySettings.showUnitCol !== false && (
                                    <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight">Units %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthUnit || ''} onChange={(e) => handleBodySettingChange('colWidthUnit', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                                {bodySettings.showRefRangeCol !== false && (
                                    <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight">Ref %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthRef || ''} onChange={(e) => handleBodySettingChange('colWidthRef', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                                {bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column' && (
                                    <div className="flex flex-col gap-0.5">
                                        <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight">Method %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthMethod || ''} onChange={(e) => handleBodySettingChange('colWidthMethod', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all ${isValid ? 'bg-emerald-500' : totalWidth > 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(totalWidth, 100)}%` }}></div>
                                </div>
                                <div className={`text-[10px] font-bold ${isValid ? 'text-emerald-700' : totalWidth > 100 ? 'text-red-600' : 'text-amber-600'}`}>
                                    Total: {totalWidth}%
                                </div>
                            </div>
                            {isCustomActive && !isValid && (
                                <p className="text-[9px] font-bold text-red-500 mt-1">Warning: Custom widths apply ONLY when total is 100%.</p>
                            )}
                        </div>
                    </div>

                    {/* General Layout */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">General Layout</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Table Style</label>
                                <select value={bodySettings.bodyTableStyle || 'grid'} onChange={(e) => handleBodySettingChange('bodyTableStyle', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="horizontal">Horizontal Lines</option>
                                    <option value="grid">Grid (All Borders)</option>
                                    <option value="outer">Outer Lines Only</option>
                                    <option value="plain">Plain (No Borders)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Line Thickness</label>
                                <select value={bodySettings.gridLineThickness || '1'} onChange={(e) => handleBodySettingChange('gridLineThickness', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="1">1.5px (Standard)</option>
                                    <option value="1.75">1.75px</option>
                                    <option value="2.0">2.0px</option>
                                    <option value="2.25">2.25px</option>
                                    <option value="2">2.5px (Medium)</option>
                                    <option value="4">4.0px (Thick)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-1">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Family</label>
                                <select value={bodySettings.bodyFontFamily || 'font-sans'} onChange={(e) => handleBodySettingChange('bodyFontFamily', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="font-sans">Sans-serif</option>
                                    <option value="font-serif">Serif</option>
                                    <option value="font-mono">Monospace</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Calibri">Calibri</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Flag Styling & Colors */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">Flag Styling & Colors</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Flag Style</label>
                                <select value={bodySettings.flagStyle || 'lh'} onChange={(e) => handleBodySettingChange('flagStyle', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="lh">Letters (H / L)</option>
                                    <option value="arrows">Arrows (↑ / ↓)</option>
                                    <option value="star">Star (*)</option>
                                    <option value="text">Text (High/Norm/Low)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Low Color</label>
                                <div className="flex items-center gap-1.5 w-full h-6 px-1.5 border border-slate-200 rounded focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.flagColorLow || '#3b82f6'} onChange={(e) => handleBodySettingChange('flagColorLow', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.flagColorLow || '#3b82f6'} onChange={(e) => handleBodySettingChange('flagColorLow', e.target.value)} className="w-full text-[9.5px] outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Normal Color</label>
                                <div className="flex items-center gap-1.5 w-full h-6 px-1.5 border border-slate-200 rounded focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.flagColorNormal || '#000000'} onChange={(e) => handleBodySettingChange('flagColorNormal', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.flagColorNormal || '#000000'} onChange={(e) => handleBodySettingChange('flagColorNormal', e.target.value)} className="w-full text-[9.5px] outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">High Color</label>
                                <div className="flex items-center gap-1.5 w-full h-6 px-1.5 border border-slate-200 rounded focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.flagColorHigh || '#ef4444'} onChange={(e) => handleBodySettingChange('flagColorHigh', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.flagColorHigh || '#ef4444'} onChange={(e) => handleBodySettingChange('flagColorHigh', e.target.value)} className="w-full text-[9.5px] outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Header Row */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">Table Header Row</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Size</label>
                                <select value={bodySettings.headerFontSize || 'text-xs'} onChange={(e) => handleBodySettingChange('headerFontSize', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="text-[10px]">Small (10px)</option>
                                    <option value="text-[11px]">Normal (11px)</option>
                                    <option value="text-xs">Standard (12px)</option>
                                    <option value="text-[13px]">Medium (13px)</option>
                                    <option value="text-sm">Large (14px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Weight</label>
                                <select value={bodySettings.headerFontWeight || 'font-bold'} onChange={(e) => handleBodySettingChange('headerFontWeight', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="font-normal">Normal</option>
                                    <option value="font-medium">Medium</option>
                                    <option value="font-semibold">Semi-Bold</option>
                                    <option value="font-bold">Bold</option>
                                    <option value="font-extrabold">Extra Bold</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Padding</label>
                                <select value={bodySettings.headerRowHeight || 'py-1.5'} onChange={(e) => handleBodySettingChange('headerRowHeight', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="py-0">0px</option>
                                    <option value="py-px">1px</option>
                                    <option value="py-0.5">2px</option>
                                    <option value="py-1">4px</option>
                                    <option value="py-1.5">6px</option>
                                    <option value="py-2">8px</option>
                                    <option value="py-2.5">10px</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Radius</label>
                                <select value={bodySettings.headerBorderRadius || 'none'} onChange={(e) => handleBodySettingChange('headerBorderRadius', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="none">0px</option>
                                    <option value="sm">2px</option>
                                    <option value="md">6px</option>
                                    <option value="lg">8px</option>
                                    <option value="xl">12px</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">To Body Gap</label>
                                <select value={bodySettings.headerToBodyGap || '0'} onChange={(e) => handleBodySettingChange('headerToBodyGap', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="0">0px</option>
                                    <option value="2">2px</option>
                                    <option value="4">4px</option>
                                    <option value="6">6px</option>
                                    <option value="8">8px</option>
                                    <option value="12">12px</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">BG Color</label>
                                <div className="flex items-center gap-1.5 w-full h-6 px-1.5 border border-slate-200 rounded focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.bodyHeaderBgColor || '#ffffff'} onChange={(e) => handleBodySettingChange('bodyHeaderBgColor', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.bodyHeaderBgColor || '#ffffff'} onChange={(e) => handleBodySettingChange('bodyHeaderBgColor', e.target.value)} className="w-full text-[9.5px] outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Text Color</label>
                                <div className="flex items-center gap-1.5 w-full h-6 px-1.5 border border-slate-200 rounded focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.bodyHeaderTextColor || '#000000'} onChange={(e) => handleBodySettingChange('bodyHeaderTextColor', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.bodyHeaderTextColor || '#000000'} onChange={(e) => handleBodySettingChange('bodyHeaderTextColor', e.target.value)} className="w-full text-[9.5px] outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grouping & Structure */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">Grouping & Structure</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Header Repeat</label>
                                <select value={bodySettings.tableHeaderRepeat || 'test'} onChange={(e) => handleBodySettingChange('tableHeaderRepeat', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="test">Repeat for every Test</option>
                                    <option value="department">Repeat for Department</option>
                                    <option value="report">Once per Report</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Page Breaks</label>
                                <select value={bodySettings.separatePagesBy || 'none'} onChange={(e) => handleBodySettingChange('separatePagesBy', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="none">Continuous (No Breaks)</option>
                                    <option value="department">New Page per Dept</option>
                                    <option value="test">New Page per Test</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-[#9575cd] uppercase tracking-tight">Space Between Tests</label>
                                <select value={bodySettings.testBlockSpacing || 'mb-4'} onChange={(e) => handleBodySettingChange('testBlockSpacing', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-[#9575cd] bg-purple-50 text-[#5e35b1] font-bold rounded outline-none focus:ring-1 focus:ring-[#9575cd]">
                                    <option value="mb-0">None (0 space)</option>
                                    <option value="mb-2">Compact</option>
                                    <option value="mb-4">Standard</option>
                                    <option value="mb-8">Relaxed</option>
                                    <option value="mb-12">Spacious</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table Body Rows */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">Table Body Rows</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Size</label>
                                <select value={bodySettings.bodyFontSize || 'text-xs'} onChange={(e) => handleBodySettingChange('bodyFontSize', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="text-[10px]">Small (10px)</option>
                                    <option value="text-[11px]">Normal (11px)</option>
                                    <option value="text-xs">Standard (12px)</option>
                                    <option value="text-[13px]">Medium (13px)</option>
                                    <option value="text-sm">Large (14px)</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[8.5px] font-bold text-[#9575cd] uppercase tracking-tight">Row Padding</label>
                                    <span className="text-[8px] font-bold text-[#9575cd] bg-purple-50 border border-purple-100 px-1 py-0.2 rounded">{rowHeightValue}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="30" 
                                    step="1" 
                                    value={rowHeightValue} 
                                    onChange={(e) => handleBodySettingChange('bodyRowHeight', `${e.target.value}px`)} 
                                    className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-1" 
                                />
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Col Padding (X)</label>
                                <select value={bodySettings.bodyColPadding || 'px-2'} onChange={(e) => handleBodySettingChange('bodyColPadding', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="px-0">None (0px)</option>
                                    <option value="px-0.5">Ultra Tight (2px)</option>
                                    <option value="px-1">Tight (4px)</option>
                                    <option value="px-1.5">Compact (6px)</option>
                                    <option value="px-2">Normal (8px)</option>
                                    <option value="px-3">Wide (12px)</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[8.5px] font-bold text-[#9575cd] uppercase tracking-tight">Line Spacing</label>
                                    <span className="text-[8px] font-bold text-[#9575cd] bg-purple-50 border border-purple-100 px-1 py-0.2 rounded">{lineHeightValue}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="2.5" 
                                    step="0.05" 
                                    value={lineHeightValue} 
                                    onChange={(e) => handleBodySettingChange('bodyLineHeight', `${e.target.value}`)} 
                                    className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-1" 
                                />
                            </div>

                            <div className="flex flex-col gap-0.5 col-span-2 md:col-span-1">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Data Alignment</label>
                                <select value={bodySettings.bodyResultAlign || 'text-center'} onChange={(e) => handleBodySettingChange('bodyResultAlign', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="text-left">Left Align</option>
                                    <option value="text-center">Center Align</option>
                                    <option value="text-right">Right Align</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Titles & Subheadings */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">Titles & Subheadings</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Test Title Align</label>
                                <select value={bodySettings.testNameAlignment || 'text-center'} onChange={(e) => handleBodySettingChange('testNameAlignment', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="text-left">Left</option>
                                    <option value="text-center">Center</option>
                                    <option value="text-right">Right</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Test Title Size</label>
                                <select value={bodySettings.testNameSize || 'text-base'} onChange={(e) => handleBodySettingChange('testNameSize', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="text-sm">Small (14px)</option>
                                    <option value="text-base">Normal (16px)</option>
                                    <option value="text-lg">Large (18px)</option>
                                    <option value="text-xl">Extra Large (20px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Subheading Size</label>
                                <select value={bodySettings.subheadingSize || 'text-sm'} onChange={(e) => handleBodySettingChange('subheadingSize', e.target.value)} className="w-full h-6 text-[10px] px-1.5 py-0 border border-slate-200 rounded outline-none focus:border-[#9575cd] bg-white">
                                    <option value="text-xs">Small (12px)</option>
                                    <option value="text-sm">Normal (14px)</option>
                                    <option value="text-base">Large (16px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Subheading Color</label>
                                <div className="flex items-center gap-1.5 w-full h-6 px-1.5 border border-slate-200 rounded focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.subheadingColor || '#000000'} onChange={(e) => handleBodySettingChange('subheadingColor', e.target.value)} className="w-4 h-4 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.subheadingColor || '#000000'} onChange={(e) => handleBodySettingChange('subheadingColor', e.target.value)} className="w-full text-[9.5px] outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row Behaviors */}
                    <div>
                        <div className="w-full text-[9px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1 mb-2">Row Behaviors</div>
                        <div className="grid grid-cols-2 gap-1 md:gap-2.5">
                            {[
                                { key: 'testNameUnderline', label: 'Underline Test Name' },
                                { key: 'highlightAbnormal', label: 'Highlight Abnormal Values' },
                                { key: 'stripedRows', label: 'Striped Row Backgrounds' },
                                { key: 'showEndOfReport', label: 'Show End of Report Line' },
                            ].map((item) => {
                                const isChecked = bodySettings[item.key as keyof typeof bodySettings] ?? true;
                                return (
                                    <div key={item.key} onClick={() => handleToggleBody(item.key)} className={`px-2 py-1 md:p-2.5 rounded-md md:rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-1 ${isChecked ? 'border-[#9575cd] bg-purple-50/20' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                        <p className={`font-bold text-[9px] md:text-xs truncate ${isChecked ? 'text-[#5e35b1]' : 'text-slate-700'}`}>{item.label}</p>
                                        <span className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                            isChecked 
                                                ? 'bg-[#9575cd] text-white' 
                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}>
                                            {isChecked ? 'ON' : 'OFF'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}