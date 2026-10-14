import React from 'react';
import { LayoutTemplate, Search, Trash2, Settings2 } from 'lucide-react';

interface HeaderTabProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleToggleSetting: (field: string) => void;
    availableFields: any[];
    setAvailableFields: React.Dispatch<React.SetStateAction<any[]>>;
    leftColFields: any[];
    setLeftColFields: React.Dispatch<React.SetStateAction<any[]>>;
    rightColFields: any[];
    setRightColFields: React.Dispatch<React.SetStateAction<any[]>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

export default function HeaderTab({
    formData, handleChange, handleToggleSetting,
    availableFields, setAvailableFields,
    leftColFields, setLeftColFields,
    rightColFields, setRightColFields,
    searchQuery, setSearchQuery
}: HeaderTabProps) {

    const handleAddField = (field: any, target: 'left' | 'right') => {
        setAvailableFields(prev => prev.filter(f => f.key !== field.key));
        if (target === 'left') setLeftColFields(prev => [...prev, field]);
        if (target === 'right') setRightColFields(prev => [...prev, field]);
    };

    const handleRemoveField = (field: any, source: 'left' | 'right') => {
        if (source === 'left') setLeftColFields(prev => prev.filter(f => f.key !== field.key));
        if (source === 'right') setRightColFields(prev => prev.filter(f => f.key !== field.key));
        setAvailableFields(prev => [...prev, field]);
    };

    const filteredAvailableFields = availableFields.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col gap-2.5 w-full h-auto md:h-full md:overflow-y-auto custom-scrollbar md:pr-2 pb-2">
            
            {/* Table Styling & Typography */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <Settings2 size={14} className="text-[#9575cd]" />
                    <h3 className="font-bold text-slate-800 text-[11px] md:text-sm">Table Styling & Typography</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2.5 gap-y-2">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Table Style</label>
                        <select name="tableStyle" value={formData.tableStyle} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <option value="none">Plain</option>
                            <option value="split">Split Blocks</option>
                            <option value="horizontal">Horizontal</option>
                            <option value="grid">Grid Border</option>
                            <option value="outer">Outer Border</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Family</label>
                        <select name="fontFamily" value={formData.fontFamily || 'font-sans'} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <optgroup label="System Basics">
                                <option value="font-sans">Sans Serif</option>
                                <option value="font-serif">Serif</option>
                                <option value="font-mono">Monospace</option>
                            </optgroup>
                            <optgroup label="Universal Web Safe">
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                                <option value="Verdana, sans-serif">Verdana</option>
                                <option value="Tahoma, sans-serif">Tahoma</option>
                                <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="Garamond, serif">Garamond</option>
                                <option value="'Courier New', Courier, monospace">Courier New</option>
                                <option value="'Brush Script MT', cursive">Brush Script</option>
                                <option value="Impact, fantasy">Impact</option>
                            </optgroup>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Font Size</label>
                        <select name="fontSize" value={formData.fontSize} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <option value="text-[10px]">Small (10px)</option>
                            <option value="text-[11px]">Normal (11px)</option>
                            <option value="text-xs">Standard (12px)</option>
                            <option value="text-sm">Large (14px)</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Row Padding</label>
                        <select name="rowPadding" value={formData.rowPadding} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <option value="py-0.5">Compact</option>
                            <option value="py-1.5">Standard</option>
                            <option value="py-2.5">Relaxed</option>
                        </select>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Left Split</label>
                        <select name="leftColWidth" value={formData.leftColWidth} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <option value="35 65">35% | 65%</option>
                            <option value="40 60">40% | 60%</option>
                            <option value="50 50">50% | 50%</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Right Split</label>
                        <select name="rightColWidth" value={formData.rightColWidth} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <option value="35 65">35% | 65%</option>
                            <option value="40 60">40% | 60%</option>
                            <option value="50 50">50% | 50%</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-2 md:col-span-1">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Center Gap</label>
                        <select name="headerColumnGap" value={formData.headerColumnGap || "2"} onChange={handleChange} className="w-full h-6 text-[10px] px-1.5 py-0 bg-white border border-slate-200 rounded outline-none focus:border-[#9575cd]">
                            <option value="0">None (0)</option>
                            <option value="2">Compact (2)</option>
                            <option value="4">Standard (4)</option>
                            <option value="6">Medium (6)</option>
                            <option value="8">Wide (8)</option>
                            <option value="10">Extra Wide (10)</option>
                            <option value="12">Spacious (12)</option>
                            <option value="16">Maximum (16)</option>
                        </select>
                    </div>

                    <div className="col-span-2 md:col-span-4 flex items-center gap-3 pt-0.5 pl-1">
                        <label className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={formData.labelBold} onChange={() => handleToggleSetting('labelBold')} className="accent-[#9575cd] w-3 h-3 rounded" /> 
                            Bold Labels
                        </label>
                        <label className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={formData.dataBold} onChange={() => handleToggleSetting('dataBold')} className="accent-[#9575cd] w-3 h-3 rounded" /> 
                            Bold Data
                        </label>
                    </div>
                </div>
            </div>

            {/* Field Builder */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl flex flex-col md:flex-1 md:overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-slate-100 p-2.5 md:p-3 bg-white shrink-0">
                    <LayoutTemplate size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Demographics Field Builder</h3>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-none">Allocate registration fields to left or right columns.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2.5 p-2.5 md:flex-1 md:overflow-hidden bg-white">
                    {/* Available Fields Column */}
                    <div className="w-full md:w-[45%] flex flex-col h-48 md:h-full bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0">
                        <div className="p-1.5 border-b border-slate-100 bg-white shrink-0">
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2 h-6 focus-within:border-[#9575cd]">
                                <Search size={12} className="text-slate-400 shrink-0" />
                                <input 
                                    type="text" 
                                    placeholder="Search fields..." 
                                    className="w-full text-[10px] outline-none bg-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1 bg-white">
                            {filteredAvailableFields.map(field => (
                                <div key={field.key} className="group flex items-center justify-between gap-1 p-1 px-1.5 bg-white border border-slate-200 rounded hover:border-[#9575cd] transition-colors">
                                    <span className="text-[10px] font-semibold text-slate-700 truncate">{field.label}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleAddField(field, 'left')} className="h-5 px-1.5 bg-slate-50 hover:bg-[#9575cd] hover:text-white border border-slate-200 text-slate-600 text-[8.5px] font-bold rounded transition-colors text-center">Left</button>
                                        <button onClick={() => handleAddField(field, 'right')} className="h-5 px-1.5 bg-slate-50 hover:bg-[#9575cd] hover:text-white border border-slate-200 text-slate-600 text-[8.5px] font-bold rounded transition-colors text-center">Right</button>
                                    </div>
                                </div>
                            ))}
                            {filteredAvailableFields.length === 0 && (
                                <div className="text-center p-3 text-[10px] text-slate-400">No fields found.</div>
                            )}
                        </div>
                    </div>

                    {/* Columns Stack */}
                    <div className="w-full md:w-[55%] flex flex-col sm:flex-row md:flex-col gap-2 h-auto md:h-full bg-white">
                        {/* Left Column Box */}
                        <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[110px] max-h-40 md:max-h-none">
                            <div className="bg-white border-b border-slate-100 p-1.5 shrink-0 flex items-center justify-between px-2">
                                <h4 className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Left Column</h4>
                                <span className="text-[8.5px] font-bold text-[#9575cd] bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">{leftColFields.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1 bg-white">
                                {leftColFields.map((field, idx) => (
                                    <div key={field.key} className="flex justify-between items-center p-1 px-1.5 bg-white border border-[#9575cd]/30 shadow-2xs rounded">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-[8px] font-bold text-[#9575cd] bg-purple-50 w-3.5 h-3.5 flex items-center justify-center rounded shrink-0">{idx + 1}</span>
                                            <span className="text-[10px] font-medium text-slate-700 truncate">{field.label}</span>
                                        </div>
                                        <button onClick={() => handleRemoveField(field, 'left')} className="text-slate-400 hover:text-red-500 transition-colors p-0.5 shrink-0"><Trash2 size={11} /></button>
                                    </div>
                                ))}
                                {leftColFields.length === 0 && <div className="text-center text-[9px] text-slate-400 italic mt-3">Empty</div>}
                            </div>
                        </div>

                        {/* Right Column Box */}
                        <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[110px] max-h-40 md:max-h-none">
                            <div className="bg-white border-b border-slate-100 p-1.5 shrink-0 flex items-center justify-between px-2">
                                <h4 className="text-[9px] font-bold text-slate-700 uppercase tracking-wider">Right Column</h4>
                                <span className="text-[8.5px] font-bold text-[#9575cd] bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">{rightColFields.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1 bg-white">
                                {rightColFields.map((field, idx) => (
                                    <div key={field.key} className="flex justify-between items-center p-1 px-1.5 bg-white border border-[#9575cd]/30 shadow-2xs rounded">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-[8px] font-bold text-[#9575cd] bg-purple-50 w-3.5 h-3.5 flex items-center justify-center rounded shrink-0">{idx + 1}</span>
                                            <span className="text-[10px] font-medium text-slate-700 truncate">{field.label}</span>
                                        </div>
                                        <button onClick={() => handleRemoveField(field, 'right')} className="text-slate-400 hover:text-red-500 transition-colors p-0.5 shrink-0"><Trash2 size={11} /></button>
                                    </div>
                                ))}
                                {rightColFields.length === 0 && <div className="text-center text-[9px] text-slate-400 italic mt-3">Empty</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}