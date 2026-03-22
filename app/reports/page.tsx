// --- BLOCK app/reports/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Save, Loader2, Table, LayoutTemplate, Stethoscope, Printer, CheckCircle, Activity } from 'lucide-react';
import { getReportSettings, updateReportSettings } from '@/app/actions/reports';

import HeaderTab from './components/HeaderTab';
import BodyTab from './components/BodyTab';
import FooterTab from './components/FooterTab';
import PrintFitTab from './components/PrintFitTab';
import LivePreviewPanel from './components/LivePreviewPanel';
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

// Default settings for Delta / Smart Reports
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
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Header');
    
    const [printHeaderFooter, setPrintHeaderFooter] = useState(true);
    
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const [separateDept, setSeparateDept] = useState(false);
    const [separateTest, setSeparateTest] = useState(false);

    // --- SUCCESS POPUP STATE ---
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
        showMethodCol: true, methodDisplayStyle: 'column', showUnitCol: true, showRefRangeCol: true, highlightAbnormal: true, stripedRows: false,
        testColumnWidth: 'auto', 
        colWidthParam: '', colWidthResult: '', colWidthUnit: '', colWidthRef: '', colWidthMethod: '',
        showEndOfReport: true, 
        bodyTableStyle: 'horizontal', bodyFontFamily: 'font-sans', bodyFontSize: 'text-sm', bodyRowHeight: 'py-2', bodyColPadding: 'px-2',
        bodyHeaderBgColor: '#f8fafc', bodyHeaderTextColor: '#1e293b', bodyResultAlign: 'text-left',
        showDepartmentName: true, departmentNameSize: 'text-sm', testNameAlignment: 'text-center', testNameUnderline: true, testNameSize: 'text-base', gridLineThickness: '1',
        subheadingColor: '#5e35b1', subheadingSize: 'text-sm'
    });
    
    const [footerSettings, setFooterSettings] = useState({ 
        footerStyle: 'style1', showQrCode: true, showBarcode: false, showPageNumbers: true, 
        qrPlacement: 'footer', qrText: 'Scan to validate', barcodeText: 'none',
        sigSize: 40, sigSpacing: 4, docNameSize: 10, docDesigSize: 8, docNameSpacing: 2, sigAlignment: 'center'
    });

    const [deltaSettings, setDeltaSettings] = useState<any>(defaultDeltaSettings);

    useEffect(() => {
        const loadSettings = async () => {
            const res = await getReportSettings();
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
                    showMethodCol: dbData.showMethodCol !== undefined ? dbData.showMethodCol : true, methodDisplayStyle: dbData.methodDisplayStyle || 'column', showUnitCol: dbData.showUnitCol !== undefined ? dbData.showUnitCol : true, showRefRangeCol: dbData.showRefRangeCol !== undefined ? dbData.showRefRangeCol : true, highlightAbnormal: dbData.highlightAbnormal !== undefined ? dbData.highlightAbnormal : true, stripedRows: dbData.stripedRows !== undefined ? dbData.stripedRows : false,
                    testColumnWidth: dbData.testColumnWidth || 'auto', 
                    colWidthParam: dbData.colWidthParam || '',
                    colWidthResult: dbData.colWidthResult || '',
                    colWidthUnit: dbData.colWidthUnit || '',
                    colWidthRef: dbData.colWidthRef || '',
                    colWidthMethod: dbData.colWidthMethod || '',
                    showEndOfReport: dbData.showEndOfReport !== undefined ? dbData.showEndOfReport : true, 
                    bodyTableStyle: dbData.bodyTableStyle || 'horizontal', bodyFontFamily: dbData.bodyFontFamily || 'font-sans', bodyFontSize: dbData.bodyFontSize || 'text-sm', bodyRowHeight: dbData.bodyRowHeight || 'py-2', bodyColPadding: dbData.bodyColPadding || 'px-2',
                    bodyHeaderBgColor: parseToHexColor(dbData.bodyHeaderBgColor, '#f8fafc'), bodyHeaderTextColor: parseToHexColor(dbData.bodyHeaderTextColor, '#1e293b'), bodyResultAlign: dbData.bodyResultAlign || 'text-left',
                    showDepartmentName: dbData.showDepartmentName !== undefined ? dbData.showDepartmentName : true, departmentNameSize: dbData.departmentNameSize || 'text-sm', testNameAlignment: dbData.testNameAlignment || 'text-center', testNameUnderline: dbData.testNameUnderline !== undefined ? dbData.testNameUnderline : true, testNameSize: dbData.testNameSize || 'text-base', gridLineThickness: dbData.gridLineThickness || '1',
                    subheadingColor: parseToHexColor(dbData.subheadingColor, '#5e35b1'), subheadingSize: dbData.subheadingSize || 'text-sm'
                });

                setFooterSettings({
                    footerStyle: dbData.footerStyle || 'style1', showQrCode: dbData.showQrCode !== undefined ? dbData.showQrCode : true, showBarcode: dbData.showBarcode !== undefined ? dbData.showBarcode : false, showPageNumbers: dbData.showPageNumbers !== undefined ? dbData.showPageNumbers : true, 
                    qrPlacement: dbData.qrPlacement || 'footer', qrText: dbData.qrText || 'Scan to validate', barcodeText: dbData.barcodeText || 'none',
                    sigSize: dbData.sigSize ?? 40, sigSpacing: dbData.sigSpacing ?? 4, docNameSize: dbData.docNameSize ?? 10, docDesigSize: dbData.docDesigSize ?? 8, docNameSpacing: dbData.docNameSpacing ?? 2, sigAlignment: dbData.sigAlignment || 'center'
                });

                // Load Delta Settings
                if (dbData.deltaSettings) {
                    try {
                        const parsed = JSON.parse(dbData.deltaSettings);
                        setDeltaSettings({ ...defaultDeltaSettings, ...parsed });
                    } catch(e) {
                        console.error("Failed to parse delta settings");
                    }
                }

                let initialLeft: any[] = []; let initialRight: any[] = [];
                
                // --- FIX LABELS ON LOAD ---
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
                deltaSettings: JSON.stringify(deltaSettings) // Save our new settings
            };
            const res = await updateReportSettings(payload);
            if (res.success) {
                setShowSuccessPopup(true);
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
        { id: 'DeltaReport', label: 'Delta Report (Analytics)', icon: <Activity size={14}/> } // NEW TAB
    ];

    if (isLoading) return <div className="h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2"/> Loading Settings...</div>;

    return (
        <div className="h-full w-full bg-[#f1f5f9] flex flex-col font-sans relative">
            
            {/* --- SUCCESS POPUP OVERLAY --- */}
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
                
                {/* Do not render standard PDF live preview for the Delta setting screen to make room */}
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
// --- BLOCK app/reports/page.tsx CLOSE ---