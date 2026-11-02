"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicDocumentData, getPublicDeltaCheckData } from "@/app/actions/verify";
import { Loader2, AlertTriangle, FileText, CheckCircle2, Printer, Download } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import PatientReportDocument from '@/app/list/components/PatientReportDocument';
import SmartReportDocument from '@/app/list/components/SmartReportDocument';
import { InvoiceDocument } from '@/app/registration/InvoiceDocument';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

function VerifyDocumentContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [verifiedInvoiceData, setVerifiedInvoiceData] = useState<any>(null);
    const [invoiceBarcodeUrl, setInvoiceBarcodeUrl] = useState<string>('');
    const [invoiceQrUrl, setInvoiceQrUrl] = useState<string>('');

    useEffect(() => {
        async function generateAndOpenPdf() {
            try {
                if (!params?.id) return;
                
                const identifier = Array.isArray(params.id) ? params.id[0] : params.id;
                const isSmartReport = searchParams.get('type') === 'smart';
                const isInvoice = searchParams.get('type') === 'invoice';
                const orgQuery = searchParams.get('org');
                
                const res = await getPublicDocumentData(identifier, Date.now().toString(), orgQuery || undefined);
                
                if (!res.success) {
                    setError(res.message || "Invalid verification link or document not found.");
                    setLoading(false); return;
                }

                const { bill, reportSettings, labProfile } = res.data as any; 

                let settingsData: any = reportSettings || {};
                let profileData: any = labProfile || {};

                const queryLh = searchParams.get('lh');
                if (queryLh) {
                    settingsData.letterheadStyle = queryLh;
                }

                settingsData.labName = profileData.name;
                settingsData.tagline = profileData.tagline;
                settingsData.address = profileData.address;
                settingsData.phone = profileData.phone;
                settingsData.email = profileData.email;
                settingsData.website = profileData.website;
                settingsData.logoUrl = profileData.logoUrl;

                let deltaSettingsData: any = {};
                if (settingsData.deltaSettings) {
                    try { 
                        let parsed = settingsData.deltaSettings;
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                        if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
                        deltaSettingsData = parsed;
                    } catch(e) {}
                }

                // 🚨 Only filter pending tests for lab test reports, NOT for invoices!
                if (!isInvoice && bill.items) {
                    bill.items = bill.items.filter((item: any) => {
                        const isCult = item.test?.isCulture;
                        return isCult !== true && isCult !== 'true' && item.status !== 'Pending';
                    });
                }

                if (bill.approvedBy1) {
                    const u = bill.approvedBy1;
                    let formattedDesignation = u.designation || '';
                    if (u.degree) formattedDesignation += formattedDesignation ? ` | ${u.degree}` : u.degree;
                    if (u.regNumber) formattedDesignation += formattedDesignation ? ` | ${u.regNumber}` : u.regNumber;
                    settingsData.doc1Name = u.signName || u.name;
                    settingsData.doc1SignUrl = u.signatureUrl === 'null' ? null : u.signatureUrl;
                    settingsData.doc1Designation = formattedDesignation;
                } else {
                    settingsData.doc1Name = ' '; settingsData.doc1SignUrl = null; settingsData.doc1Designation = null;
                }

                if (bill.approvedBy2) {
                    const u = bill.approvedBy2;
                    let formattedDesignation = u.designation || '';
                    if (u.degree) formattedDesignation += formattedDesignation ? ` | ${u.degree}` : u.degree;
                    if (u.regNumber) formattedDesignation += formattedDesignation ? ` | ${u.regNumber}` : u.regNumber;
                    settingsData.doc2Name = u.signName || u.name;
                    settingsData.doc2SignUrl = u.signatureUrl === 'null' ? null : u.signatureUrl;
                    settingsData.doc2Designation = formattedDesignation;
                } else {
                    settingsData.doc2Name = null; settingsData.doc2SignUrl = null; settingsData.doc2Designation = null;
                }

                const baseDate = bill.date ? new Date(bill.date) : new Date();
                const collectedDateStr = baseDate.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');

                let repDateObj = new Date();
                if (bill.items && bill.items.length > 0) {
                    const latestUpdate = bill.items.reduce((latest: Date, current: any) => {
                        const currentUpdate = new Date(current.updatedAt || current.createdAt || Date.now());
                        return currentUpdate > latest ? currentUpdate : latest;
                    }, new Date(0));
                    if (latestUpdate.getTime() > 0) repDateObj = latestUpdate;
                } else if (bill.updatedAt) {
                    repDateObj = new Date(bill.updatedAt);
                }
                const reportedDateStr = repDateObj.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');

                // ==========================================
                // INVOICE (BILL) REPORT GENERATOR & VIEWER
                // ==========================================
                if (isInvoice) {
                    let barcodeUrl = '';
                    try {
                        const canvas = document.createElement('canvas');
                        const shortBarcodeText = String(bill.billNumber || '').slice(-4);
                        JsBarcode(canvas, shortBarcodeText, { 
                            format: "CODE128", 
                            displayValue: false, 
                            height: 20, 
                            width: 1, 
                            margin: 0, 
                            background: "transparent", 
                            lineColor: "#000000" 
                        });
                        barcodeUrl = canvas.toDataURL();
                    } catch(e){}

                    const qrUrlString = typeof window !== 'undefined' ? window.location.href : '';
                    let qrDataUrl = '';
                    try {
                        qrDataUrl = await QRCode.toDataURL(qrUrlString, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } });
                    } catch(e){}

                    const fullName = `${bill.patient?.designation || ''} ${bill.patient?.firstName || ''} ${bill.patient?.lastName || ''}`.trim() || 'Unknown Patient';
                    const ageString = `${bill.patient?.ageY || 0} Y / ${bill.patient?.gender || 'Unknown'}`;
                    const dateString = new Date(bill.date || Date.now()).toLocaleString('en-GB');
                    const referredString = bill.referredBy || bill.patient?.refDoctor || 'Self';

                    const subTotal = Number(bill.subTotal || (Number(bill.netAmount || 0) + Number(bill.discountAmount || 0)));
                    const discount = Number(bill.discountAmount || bill.discount || 0);
                    const totalAmount = Number(bill.netAmount || bill.totalAmount || 0);
                    const paidAmount = Number(bill.paidAmount || 0);
                    
                    const dbBalance = Number(bill.balanceAmount || bill.balanceDue || bill.dueAmount || 0);
                    const computedBalance = Math.max(0, totalAmount - paidAmount);
                    const finalBalanceDue = dbBalance > 0 ? dbBalance : computedBalance;

                    const finalItems = (bill.items || []).map((i: any) => ({ 
                        id: i.id, 
                        name: i.test?.displayName || i.test?.name || i.testName || 'Test', 
                        price: Number(i.price || 0) 
                    }));

                    const finalAuthorSign = (res.data as any)?.authorSign || null;

                    const invoiceData = {
                        id: bill.id,
                        organizationId: bill.organizationId,
                        billId: bill.billNumber,
                        billDate: dateString,
                        patientName: fullName,
                        ageGender: ageString,
                        referredBy: referredString,
                        paymentType: bill.paymentMode || 'Cash',
                        items: finalItems,
                        subTotal: subTotal,
                        discount: discount,
                        totalAmount: totalAmount,
                        paidAmount: paidAmount,
                        balanceDue: finalBalanceDue,
                        barcodeUrl: barcodeUrl,
                        qrUrl: qrDataUrl, 
                        labProfile: profileData,
                        note: bill.discountReason || bill.note || '',
                        authorSign: finalAuthorSign
                    };

                    setInvoiceBarcodeUrl(barcodeUrl);
                    setInvoiceQrUrl(qrDataUrl);
                    setVerifiedInvoiceData(invoiceData);

                    // Generate PDF blob in background for the download button
                    try {
                        const blob = await pdf(<InvoiceDocument data={invoiceData as any} />).toBlob();
                        const url = URL.createObjectURL(blob);
                        setPdfUrl(url);
                    } catch (pdfErr) {
                        console.error("Invoice PDF generation error:", pdfErr);
                    }

                    setLoading(false);
                    return;
                }

                let documentElement;

                // ==========================================
                // SMART (DELTA) REPORT GENERATOR
                // ==========================================
                if (isSmartReport) {
                    let groupedData: any = {};
                    
                    const deltaRes = await getPublicDeltaCheckData(bill.id, bill.patientId);
                    
                    if (deltaRes.success && deltaRes.data) {
                        const withHistory = deltaRes.data.filter((d: any) => d.previousValue !== null);
                        groupedData = withHistory.reduce((acc: any, curr: any) => {
                            if (!acc[curr.testName]) acc[curr.testName] = [];
                            acc[curr.testName].push(curr);
                            return acc;
                        }, {});
                    }

                    const qrUrlString = window.location.href;
                    const qrDataUrl = await QRCode.toDataURL(qrUrlString, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } });

                    documentElement = (
                        <SmartReportDocument 
                            bill={bill}
                            groupedData={groupedData}
                            reportSettings={settingsData}
                            reportedDate={reportedDateStr}
                            deltaSettings={deltaSettingsData}
                            qrDataUrl={qrDataUrl}
                        />
                    );

                } 
                // ==========================================
                // ROUTINE (NORMAL) REPORT GENERATOR
                // ==========================================
                else {
                    let barcodeUrl = '';
                    try {
                        const canvas = document.createElement('canvas');
                        const shortBarcodeText = String(bill.billNumber || '').slice(-4);
                        JsBarcode(canvas, shortBarcodeText, { displayValue: false, height: 40, width: 1.5, margin: 0, background: "transparent", lineColor: "#000000" });
                        barcodeUrl = canvas.toDataURL();
                    } catch(e){}

                    const qrUrl = window.location.href;
                    const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } });

                    let displayData: any[] = [];
                    if (bill.items && Array.isArray(bill.items)) {
                        const getAgeInDays = (val: number, unit: string) => {
                            if (unit === 'Years') return val * 365;
                            if (unit === 'Months') return val * 30;
                            return val;
                        };

                        const getPatientAgeDays = () => {
                            const y = bill.patient?.ageY || 0; const m = bill.patient?.ageM || 0; const d = bill.patient?.ageD || 0;
                            return (y * 365) + (m * 30) + d;
                        };

                        const getMatchedRange = (parameter: any) => {
                            if (!parameter) return null;
                            const patientGender = bill.patient?.gender || 'Male';
                            const patientDays = getPatientAgeDays();

                            if (parameter.ranges && parameter.ranges.length > 0) {
                                const match = parameter.ranges.find((r: any) => {
                                    const genderMatch = r.gender === 'Both' || r.gender === patientGender;
                                    const minDays = getAgeInDays(r.minAge, r.minAgeUnit);
                                    const maxDays = getAgeInDays(r.maxAge, r.maxAgeUnit);
                                    return genderMatch && (patientDays >= minDays && patientDays <= maxDays);
                                });
                                if (match) return match;
                            }
                            return null; 
                        };

                        const getDisplayRange = (parameter: any) => {
                            if (!parameter) return '';
                            const range = getMatchedRange(parameter);
                            if (range) {
                                if (range.normalRange && range.normalRange.trim() !== '') return range.normalRange;
                                if (range.normalValue && range.normalValue.trim() !== '') return range.normalValue;
                                if (range.lowRange !== null && range.highRange !== null) return `${range.lowRange} - ${range.highRange}`;
                            }
                            if (parameter.minVal !== null && parameter.maxVal !== null) return `${parameter.minVal} - ${parameter.maxVal}`;
                            return parameter.referenceRange ?? parameter.bioRefRange ?? parameter.normalRange ?? '';
                        };

                        let itemsToProcess = bill.items;

                        itemsToProcess.forEach((item: any) => {
                            if (item.test && item.test.isConfigured === false) return;

                            const testName = item.test?.displayName || item.test?.name || item.testName || 'TEST';
                            displayData.push({ isGroup: true, isSubHeading: false, param: testName, result: '', unit: '', ref: '', method: '', abnormal: false });
                            
                            const results = item.results || [];
                            const printedParamIds = new Set();

                            const processParams = (paramsList: any[]) => {
                                if (!paramsList || paramsList.length === 0) return;
                                
                                paramsList.forEach((junctionOrParam: any) => {
                                    const actualParam = junctionOrParam.parameter;

                                    if (junctionOrParam.isHeading) {
                                        const hText = junctionOrParam.headingText || actualParam?.displayName || actualParam?.name || '---';
                                        displayData.push({ isGroup: true, isSubHeading: true, param: hText, result: '', unit: '', ref: '', method: '', abnormal: false });
                                        return;
                                    }

                                    if (!actualParam) {
                                        if (junctionOrParam.headingText || junctionOrParam.name) {
                                            displayData.push({ isGroup: false, param: junctionOrParam.headingText || junctionOrParam.name, result: '', unit: '', ref: '', method: '', abnormal: false });
                                        }
                                        return; 
                                    }
                                    
                                    const pId = actualParam.id;
                                    printedParamIds.add(pId);
                                    const pName = actualParam.displayName || actualParam.name || '-';

                                    const matchedResult = results.find((r: any) => r.parameterId === pId);
                                    let val = matchedResult ? (matchedResult.resultValue ?? matchedResult.value ?? matchedResult.result ?? matchedResult.enteredValue ?? '') : '';

                                    if (val === null || val === undefined || String(val).trim() === '') return; 

                                    const refRange = getDisplayRange(actualParam);
                                    const activeRange = getMatchedRange(actualParam);
                                    const abnormalValues = activeRange?.abnormalValue ? activeRange.abnormalValue.split(',').map((v: string) => v.trim().toLowerCase()) : [];

                                    let isAbnormal = false;
                                    
                                    if (matchedResult) {
                                        const flag = String(matchedResult.flag || '').trim().toUpperCase();
                                        if (['H', 'L', 'HIGH', 'LOW', '*', 'A', 'ABNORMAL'].includes(flag) || matchedResult.isAbnormal) {
                                            isAbnormal = true;
                                        } 
                                    }

                                    if (val && abnormalValues.includes(String(val).trim().toLowerCase())) isAbnormal = true;

                                    displayData.push({
                                        isGroup: false, param: pName, result: val !== '' ? String(val) : '', 
                                        unit: actualParam.unit ?? '', ref: refRange, method: actualParam.method ?? '',
                                        abnormal: isAbnormal, inputType: actualParam.inputType || 'Numerical'
                                    });
                                });
                            };

                            processParams(item.test?.parameters);

                            if (item.test?.packageTests && Array.isArray(item.test.packageTests)) {
                                item.test.packageTests.forEach((pt: any) => { if (pt.test) processParams(pt.test.parameters); });
                            }

                            if (results && results.length > 0) {
                                results.forEach((res: any) => {
                                    if (!res.parameterId || printedParamIds.has(res.parameterId)) return; 
                                    const actualParam = res.parameter || {};
                                    const pName = actualParam.displayName || actualParam.name || '-';
                                    if (pName === '-') return;

                                    let val = res.resultValue ?? res.value ?? res.result ?? res.enteredValue ?? '';
                                    if (val === null || val === undefined || String(val).trim() === '') return; 

                                    const refRange = getDisplayRange(actualParam);
                                    const activeRange = getMatchedRange(actualParam);
                                    const abnormalValues = activeRange?.abnormalValue ? activeRange.abnormalValue.split(',').map((v: string) => v.trim().toLowerCase()) : [];

                                    let isAbnormal = false;
                                    const flag = String(res.flag || '').trim().toUpperCase();
                                    if (['H', 'L', 'HIGH', 'LOW', '*', 'A', 'ABNORMAL'].includes(flag) || res.isAbnormal) isAbnormal = true;
                                    if (val && abnormalValues.includes(String(val).trim().toLowerCase())) isAbnormal = true;

                                    displayData.push({
                                        isGroup: false, param: pName, result: val !== '' ? String(val) : '',
                                        unit: actualParam.unit ?? '', ref: refRange, method: actualParam.method ?? '',
                                        abnormal: isAbnormal, inputType: actualParam.inputType || 'Numerical'
                                    });
                                });
                            }
                        });

                        let cleanedDisplayData: any[] = [];
                        for (let i = 0; i < displayData.length; i++) {
                            const current = displayData[i];
                            const next = displayData[i + 1];

                            if (current.isGroup) {
                                if (next && next.isGroup) continue; 
                                if (!next) continue; 
                            }
                            cleanedDisplayData.push(current);
                        }
                        displayData = cleanedDisplayData;
                    }

                    let activeImageBase64: string | null = null;
                    const letterheadStyle = settingsData.letterheadStyle || 'none';

                    if (letterheadStyle === 'custom1' && settingsData.customHeader1 !== 'null') activeImageBase64 = settingsData.customHeader1 || null;
                    if (letterheadStyle === 'custom2' && settingsData.customHeader2 !== 'null') activeImageBase64 = settingsData.customHeader2 || null;
                    if (letterheadStyle === 'custom3' && settingsData.customHeader3 !== 'null') activeImageBase64 = settingsData.customHeader3 || null;
                    if (letterheadStyle === 'custom4' && settingsData.customHeader4 !== 'null') activeImageBase64 = settingsData.customHeader4 || null;

                    documentElement = (
                        <PatientReportDocument 
                            realData={bill}
                            displayData={displayData}
                            reportSettings={settingsData}
                            barcodeUrl={barcodeUrl}
                            qrDataUrl={qrDataUrl}
                            collectedDate={collectedDateStr}
                            reportedDate={reportedDateStr}
                            activeImageBase64={activeImageBase64}
                            printHeaderFooter={true}
                            letterheadStyle={letterheadStyle}
                            separateDept={false}
                            separateTest={false}
                        />
                    );
                }

                const blob = await pdf(documentElement).toBlob();
                const url = URL.createObjectURL(blob);
                
                setPdfUrl(url);
                setLoading(false);

                window.location.replace(url);

            } catch (err: any) {
                console.error("PDF Generation Error:", err);
                setError("Failed to generate the PDF document.");
                setLoading(false);
            }
        }
        generateAndOpenPdf();
    }, [params?.id, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <Loader2 className="animate-spin text-[#a07be1] mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Generating Report...</h2>
                <p className="text-slate-500 font-medium text-sm text-center">Please wait while we securely prepare your PDF document.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
                        <AlertTriangle className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Error Loading Report</h2>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                </div>
            </div>
        );
    }

    // ========================================================
    // VERIFIED INVOICE (BILL) POPUP-STYLE WEB VIEW
    // ========================================================
    if (verifiedInvoiceData) {
        const profile = verifiedInvoiceData.labProfile || {};
        const hasLetterhead = profile?.letterheadUrl && 
                              profile.letterheadUrl !== 'null' && 
                              profile.letterheadUrl !== 'undefined' && 
                              profile.letterheadUrl.trim() !== '';

        return (
            <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
                {/* Header Toolbar */}
                <div className="h-14 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-xs sticky top-0 z-50 print:hidden">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm md:text-base font-bold text-slate-800 leading-tight">Verified Invoice</h1>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Official Bill</span>
                            </div>
                            <p className="text-[10px] text-slate-400">Lab Seven Authenticated Document • {verifiedInvoiceData.billId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                            <Printer size={14} /> <span>Print</span>
                        </button>
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                download={`${verifiedInvoiceData.billId}_Invoice.pdf`}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                                style={{ background: 'linear-gradient(135deg, #9575cd, #7e57c2)' }}
                            >
                                <Download size={14} /> <span>Download PDF</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Main A4 Printable Sheet */}
                <div className="flex-1 overflow-y-auto py-6 md:py-8 px-2 md:px-4 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
                    <div className="w-full flex justify-center origin-top transform scale-[0.45] sm:scale-[0.62] md:scale-[0.85] lg:scale-[0.95] xl:scale-100 print:transform-none print:m-0 mb-[-45%] sm:mb-[-28%] md:mb-[-12%] lg:mb-0">
                        <div 
                            id="invoice-printable-area" 
                            className="bg-white shadow-xl md:shadow-2xl border border-slate-200 shrink-0 mx-auto print:border-none print:shadow-none"
                            style={{ position: 'relative', width: '794px', minHeight: '1123px', display: 'flex', flexDirection: 'column' }}
                        >
                            {/* Background Letterhead Layer */}
                            {hasLetterhead && (
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
                                    <img 
                                        src={profile.letterheadUrl} 
                                        alt="Letterhead Stationery" 
                                        style={{
                                            width: profile.lhWidth ? `${profile.lhWidth}px` : '100%',
                                            height: profile.lhHeight ? `${profile.lhHeight}px` : '100%',
                                            objectFit: profile.lhWidth || profile.lhHeight ? 'contain' : 'fill',
                                            objectPosition: 'top center',
                                            display: 'block'
                                        }} 
                                    />
                                </div>
                            )}

                            <div 
                                style={{
                                    position: 'relative',
                                    zIndex: 10,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    flex: 1,
                                    paddingTop: hasLetterhead ? `${profile.lhMt || 120}px` : '40px',
                                    paddingBottom: hasLetterhead ? `${profile.lhMb || 80}px` : '40px',
                                    paddingLeft: hasLetterhead ? `${profile.lhMl || 40}px` : '40px',
                                    paddingRight: hasLetterhead ? `${profile.lhMr || 40}px` : '40px',
                                }}
                            >
                                {!hasLetterhead && (
                                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                                        <div className="flex items-center gap-4 text-left">
                                            {profile?.logoUrl && <img src={profile.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />}
                                            <div>
                                                <h1 className="text-3xl font-black uppercase text-slate-900 leading-none">{profile?.name || 'Smart Lab'}</h1>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{profile?.tagline || 'Pathology & Diagnostics'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-slate-500 space-y-0.5 max-w-[200px]">
                                            {profile?.address ? <p className="whitespace-pre-wrap">{profile.address}</p> : <><p>123, Health Avenue, Medical District</p><p>City - 500010, State</p></>}
                                            <p>Ph: {profile?.phone || '+91 98765 43210'}</p>
                                            {profile?.email && <p>{profile.email}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* DEMOGRAPHICS GRID */}
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-8">
                                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Bill ID:</span> <span className="font-bold text-slate-700">{verifiedInvoiceData.billId}</span></div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Date:</span> <span className="font-bold text-slate-700">{verifiedInvoiceData.billDate}</span></div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Patient:</span> <span className="font-bold text-slate-700">{verifiedInvoiceData.patientName}</span></div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Referred By:</span> <span className="font-bold text-slate-700">{verifiedInvoiceData.referredBy}</span></div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Age/Gender:</span> <span className="font-bold text-slate-700">{verifiedInvoiceData.ageGender}</span></div>
                                    <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Mode:</span> <span className="font-bold text-slate-700">{verifiedInvoiceData.paymentType}</span></div>
                                </div>

                                {/* TEST ITEMS TABLE */}
                                <div className="mb-4">
                                    <table className="w-full text-xs border-collapse mb-4">
                                        <thead>
                                            <tr className="bg-slate-800 text-white">
                                            <th className="py-2 pl-3 text-left rounded-l-sm">TEST DESCRIPTION</th>
                                            <th className="py-2 pr-3 text-right rounded-r-sm w-32">AMOUNT (₹)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {verifiedInvoiceData.items.map((item: any, i: number) => (
                                            <tr key={i} className="border-b border-slate-100">
                                                <td className="py-2 pl-3 text-slate-700 font-medium">{item.name}</td>
                                                <td className="py-2 pr-3 text-right font-bold text-slate-800">{Number(item.price || 0).toFixed(2)}</td>
                                            </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* BARCODES, QR & TOTALS */}
                                <div className="flex justify-between items-start pt-4 border-t border-slate-100">
                                    <div className="w-[50%] flex items-end gap-6 pb-1">
                                        {invoiceBarcodeUrl && (
                                        <div className="opacity-90 flex flex-col items-center">
                                            <img src={invoiceBarcodeUrl} alt="Barcode" className="h-5 w-[80px] mb-1" />
                                            <p className="text-[10px] text-slate-500 font-mono tracking-widest">{String(verifiedInvoiceData.billId || '').slice(-4)}</p>
                                        </div>
                                        )}
                                        
                                        <div className="opacity-90 flex flex-col items-center">
                                            <div className="p-1 bg-white border border-slate-200 rounded flex items-center justify-center w-[44px] h-[44px]">
                                                {invoiceQrUrl ? <img src={invoiceQrUrl} alt="QR Code" className="w-full h-full" /> : <div className="w-full h-full bg-slate-50"></div>}
                                            </div>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Scan to Verify</p>
                                        </div>
                                    </div>

                                    <div className="w-[45%] flex flex-col">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500"><span>Sub Total</span><span>{Number(verifiedInvoiceData.subTotal || 0).toFixed(2)}</span></div>
                                            {Number(verifiedInvoiceData.discount || 0) > 0 && <div className="flex justify-between text-xs text-red-500"><span>Discount</span><span>- {Number(verifiedInvoiceData.discount || 0).toFixed(2)}</span></div>}
                                            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-900 pt-2 mt-1"><span>Net Amount</span><span>₹ {Number(verifiedInvoiceData.totalAmount || 0).toFixed(2)}</span></div>
                                            <div className="flex justify-between text-xs font-bold bg-green-50 text-green-600 px-1 py-1 rounded"><span>Paid Amount</span><span>{Number(verifiedInvoiceData.paidAmount || 0).toFixed(2)}</span></div>
                                            {Number(verifiedInvoiceData.balanceDue || 0) > 0 && <div className="flex justify-between text-xs font-bold bg-red-50 text-red-600 px-1 py-1 rounded"><span>Balance Due</span><span>{Number(verifiedInvoiceData.balanceDue || 0).toFixed(2)}</span></div>}
                                        </div>
                                    </div>
                                </div>

                                {verifiedInvoiceData.note && (
                                <div className="mt-6 mb-2 border border-slate-200 rounded p-3 bg-slate-50/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Note / Instructions:</p>
                                    <div className="text-xs text-slate-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: verifiedInvoiceData.note }} />
                                </div>
                                )}

                                {/* DIGITAL SIGNATURE */}
                                <div className="mt-auto pt-12 text-center self-end w-48 ml-auto flex flex-col items-center justify-end min-h-[60px]">
                                    {verifiedInvoiceData.authorSign ? (
                                        <>
                                            {verifiedInvoiceData.authorSign.signatureUrl ? (
                                                <img src={verifiedInvoiceData.authorSign.signatureUrl} alt="Signature" className="h-10 w-auto object-contain mb-1" />
                                            ) : (
                                                <div className="w-32 border-b border-dashed border-slate-400 mb-1 mt-6"></div>
                                            )}
                                            <p className="text-[10px] font-bold text-slate-800 leading-tight">{verifiedInvoiceData.authorSign.name}</p>
                                            {verifiedInvoiceData.authorSign.designation && <p className="text-[8px] text-slate-500 leading-tight">{verifiedInvoiceData.authorSign.designation}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-32 border-b border-dashed border-slate-400 mb-1 mt-6"></div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase">Authorized Signatory</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx global>{`
                    @media print {
                        @page { size: A4 portrait; margin: 0; }
                        body { padding: 0; margin: 0; background: white; }
                        header, nav, .print\\:hidden { display: none !important; }
                        #invoice-printable-area {
                            width: 210mm !important;
                            min-height: 297mm !important;
                            box-shadow: none !important;
                            border: none !important;
                            margin: 0 !important;
                            transform: none !important;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-emerald-100 animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-emerald-100">
                    <CheckCircle2 className="text-emerald-500" size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Report Ready</h2>
                <p className="text-sm text-slate-500 mb-8">If your document didn't open automatically, click the button below to view it.</p>
                
                <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-12 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #a07be1, #8e62d9)' }}
                >
                    <FileText size={20} /> Open PDF Report
                </a>
            </div>
        </div>
    );
}

export default function VerifyDocumentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <Loader2 className="animate-spin text-[#a07be1] mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Loading...</h2>
            </div>
        }>
            <VerifyDocumentContent />
        </Suspense>
    );
}
