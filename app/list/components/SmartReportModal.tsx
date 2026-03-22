// --- BLOCK app/list/components/SmartReportModal.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { X, Activity, FlaskConical, History as HistoryIcon, Loader2, AlertCircle, Eye, Download, ArrowLeft } from 'lucide-react';
import { getDeltaCheckData } from '@/app/actions/result-entry';

import { pdf } from '@react-pdf/renderer';
import { getReportSettings } from '@/app/actions/reports';
import { getLabProfile } from '@/app/actions/lab-profile';
import SmartReportDocument from './SmartReportDocument';

// ============================================================================
// WEB CHART ENGINE (Dynamic Settings Applied)
// ============================================================================
function WebDynamicChart({ dataPoints, isAlert, deltaSettings }: { dataPoints: {value: number, label: string}[], isAlert: boolean, deltaSettings: any }) {
    if (!dataPoints || dataPoints.length < 2) return <div className="h-16 w-full flex items-center justify-center text-slate-400 text-xs italic">Requires at least 2 data points.</div>;

    const width = 800; 
    const height = 110;
    const paddingX = 40;
    const paddingY = 25;
    const usableHeight = height - paddingY * 2;

    const values = dataPoints.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;

    const primaryColor = isAlert ? (deltaSettings?.alertColor || '#e11d48') : (deltaSettings?.primaryColor || '#9575cd'); 
    const trackColor = isAlert ? '#ffe4e6' : '#f1f5f9';
    const nodeRadius = parseInt(deltaSettings?.nodeRadius !== undefined ? deltaSettings.nodeRadius : '3');
    
    // Chart Style Booleans
    const style = deltaSettings?.graphStyle || 'lollipop';
    const isLine = style === 'line';
    const isBar = style === 'bar';
    const isArea = style === 'area';
    const isStep = style === 'step';
    const isScatter = style === 'scatter';
    const isLollipop = !isLine && !isBar && !isArea && !isStep && !isScatter;

    const getX = (index: number) => paddingX + (index * ((width - paddingX * 2) / (dataPoints.length - 1)));
    const getY = (val: number) => paddingY + usableHeight - (((val - min) / range) * usableHeight);

    let linePath = '';
    let areaPath = '';
    let stepPath = '';

    if (isLine || isArea) {
        linePath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(d.value)}`).join(' ');
    }
    if (isArea && dataPoints.length > 0) {
        areaPath = `${linePath} L ${getX(dataPoints.length - 1)},${height - paddingY} L ${getX(0)},${height - paddingY} Z`;
    }
    if (isStep) {
        stepPath = dataPoints.map((d, i) => i === 0 ? `M ${getX(i)},${getY(d.value)}` : `L ${getX(i)},${getY(dataPoints[i-1].value)} L ${getX(i)},${getY(d.value)}`).join(' ');
    }

    return (
        <div className="w-full relative mt-4 overflow-x-auto custom-scrollbar pb-2">
            <div className="min-w-[450px] md:min-w-[500px]">
                <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-auto max-h-[140px] overflow-visible font-sans">
                    
                    {/* Base Axis Line */}
                    <line x1={paddingX - 20} y1={height - paddingY} x2={width - paddingX + 20} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                    
                    {/* Area Fill */}
                    {isArea && <path d={areaPath} fill={primaryColor} opacity="0.15" stroke="none" className="transition-all duration-700" />}

                    {/* Line & Step Connectors */}
                    {(isLine || isArea) && <path d={linePath} stroke={primaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700" />}
                    {isStep && <path d={stepPath} stroke={primaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700" />}

                    {/* Data Stems & Nodes */}
                    {dataPoints.map((d, i) => {
                        const cx = getX(i);
                        const cy = getY(d.value);
                        const isLatest = i === dataPoints.length - 1;
                        return (
                            <g key={`point-${i}`}>
                                {/* Vertical Stem (Lollipop / Bar) */}
                                {(isLollipop || isBar) && (
                                    <>
                                        {!isBar && <line x1={cx} y1={height - paddingY} x2={cx} y2={cy} stroke={trackColor} strokeWidth="6" strokeLinecap="round" />}
                                        <line x1={cx} y1={height - paddingY} x2={cx} y2={cy} stroke={primaryColor} strokeWidth={isBar ? "24" : "2"} strokeLinecap={isBar ? "square" : "round"} className={isBar ? "opacity-80" : "opacity-40"} />
                                    </>
                                )}
                                
                                {/* Data Dot (Hidden on Bar Chart, visible if nodeRadius > 0) */}
                                {!isBar && nodeRadius > 0 && (
                                    <circle cx={cx} cy={cy} r={isLatest ? nodeRadius + 2 : nodeRadius} fill="#ffffff" stroke={primaryColor} strokeWidth="2.5" className="transition-all duration-300"/>
                                )}
                                
                                {/* Value Text */}
                                <text x={cx} y={cy - (isBar ? 6 : (nodeRadius + 9))} fill={primaryColor} fontSize="14" fontWeight="800" textAnchor="middle">{d.value}</text>
                                
                                {/* Date Text */}
                                <text x={cx} y={height - 8} fill="#64748b" fontSize="12" fontWeight="600" textAnchor="middle">{d.label}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

interface SmartReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
}

export default function SmartReportModal({ isOpen, onClose, bill }: SmartReportModalProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [deltaData, setDeltaData] = useState<any[]>([]);
    
    const [reportSettings, setReportSettings] = useState<any>(null);
    const [deltaSettings, setDeltaSettings] = useState<any>({});
    
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfAction, setPdfAction] = useState<'preview' | 'download' | null>(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && bill) {
            setIsAnalyzing(true);
            setPdfPreviewUrl(null); 
            Promise.all([
                getDeltaCheckData(bill.id, bill.patientId),
                getReportSettings(),
                getLabProfile()
            ]).then(([deltaRes, setRes, profRes]) => {
                setDeltaData((deltaRes.success && deltaRes.data) ? deltaRes.data : []);
                
                let settings: any = setRes.success && setRes.data ? setRes.data : {};
                let prof: any = profRes.success && profRes.data ? profRes.data : {};
                
                // Parse Delta Settings
                let parsedDelta = { primaryColor: '#9575cd', alertColor: '#e11d48', fontFamily: 'Helvetica', headingSize: '12', paramNameSize: '11', resultValueSize: '12', graphStyle: 'lollipop', nodeRadius: '3', showFooterNotes: true };
                if (settings.deltaSettings) {
                    try { parsedDelta = { ...parsedDelta, ...JSON.parse(settings.deltaSettings) }; } catch(e){}
                }
                setDeltaSettings(parsedDelta);

                setReportSettings({ 
                    ...settings, 
                    labName: prof.name, tagline: prof.tagline, address: prof.address, 
                    phone: prof.phone, email: prof.email, website: prof.website, logoUrl: prof.logoUrl 
                });
                setTimeout(() => setIsAnalyzing(false), 800);
            });
        } else if (!isOpen && pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }
    }, [isOpen, bill]);

    const processedData = useMemo(() => {
        const withHistory = deltaData.filter(d => d.previousValue !== null);
        const grouped = withHistory.reduce((acc: any, curr: any) => {
            if (!acc[curr.testName]) acc[curr.testName] = [];
            acc[curr.testName].push(curr);
            return acc;
        }, {});
        return { grouped, hasHistory: withHistory.length > 0 };
    }, [deltaData]);

    const handleGeneratePDF = async (action: 'preview' | 'download') => {
        setPdfAction(action);
        setIsGeneratingPdf(true);
        try {
            const reportedDate = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            const blob = await pdf(
                <SmartReportDocument bill={bill} groupedData={grouped} reportSettings={reportSettings} reportedDate={reportedDate} deltaSettings={deltaSettings} />
            ).toBlob();
            
            const url = URL.createObjectURL(blob);
            
            if (action === 'download') {
                const a = document.createElement('a');
                a.href = url;
                a.download = `DeltaReport_${bill.billNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                setPdfPreviewUrl(url);
            }
        } catch(e) {
            console.error(e);
            alert("Failed to generate PDF.");
        } finally {
            setIsGeneratingPdf(false);
            setPdfAction(null);
        }
    };

    if (!isOpen || !bill) return null;
    const patientName = `${bill.patient.designation || ''} ${bill.patient.firstName} ${bill.patient.lastName}`.trim();
    const { grouped, hasHistory } = processedData;

    return (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 flex items-center justify-center backdrop-blur-sm p-0 md:p-6 transition-all">
            
            <div className="bg-[#f8fafc] rounded-none md:rounded-2xl shadow-2xl w-full max-w-[1000px] h-[100dvh] md:h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                
                {/* --- RESPONSIVE HEADER --- */}
                <div className="h-14 md:h-16 px-4 md:px-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0 z-30">
                    <div className="flex items-center gap-2 md:gap-3 truncate pr-2">
                        <Activity size={20} className="md:w-6 md:h-6 shrink-0" style={{ color: deltaSettings.primaryColor || '#9575cd' }}/>
                        <span className="text-base md:text-xl font-black text-slate-800 tracking-tight truncate">
                            {reportSettings?.labName || 'SmartLab'} <span className="font-light text-slate-400 hidden sm:inline">| Delta Report</span>
                        </span>
                    </div>
                    
                    {/* Action Buttons: Text hides on mobile, showing only icons to save space */}
                    <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                        {pdfPreviewUrl ? (
                            <>
                                <button onClick={() => setPdfPreviewUrl(null)} className="px-3 md:px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                                    <ArrowLeft size={16}/> <span className="hidden sm:inline">Back</span>
                                </button>
                                <button onClick={() => {
                                        const a = document.createElement('a');
                                        a.href = pdfPreviewUrl;
                                        a.download = `DeltaReport_${bill.billNumber}.pdf`;
                                        a.click();
                                    }} className="px-3 md:px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm" style={{ backgroundColor: deltaSettings.primaryColor || '#9575cd' }}>
                                    <Download size={16}/> <span className="hidden sm:inline">Download</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button disabled={isAnalyzing || !hasHistory || isGeneratingPdf} onClick={() => handleGeneratePDF('preview')} className="px-3 md:px-4 py-2 bg-white border rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50" style={{ borderColor: deltaSettings.primaryColor || '#9575cd', color: deltaSettings.primaryColor || '#9575cd' }}>
                                    {isGeneratingPdf && pdfAction === 'preview' ? <Loader2 size={16} className="animate-spin"/> : <Eye size={16}/>} 
                                    <span className="hidden sm:inline">Preview PDF</span>
                                </button>
                                <button disabled={isAnalyzing || !hasHistory || isGeneratingPdf} onClick={() => handleGeneratePDF('download')} className="px-3 md:px-5 py-2 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50" style={{ backgroundColor: deltaSettings.primaryColor || '#9575cd' }}>
                                    {isGeneratingPdf && pdfAction === 'download' ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>} 
                                    <span className="hidden sm:inline">Download</span>
                                </button>
                            </>
                        )}
                        <div className="w-px h-6 bg-slate-200 mx-1 md:mx-1"></div>
                        <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><X size={18} className="md:w-5 md:h-5"/></button>
                    </div>
                </div>

                {pdfPreviewUrl ? (
                    <div className="flex-1 w-full h-full bg-slate-600 relative">
                        <iframe src={`${pdfPreviewUrl}#view=FitH`} className="w-full h-full border-0 absolute inset-0" title="PDF Preview" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar">
                        
                        {isAnalyzing && (
                            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                                <Loader2 size={40} className="md:w-12 md:h-12 animate-spin mb-4" style={{ color: deltaSettings.primaryColor || '#9575cd' }} />
                                <h3 className="text-lg md:text-xl font-black text-slate-800">Analyzing Results...</h3>
                            </div>
                        )}

                        {/* --- RESPONSIVE PATIENT BANNER --- */}
                        <div className="bg-white px-4 md:px-8 py-4 md:py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-sm sticky top-0 z-20">
                            <div className="flex items-center gap-3 md:gap-5">
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center font-black text-lg md:text-xl border shrink-0" style={{ backgroundColor: `${deltaSettings.primaryColor}20`, color: deltaSettings.primaryColor, borderColor: `${deltaSettings.primaryColor}40` }}>
                                    {bill.patient.firstName.charAt(0)}{bill.patient.lastName?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">{patientName}</h3>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-0.5 md:mt-1 text-xs md:text-sm font-bold text-slate-500">
                                        <span>{bill.patient.ageY}Y {bill.patient.ageM}M</span>
                                        <span className="hidden md:inline">•</span>
                                        <span>{bill.patient.gender}</span>
                                        <span>•</span>
                                        <span>UID: {bill.patient.patientId}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                                <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Bill Ref</p>
                                <p className="text-xs md:text-sm font-black px-2 md:px-3 py-1 rounded-md md:rounded-lg border inline-block" style={{ color: deltaSettings.primaryColor, backgroundColor: `${deltaSettings.primaryColor}10`, borderColor: `${deltaSettings.primaryColor}30` }}>{bill.billNumber}</p>
                            </div>
                        </div>

                        <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-4xl mx-auto w-full">
                            {!hasHistory && !isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center text-slate-400 gap-4 mt-16 md:mt-20 text-center px-4">
                                    <HistoryIcon size={40} className="md:w-12 md:h-12 text-slate-300"/>
                                    <h3 className="text-lg md:text-xl font-black text-slate-700">No Historical Data</h3>
                                    <p className="text-xs md:text-sm font-medium max-w-sm">Delta reports require previous results to plot a timeline and calculate variance trends.</p>
                                </div>
                            ) : (
                                Object.keys(grouped).map((testName) => (
                                    <div key={testName} className="space-y-4">
                                        
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <h3 className="font-black uppercase tracking-widest flex items-center gap-2 text-sm md:text-base" style={{ color: deltaSettings.primaryColor || '#1e293b' }}>
                                                <FlaskConical size={16} className="md:w-[18px] md:h-[18px]" /> {testName}
                                            </h3>
                                            <div className="h-px bg-slate-300 flex-1"></div>
                                        </div>

                                        {grouped[testName].map((row: any, idx: number) => {
                                            const isAlert = row.isClinicallySignificant;
                                            
                                            // 1. Get chronological history (Oldest -> Newer)
                                            const chronologicalHistory = row.history ? [...row.history].reverse() : [];
                                            
                                            // 2. Chart points (Oldest -> Latest)
                                            const rawPoints = [
                                                ...chronologicalHistory.map((h: any) => ({
                                                    value: parseFloat(h.value),
                                                    label: new Date(h.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})
                                                })),
                                                { value: parseFloat(row.currentValue), label: 'Latest' }
                                            ];
                                            const graphPoints = rawPoints.filter(p => !isNaN(p.value));

                                            // 3. Text sequence mapped exactly same as chart (Oldest -> Latest)
                                            const displaySequence = [
                                                ...chronologicalHistory.map((h: any) => ({
                                                    label: new Date(h.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: '2-digit'}), value: h.value, flag: h.flag
                                                })),
                                                { label: new Date(row.currentDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: '2-digit'}), value: row.currentValue, flag: row.currentFlag }
                                            ];

                                            return (
                                                <div key={idx} className={`bg-white rounded-xl p-4 md:p-6 shadow-sm border transition-all ${isAlert ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'}`}>
                                                    
                                                    {/* --- RESPONSIVE ROW LAYOUT --- */}
                                                    <div className="flex flex-col lg:flex-row items-start lg:items-center w-full gap-4">
                                                        
                                                        {/* Parameter Name */}
                                                        <div className="w-full lg:w-[30%] shrink-0 pr-0 md:pr-2 flex flex-row lg:flex-col justify-between lg:justify-start items-center lg:items-start">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-black text-slate-800 text-sm md:text-base">{row.parameterName}</h4>
                                                                {isAlert && <AlertCircle size={14} style={{ color: deltaSettings.alertColor || '#e11d48' }} className="shrink-0"/>}
                                                            </div>
                                                            <p className="text-[10px] md:text-[11px] font-bold text-slate-400 mt-0 lg:mt-1">Unit: {row.unit || 'N/A'}</p>
                                                        </div>
                                                        
                                                        {/* Scrollable Timeline */}
                                                        <div className="w-full lg:w-[55%] flex items-center gap-6 md:gap-8 overflow-x-auto custom-scrollbar pb-2 lg:pb-1">
                                                            {displaySequence.map((item, i) => (
                                                                <div key={i} className="flex flex-col items-start shrink-0">
                                                                    <span className="font-black leading-none text-lg md:text-xl" style={{ color: item.flag !== 'Normal' ? (deltaSettings.alertColor || '#e11d48') : '#1e293b' }}>
                                                                        {item.value}
                                                                    </span>
                                                                    <span className="text-[10px] md:text-[11px] font-medium text-slate-400 mt-1">
                                                                        {item.label}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Delta Shift Percentage */}
                                                        <div className="w-full lg:w-[15%] text-left lg:text-right shrink-0 bg-slate-50 lg:bg-transparent p-2 lg:p-0 rounded-lg lg:rounded-none">
                                                            {row.deltaPercent !== null ? (
                                                                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start">
                                                                    <span className="font-black leading-none text-base md:text-xl" style={{ color: isAlert ? (deltaSettings.alertColor || '#e11d48') : '#334155' }}>
                                                                        {Number(row.deltaPercent) > 0 ? '+' : ''}{row.deltaPercent}%
                                                                    </span>
                                                                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0 lg:mt-1">Shift</p>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 hidden lg:block">-</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* --- DYNAMIC GRAPH --- */}
                                                    <div className="mt-4 pt-2 border-t border-slate-100">
                                                        <WebDynamicChart dataPoints={graphPoints} isAlert={isAlert} deltaSettings={deltaSettings} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}
// --- BLOCK app/list/components/SmartReportModal.tsx CLOSE ---