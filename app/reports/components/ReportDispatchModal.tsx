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

    overrideCollectionDate?: string;
    setOverrideCollectionDate?: (val: string) => void;
    overrideReportedDate?: string;
    setOverrideReportedDate?: (val: string) => void;

    onSendReport?: () => void;
    isSendingReport?: boolean;
    whatsappManualEnabled?: boolean;
}

export default function ReportDispatchModal({
    isOpen, onClose, pdfPreviewUrl, isPreviewLoading, handleDirectDownload,
    printHeaderFooter, onToggleHeaderFooter, letterheadStyle, onChangeLetterheadStyle,
    separateDept, onToggleSeparateDept, separateTest, onToggleSeparateTest,
    billItems, selectedItemIds, onToggleItem, onSelectAll, onDeselectAll,
    overrideCollectionDate, setOverrideCollectionDate, overrideReportedDate, setOverrideReportedDate,
    onSendReport, isSendingReport = false, whatsappManualEnabled = true
}: ReportDispatchModalProps) {
    
    // Compute available dispatch modes based on settings
    const availableModes = [];
    if (whatsappManualEnabled) availableModes.push('Manual WhatsApp');
    availableModes.push('Hard Copy', 'Mark Delivered');

    const [panelSendLetterhead, setPanelSendLetterhead] = useState(true);
    const [panelDispatchMode, setPanelDispatchMode] = useState(availableModes[0]);
    
    // MOBILE TAB STATE: Controls which panel is visible on small screens
    const [activeTab, setActiveTab] = useState<'preview' | 'tests' | 'dispatch'>('preview');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center px-2 py-2 lg:p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[6px] shadow-2xl w-full h-full max-h-[92vh] lg:max-h-[88vh] lg:max-w-7xl flex flex-col lg:flex-row border border-slate-200 overflow-hidden relative">
                
                {/* --- MOBILE TABS HEADER --- */}
                <div className="flex lg:hidden bg-slate-50/90 border-b border-slate-200 shrink-0 w-full min-h-[36px] h-[36px]">
                    <button onClick={() => setActiveTab('tests')} className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-medium border-b-2 transition-colors ${activeTab === 'tests' ? 'border-[#9575cd] text-[#9575cd] font-semibold bg-white' : 'border-transparent text-slate-500'}`}>
                        <ListChecks size={13} /> Tests
                    </button>
                    <button onClick={() => setActiveTab('preview')} className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-[#9575cd] text-[#9575cd] font-semibold bg-white' : 'border-transparent text-slate-500'}`}>
                        <Eye size={13} /> Preview
                    </button>
                    <button onClick={() => setActiveTab('dispatch')} className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-medium border-b-2 transition-colors ${activeTab === 'dispatch' ? 'border-[#9575cd] text-[#9575cd] font-semibold bg-white' : 'border-transparent text-slate-500'}`}>
                        <Settings size={13} /> Dispatch
                    </button>
                    <button onClick={onClose} className="px-3 text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors border-l border-slate-200">
                        <X size={15} />
                    </button>
                </div>

                {/* 1. LEFT PANEL: TEST SELECTION */}
                <div className={`w-full lg:w-[280px] bg-slate-50/50 border-r border-slate-200 flex-col flex-1 lg:flex-none lg:shrink-0 lg:h-full min-h-0 ${activeTab === 'tests' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="hidden lg:flex justify-between items-center min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                                <ListChecks size={14} />
                            </div>
                            <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                Include Tests
                            </h3>
                        </div>
                        <span className="text-[10px] xl:text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {selectedItemIds.length} Selected
                        </span>
                    </div>

                    <div className="px-3 py-1.5 bg-slate-50/60 border-b border-slate-200 flex justify-between items-center shrink-0">
                        <span className="text-[10px] xl:text-[11px] font-medium text-slate-500">Selection Options</span>
                        <div className="flex gap-1.5">
                            <button 
                                onClick={onSelectAll} 
                                className="h-[20px] md:h-[22px] px-2 rounded-[4px] text-[10px] font-medium text-[#9575cd] bg-purple-50 hover:bg-purple-100 border border-purple-200 shadow-2xs transition-colors"
                            >
                                Select All
                            </button>
                            <button 
                                onClick={onDeselectAll} 
                                className="h-[20px] md:h-[22px] px-2 rounded-[4px] text-[10px] font-medium text-slate-600 hover:bg-slate-50 bg-white border border-slate-200 shadow-2xs transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar flex flex-col gap-1.5 min-h-0 bg-white">
                        {billItems && billItems.length > 0 ? (
                            billItems.map((item: any) => {
                                const testName = item.test?.displayName || item.test?.name || item.testName || 'Unknown Test';
                                const isSelected = selectedItemIds.includes(item.id);
                                const isPending = item.status === 'Pending';

                                return (
                                    <label key={item.id} className={`flex items-start gap-2 p-1.5 rounded-[5px] transition-all border ${
                                        isPending ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' :
                                        isSelected ? 'bg-purple-50/40 shadow-2xs border-purple-200 ring-1 ring-purple-100 cursor-pointer' : 
                                        'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
                                    }`}>
                                        <div className="relative flex items-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected && !isPending}
                                                disabled={isPending}
                                                onChange={(e) => !isPending && onToggleItem(item.id, e.target.checked)}
                                                className={`w-3.5 h-3.5 rounded border-slate-300 text-[#9575cd] focus:ring-[#9575cd] accent-[#9575cd] ${isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                            />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-[11px] xl:text-[12px] font-medium leading-tight truncate transition-colors ${isSelected && !isPending ? 'text-slate-800' : 'text-slate-500'}`}>
                                                {testName}
                                            </span>
                                            {isPending && (
                                                <span className="text-[9.5px] font-medium text-amber-600 mt-0.5 flex items-center gap-1">
                                                    ● Pending Entry
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                );
                            })
                        ) : (
                            <div className="text-center p-4 text-[11px] text-slate-400">No tests available.</div>
                        )}
                    </div>
                </div>

                {/* 2. CENTER PANEL: NATIVE PDF VIEWER */}
                <div className={`flex-1 bg-[#525659] relative flex-col lg:h-full min-h-0 ${activeTab === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
                    <button 
                        onClick={onClose} 
                        className="hidden lg:flex absolute top-2 right-2 z-50 bg-slate-800/80 hover:bg-slate-700 text-white h-[26px] w-[26px] rounded-[5px] items-center justify-center backdrop-blur-sm transition-colors shadow-2xs"
                        title="Close Preview"
                    >
                        <X size={15} />
                    </button>

                    {isPreviewLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800/80 backdrop-blur-sm z-10">
                            <Loader2 className="animate-spin text-[#9575cd] mb-3" size={36} />
                            <h2 className="text-[14px] xl:text-[15px] font-semibold" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>Rendering Document...</h2>
                            <p className="text-[11px] text-slate-300 mt-1">Connecting to layout engine.</p>
                        </div>
                    ) : (
                        pdfPreviewUrl && (
                            <iframe src={`${pdfPreviewUrl}#toolbar=1&navpanes=0&view=FitH`} className="w-full h-full border-0" title="Report PDF Preview" />
                        )
                    )}
                </div>

                {/* 3. RIGHT PANEL: DISPATCH SETTINGS */}
                <div className={`w-full lg:w-[340px] bg-white border-l border-slate-200 flex-col flex-1 lg:flex-none lg:shrink-0 lg:h-full relative z-30 min-h-0 ${activeTab === 'dispatch' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="hidden lg:flex justify-between items-center min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                                <Send size={14} />
                            </div>
                            <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                Dispatch Options
                            </h3>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Close"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar flex flex-col gap-3.5">
                        
                        <div>
                            <h4 className="text-[10px] xl:text-[11px] font-semibold text-[#9575cd] uppercase tracking-wider mb-1.5">Report Settings</h4>
                            <div className="flex flex-col gap-2.5">
                                <div className="space-y-1.5 p-2 bg-slate-50/60 rounded-[5px] border border-slate-200">
                                    <div className="flex flex-col gap-0.5">
                                        <EntryDateTimePicker 
                                            label="Collected:" 
                                            date={overrideCollectionDate || new Date().toISOString()} 
                                            onChange={(val) => setOverrideCollectionDate?.(val)} 
                                            align="right"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <EntryDateTimePicker 
                                            label="Reported:" 
                                            date={overrideReportedDate || new Date().toISOString()} 
                                            onChange={(val) => setOverrideReportedDate?.(val)} 
                                            align="right"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-0.5 flex items-center h-4">Report Format</label>
                                    <select 
                                        value={letterheadStyle} 
                                        onChange={(e) => onChangeLetterheadStyle(e.target.value)} 
                                        className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd] cursor-pointer"
                                    >
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
                            <h4 className="text-[10px] xl:text-[11px] font-semibold text-[#9575cd] uppercase tracking-wider mb-1.5">Layout Options</h4>
                            <div className="flex flex-col gap-1.5 bg-slate-50/60 p-2 rounded-[5px] border border-slate-200">
                                <label className="flex items-center justify-between cursor-pointer group py-0.5">
                                    <span className="text-[11px] xl:text-[12px] font-normal text-slate-700 group-hover:text-[#9575cd] transition-colors">Print with Header/Footer</span>
                                    <div className={`w-7 h-4 rounded-full transition-colors relative ${printHeaderFooter ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${printHeaderFooter ? 'right-0.5' : 'left-0.5'}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={printHeaderFooter} onChange={(e) => onToggleHeaderFooter(e.target.checked)} />
                                </label>

                                {[
                                    { label: 'Separate by Department', state: separateDept, setter: onToggleSeparateDept },
                                    { label: 'Separate by Test', state: separateTest, setter: onToggleSeparateTest },
                                    { label: 'Send with Letterhead', state: panelSendLetterhead, setter: setPanelSendLetterhead }
                                ].map((item, i) => (
                                    <label key={i} className="flex items-center justify-between cursor-pointer group py-0.5">
                                        <span className="text-[11px] xl:text-[12px] font-normal text-slate-700 group-hover:text-[#9575cd] transition-colors">{item.label}</span>
                                        <div className={`w-7 h-4 rounded-full transition-colors relative ${item.state ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${item.state ? 'right-0.5' : 'left-0.5'}`}></div>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={item.state} onChange={(e) => item.setter(e.target.checked)} />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-1">
                            <h4 className="text-[10px] xl:text-[11px] font-semibold text-[#9575cd] uppercase tracking-wider mb-1.5">Mode of Dispatch</h4>
                            <div className="flex flex-col gap-1">
                                {availableModes.map((mode) => (
                                    <label key={mode} className={`flex items-center gap-2 p-1.5 rounded-[5px] border cursor-pointer transition-all ${panelDispatchMode === mode ? 'border-[#9575cd] bg-purple-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                        <input type="radio" name="dispatchMode" value={mode} checked={panelDispatchMode === mode} onChange={(e) => setPanelDispatchMode(e.target.value)} className="w-3.5 h-3.5 accent-[#9575cd]" />
                                        <span className={`text-[11px] xl:text-[12px] font-medium ${panelDispatchMode === mode ? 'text-[#9575cd]' : 'text-slate-700'}`}>{mode}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-2.5 xl:p-3 border-t border-slate-200 bg-white md:bg-slate-50/80 flex flex-col gap-2 shrink-0 z-20">
                        <button 
                            type="button"
                            className="h-[26px] xl:h-[28px] w-full rounded-[5px] border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] xl:text-[12px] font-medium flex items-center justify-center gap-1 shadow-2xs transition-all"
                        >
                            <CheckCircle size={13} strokeWidth={2} /> <span>Mark Printed</span>
                        </button>
                        <div className="flex gap-2">
                            <button 
                                type="button"
                                onClick={handleDirectDownload} 
                                disabled={isPreviewLoading} 
                                className="h-[26px] xl:h-[28px] flex-1 rounded-[5px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] xl:text-[12px] font-medium flex items-center justify-center gap-1 shadow-2xs transition-all disabled:opacity-50"
                            >
                                <Download size={13} strokeWidth={2} /> <span>Download</span>
                            </button>
                            {whatsappManualEnabled && panelDispatchMode === 'Manual WhatsApp' && (
                                <button 
                                    type="button"
                                    onClick={onSendReport} 
                                    disabled={isPreviewLoading || isSendingReport} 
                                    className="h-[26px] xl:h-[28px] flex-1 rounded-[5px] text-white text-[11px] xl:text-[12px] font-medium flex items-center justify-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                    style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                                >
                                    {isSendingReport ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} strokeWidth={2} />} 
                                    <span>{isSendingReport ? 'Sending...' : 'Send WA'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
// --- app/reports/components/ReportDispatchModal.tsx Block Close ---