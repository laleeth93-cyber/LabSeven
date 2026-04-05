// --- BLOCK app/list/components/PatientReportModal.tsx OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { getResultEntryData } from '@/app/actions/result-entry';
import { getReportSettings } from '@/app/actions/reports';
import { getLabProfile } from '@/app/actions/lab-profile';
import ReportDispatchModal from '@/app/reports/components/ReportDispatchModal';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { pdf } from '@react-pdf/renderer';
import PatientReportDocument from './PatientReportDocument';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    billId: number | null;
}

export default function PatientReportModal({ isOpen, onClose, billId }: Props) {
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    
    const [realData, setRealData] = useState<any>(null);
    const [reportSettings, setReportSettings] = useState<any>(null);
    const [barcodeUrl, setBarcodeUrl] = useState<string>('');

    const [printHeaderFooter, setPrintHeaderFooter] = useState(true);
    const [letterheadStyle, setLetterheadStyle] = useState('none');
    
    const [separateDept, setSeparateDept] = useState(false);
    const [separateTest, setSeparateTest] = useState(false);
    
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

    const [overrideCollectionDate, setOverrideCollectionDate] = useState<string>('');
    const [overrideReportedDate, setOverrideReportedDate] = useState<string>('');

    useEffect(() => {
        if (isOpen && billId) {
            loadData();
        } else {
            setPdfPreviewUrl(null);
            setRealData(null);
            setReportSettings(null);
            setPrintHeaderFooter(true);
            setLetterheadStyle('none');
            setSeparateDept(false);
            setSeparateTest(false);
            setSelectedItemIds([]);
            setOverrideCollectionDate('');
            setOverrideReportedDate('');
        }
    }, [isOpen, billId]);

    const loadData = async () => {
        setIsPreviewLoading(true);
        
        const [billRes, settingsRes, profileRes] = await Promise.all([
            getResultEntryData(billId!),
            getReportSettings(),
            getLabProfile()
        ]);

        let settingsData: any = settingsRes.success && settingsRes.data ? settingsRes.data : {};
        let profileData: any = profileRes.success && profileRes.data ? profileRes.data : {};

        settingsData.labName = profileData.name;
        settingsData.tagline = profileData.tagline;
        settingsData.address = profileData.address;
        settingsData.phone = profileData.phone;
        settingsData.email = profileData.email;
        settingsData.website = profileData.website;
        settingsData.logoUrl = profileData.logoUrl;

        if (billRes.success && billRes.data) {
            const billData: any = billRes.data; 

            if (billData.items) {
                billData.items = billData.items.filter((item: any) => {
                    const isCult = item.test?.isCulture;
                    return isCult !== true && isCult !== 'true'; 
                });
            }

            setRealData(billData);

            if (billData.date) {
                setOverrideCollectionDate(new Date(billData.date).toISOString());
            } else {
                setOverrideCollectionDate(new Date().toISOString());
            }

            let defaultReportedDate = new Date();
            if (billData.items && billData.items.length > 0) {
                const savedItems = billData.items.filter((i: any) => i.status !== 'Pending');
                
                if (savedItems.length > 0) {
                    const latestUpdate = savedItems.reduce((latest: Date, current: any) => {
                        const currentUpdate = new Date(current.updatedAt || current.createdAt || Date.now());
                        return currentUpdate > latest ? currentUpdate : latest;
                    }, new Date(0));
                    
                    if (latestUpdate.getTime() > 0) {
                        defaultReportedDate = latestUpdate;
                    }
                } else if (billData.updatedAt) {
                    defaultReportedDate = new Date(billData.updatedAt);
                }
            }
            setOverrideReportedDate(defaultReportedDate.toISOString());

            if (billData.items) {
                const printableItems = billData.items.filter((i: any) => i.status !== 'Pending');
                setSelectedItemIds(printableItems.map((item: any) => item.id));
            }

            const hasBeenSaved = billData.items && billData.items.some((i:any) => i.status !== 'Pending');

            if (hasBeenSaved) {
                if (billData.approvedBy1) {
                    const u = billData.approvedBy1;
                    let formattedDesignation = u.designation || '';
                    if (u.degree) formattedDesignation += formattedDesignation ? ` | ${u.degree}` : u.degree;
                    if (u.regNumber) formattedDesignation += formattedDesignation ? ` | ${u.regNumber}` : u.regNumber;
                    
                    settingsData.doc1Name = u.signName || u.name;
                    settingsData.doc1SignUrl = u.signatureUrl;
                    settingsData.doc1Designation = formattedDesignation;
                } else {
                    settingsData.doc1Name = ' '; 
                    settingsData.doc1SignUrl = null;
                    settingsData.doc1Designation = null;
                }

                if (billData.approvedBy2) {
                    const u = billData.approvedBy2;
                    let formattedDesignation = u.designation || '';
                    if (u.degree) formattedDesignation += formattedDesignation ? ` | ${u.degree}` : u.degree;
                    if (u.regNumber) formattedDesignation += formattedDesignation ? ` | ${u.regNumber}` : u.regNumber;

                    settingsData.doc2Name = u.signName || u.name;
                    settingsData.doc2SignUrl = u.signatureUrl;
                    settingsData.doc2Designation = formattedDesignation;
                } else {
                    settingsData.doc2Name = null;
                    settingsData.doc2SignUrl = null;
                    settingsData.doc2Designation = null;
                }
            }

            try {
                const canvas = document.createElement('canvas');
                // ONLY GENERATE BARCODE FOR THE LAST 4 DIGITS
                const shortBarcodeText = String(billData.billNumber || '').slice(-4);
                JsBarcode(canvas, shortBarcodeText, { displayValue: false, height: 40, width: 1.5, margin: 0, background: "transparent", lineColor: "#000000" });
                setBarcodeUrl(canvas.toDataURL());
            } catch(e){}
        }

        setReportSettings(settingsData);
        if (settingsData.letterheadStyle) setLetterheadStyle(settingsData.letterheadStyle);
    };

    let filteredRealData: any = null;
    if (realData) {
        filteredRealData = {
            ...realData,
            items: realData.items?.filter((item: any) => selectedItemIds.includes(item.id) && item.status !== 'Pending') || []
        };
    }

    let displayData: any[] = [];
    if (filteredRealData && filteredRealData.items && Array.isArray(filteredRealData.items)) {
        
        const getAgeInDays = (val: number, unit: string) => {
            if (unit === 'Years') return val * 365;
            if (unit === 'Months') return val * 30;
            return val;
        };

        const getPatientAgeDays = () => {
            const y = filteredRealData.patient?.ageY || 0;
            const m = filteredRealData.patient?.ageM || 0;
            const d = filteredRealData.patient?.ageD || 0;
            return (y * 365) + (m * 30) + d;
        };

        const getMatchedRange = (parameter: any) => {
            if (!parameter) return null;
            const patientGender = filteredRealData.patient?.gender || 'Male';
            const patientDays = getPatientAgeDays();

            if (parameter.ranges && parameter.ranges.length > 0) {
                const match = parameter.ranges.find((r: any) => {
                    const genderMatch = r.gender === 'Both' || r.gender === patientGender;
                    const minDays = getAgeInDays(r.minAge, r.minAgeUnit);
                    const maxDays = getAgeInDays(r.maxAge, r.maxAgeUnit);
                    const ageMatch = patientDays >= minDays && patientDays <= maxDays;
                    return genderMatch && ageMatch;
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

            if (parameter.minVal !== null && parameter.maxVal !== null) {
                return `${parameter.minVal} - ${parameter.maxVal}`;
            }
            return parameter.referenceRange ?? parameter.bioRefRange ?? parameter.normalRange ?? '';
        };

        let itemsToProcess = filteredRealData.items;
        if (separateDept) {
            itemsToProcess = [...filteredRealData.items].sort((a: any, b: any) => {
                const deptA = (a.test?.department?.name || 'Pathology').toLowerCase().trim();
                const deptB = (b.test?.department?.name || 'Pathology').toLowerCase().trim();
                return deptA.localeCompare(deptB);
            });
        }

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

                    if (val === null || val === undefined || String(val).trim() === '') {
                        return; 
                    }

                    const refRange = getDisplayRange(actualParam);
                    const activeRange = getMatchedRange(actualParam);
                    const abnormalValues = activeRange?.abnormalValue ? activeRange.abnormalValue.split(',').map((v: string) => v.trim().toLowerCase()) : [];

                    let isAbnormal = false;
                    
                    if (matchedResult) {
                        const flag = String(matchedResult.flag || '').trim().toUpperCase();
                        if (flag === 'H' || flag === 'L' || flag === 'HIGH' || flag === 'LOW' || flag === '*' || flag === 'A' || flag === 'ABNORMAL' || matchedResult.isAbnormal) {
                            isAbnormal = true;
                        } 
                    }

                    if (val && abnormalValues.includes(String(val).trim().toLowerCase())) {
                        isAbnormal = true;
                    }

                    displayData.push({
                        isGroup: false, param: pName, result: val !== '' ? String(val) : '', 
                        unit: actualParam.unit ?? '', ref: refRange, method: actualParam.method ?? '',
                        abnormal: isAbnormal,
                        inputType: actualParam.inputType || 'Numerical'
                    });
                });
            };

            processParams(item.test?.parameters);

            if (item.test?.packageTests && Array.isArray(item.test.packageTests)) {
                item.test.packageTests.forEach((pt: any) => {
                    if (pt.test) processParams(pt.test.parameters);
                });
            }

            if (results && results.length > 0) {
                results.forEach((res: any) => {
                    if (!res.parameterId || printedParamIds.has(res.parameterId)) return; 
                    const actualParam = res.parameter || {};
                    const pName = actualParam.displayName || actualParam.name || '-';
                    if (pName === '-') return;

                    let val = res.resultValue ?? res.value ?? res.result ?? res.enteredValue ?? '';
                    
                    if (val === null || val === undefined || String(val).trim() === '') {
                        return; 
                    }

                    const refRange = getDisplayRange(actualParam);
                    const activeRange = getMatchedRange(actualParam);
                    const abnormalValues = activeRange?.abnormalValue ? activeRange.abnormalValue.split(',').map((v: string) => v.trim().toLowerCase()) : [];

                    let isAbnormal = false;
                    
                    const flag = String(res.flag || '').trim().toUpperCase();
                    if (flag === 'H' || flag === 'L' || flag === 'HIGH' || flag === 'LOW' || flag === '*' || flag === 'A' || flag === 'ABNORMAL' || res.isAbnormal) {
                        isAbnormal = true;
                    }

                    if (val && abnormalValues.includes(String(val).trim().toLowerCase())) {
                        isAbnormal = true;
                    }

                    displayData.push({
                        isGroup: false, param: pName, result: val !== '' ? String(val) : '',
                        unit: actualParam.unit ?? '', ref: refRange, method: actualParam.method ?? '',
                        abnormal: isAbnormal,
                        inputType: actualParam.inputType || 'Numerical'
                    });
                });
            }
        });

        let cleanedDisplayData: any[] = [];
        for (let i = 0; i < displayData.length; i++) {
            const current = displayData[i];

            if (current.isGroup) {
                let hasData = false;
                
                for (let j = i + 1; j < displayData.length; j++) {
                    const next = displayData[j];
                    if (!next.isGroup) {
                        hasData = true; 
                        break;
                    }
                    if (!current.isSubHeading && next.isGroup && !next.isSubHeading) break;
                    if (current.isSubHeading && next.isGroup) break;
                }

                if (hasData) {
                    cleanedDisplayData.push(current);
                }
            } else {
                cleanedDisplayData.push(current);
            }
        }
        displayData = cleanedDisplayData;
    }

    const generatePDF = async () => {
        setIsPreviewLoading(true);

        try {
            let activeImageBase64 = '';
            if (letterheadStyle === 'custom1') activeImageBase64 = reportSettings?.customHeader1 || '';
            if (letterheadStyle === 'custom2') activeImageBase64 = reportSettings?.customHeader2 || '';
            if (letterheadStyle === 'custom3') activeImageBase64 = reportSettings?.customHeader3 || '';
            if (letterheadStyle === 'custom4') activeImageBase64 = reportSettings?.customHeader4 || '';

            // 🚨 THE FIX: Create a real web link URL for the QR code!
            const qrUrl = `${window.location.origin}/verify/${filteredRealData?.id || billId}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } });
            
            const baseDate = overrideCollectionDate ? new Date(overrideCollectionDate) : (filteredRealData?.date ? new Date(filteredRealData.date) : new Date());
            const collectedDateStr = baseDate.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');
            
            const repDateObj = overrideReportedDate ? new Date(overrideReportedDate) : new Date();
            const reportedDateStr = repDateObj.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');

            const pdfRealData = { ...filteredRealData, date: baseDate.toISOString() };

            const blob = await pdf(
                <PatientReportDocument 
                    realData={pdfRealData} 
                    displayData={displayData}
                    reportSettings={reportSettings}
                    barcodeUrl={barcodeUrl}
                    qrDataUrl={qrDataUrl}
                    collectedDate={collectedDateStr}
                    reportedDate={reportedDateStr}
                    activeImageBase64={activeImageBase64}
                    printHeaderFooter={printHeaderFooter}
                    letterheadStyle={letterheadStyle}
                    separateDept={separateDept}
                    separateTest={separateTest}
                />
            ).toBlob();
            
            const url = URL.createObjectURL(blob);
            setPdfPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
        } catch (error) {
            console.error("React-PDF Generation failed:", error);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    useEffect(() => {
        if (realData) {
            generatePDF();
        }
    }, [realData, reportSettings, printHeaderFooter, letterheadStyle, separateDept, separateTest, selectedItemIds, overrideCollectionDate, overrideReportedDate]); 

    const handleDirectDownload = () => {
        if (!pdfPreviewUrl) return;
        const a = document.createElement('a');
        a.href = pdfPreviewUrl;
        a.download = `${filteredRealData?.billNumber || 'Patient'}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const toggleTestSelection = (id: number, isChecked: boolean) => {
        setSelectedItemIds(prev => isChecked ? [...prev, id] : prev.filter(testId => testId !== id));
    };

    if (!isOpen) return null;

    return (
        <ReportDispatchModal 
            isOpen={isOpen} onClose={onClose} pdfPreviewUrl={pdfPreviewUrl} isPreviewLoading={isPreviewLoading}
            handleDirectDownload={handleDirectDownload} 
            printHeaderFooter={printHeaderFooter} onToggleHeaderFooter={setPrintHeaderFooter}
            letterheadStyle={letterheadStyle} onChangeLetterheadStyle={setLetterheadStyle}
            separateDept={separateDept} onToggleSeparateDept={setSeparateDept}
            separateTest={separateTest} onToggleSeparateTest={setSeparateTest}
            
            billItems={realData?.items || []}
            selectedItemIds={selectedItemIds}
            onToggleItem={toggleTestSelection}
            onSelectAll={() => setSelectedItemIds((realData?.items || []).filter((i: any) => i.status !== 'Pending').map((i: any) => i.id))}
            onDeselectAll={() => setSelectedItemIds([])}

            overrideCollectionDate={overrideCollectionDate}
            setOverrideCollectionDate={setOverrideCollectionDate}
            overrideReportedDate={overrideReportedDate}
            setOverrideReportedDate={setOverrideReportedDate}
        />
    );
}
// --- BLOCK app/list/components/PatientReportModal.tsx CLOSE ---