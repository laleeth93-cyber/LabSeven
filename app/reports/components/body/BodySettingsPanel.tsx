import React from 'react';

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

    return (
        <div className="w-full flex flex-col gap-5">
            
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">Table Content</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Toggle and configure the columns displayed in the results table.</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-start content-start">
                    <div className={`w-full max-w-[280px] p-3 rounded-xl border transition-all flex flex-col gap-3 ${bodySettings.showMethodCol ? 'border-[#9575cd] bg-purple-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => handleToggleBody('showMethodCol')}>
                            <div><p className={`font-bold text-xs ${bodySettings.showMethodCol ? 'text-[#5e35b1]' : 'text-slate-700'}`}>Analytical Method</p></div>
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${bodySettings.showMethodCol ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all ${bodySettings.showMethodCol ? 'right-[2px]' : 'left-[2px]'}`}></div>
                            </div>
                        </div>
                        {bodySettings.showMethodCol && (
                            <div className="pt-2 border-t border-[#9575cd]/20 flex flex-col gap-2 mt-1">
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer">
                                    <input type="radio" checked={bodySettings.methodDisplayStyle === 'column'} onChange={() => handleBodySettingChange('methodDisplayStyle', 'column')} className="accent-[#9575cd] w-3.5 h-3.5" />
                                    Discrete Column
                                </label>
                                <label className="flex items-center gap-2 text-[11px] font-bold text-slate-600 cursor-pointer">
                                    <input type="radio" checked={bodySettings.methodDisplayStyle === 'beneath'} onChange={() => handleBodySettingChange('methodDisplayStyle', 'beneath')} className="accent-[#9575cd] w-3.5 h-3.5" />
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
                        <div key={item.key} onClick={() => handleToggleBody(item.key)} className={`w-auto min-w-[160px] p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${finalChecked ? 'border-[#9575cd] bg-purple-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <div><p className={`font-bold text-xs ${finalChecked ? 'text-[#5e35b1]' : 'text-slate-700'}`}>{item.label}</p></div>
                            <div className={`shrink-0 w-8 h-4 rounded-full transition-colors relative ${finalChecked ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all ${finalChecked ? 'right-[2px]' : 'left-[2px]'}`}></div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">Table Design & Typography</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Customize the borders, fonts, colors, and layout of the results table.</p>
                </div>
                
                <div className="flex flex-col gap-6">
                    
                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3 flex justify-between items-center">
                            <span>Individual Column Widths</span>
                            <span className="text-[9px] text-slate-400 normal-case font-medium">Sum must equal exactly 100%</span>
                        </div>
                        
                        <div className={`p-4 rounded-xl border transition-colors ${isCustomActive ? (isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex flex-wrap gap-3 mb-4">
                                <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
                                    <label className="text-[10px] font-bold text-slate-600">Parameter %</label>
                                    <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthParam || ''} onChange={(e) => handleBodySettingChange('colWidthParam', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white" />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
                                    <label className="text-[10px] font-bold text-slate-600">Result %</label>
                                    <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthResult || ''} onChange={(e) => handleBodySettingChange('colWidthResult', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white" />
                                </div>
                                {bodySettings.showFlagCol !== false && (
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
                                        <label className="text-[10px] font-bold text-slate-600">Flag %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthFlag || ''} onChange={(e) => handleBodySettingChange('colWidthFlag', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                                {bodySettings.showUnitCol !== false && (
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
                                        <label className="text-[10px] font-bold text-slate-600">Units %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthUnit || ''} onChange={(e) => handleBodySettingChange('colWidthUnit', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                                {bodySettings.showRefRangeCol !== false && (
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
                                        <label className="text-[10px] font-bold text-slate-600">Ref. Range %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthRef || ''} onChange={(e) => handleBodySettingChange('colWidthRef', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                                {bodySettings.showMethodCol && bodySettings.methodDisplayStyle === 'column' && (
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[80px]">
                                        <label className="text-[10px] font-bold text-slate-600">Method %</label>
                                        <input type="number" placeholder="Auto" min="0" max="100" value={bodySettings.colWidthMethod || ''} onChange={(e) => handleBodySettingChange('colWidthMethod', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all ${isValid ? 'bg-emerald-500' : totalWidth > 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(totalWidth, 100)}%` }}></div>
                                </div>
                                <div className={`text-xs font-bold ${isValid ? 'text-emerald-700' : totalWidth > 100 ? 'text-red-600' : 'text-amber-600'}`}>
                                    Total: {totalWidth}%
                                </div>
                            </div>
                            {isCustomActive && !isValid && (
                                <p className="text-[10px] font-bold text-red-500 mt-2">Warning: Custom widths will ONLY be applied if the total is exactly 100%.</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">General Layout</div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Table Style</label>
                                <select value={bodySettings.bodyTableStyle || 'grid'} onChange={(e) => handleBodySettingChange('bodyTableStyle', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="horizontal">Horizontal Lines</option>
                                    <option value="grid">Grid (All Borders)</option>
                                    <option value="outer">Outer Lines Only</option>
                                    <option value="plain">Plain (No Borders)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Line Thickness</label>
                                <select value={bodySettings.gridLineThickness || '1'} onChange={(e) => handleBodySettingChange('gridLineThickness', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="1">1.5px (Standard)</option>
                                    <option value="1.75">1.75px</option>
                                    <option value="2.0">2.0px</option>
                                    <option value="2.25">2.25px</option>
                                    <option value="2">2.5px (Medium)</option>
                                    <option value="4">4.0px (Thick)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Font Family</label>
                                <select value={bodySettings.bodyFontFamily || 'font-sans'} onChange={(e) => handleBodySettingChange('bodyFontFamily', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
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

                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">Flag Styling & Colors</div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Flag Style</label>
                                <select value={bodySettings.flagStyle || 'lh'} onChange={(e) => handleBodySettingChange('flagStyle', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="lh">Letters (H / L)</option>
                                    <option value="arrows">Arrows (↑ / ↓)</option>
                                    <option value="star">Star (*)</option>
                                    <option value="text">Text (High/Normal/Low)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Low Color</label>
                                <div className="flex items-center gap-2 w-full p-1.5 border border-slate-300 rounded-lg focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.flagColorLow || '#3b82f6'} onChange={(e) => handleBodySettingChange('flagColorLow', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.flagColorLow || '#3b82f6'} onChange={(e) => handleBodySettingChange('flagColorLow', e.target.value)} className="w-full text-xs outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Normal Color</label>
                                <div className="flex items-center gap-2 w-full p-1.5 border border-slate-300 rounded-lg focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.flagColorNormal || '#000000'} onChange={(e) => handleBodySettingChange('flagColorNormal', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.flagColorNormal || '#000000'} onChange={(e) => handleBodySettingChange('flagColorNormal', e.target.value)} className="w-full text-xs outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">High Color</label>
                                <div className="flex items-center gap-2 w-full p-1.5 border border-slate-300 rounded-lg focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.flagColorHigh || '#ef4444'} onChange={(e) => handleBodySettingChange('flagColorHigh', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.flagColorHigh || '#ef4444'} onChange={(e) => handleBodySettingChange('flagColorHigh', e.target.value)} className="w-full text-xs outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">Table Header Row</div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Header Font Size</label>
                                <select value={bodySettings.headerFontSize || 'text-xs'} onChange={(e) => handleBodySettingChange('headerFontSize', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="text-[10px]">Small (10px)</option>
                                    <option value="text-[11px]">Normal (11px)</option>
                                    <option value="text-xs">Standard (12px)</option>
                                    <option value="text-[13px]">Medium (13px)</option>
                                    <option value="text-sm">Large (14px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Header Font Style</label>
                                <select value={bodySettings.headerFontWeight || 'font-bold'} onChange={(e) => handleBodySettingChange('headerFontWeight', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="font-normal">Normal</option>
                                    <option value="font-medium">Medium</option>
                                    <option value="font-semibold">Semi-Bold</option>
                                    <option value="font-bold">Bold</option>
                                    <option value="font-extrabold">Extra Bold</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Header Padding</label>
                                <select value={bodySettings.headerRowHeight || 'py-1.5'} onChange={(e) => handleBodySettingChange('headerRowHeight', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="py-0">Ultra Compact (0px)</option>
                                    <option value="py-px">Extra Compact (1px)</option>
                                    <option value="py-0.5">Very Compact (2px)</option>
                                    <option value="py-1">Compact (4px)</option>
                                    <option value="py-1.5">Normal (6px)</option>
                                    <option value="py-2">Comfortable (8px)</option>
                                    <option value="py-2.5">Relaxed (10px)</option>
                                    <option value="py-3">Spacious (12px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Header Border Radius</label>
                                <select value={bodySettings.headerBorderRadius || 'none'} onChange={(e) => handleBodySettingChange('headerBorderRadius', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="none">None (0px)</option>
                                    <option value="sm">Small (2px)</option>
                                    <option value="md">Medium (6px)</option>
                                    <option value="lg">Large (8px)</option>
                                    <option value="xl">Extra Large (12px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Header BG Color</label>
                                <div className="flex items-center gap-2 w-full p-1.5 border border-slate-300 rounded-lg focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.bodyHeaderBgColor || '#ffffff'} onChange={(e) => handleBodySettingChange('bodyHeaderBgColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.bodyHeaderBgColor || '#ffffff'} onChange={(e) => handleBodySettingChange('bodyHeaderBgColor', e.target.value)} className="w-full text-xs outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Header Text Color</label>
                                <div className="flex items-center gap-2 w-full p-1.5 border border-slate-300 rounded-lg focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.bodyHeaderTextColor || '#000000'} onChange={(e) => handleBodySettingChange('bodyHeaderTextColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.bodyHeaderTextColor || '#000000'} onChange={(e) => handleBodySettingChange('bodyHeaderTextColor', e.target.value)} className="w-full text-xs outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">Grouping & Structure</div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Table Header Repeat</label>
                                <select value={bodySettings.tableHeaderRepeat || 'test'} onChange={(e) => handleBodySettingChange('tableHeaderRepeat', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="test">Repeat for every Test (Default)</option>
                                    <option value="department">Repeat for every Department</option>
                                    <option value="report">Print Once per Report</option>
                                </select>
                                <p className="text-[9px] text-slate-400">Controls how often the "Test Parameter, Result..." header row prints.</p>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Automatic Page Breaks</label>
                                <select value={bodySettings.separatePagesBy || 'none'} onChange={(e) => handleBodySettingChange('separatePagesBy', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="none">Continuous (No Breaks)</option>
                                    <option value="department">New Page per Department</option>
                                    <option value="test">New Page per Test</option>
                                </select>
                                <p className="text-[9px] text-slate-400">Forces a fresh page when the selected group changes.</p>
                            </div>
                            {/* ✨ NEW FEATURE: Space Between Tests */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-[#9575cd] uppercase">Space Between Tests</label>
                                <select value={bodySettings.testBlockSpacing || 'mb-4'} onChange={(e) => handleBodySettingChange('testBlockSpacing', e.target.value)} className="w-full text-xs p-2 border border-[#9575cd] bg-purple-50 text-[#5e35b1] font-bold rounded-lg outline-none focus:ring-1 focus:ring-[#9575cd]">
                                    <option value="mb-0">None (0 space)</option>
                                    <option value="mb-2">Compact</option>
                                    <option value="mb-4">Standard</option>
                                    <option value="mb-8">Relaxed</option>
                                    <option value="mb-12">Spacious</option>
                                </select>
                                <p className="text-[9px] text-slate-400">Controls the vertical padding between different test groups.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">Table Body Rows</div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Body Font Size</label>
                                <select value={bodySettings.bodyFontSize || 'text-xs'} onChange={(e) => handleBodySettingChange('bodyFontSize', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="text-[10px]">Small (10px)</option>
                                    <option value="text-[11px]">Normal (11px)</option>
                                    <option value="text-xs">Standard (12px)</option>
                                    <option value="text-[13px]">Medium (13px)</option>
                                    <option value="text-sm">Large (14px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Row Padding (Y)</label>
                                <select value={bodySettings.bodyRowHeight || 'py-1.5'} onChange={(e) => handleBodySettingChange('bodyRowHeight', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="py-0">Ultra Compact (0px)</option>
                                    <option value="py-px">Extra Compact (1px)</option>
                                    <option value="py-0.5">Very Compact (2px)</option>
                                    <option value="py-1">Compact (4px)</option>
                                    <option value="py-1.5">Normal (6px)</option>
                                    <option value="py-2">Comfortable (8px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Column Padding (X)</label>
                                <select value={bodySettings.bodyColPadding || 'px-2'} onChange={(e) => handleBodySettingChange('bodyColPadding', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="px-0">None (0px)</option>
                                    <option value="px-0.5">Ultra Tight (2px)</option>
                                    <option value="px-1">Tight (4px)</option>
                                    <option value="px-1.5">Compact (6px)</option>
                                    <option value="px-2">Normal (8px)</option>
                                    <option value="px-3">Wide (12px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Line Spacing</label>
                                <select value={bodySettings.bodyLineHeight || '1.5'} onChange={(e) => handleBodySettingChange('bodyLineHeight', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="1">Ultra Tight (1.0)</option>
                                    <option value="1.15">Tight (1.15)</option>
                                    <option value="1.3">Compact (1.3)</option>
                                    <option value="1.5">Normal (1.5)</option>
                                    <option value="1.8">Relaxed (1.8)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Data Alignment</label>
                                <select value={bodySettings.bodyResultAlign || 'text-center'} onChange={(e) => handleBodySettingChange('bodyResultAlign', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="text-left">Left Align</option>
                                    <option value="text-center">Center Align</option>
                                    <option value="text-right">Right Align</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">Titles & Subheadings</div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Test Title Align</label>
                                <select value={bodySettings.testNameAlignment || 'text-center'} onChange={(e) => handleBodySettingChange('testNameAlignment', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="text-left">Left</option>
                                    <option value="text-center">Center</option>
                                    <option value="text-right">Right</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Test Title Size</label>
                                <select value={bodySettings.testNameSize || 'text-base'} onChange={(e) => handleBodySettingChange('testNameSize', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="text-sm">Small (14px)</option>
                                    <option value="text-base">Normal (16px)</option>
                                    <option value="text-lg">Large (18px)</option>
                                    <option value="text-xl">Extra Large (20px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Subheading Size</label>
                                <select value={bodySettings.subheadingSize || 'text-sm'} onChange={(e) => handleBodySettingChange('subheadingSize', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                                    <option value="text-xs">Small (12px)</option>
                                    <option value="text-sm">Normal (14px)</option>
                                    <option value="text-base">Large (16px)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Subheading Color</label>
                                <div className="flex items-center gap-2 w-full p-1.5 border border-slate-300 rounded-lg focus-within:border-[#9575cd] bg-white">
                                    <input type="color" value={bodySettings.subheadingColor || '#000000'} onChange={(e) => handleBodySettingChange('subheadingColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0 bg-transparent" />
                                    <input type="text" value={bodySettings.subheadingColor || '#000000'} onChange={(e) => handleBodySettingChange('subheadingColor', e.target.value)} className="w-full text-xs outline-none bg-transparent uppercase font-mono text-slate-600" maxLength={7}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="w-full text-[10px] font-bold text-[#9575cd] uppercase border-b border-slate-100 pb-1.5 mb-3">Row Behaviors</div>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { key: 'testNameUnderline', label: 'Underline Test Name' },
                                { key: 'highlightAbnormal', label: 'Highlight Abnormal Values' },
                                { key: 'stripedRows', label: 'Striped Row Backgrounds' },
                                { key: 'showEndOfReport', label: 'Show End of Report Line' },
                            ].map((item) => {
                                const isChecked = bodySettings[item.key as keyof typeof bodySettings] ?? true;
                                return (
                                <div key={item.key} onClick={() => handleToggleBody(item.key)} className={`flex-1 min-w-[200px] p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${isChecked ? 'border-[#9575cd] bg-purple-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                    <div><p className={`font-bold text-xs ${isChecked ? 'text-[#5e35b1]' : 'text-slate-700'}`}>{item.label}</p></div>
                                    <div className={`shrink-0 w-8 h-4 rounded-full transition-colors relative ${isChecked ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all ${isChecked ? 'right-[2px]' : 'left-[2px]'}`}></div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}