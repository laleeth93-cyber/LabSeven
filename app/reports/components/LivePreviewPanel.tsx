// --- app/reports/components/LivePreviewPanel.tsx Block Open ---
import React from 'react';
import { FileText, Eye } from 'lucide-react';
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
        <div className="w-[52%] xl:w-[55%] bg-white border border-slate-200 shadow-sm rounded-[6px] p-2.5 xl:p-3 flex flex-col overflow-hidden relative h-full">
            <div className="border-b border-slate-100 pb-2 mb-2 shrink-0 flex justify-between items-center">
                <div>
                    <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 leading-tight" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Universal Print Canvas
                    </h3>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">Live visualization of your exact print output.</p>
                </div>
                
                <div className="flex items-center gap-1.5 z-10">
                    <span className="text-[10px] text-slate-500 font-normal bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {formData.paperSize || 'A4'} • {isLandscape ? 'Landscape' : 'Portrait'}
                    </span>
                    
                    <button 
                        onClick={handleOpenPDFPreview} 
                        className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
                        style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                    >
                        <Eye size={12} strokeWidth={2} />
                        <span>Get Report</span>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-slate-100/90 p-4 rounded-[5px] border border-slate-200 flex justify-center items-start custom-scrollbar">
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
