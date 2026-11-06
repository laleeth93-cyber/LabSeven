// --- BLOCK app/reports/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Save, Loader2, Table, LayoutTemplate, Stethoscope, Printer, 
    CheckCircle, Activity, ChevronLeft, Eye, FileText, Settings2, SlidersHorizontal 
} from 'lucide-react';
import { getReportSettings, updateReportSettings } from '@/app/actions/reports';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 

import HeaderTab from './components/HeaderTab';
import BodyTab from './components/BodyTab';
import FooterTab from './components/FooterTab';
import PrintFitTab from './components/PrintFitTab';
import LivePreviewPanel from './components/LivePreviewPanel';
import PrintReportContent from './components/PrintReportContent';
import ReportDispatchModal from './components/ReportDispatchModal';
import DeltaReportTab from './components/DeltaReportTab';

// Clean default fields
const defaultRegistrationFields = [
    { key: 'showBarcode', label: 'Barcode' }, 
    { key: 'showPatientId', label: 'Patient ID' }, 
    { key: 'showUhid', label: 'UHID / MRN' }, 
    { key: 'showName', label: 'Patient Name' }, 
    { key: 'showAgeGender', label: 'Age & Gender' }, 
    { key: 'showHeight', label: 'Height (cm)' }, 
    { key: 'showWeight', label: 'Weight (kg)' }, 
    { key: 'showPhone', label: 'Phone Number' }, 
    { key: 'showEmail', label: 'Email Address' }, 
    { key: 'showAddress', label: 'Address' }, 
    { key: 'showAadhaar', label: 'Aadhaar Number' }, 
    { key: 'showPassport', label: 'Passport Number' }, 
    { key: 'showReferringDoc', label: 'Referred By' }, 
    { key: 'showRefDoc', label: 'Ref. Doctor' },      
    { key: 'showRefHospital', label: 'Ref. Hospital' }, 
    { key: 'showRefLab', label: 'Ref. Lab' }, 
    { key: 'showCollectionDate', label: 'Collection Date' }, 
    { key: 'showReceivedDate', label: 'Received Date' }, 
    { key: 'showCollectedBy', label: 'Collected By' }, 
    { key: 'showReportDelivery', label: 'Report Delivery' }, 
    { key: 'showClinicalHistory', label: 'Clinical History' }, 
    { key: 'showCurrentMeds', label: 'Current Meds' }, 
    { key: 'showReportedDate', label: 'Reported Date' }, 
    { key: 'showPrintedDate', label: 'Printed Date (Auto)' }
];

