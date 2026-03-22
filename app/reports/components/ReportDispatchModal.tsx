// --- BLOCK app/reports/components/ReportDispatchModal.tsx OPEN ---
import React, { useState } from 'react';
import { Loader2, X, Send, CheckCircle, Download, ListChecks, LayoutTemplate, Share2, Clock, Eye, Settings } from 'lucide-react';
import EntryDateTimePicker from '@/app/results/entry/components/EntryDateTimePicker';

interface ReportDispatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfPreviewUrl: string | null;
    isPreviewLoading: boolean;
    handleDirectDownload: () => void;
    printHeaderFooter: boolean;
    onToggleHeaderFooter: (val: boolean) => void;
    letterheadStyle: string;
    onChangeLetterheadStyle: (val: string) => void;
    separateDept: boolean;
    onToggleSeparateDept: (val: boolean) => void;
    separateTest: boolean;
    onToggleSeparateTest: (val: boolean) => void;
    billItems: any[];
    selectedItemIds: number[];
    onToggleItem: (id: number, checked: boolean) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;

    // Time Override Props
    overrideCollectionDate?: string;
    setOverrideCollectionDate?: (val: string) => void;
    overrideReportedDate?: string;
    setOverrideReportedDate?: (val: string) => void;
}

export default function ReportDispatchModal({
    isOpen, onClose, pdfPreviewUrl, isPreviewLoading, handleDirectDownload,
    printHeaderFooter, onToggleHeaderFooter, letterheadStyle, onChangeLetterheadStyle,
    separateDept, onToggleSeparateDept, separateTest, onToggleSeparateTest,
    billItems, selectedItemIds, onToggleItem, onSelectAll, onDeselectAll,
    overrideCollectionDate, setOverrideCollectionDate, overrideReportedDate, setOverrideReportedDate
}: ReportDispatchModalProps) {
    const [panelSendLetterhead, setPanelSendLetterhead] = useState(true);
    const [panelDispatchMode, setPanelDispatchMode] = useState('Manual WhatsApp');
    
    // MOBILE TAB STATE: Controls which panel is visible on small screens
    const [activeTab, setActiveTab] = useState<'preview' | 'tests' | 'dispatch'>('preview');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-0 lg:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-none lg:rounded-2xl shadow-2xl w-full h-[100dvh] lg:h-[85vh] lg:max-w-7xl flex flex-col lg:flex-row border border-slate-200 overflow-hidden relative">
                
                {/* --- MOBILE TABS HEADER --- */}
                <div className="flex lg:hidden bg-slate-50 border-b border-slate-200 shrink-0 w-full">
                    <button onClick={() => setActiveTab('tests')} className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition-colors ${activeTab === 'tests' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}>
                        <ListChecks size={14} /> Tests
                    </button>
                    <button onClick={() => setActiveTab('preview')} className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition-colors ${activeTab === 'preview' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}>
                        <Eye size={14} /> Preview
                    </button>
                    <button onClick={() => setActiveTab('dispatch')} className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold border-b-2 transition-colors ${activeTab === 'dispatch' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}>
                        <Settings size={14} /> Dispatch
                    </button>
                    <button onClick={onClose} className="px-4 text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors border-l border-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* 1. LEFT PANEL: TEST SELECTION */}
                <div className={`w-full lg:w-[280px] bg-slate-50 border-r border-slate-200 flex-col shrink-0 h-full ${activeTab === 'tests' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="hidden lg:flex justify-between items-center p-4 border-b border-slate-200 bg-white shrink-0">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                            <ListChecks size={18} className="text-[#9575cd]" /> Include Tests
                        </h2>
                    </div>

                    <div className="p-3 flex justify-between items-center shrink-0">
                        <span className="text-xs font-medium text-slate-500">{selectedItemIds.length} Selected</span>
                        <div className="flex gap-2">
                            <button onClick={onSelectAll} className="text-[10px] font-bold text-[#9575cd] hover:bg-purple-100 bg-purple-50 px-2 py-1 rounded transition-colors border border-purple-100">Select All</button>
                            <button onClick={onDeselectAll} className="text-[10px] font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 bg-white px-2 py-1 rounded transition-colors border border-slate-200">Clear</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 pt-0 custom-scrollbar flex flex-col gap-1.5 min-h-0">
                        {billItems && billItems.length > 0 ? (
                            billItems.map((item: any) => {
                                const testName = item.test?.displayName || item.test?.name || item.testName || 'Unknown Test';
                                const isSelected = selectedItemIds.includes(item.id);
                                const isPending = item.status === 'Pending';

                                return (
                                    <label key={item.id} className={`flex items-start gap-3 p-2.5 rounded-xl transition-all border ${
                                        isPending ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' :
                                        isSelected ? 'bg-white shadow-sm border-[#9575cd]/30 ring-1 ring-[#9575cd]/10 cursor-pointer' : 
                                        'bg-white/50 border-transparent hover:border-slate-200 hover:bg-white cursor-pointer'
                                    }`}>
                                        <div className="relative flex items-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected && !isPending}
                                                disabled={isPending}
                                                onChange={(e) => !isPending && onToggleItem(item.id, e.target.checked)}
                                                className={`w-4 h-4 rounded border-slate-300 text-[#9575cd] focus:ring-[#9575cd] accent-[#9575cd] ${isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-medium leading-tight transition-colors ${isSelected && !isPending ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {testName}
                                            </span>
                                            {isPending && (
                                                <span className="text-[10px] font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                                                    ● Pending Entry
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                );
                            })
                        ) : (
                            <div className="text-center p-4 text-xs text-slate-400">No tests available.</div>
                        )}
                    </div>
                </div>

                {/* 2. CENTER PANEL: NATIVE PDF VIEWER */}
                <div className={`flex-1 bg-[#525659] relative flex-col h-full min-h-0 ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
                    <button onClick={onClose} className="hidden lg:flex absolute top-2 right-2 z-50 bg-slate-800/60 text-white p-2 rounded-full backdrop-blur-sm hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>

                    {isPreviewLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800/80 backdrop-blur-sm z-10">
                            <Loader2 className="animate-spin text-[#9575cd] mb-4" size={48} />
                            <h2 className="text-lg md:text-xl font-bold">Rendering Document...</h2>
                            <p className="text-xs md:text-sm text-slate-300 mt-2">Connecting to layout engine.</p>
                        </div>
                    ) : (
                        pdfPreviewUrl && (
                            <iframe src={`${pdfPreviewUrl}#toolbar=1&navpanes=0&view=FitH`} className="w-full h-full border-0" title="Report PDF Preview" />
                        )
                    )}
                </div>

                {/* 3. RIGHT PANEL: DISPATCH SETTINGS */}
                <div className={`w-full lg:w-[340px] bg-white border-l border-slate-200 flex-col shrink-0 h-full relative z-30 ${activeTab === 'dispatch' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="hidden lg:flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Send size={18} className="text-[#9575cd]" /> Dispatch Options
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-5 custom-scrollbar flex flex-col gap-6">
                        
                        <div>
                            <h3 className="text-[11px] md:text-xs font-bold text-[#9575cd] uppercase tracking-wider mb-3">Report Settings</h3>
                            <div className="flex flex-col gap-4">
                                <div className="space-y-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div className="flex flex-col gap-1.5">
                                        <EntryDateTimePicker 
                                            label="Collected:" 
                                            date={overrideCollectionDate || new Date().toISOString()} 
                                            onChange={(val) => setOverrideCollectionDate?.(val)} 
                                            align="right"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <EntryDateTimePicker 
                                            label="Reported:" 
                                            date={overrideReportedDate || new Date().toISOString()} 
                                            onChange={(val) => setOverrideReportedDate?.(val)} 
                                            align="right"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-slate-500">Report Format</label>
                                    <select value={letterheadStyle} onChange={(e) => onChangeLetterheadStyle(e.target.value)} className="w-full text-sm p-2.5 md:p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-white cursor-pointer font-medium text-slate-700">
                                        <option value="none">No Letterhead (None)</option>
                                        <option value="custom1">Format 1</option>
                                        <option value="custom2">Format 2</option>
                                        <option value="custom3">Format 3</option>
                                        <option value="custom4">Format 4</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[11px] md:text-xs font-bold text-[#9575cd] uppercase tracking-wider mb-3">Layout Options</h3>
                            <div className="flex flex-col gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <label className="flex items-center justify-between cursor-pointer group py-1">
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-[#9575cd] transition-colors">Print with Header/Footer</span>
                                    <div className={`w-10 h-5 rounded-full transition-colors relative ${printHeaderFooter ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${printHeaderFooter ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={printHeaderFooter} onChange={(e) => onToggleHeaderFooter(e.target.checked)} />
                                </label>

                                {[
                                    { label: 'Separate by Department', state: separateDept, setter: onToggleSeparateDept },
                                    { label: 'Separate by Test', state: separateTest, setter: onToggleSeparateTest },
                                    { label: 'Send with Letterhead', state: panelSendLetterhead, setter: setPanelSendLetterhead }
                                ].map((item, i) => (
                                    <label key={i} className="flex items-center justify-between cursor-pointer group py-1">
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-[#9575cd] transition-colors">{item.label}</span>
                                        <div className={`w-10 h-5 rounded-full transition-colors relative ${item.state ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${item.state ? 'right-0.5' : 'left-0.5'}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={item.state} onChange={(e) => item.setter(e.target.checked)} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-[11px] md:text-xs font-bold text-[#9575cd] uppercase tracking-wider mb-3">Mode of Dispatch</h3>
                            <div className="flex flex-col gap-2">
                                {['Manual WhatsApp', 'Hard Copy', 'Mark Delivered'].map((mode) => (
                                    <label key={mode} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${panelDispatchMode === mode ? 'border-[#9575cd] bg-purple-50 shadow-sm' : 'border-slate-200 hover:border-[#9575cd]/50 bg-white'}`}>
                                        <input type="radio" name="dispatchMode" value={mode} checked={panelDispatchMode === mode} onChange={(e) => setPanelDispatchMode(e.target.value)} className="w-4 h-4 accent-[#9575cd]" />
                                        <span className={`text-sm font-bold ${panelDispatchMode === mode ? 'text-[#9575cd]' : 'text-slate-600'}`}>{mode}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white md:bg-slate-50 flex flex-col gap-3 shrink-0 z-20 pb-6 lg:pb-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] lg:shadow-none">
                        <button className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 px-4 py-3 md:py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm md:text-base">
                            <CheckCircle size={18} /> Mark Printed
                        </button>
                        <div className="flex gap-3">
                            <button onClick={handleDirectDownload} disabled={isPreviewLoading} className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 hover:border-[#9575cd] hover:text-[#9575cd] px-4 py-3 md:py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 text-sm md:text-base">
                                <Download size={18} /> Download
                            </button>
                            <button disabled={isPreviewLoading} className="flex-1 flex items-center justify-center gap-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-3 md:py-2.5 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 hover:shadow-md text-sm md:text-base">
                                <Send size={18} /> Send
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
// --- app/reports/components/ReportDispatchModal.tsx Block Close ---