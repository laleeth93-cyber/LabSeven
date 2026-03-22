// --- app/reports/components/LivePreviewPanel.tsx Block Open ---
import React from 'react';
import { FileText } from 'lucide-react';
import PrintReportContent from './PrintReportContent';

interface LivePreviewPanelProps {
    formData: any;
    leftColFields: any[];
    rightColFields: any[];
    bodySettings: any;
    footerSettings: any;
    paperWidth: number;
    paperHeight: number;
    t: number;
    b: number;
    l: number;
    r: number;
    activeImageBase64: string;
    isLandscape: boolean;
    printHeaderFooter: boolean;
    handleOpenPDFPreview: () => void;
}

export default function LivePreviewPanel({
    formData, leftColFields, rightColFields, bodySettings, footerSettings,
    paperWidth, paperHeight, t, b, l, r, activeImageBase64, isLandscape, printHeaderFooter, handleOpenPDFPreview
}: LivePreviewPanelProps) {
    return (
        <div className="w-[50%] bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col overflow-hidden relative">
            <div className="border-b border-slate-100 pb-2 mb-3 shrink-0 flex justify-between items-end">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm">Universal Print Canvas</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Live visualization of your exact print output.</p>
                </div>
                
                <div className="flex items-center gap-1.5 z-10">
                    <div className="ml-1 text-[10px] font-bold text-[#9575cd] bg-purple-50 px-2 py-1.5 rounded border border-[#9575cd]/20 mr-2">
                        {formData.paperSize || 'A4'} • {isLandscape ? 'Landscape' : 'Portrait'}
                    </div>
                    
                    <button 
                        onClick={handleOpenPDFPreview} 
                        className="flex items-center gap-1.5 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 border border-transparent rounded shadow-sm text-xs font-bold transition-all active:scale-95"
                    >
                        <FileText size={14} /> Get Report
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-200/80 p-6 rounded-xl border border-slate-200 flex justify-center items-start custom-scrollbar">
                <PrintReportContent 
                    formData={formData}
                    leftColFields={leftColFields}
                    rightColFields={rightColFields}
                    bodySettings={bodySettings}
                    footerSettings={footerSettings}
                    paperWidth={paperWidth}
                    paperHeight={paperHeight}
                    t={t} b={b} l={l} r={r}
                    activeImageBase64={activeImageBase64}
                    printHeaderFooter={printHeaderFooter}
                />
            </div>
        </div>
    );
}
// --- app/reports/components/LivePreviewPanel.tsx Block Close ---