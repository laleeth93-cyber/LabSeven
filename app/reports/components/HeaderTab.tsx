// --- app/reports/components/HeaderTab.tsx Block Open ---
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
        <div className="flex flex-col gap-4 h-full w-full overflow-y-auto custom-scrollbar pr-2 pb-4">
            
            {/* Table Styling & Typography */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <Settings2 size={16} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Table Styling & Typography</h3>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-x-3 gap-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Table Style</label>
                        <select name="tableStyle" value={formData.tableStyle} onChange={handleChange} className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="none">Plain</option>
                            <option value="split">Split Blocks</option>
                            <option value="horizontal">Horizontal</option>
                            <option value="grid">Grid Border</option>
                            <option value="outer">Outer Border</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Font Family</label>
                        <select name="fontFamily" value={formData.fontFamily || 'font-sans'} onChange={handleChange} className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
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
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Font Size</label>
                        <select name="fontSize" value={formData.fontSize} onChange={handleChange} className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="text-[10px]">Small (10px)</option>
                            <option value="text-[11px]">Normal (11px)</option>
                            <option value="text-xs">Standard (12px)</option>
                            <option value="text-sm">Large (14px)</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Row Padding</label>
                        <select name="rowPadding" value={formData.rowPadding} onChange={handleChange} className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="py-0.5">Compact</option>
                            <option value="py-1.5">Standard</option>
                            <option value="py-2.5">Relaxed</option>
                        </select>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Left Split</label>
                        <select name="leftColWidth" value={formData.leftColWidth} onChange={handleChange} className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="35 65">35% | 65%</option>
                            <option value="40 60">40% | 60%</option>
                            <option value="50 50">50% | 50%</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Right Split</label>
                        <select name="rightColWidth" value={formData.rightColWidth} onChange={handleChange} className="w-full text-[11px] p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="35 65">35% | 65%</option>
                            <option value="40 60">40% | 60%</option>
                            <option value="50 50">50% | 50%</option>
                        </select>
                    </div>
                    <div className="col-span-2 flex items-center gap-4 pt-4 pl-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={formData.labelBold} onChange={() => handleToggleSetting('labelBold')} className="accent-[#9575cd] w-3.5 h-3.5 rounded" /> 
                            Bold Labels
                        </label>
                        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={formData.dataBold} onChange={() => handleToggleSetting('dataBold')} className="accent-[#9575cd] w-3.5 h-3.5 rounded" /> 
                            Bold Data
                        </label>
                    </div>
                </div>
            </div>

            {/* Field Builder */}
            <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col overflow-hidden min-h-[400px]">
                <div className="flex items-center gap-2 border-b border-slate-100 p-4 pb-3 bg-slate-50/50 shrink-0">
                    <LayoutTemplate size={16} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Demographics Field Builder</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Allocate registration fields to the left or right columns.</p>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 p-4 overflow-hidden">
                    <div className="w-[45%] flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-2 border-b border-slate-200 bg-slate-50 shrink-0">
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2 py-1 focus-within:border-[#9575cd]">
                                <Search size={14} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search fields..." 
                                    className="w-full text-[11px] outline-none bg-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 bg-slate-50/30">
                            {filteredAvailableFields.map(field => (
                                <div key={field.key} className="group flex flex-col gap-1 p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#9575cd] transition-colors">
                                    <span className="text-[11px] font-bold text-slate-700 block truncate">{field.label}</span>
                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleAddField(field, 'left')} className="flex-1 bg-slate-100 hover:bg-[#9575cd] hover:text-white text-slate-600 text-[9px] font-bold py-1 rounded transition-colors text-center">Left Col</button>
                                        <button onClick={() => handleAddField(field, 'right')} className="flex-1 bg-slate-100 hover:bg-[#9575cd] hover:text-white text-slate-600 text-[9px] font-bold py-1 rounded transition-colors text-center">Right Col</button>
                                    </div>
                                </div>
                            ))}
                            {filteredAvailableFields.length === 0 && (
                                <div className="text-center p-4 text-xs text-slate-400">No fields found.</div>
                            )}
                        </div>
                    </div>

                    <div className="w-[55%] flex flex-col gap-3 h-full">
                        <div className="flex-1 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <div className="bg-slate-100 border-b border-slate-200 p-1.5 shrink-0">
                                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider text-center">Left Column</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                {leftColFields.map((field, idx) => (
                                    <div key={field.key} className="flex justify-between items-center p-1.5 bg-white border border-[#9575cd]/30 shadow-sm rounded-lg">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-[9px] font-bold text-[#9575cd] bg-purple-50 w-4 h-4 flex items-center justify-center rounded shrink-0">{idx + 1}</span>
                                            <span className="text-[11px] font-semibold text-slate-700 truncate">{field.label}</span>
                                        </div>
                                        <button onClick={() => handleRemoveField(field, 'left')} className="text-slate-400 hover:text-red-500 transition-colors p-0.5 shrink-0"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                                {leftColFields.length === 0 && <div className="text-center text-[10px] text-slate-400 italic mt-4">Empty</div>}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <div className="bg-slate-100 border-b border-slate-200 p-1.5 shrink-0">
                                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider text-center">Right Column</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1">
                                {rightColFields.map((field, idx) => (
                                    <div key={field.key} className="flex justify-between items-center p-1.5 bg-white border border-[#9575cd]/30 shadow-sm rounded-lg">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="text-[9px] font-bold text-[#9575cd] bg-purple-50 w-4 h-4 flex items-center justify-center rounded shrink-0">{idx + 1}</span>
                                            <span className="text-[11px] font-semibold text-slate-700 truncate">{field.label}</span>
                                        </div>
                                        <button onClick={() => handleRemoveField(field, 'right')} className="text-slate-400 hover:text-red-500 transition-colors p-0.5 shrink-0"><Trash2 size={12} /></button>
                                    </div>
                                ))}
                                {rightColFields.length === 0 && <div className="text-center text-[10px] text-slate-400 italic mt-4">Empty</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
// --- app/reports/components/HeaderTab.tsx Block Close ---