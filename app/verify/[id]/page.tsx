// --- BLOCK app/verify/[id]/page.tsx OPEN ---
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicDocumentData } from "@/app/actions/verify";
import { Loader2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import PatientReportDocument from '@/app/list/components/PatientReportDocument';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export default function VerifyDocumentPage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");

    useEffect(() => {
        async function generateAndOpenPdf() {
            try {
                if (!params?.id) return;
                const billId = Number(params.id);
                
                const res = await getPublicDocumentData(billId);
                if (!res.success) {
                    setError(res.message || "Invalid verification link or document not found.");
                    setLoading(false); return;
                }

                const { bill, reportSettings, labProfile } = res.data as any; 

                // --- 1. PREPARE SETTINGS & LAB PROFILE ---
                let settingsData: any = reportSettings || {};
                let profileData: any = labProfile || {};

                settingsData.labName = profileData.name;
                settingsData.tagline = profileData.tagline;
                settingsData.address = profileData.address;
                settingsData.phone = profileData.phone;
                settingsData.email = profileData.email;
                settingsData.website = profileData.website;
                settingsData.logoUrl = profileData.logoUrl;

                // --- 2. FILTER APPROVED ITEMS ---
                if (bill.items) {
                    bill.items = bill.items.filter((item: any) => {
                        const isCult = item.test?.isCulture;
                        return isCult !== true && isCult !== 'true' && item.status !== 'Pending';
                    });
                }

                // --- 3. PROCESS SIGNATURES ---
                if (bill.approvedBy1) {
                    const u = bill.approvedBy1;
                    let formattedDesignation = u.designation || '';
                    if (u.degree) formattedDesignation += formattedDesignation ? ` | ${u.degree}` : u.degree;
                    if (u.regNumber) formattedDesignation += formattedDesignation ? ` | ${u.regNumber}` : u.regNumber;
                    settingsData.doc1Name = u.signName || u.name;
                    settingsData.doc1SignUrl = u.signatureUrl;
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
                    settingsData.doc2SignUrl = u.signatureUrl;
                    settingsData.doc2Designation = formattedDesignation;
                } else {
                    settingsData.doc2Name = null; settingsData.doc2SignUrl = null; settingsData.doc2Designation = null;
                }

                // --- 4. GENERATE BARCODE & QR ---
                let barcodeUrl = '';
                try {
                    const canvas = document.createElement('canvas');
                    const shortBarcodeText = String(bill.billNumber || '').slice(-4);
                    JsBarcode(canvas, shortBarcodeText, { displayValue: false, height: 40, width: 1.5, margin: 0, background: "transparent", lineColor: "#000000" });
                    barcodeUrl = canvas.toDataURL();
                } catch(e){}

                const qrUrl = window.location.href;
                const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } });

                // --- 5. FORMAT DATES ---
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

                // --- 6. GENERATE DISPLAY DATA (TABLE CONTENT) ---
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

                    // Clean empty groups
                    let cleanedDisplayData: any[] = [];
                    for (let i = 0; i < displayData.length; i++) {
                        const current = displayData[i];
                        if (current.isGroup) {
                            let hasData = false;
                            for (let j = i + 1; j < displayData.length; j++) {
                                const next = displayData[j];
                                if (!next.isGroup) { hasData = true; break; }
                                if (!current.isSubHeading && next.isGroup && !next.isSubHeading) break;
                                if (current.isSubHeading && next.isGroup) break;
                            }
                            if (hasData) cleanedDisplayData.push(current);
                        } else {
                            cleanedDisplayData.push(current);
                        }
                    }
                    displayData = cleanedDisplayData;
                }

                // --- 7. ASSIGN LETTERHEAD ---
                let activeImageBase64: string | null = null;
                const letterheadStyle = settingsData.letterheadStyle || 'none';
                if (letterheadStyle === 'custom1') activeImageBase64 = settingsData.customHeader1 || null;
                if (letterheadStyle === 'custom2') activeImageBase64 = settingsData.customHeader2 || null;
                if (letterheadStyle === 'custom3') activeImageBase64 = settingsData.customHeader3 || null;
                if (letterheadStyle === 'custom4') activeImageBase64 = settingsData.customHeader4 || null;

                // --- 8. MOUNT DOCUMENT ---
                const documentElement = (
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

                const blob = await pdf(documentElement).toBlob();
                const url = URL.createObjectURL(blob);
                
                setPdfUrl(url);
                setLoading(false);

                // Open the generated report
                window.location.replace(url);

            } catch (err: any) {
                console.error("PDF Generation Error:", err);
                setError("Failed to generate the PDF document.");
                setLoading(false);
            }
        }
        generateAndOpenPdf();
    }, [params?.id]);

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
// --- BLOCK app/verify/[id]/page.tsx CLOSE ---