const parseToHexColor = (val: string, defaultHex: string) => {
    if (!val) return defaultHex;
    if (val.startsWith('#')) return val;
    if (val.includes('[#')) { const hexMatch = val.match(/\[(#.*?)\]/); return hexMatch ? hexMatch[1] : defaultHex; }
    const tailwindColorMap: Record<string, string> = { 'bg-transparent': '#ffffff', 'bg-slate-50': '#f8fafc', 'bg-slate-200': '#e2e8f0', 'bg-purple-50': '#faf5ff', 'bg-[#9575cd]': '#9575cd', 'bg-slate-800': '#1e293b', 'text-slate-800': '#1e293b', 'text-black': '#000000', 'text-white': '#ffffff', 'text-[#5e35b1]': '#5e35b1' };
    return tailwindColorMap[val] || defaultHex;
};

const defaultMargins = {
    'none': { top: 120, bottom: 80, left: 40, right: 40 },
    'custom1': { top: 120, bottom: 80, left: 40, right: 40 },
    'custom2': { top: 120, bottom: 80, left: 40, right: 40 },
    'custom3': { top: 120, bottom: 80, left: 40, right: 40 },
    'custom4': { top: 120, bottom: 80, left: 40, right: 40 },
};

const defaultDeltaSettings = {
    primaryColor: '#9575cd',
    alertColor: '#e11d48',
    fontFamily: 'Helvetica',
    headingSize: '12',
    paramNameSize: '11',
    resultValueSize: '12',
    graphStyle: 'lollipop',
    nodeRadius: '3',
    showFooterNotes: true
};

export default function ReportsSettingsPage() {
    const router = useRouter(); 
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Header');
    const [mobileTab, setMobileTab] = useState('Header');
    const [mobileZoom, setMobileZoom] = useState<'fit' | 'full'>('fit');
    
    const [printHeaderFooter, setPrintHeaderFooter] = useState(true);
    
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const [separateDept, setSeparateDept] = useState(false);
    const [separateTest, setSeparateTest] = useState(false);

    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const [formData, setFormData] = useState<any>({
        doc1Name: '', doc1Designation: '', doc2Name: '', doc2Designation: '',
        marginTop: 120, marginBottom: 80, marginLeft: 40, marginRight: 40,
        marginSettings: defaultMargins,
        letterheadStyle: 'none', paperSize: 'A4', printOrientation: 'portrait',
        customHeader1: '', customHeader2: '', customHeader3: '', customHeader4: '',
        tableStyle: 'grid', fontFamily: 'font-sans', fontSize: 'text-xs',
        rowPadding: 'py-1.5', labelBold: true, dataBold: false,
        leftColWidth: '35 65', rightColWidth: '35 65', headerQrCode: false 
    });

    const [availableFields, setAvailableFields] = useState<any[]>(defaultRegistrationFields);
    const [leftColFields, setLeftColFields] = useState<any[]>([]);
    const [rightColFields, setRightColFields] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [bodySettings, setBodySettings] = useState({
        showMethodCol: true, methodDisplayStyle: 'column', showFlagCol: true, showUnitCol: true, showRefRangeCol: true, highlightAbnormal: true, stripedRows: false,
        testColumnWidth: 'auto', 
        colWidthParam: '', colWidthResult: '', colWidthFlag: '', colWidthUnit: '', colWidthRef: '', colWidthMethod: '',
        showEndOfReport: true, 
        bodyTableStyle: 'horizontal', bodyFontFamily: 'font-sans', bodyFontSize: 'text-sm', bodyRowHeight: 'py-2', bodyColPadding: 'px-2',
        bodyLineHeight: '1.5',
        bodyHeaderBgColor: '#f8fafc', bodyHeaderTextColor: '#1e293b', bodyResultAlign: 'text-left',
        headerFontSize: 'text-xs', headerFontWeight: 'font-bold', headerRowHeight: 'py-1.5', headerBorderRadius: 'none', headerToBodyGap: '0',
        showDepartmentName: true, showTestName: true, departmentNameSize: 'text-sm', testNameAlignment: 'text-center', testNameUnderline: true, testNameSize: 'text-base', gridLineThickness: '1',
        subheadingColor: '#5e35b1', subheadingSize: 'text-sm',
        flagStyle: 'lh', flagColorLow: '#3b82f6', flagColorNormal: '#000000', flagColorHigh: '#ef4444',
        tableHeaderRepeat: 'test', separatePagesBy: 'none',
        testBlockSpacing: 'mb-4' 
    });
    
    const [footerSettings, setFooterSettings] = useState({ 
        footerStyle: 'style1', showQrCode: true, showBarcode: false, showPageNumbers: true, 
        qrPlacement: 'footer', qrText: 'Scan to validate', barcodeText: 'none',
        sigSize: 40, sigSpacing: 4, docNameSize: 10, docDesigSize: 8, docNameSpacing: 2, sigAlignment: 'center'
    });

    const [deltaSettings, setDeltaSettings] = useState<any>(defaultDeltaSettings);

    useEffect(() => {
        const loadSettings = async () => {
            const res = await getReportSettings(Date.now().toString());
            
            if (res.success && res.data) {
                const dbData: any = res.data;

                let loadedMargins = defaultMargins;
                if (dbData.marginSettings) {
                    try { loadedMargins = { ...defaultMargins, ...JSON.parse(dbData.marginSettings) }; } catch(e){}
                } else {
                    loadedMargins['none'] = { top: dbData.marginTop || 120, bottom: dbData.marginBottom || 80, left: dbData.marginLeft || 40, right: dbData.marginRight || 40 };
                }

                setFormData((prev: any) => ({ 
                    ...prev, ...dbData, 
                    tableStyle: dbData.tableStyle || 'grid', fontFamily: dbData.fontFamily || 'font-sans', 
                    fontSize: dbData.fontSize || 'text-xs', rowPadding: dbData.rowPadding || 'py-1.5', 
                    labelBold: dbData.labelBold !== undefined ? dbData.labelBold : true, 
                    dataBold: dbData.dataBold !== undefined ? dbData.dataBold : false, 
                    leftColWidth: dbData.leftColWidth || '35 65', rightColWidth: dbData.rightColWidth || '35 65', 
                    headerQrCode: dbData.headerQrCode !== undefined ? dbData.headerQrCode : false,
                    marginSettings: loadedMargins,
                    letterheadStyle: dbData.letterheadStyle || 'none', paperSize: dbData.paperSize || 'A4', printOrientation: dbData.printOrientation || 'portrait',
                    customHeader1: dbData.customHeader1 || '', customHeader2: dbData.customHeader2 || '',
                    customHeader3: dbData.customHeader3 || '', customHeader4: dbData.customHeader4 || ''
                }));

                setBodySettings({
                    showMethodCol: dbData.showMethodCol !== undefined ? dbData.showMethodCol : true, 
                    methodDisplayStyle: dbData.methodDisplayStyle || 'column', 
                    showFlagCol: dbData.showFlagCol !== undefined ? dbData.showFlagCol : true,
                    showUnitCol: dbData.showUnitCol !== undefined ? dbData.showUnitCol : true, 
                    showRefRangeCol: dbData.showRefRangeCol !== undefined ? dbData.showRefRangeCol : true, 
                    highlightAbnormal: dbData.highlightAbnormal !== undefined ? dbData.highlightAbnormal : true, 
                    stripedRows: dbData.stripedRows !== undefined ? dbData.stripedRows : false,
                    testColumnWidth: dbData.testColumnWidth || 'auto', 
                    colWidthParam: dbData.colWidthParam || '', colWidthResult: dbData.colWidthResult || '', colWidthFlag: dbData.colWidthFlag || '', colWidthUnit: dbData.colWidthUnit || '', colWidthRef: dbData.colWidthRef || '', colWidthMethod: dbData.colWidthMethod || '',
                    showEndOfReport: dbData.showEndOfReport !== undefined ? dbData.showEndOfReport : true, 
                    bodyTableStyle: dbData.bodyTableStyle || 'horizontal', bodyFontFamily: dbData.bodyFontFamily || 'font-sans', bodyFontSize: dbData.bodyFontSize || 'text-sm', bodyRowHeight: dbData.bodyRowHeight || 'py-2', bodyColPadding: dbData.bodyColPadding || 'px-2',
                    bodyLineHeight: dbData.bodyLineHeight || '1.5',
                    bodyHeaderBgColor: parseToHexColor(dbData.bodyHeaderBgColor, '#f8fafc'), bodyHeaderTextColor: parseToHexColor(dbData.bodyHeaderTextColor, '#1e293b'), bodyResultAlign: dbData.bodyResultAlign || 'text-left',
                    headerFontSize: dbData.headerFontSize || 'text-xs', headerFontWeight: dbData.headerFontWeight || 'font-bold', headerRowHeight: dbData.headerRowHeight || 'py-1.5', headerBorderRadius: dbData.headerBorderRadius || 'none', headerToBodyGap: dbData.headerToBodyGap || '0',
                    showDepartmentName: dbData.showDepartmentName !== undefined ? dbData.showDepartmentName : true, showTestName: dbData.showTestName !== undefined ? dbData.showTestName : true, departmentNameSize: dbData.departmentNameSize || 'text-sm', testNameAlignment: dbData.testNameAlignment || 'text-center', testNameUnderline: dbData.testNameUnderline !== undefined ? dbData.testNameUnderline : true, testNameSize: dbData.testNameSize || 'text-base', gridLineThickness: dbData.gridLineThickness || '1',
                    subheadingColor: parseToHexColor(dbData.subheadingColor, '#5e35b1'), subheadingSize: dbData.subheadingSize || 'text-sm',
                    flagStyle: dbData.flagStyle || 'lh',
                    flagColorLow: parseToHexColor(dbData.flagColorLow, '#3b82f6'),
                    flagColorNormal: parseToHexColor(dbData.flagColorNormal, '#000000'),
                    flagColorHigh: parseToHexColor(dbData.flagColorHigh, '#ef4444'),
                    tableHeaderRepeat: dbData.tableHeaderRepeat || 'test',
                    separatePagesBy: dbData.separatePagesBy || 'none',
                    testBlockSpacing: dbData.testBlockSpacing || 'mb-4' 
                });

                setFooterSettings({
                    footerStyle: dbData.footerStyle || 'style1', showQrCode: dbData.showQrCode !== undefined ? dbData.showQrCode : true, showBarcode: dbData.showBarcode !== undefined ? dbData.showBarcode : false, showPageNumbers: dbData.showPageNumbers !== undefined ? dbData.showPageNumbers : true, 
                    qrPlacement: dbData.qrPlacement || 'footer', qrText: dbData.qrText || 'Scan to validate', barcodeText: dbData.barcodeText || 'none',
                    sigSize: dbData.sigSize ?? 40, sigSpacing: dbData.sigSpacing ?? 4, docNameSize: dbData.docNameSize ?? 10, docDesigSize: dbData.docDesigSize ?? 8, docNameSpacing: dbData.docNameSpacing ?? 2, sigAlignment: dbData.sigAlignment || 'center'
                });

                if (dbData.deltaSettings) {
                    try {
                        const parsed = JSON.parse(dbData.deltaSettings);
                        setDeltaSettings({ ...defaultDeltaSettings, ...parsed });
                    } catch(e) {}
                }

                let initialLeft: any[] = []; let initialRight: any[] = [];
                
                const fixLabels = (arr: any[]) => arr.map((item: any) => {
                    if (item?.key === 'showReceivedDate') return { ...item, label: 'Received Date' };
                    if (item?.key === 'showReportedDate') return { ...item, label: 'Reported Date' };
                    return item;
                });

                if (dbData.leftColFields) { try { initialLeft = fixLabels(JSON.parse(dbData.leftColFields)); setLeftColFields(initialLeft); } catch(e){} }
                if (dbData.rightColFields) { try { initialRight = fixLabels(JSON.parse(dbData.rightColFields)); setRightColFields(initialRight); } catch(e){} }
                
                const usedKeys = [...initialLeft, ...initialRight].map(i => i.key); 
                setAvailableFields(defaultRegistrationFields.filter(f => !usedKeys.includes(f.key)));
            }
            setIsLoading(false);
        };
        loadSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<any>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleToggleSetting = (field: string) => { setFormData((prev: any) => ({ ...prev, [field]: !prev[field] })); };
    const handleBodySettingChange = (field: string, value: any) => { setBodySettings(prev => ({ ...prev, [field]: value })); };
    const handleToggleBody = (field: string) => { setBodySettings(prev => ({ ...prev, [field]: !(prev as any)[field] })); };
    const handleToggleFooter = (field: string) => { setFooterSettings(prev => ({ ...prev, [field]: !(prev as any)[field] })); };
    const handleFooterSettingChange = (field: string, value: any) => { setFooterSettings(prev => ({ ...prev, [field]: value })); };
    const handleCustomChange = (field: string, value: any) => { setFormData((prev: any) => ({ ...prev, [field]: value })); };

    const handleSave = () => {
        startTransition(async () => {
            const payload = { 
                ...formData, ...bodySettings, ...footerSettings, 
                leftColFields: JSON.stringify(leftColFields), 
                rightColFields: JSON.stringify(rightColFields),
                marginSettings: JSON.stringify(formData.marginSettings),
                deltaSettings: JSON.stringify(deltaSettings) 
            };
            const res = await updateReportSettings(payload);
            if (res.success) {
                setShowSuccessPopup(true);
                router.refresh(); 
                setTimeout(() => setShowSuccessPopup(false), 1500);
            } else {
                alert("Error saving settings: " + res.message);
            }
        });
    };

    const activeStyle = (formData.letterheadStyle && formData.letterheadStyle.startsWith('custom')) ? formData.letterheadStyle : 'custom1';
    const currentMargins = formData.marginSettings?.[activeStyle] || { top: 120, bottom: 80, left: 40, right: 40 };
    const t = currentMargins.top; const b = currentMargins.bottom; const l = currentMargins.left; const r = currentMargins.right;

    const isLandscape = formData.printOrientation === 'landscape';
    const paperWidth = isLandscape ? 1122 : 794;
    const paperHeight = isLandscape ? 794 : 1122;
    const activeImageBase64 = formData.letterheadStyle === 'none' ? '' : formData[activeStyle.replace('custom', 'customHeader')];

    const refreshPDFPreview = async () => {
        setIsPreviewLoading(true);
        
        const sourceElement = document.getElementById('demo-report-content');
        if (!sourceElement) {
            setIsPreviewLoading(false);
            return;
        }

        const rulers = sourceElement.querySelectorAll('.hide-on-print');
        rulers.forEach(r => (r as HTMLElement).style.display = 'none');
        const rawHtml = sourceElement.innerHTML;
        rulers.forEach(r => (r as HTMLElement).style.display = 'flex');

        const fullHtmlDocument = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Lab Report</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    *, *::before, *::after { box-sizing: border-box !important; }
                    body { 
                        margin: 0; padding: 0; background: white; 
                        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
                        text-rendering: optimizeLegibility !important; -webkit-font-smoothing: antialiased !important;
                    }
                    #pdf-container { width: ${paperWidth}px; height: ${paperHeight}px; position: relative; overflow: hidden; background: white; }
                    table { border-collapse: collapse !important; border-spacing: 0 !important; } 
                </style>
            </head>
            <body>
                <div id="pdf-container">
                    ${rawHtml}
                </div>
            </body>
            </html>
        `;

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ html: fullHtmlDocument, paperSize: formData.paperSize || 'A4', printOrientation: formData.printOrientation || 'portrait', width: paperWidth, height: paperHeight })
            });

            if (!response.ok) throw new Error('Server failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            setPdfPreviewUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } catch (error) {
            console.error("PDF Generation failed:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleOpenPDFPreview = () => {
        setIsReportModalOpen(true);
        refreshPDFPreview();
    };

    const handleToggleHeaderFooter = (val: boolean) => {
        setPrintHeaderFooter(val);
        setTimeout(() => refreshPDFPreview(), 200); 
    };

    const handleChangeLetterheadStyle = (val: string) => {
        setFormData((prev: any) => ({ ...prev, letterheadStyle: val }));
        setTimeout(() => refreshPDFPreview(), 200);
    };

    const handleCloseModal = () => {
        setIsReportModalOpen(false);
        if (pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
        }
    };

    const handleDirectDownload = () => {
        if (!pdfPreviewUrl) return;
        const a = document.createElement('a');
        a.href = pdfPreviewUrl;
        a.download = 'Lab_Seven_Report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const tabs = [ 
        { id: 'Header', label: 'Header', icon: <LayoutTemplate size={13}/> }, 
        { id: 'Body', label: 'Body', icon: <Table size={13}/> }, 
        { id: 'Footer', label: 'Footer', icon: <Stethoscope size={13}/> },
        { id: 'PrintFit', label: 'Report Fit', icon: <Printer size={13}/> },
        { id: 'DeltaReport', label: 'Delta Report', icon: <Activity size={13}/> } 
    ];

    const mobileTabs = [ 
        { id: 'Header', label: 'Header', icon: <LayoutTemplate size={10}/> }, 
        { id: 'Body', label: 'Body', icon: <Table size={10}/> }, 
        { id: 'Footer', label: 'Footer', icon: <Stethoscope size={10}/> },
        { id: 'PrintFit', label: 'Fit', icon: <Printer size={10}/> },
        { id: 'DeltaReport', label: 'Delta', icon: <Activity size={10}/> },
        { id: 'Preview', label: 'Canvas', icon: <Eye size={10}/> }
    ];

    if (isLoading) return (
        <div className="h-full flex items-center justify-center bg-white font-sans">
            <MusicBarLoader text="Loading Settings..." />
        </div>
    );

    const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
    const CurrentTabIcon = currentTabObj.icon;

    return (
        <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
            <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
                
                {/* SUCCESS POPUP */}
                {showSuccessPopup && (
                  <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-xl animate-in zoom-in-95 duration-200 max-w-xs w-full mx-4 border border-slate-200">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-2 border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={26} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-800 tracking-tight text-center" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Settings Saved Successfully!
                      </h2>
                    </div>
                  </div>
                )}

                {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    {/* Left: 20px Title in Calibri */}
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                            <LayoutTemplate size={16} />
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Report Formatting
                        </h2>
                    </div>

                    {/* Right: Desktop Module Tabs (Header, Body, Footer, Report Fit, Delta Report) */}
                    <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                                    activeTab === tab.id ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Tabs Header */}
                <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
                    {mobileTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMobileTab(tab.id)}
                            className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                                mobileTab === tab.id
                                    ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200'
                                    : 'text-slate-500'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
                <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd]">
                            {CurrentTabIcon}
                        </div>
                        <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            {activeTab === 'Header' ? 'Header Demographics Setup' : activeTab === 'Body' ? 'Body Results Table Layout' : activeTab === 'Footer' ? 'Footer & Signatures Setup' : activeTab === 'PrintFit' ? 'Report Fit & Margins' : 'Delta Report Analytics'}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-normal bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                            {formData.paperSize || 'A4'} • {isLandscape ? 'Landscape' : 'Portrait'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={handleOpenPDFPreview}
                            className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                            <Eye size={12} strokeWidth={2}/>
                            <span>Get Report</span>
                        </button>

                        <button 
                            onClick={handleSave} 
                            disabled={isPending} 
                            className="h-[24px] xl:h-[26px] px-3.5 xl:px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all shrink-0 disabled:opacity-50"
                            style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                        >
                            {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13} strokeWidth={2}/>} 
                            <span>{isPending ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                    </div>
                </div>

                {/* DESKTOP CONTENT AREA - PANELS AS SEPARATE BLOCKS */}
                <div className="hidden md:flex flex-1 overflow-hidden bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 min-h-0 gap-2.5 xl:gap-3">
                    
                    {activeTab !== 'DeltaReport' && (
                        <LivePreviewPanel 
                            formData={formData}
                            leftColFields={leftColFields}
                            rightColFields={rightColFields}
                            bodySettings={bodySettings}
                            footerSettings={footerSettings}
                            paperWidth={paperWidth}
                            paperHeight={paperHeight}
                            t={t} b={b} l={l} r={r}
                            activeImageBase64={activeImageBase64}
                            isLandscape={isLandscape}
                            printHeaderFooter={printHeaderFooter}
                            handleOpenPDFPreview={handleOpenPDFPreview}
                        />
                    )}

                    <div className={`${activeTab === 'DeltaReport' ? 'w-full max-w-4xl mx-auto rounded-[6px] border border-slate-200 shadow-sm bg-white p-3 xl:p-4 overflow-y-auto custom-scrollbar' : 'w-[48%] xl:w-[45%] rounded-[6px] border border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col min-h-0 p-2.5 xl:p-3'} transition-all`}>
                        {activeTab === 'Header' && ( <HeaderTab formData={formData} handleChange={handleChange} handleToggleSetting={handleToggleSetting} availableFields={availableFields} setAvailableFields={setAvailableFields} leftColFields={leftColFields} setLeftColFields={setLeftColFields} rightColFields={rightColFields} setRightColFields={setRightColFields} searchQuery={searchQuery} setSearchQuery={setSearchQuery} /> )}
                        {activeTab === 'Body' && ( <BodyTab bodySettings={bodySettings} handleToggleBody={handleToggleBody} handleBodySettingChange={handleBodySettingChange} /> )}
                        {activeTab === 'Footer' && ( <FooterTab footerSettings={footerSettings} handleToggleFooter={handleToggleFooter} handleFooterSettingChange={handleFooterSettingChange} /> )}
                        {activeTab === 'PrintFit' && ( <PrintFitTab formData={formData} handleChange={handleChange} handleCustomChange={handleCustomChange} /> )}
                        {activeTab === 'DeltaReport' && ( <DeltaReportTab deltaSettings={deltaSettings} setDeltaSettings={setDeltaSettings} /> )}
                    </div>
                </div>

                {/* MOBILE VIEWPORT */}
                <div className="flex md:hidden flex-col flex-1 w-full h-full bg-[#f8fafc] p-2 overflow-hidden">
                    <div className="w-full h-full bg-white rounded-[6px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                        
                        {/* Mobile Tab Content Area */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 custom-scrollbar bg-white">
                            {mobileTab === 'Header' && (
                                <HeaderTab 
                                    formData={formData} 
                                    handleChange={handleChange} 
                                    handleToggleSetting={handleToggleSetting} 
                                    availableFields={availableFields} 
                                    setAvailableFields={setAvailableFields} 
                                    leftColFields={leftColFields} 
                                    setLeftColFields={setLeftColFields} 
                                    rightColFields={rightColFields} 
                                    setRightColFields={setRightColFields} 
                                    searchQuery={searchQuery} 
                                    setSearchQuery={setSearchQuery} 
                                />
                            )}

                            {mobileTab === 'Body' && (
                                <BodyTab 
                                    bodySettings={bodySettings} 
                                    handleToggleBody={handleToggleBody} 
                                    handleBodySettingChange={handleBodySettingChange} 
                                />
                            )}

                            {mobileTab === 'Footer' && (
                                <FooterTab 
                                    footerSettings={footerSettings} 
                                    handleToggleFooter={handleToggleFooter} 
                                    handleFooterSettingChange={handleFooterSettingChange} 
                                />
                            )}

                            {mobileTab === 'PrintFit' && (
                                <PrintFitTab 
                                    formData={formData} 
                                    handleChange={handleChange} 
                                    handleCustomChange={handleCustomChange} 
                                />
                            )}

                            {mobileTab === 'DeltaReport' && (
                                <DeltaReportTab 
                                    deltaSettings={deltaSettings} 
                                    setDeltaSettings={setDeltaSettings} 
                                />
                            )}

                            {mobileTab === 'Preview' && (
                                <div className="w-full bg-white border border-slate-200 shadow-sm rounded-[6px] p-2.5 flex flex-col overflow-hidden relative">
                                    <div className="border-b border-slate-100 pb-2 mb-2 shrink-0 flex items-center justify-between gap-1 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-slate-800">Print Canvas</span>
                                            <span className="text-[8.5px] font-bold text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                                {formData.paperSize || 'A4'} • {isLandscape ? 'Landscape' : 'Portrait'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <div className="flex items-center bg-slate-100 rounded p-0.5 border border-slate-200">
                                                <button
                                                    onClick={() => setMobileZoom('fit')}
                                                    className={`h-5 px-1.5 rounded text-[8.5px] font-bold transition-all flex items-center gap-0.5 ${
                                                        mobileZoom === 'fit' ? 'bg-white text-[#9575cd] shadow-2xs' : 'text-slate-500'
                                                    }`}
                                                >
                                                    Fit View
                                                </button>
                                                <button
                                                    onClick={() => setMobileZoom('full')}
                                                    className={`h-5 px-1.5 rounded text-[8.5px] font-bold transition-all flex items-center gap-0.5 ${
                                                        mobileZoom === 'full' ? 'bg-white text-[#9575cd] shadow-2xs' : 'text-slate-500'
                                                    }`}
                                                >
                                                    100%
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleOpenPDFPreview}
                                                className="h-5 px-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-[9px] font-bold rounded flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                                            >
                                                <FileText size={10} /> Get PDF
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full overflow-auto bg-slate-100/90 p-2 rounded-lg border border-slate-200 flex justify-center items-start custom-scrollbar max-h-[72vh]">
                                        <div 
                                            style={
                                                mobileZoom === 'fit' 
                                                    ? { 
                                                            transform: `scale(${isLandscape ? 0.32 : 0.44})`, 
                                                            transformOrigin: 'top center',
                                                            width: `${paperWidth}px`,
                                                            height: `${paperHeight * (isLandscape ? 0.32 : 0.44)}px`,
                                                            marginBottom: `${isLandscape ? 30 : 60}px`
                                                        }
                                                    : {
                                                            width: `${paperWidth}px`
                                                        }
                                            }
                                            className="transition-transform duration-200 shrink-0"
                                        >
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
                                </div>
                            )}
                        </div>

                        {/* Mobile Footer */}
                        <footer className="shrink-0 bg-white p-2 z-[50] pb-safe border-t border-slate-100">
                            <div className="grid grid-cols-4 gap-1.5 w-full">
                                <button 
                                    type="button" 
                                    onClick={() => router.back()} 
                                    className="h-6 w-full flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 font-medium text-[9px] rounded active:scale-95 transition-all gap-0.5"
                                >
                                    <ChevronLeft size={12} />
                                    <span>Back</span>
                                </button>

                                {mobileTab !== 'Preview' ? (
                                    <button 
                                        type="button" 
                                        onClick={() => setMobileTab('Preview')}
                                        className="h-6 w-full bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-[#9575cd] rounded text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
                                    >
                                        <Eye size={11} />
                                        <span>Canvas</span>
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => setMobileTab('Header')}
                                        className="h-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all border border-slate-200"
                                    >
                                        <Settings2 size={11} />
                                        <span>Config</span>
                                    </button>
                                )}

                                <button 
                                    type="button" 
                                    onClick={handleOpenPDFPreview}
                                    className="h-6 w-full text-[9px] font-bold text-[#9575cd] bg-purple-50 hover:bg-purple-100/70 border border-purple-200 rounded flex items-center justify-center gap-1 active:scale-95 transition-all shadow-2xs"
                                >
                                    <FileText size={11} />
                                    <span>Preview</span>
                                </button>

                                <button 
                                    type="button" 
                                    onClick={handleSave} 
                                    disabled={isPending}
                                    className="h-6 w-full bg-[#9575cd] hover:bg-[#7e57c2] text-white rounded text-[9.5px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all disabled:opacity-70"
                                >
                                    {isPending ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                                    <span>{isPending ? '...' : 'Save'}</span>
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>

                <ReportDispatchModal 
                    isOpen={isReportModalOpen}
                    onClose={handleCloseModal}
                    pdfPreviewUrl={pdfPreviewUrl}
                    isPreviewLoading={isPreviewLoading}
                    handleDirectDownload={handleDirectDownload}
                    printHeaderFooter={printHeaderFooter}
                    onToggleHeaderFooter={handleToggleHeaderFooter}
                    letterheadStyle={formData.letterheadStyle || 'none'}
                    onChangeLetterheadStyle={handleChangeLetterheadStyle}
                    separateDept={separateDept}
                    onToggleSeparateDept={setSeparateDept}
                    separateTest={separateTest}
                    onToggleSeparateTest={setSeparateTest}
                    billItems={[]} 
                    selectedItemIds={[]}
                    onToggleItem={() => {}}
                    onSelectAll={() => {}}
                    onDeselectAll={() => {}}
                />

                <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            </div>
        </div>
    );
}
// --- BLOCK app/reports/page.tsx CLOSE ---