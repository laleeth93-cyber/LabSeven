"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Table, LayoutTemplate, Stethoscope, Printer, CheckCircle, Activity, ChevronLeft, Eye, FileText, Settings2 } from 'lucide-react';
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
        bodyLineHeight: '1.5', // 🚨 ADDED
        bodyHeaderBgColor: '#f8fafc', bodyHeaderTextColor: '#1e293b', bodyResultAlign: 'text-left',
        headerFontSize: 'text-xs', headerFontWeight: 'font-bold', headerRowHeight: 'py-1.5', headerBorderRadius: 'none', headerToBodyGap: '0', // 🚨 ADDED
        showDepartmentName: true, showTestName: true, departmentNameSize: 'text-sm', testNameAlignment: 'text-center', testNameUnderline: true, testNameSize: 'text-base', gridLineThickness: '1',
        subheadingColor: '#5e35b1', subheadingSize: 'text-sm',
        flagStyle: 'lh', flagColorLow: '#3b82f6', flagColorNormal: '#000000', flagColorHigh: '#ef4444',
        tableHeaderRepeat: 'test', separatePagesBy: 'none',
        testBlockSpacing: 'mb-4' // 🚨 ADDED
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
        { id: 'Header', label: 'Header (Demographics)', icon: <LayoutTemplate size={14}/> }, 
        { id: 'Body', label: 'Body (Results Table)', icon: <Table size={14}/> }, 
        { id: 'Footer', label: 'Footer (Signatures)', icon: <Stethoscope size={14}/> },
        { id: 'PrintFit', label: 'Report Fit (Print & Margins)', icon: <Printer size={14}/> },
        { id: 'DeltaReport', label: 'Delta Report (Analytics)', icon: <Activity size={14}/> } 
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
        <div className="h-full flex items-center justify-center bg-[#f1f5f9]">
            <MusicBarLoader text="Loading Settings..." />
        </div>
    );

    return (
        <div className="h-full w-full bg-[#f1f5f9] flex flex-col font-sans relative">
            
            {showSuccessPopup && (
              <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                    <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Settings Saved!</h2>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* DESKTOP RATIO (100% UNTOUCHED ORIGINAL LAYOUT)                            */}
            {/* ========================================================================= */}
            <div className="hidden md:flex flex-col flex-1 h-full w-full bg-[#f1f5f9] overflow-hidden">
                <header className="flex justify-between items-center p-6 pb-4 shrink-0 bg-white border-b border-slate-200 z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Report Template Configuration</h1>
                        <p className="text-sm text-slate-500 mt-1">Design the anatomy of your printed PDF reports.</p>
                    </div>
                    <button onClick={handleSave} disabled={isPending} className="flex items-center gap-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-70">
                        {isPending ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {isPending ? 'Saving...' : 'Save Settings'}
                    </button>
                </header>

                <div className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm px-6">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-[3px] ${activeTab === tab.id ? 'border-[#9575cd] text-[#9575cd] bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex gap-6 p-6 min-h-0">
                    
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

                    <div className={`${activeTab === 'DeltaReport' ? 'w-full max-w-4xl mx-auto' : 'w-[50%]'} flex flex-col min-h-0 transition-all`}>
                        {activeTab === 'Header' && ( <HeaderTab formData={formData} handleChange={handleChange} handleToggleSetting={handleToggleSetting} availableFields={availableFields} setAvailableFields={setAvailableFields} leftColFields={leftColFields} setLeftColFields={setLeftColFields} rightColFields={rightColFields} setRightColFields={setRightColFields} searchQuery={searchQuery} setSearchQuery={setSearchQuery} /> )}
                        {activeTab === 'Body' && ( <BodyTab bodySettings={bodySettings} handleToggleBody={handleToggleBody} handleBodySettingChange={handleBodySettingChange} /> )}
                        {activeTab === 'Footer' && ( <FooterTab footerSettings={footerSettings} handleToggleFooter={handleToggleFooter} handleFooterSettingChange={handleFooterSettingChange} /> )}
                        {activeTab === 'PrintFit' && ( <PrintFitTab formData={formData} handleChange={handleChange} handleCustomChange={handleCustomChange} /> )}
                        {activeTab === 'DeltaReport' && ( <DeltaReportTab deltaSettings={deltaSettings} setDeltaSettings={setDeltaSettings} /> )}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MOBILE RATIO (BUILT SPECIFICALLY FOR MOBILE RATIO)                        */}
            {/* ========================================================================= */}
            <div className="flex md:hidden flex-col flex-1 w-full h-full bg-[#f1f5f9] p-2 overflow-hidden">
                <div className="w-full h-full bg-white rounded-none border-0 shadow-sm overflow-hidden flex flex-col relative">
                {/* Mobile Tab Switcher Ribbon */}
                <div className="px-2 py-1 bg-white shrink-0 z-10 overflow-x-auto no-scrollbar flex items-center gap-1">
                    {mobileTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMobileTab(tab.id)}
                            className={`h-5 px-2 rounded-full text-[8.5px] font-bold shrink-0 flex items-center gap-1 transition-all ${
                                mobileTab === tab.id
                                    ? 'bg-[#9575cd] text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

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
                        <div className="w-full bg-white border border-slate-200 shadow-sm rounded-none md:rounded-xl p-2.5 flex flex-col overflow-hidden relative">
                            {/* Preview Controls Bar */}
                            <div className="border-b border-slate-100 pb-2 mb-2 shrink-0 flex items-center justify-between gap-1 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-800">Print Canvas</span>
                                    <span className="text-[8.5px] font-bold text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                        {formData.paperSize || 'A4'} • {isLandscape ? 'Landscape' : 'Portrait'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    {/* Zoom Mode Toggle */}
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

                            {/* Canvas Scroll Viewport */}
                            <div className="w-full overflow-auto bg-slate-200/90 p-2 rounded-lg border border-slate-200 flex justify-center items-start custom-scrollbar max-h-[72vh]">
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

                {/* Mobile Proper Footer */}
                <footer className="shrink-0 bg-white p-2 z-[50] pb-safe">
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
    );
}
