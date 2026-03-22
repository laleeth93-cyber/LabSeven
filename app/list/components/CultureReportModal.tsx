// --- BLOCK app/list/components/CultureReportModal.tsx OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, Printer, Bug, LayoutTemplate } from 'lucide-react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import CultureReportDocument from './CultureReportDocument';
import { getLabProfile } from '@/app/actions/lab-profile';
import { getReportSettings } from '@/app/actions/reports';
import { getResultEntryData } from '@/app/actions/result-entry'; 
import EntryDateTimePicker from '@/app/results/entry/components/EntryDateTimePicker';

interface CultureReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
}

export default function CultureReportModal({ isOpen, onClose, bill }: CultureReportModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [labProfile, setLabProfile] = useState<any>(null);
    const [reportSettings, setReportSettings] = useState<any>(null);
    const [fullBillData, setFullBillData] = useState<any>(null); 
    
    const [selectedHeaderStyle, setSelectedHeaderStyle] = useState<string>('none');

    // Date & Time Override States
    const [overrideCollectionDate, setOverrideCollectionDate] = useState<string>('');
    const [overrideReportedDate, setOverrideReportedDate] = useState<string>('');

    useEffect(() => {
        if (isOpen && bill) {
            loadConfig();
        }
    }, [isOpen, bill]);

    const loadConfig = async () => {
        setIsLoading(true);
        
        const [labRes, repRes, billRes] = await Promise.all([
            getLabProfile(), 
            getReportSettings(),
            getResultEntryData(bill.id)
        ]);
        
        let settingsData: any = repRes.success && repRes.data ? repRes.data : {};
        let profileData: any = labRes.success && labRes.data ? labRes.data : {};
        let fetchedBill: any = billRes.success && billRes.data ? billRes.data : bill;

        settingsData.labName = profileData.name;
        settingsData.tagline = profileData.tagline;
        settingsData.address = profileData.address;
        settingsData.phone = profileData.phone;
        settingsData.email = profileData.email;
        settingsData.website = profileData.website;
        settingsData.logoUrl = profileData.logoUrl;

        const hasBeenSaved = fetchedBill && fetchedBill.items && fetchedBill.items.some((i:any) => i.status !== 'Pending');

        if (hasBeenSaved) {
            if (fetchedBill.approvedBy1) {
                const u = fetchedBill.approvedBy1;
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

            if (fetchedBill.approvedBy2) {
                const u = fetchedBill.approvedBy2;
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

        // --- INITIALIZE DATE & TIME PICKERS ---
        // 1. Collection Date (Defaults to Registration Time)
        let baseCollectionDate = new Date();
        if (fetchedBill.date) {
            baseCollectionDate = new Date(fetchedBill.date);
        }
        setOverrideCollectionDate(baseCollectionDate.toISOString());

        // 2. SMART REPORTED DATE LOGIC (Defaults to the exact time the results were saved)
        let defaultReportedDate = new Date();
        let foundResultDate = false;
        let latestResultDate = new Date(0);

        if (fetchedBill.items && fetchedBill.items.length > 0) {
            fetchedBill.items.forEach((item: any) => {
                if (item.status !== 'Pending' && item.results && item.results.length > 0) {
                    item.results.forEach((res: any) => {
                        if (res.updatedAt || res.createdAt) {
                            const resTime = new Date(res.updatedAt || res.createdAt);
                            if (resTime.getTime() > latestResultDate.getTime()) {
                                latestResultDate = resTime;
                                foundResultDate = true;
                            }
                        }
                    });
                }
            });

            if (foundResultDate) {
                defaultReportedDate = latestResultDate;
            } else if (fetchedBill.updatedAt) {
                defaultReportedDate = new Date(fetchedBill.updatedAt);
            }
        }

        setOverrideReportedDate(defaultReportedDate.toISOString());

        setFullBillData(fetchedBill);
        setLabProfile(profileData);
        setReportSettings(settingsData);
        
        setSelectedHeaderStyle(settingsData.letterheadStyle || 'none');
        setIsLoading(false);
    };

    const getDocumentProps = () => {
        const targetBill = fullBillData || bill;
        const cultureItems = targetBill.items.filter((item: any) => item.test?.isCulture);
        
        const lStyle = selectedHeaderStyle;
        let activeImageBase64 = '';
        if (lStyle === 'custom1') activeImageBase64 = reportSettings?.customHeader1 || '';
        if (lStyle === 'custom2') activeImageBase64 = reportSettings?.customHeader2 || '';
        if (lStyle === 'custom3') activeImageBase64 = reportSettings?.customHeader3 || '';
        if (lStyle === 'custom4') activeImageBase64 = reportSettings?.customHeader4 || '';

        const baseDate = overrideCollectionDate ? new Date(overrideCollectionDate) : (targetBill?.date ? new Date(targetBill.date) : new Date());
        const collectedDateStr = baseDate.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');
        
        const repDateObj = overrideReportedDate ? new Date(overrideReportedDate) : new Date();
        const reportedDateStr = repDateObj.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(',', '');

        const pdfRealData = { ...targetBill, date: baseDate.toISOString() };

        // EXTRACT ONLY THE LAST 4 DIGITS FOR THE BARCODE
        const shortBarcodeText = String(targetBill.billNumber || '').slice(-4);

        return {
            realData: pdfRealData,
            reportSettings: reportSettings,
            cultureItems: cultureItems,
            activeImageBase64: activeImageBase64, 
            printHeaderFooter: true,
            letterheadStyle: lStyle,
            barcodeUrl: `https://bwipjs-api.metafloor.com/?bcid=code128&text=${shortBarcodeText}&scale=2`,
            qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=UID:${targetBill.patient.patientId}%0ABILL:${targetBill.billNumber}`,
            collectedDate: collectedDateStr,
            reportedDate: reportedDateStr
        };
    };

    const handlePrint = async () => {
        if (!bill || isLoading) return;
        const props = getDocumentProps();
        const doc = <CultureReportDocument {...props} />;
        const asPdf = pdf(doc); 
        const blob = await asPdf.toBlob();
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => { iframe.contentWindow?.print(); };
    };

    if (!isOpen || !bill) return null;

    const patientName = `${bill.patient.designation || ''} ${bill.patient.firstName || ''} ${bill.patient.lastName || ''}`.trim();

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                
                {/* --- COMPACT SINGLE LINE HEADER --- */}
                <div className="px-5 py-3 border-b border-slate-200 bg-rose-50/50 flex justify-between items-center shrink-0">
                    
                    {/* Left Side: Title & Info */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm text-rose-500 shrink-0">
                            <Bug size={18} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-base font-bold text-slate-800 leading-tight">Culture Report</h2>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{patientName} <span className="text-slate-300 mx-1">|</span> {bill.billNumber}</p>
                        </div>
                    </div>
                    
                    {/* Right Side: Controls */}
                    <div className="flex items-center gap-2.5">
                        {!isLoading && (
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm hidden lg:flex shrink-0">
                                <EntryDateTimePicker 
                                    label="Collected:" 
                                    date={overrideCollectionDate || new Date().toISOString()} 
                                    onChange={(val) => setOverrideCollectionDate(val)} 
                                    align="right"
                                />
                                <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                                <EntryDateTimePicker 
                                    label="Reported:" 
                                    date={overrideReportedDate || new Date().toISOString()} 
                                    onChange={(val) => setOverrideReportedDate(val)} 
                                    align="right"
                                />
                                <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                                
                                <div className="flex items-center gap-1.5 px-2 py-1 h-8 bg-slate-50 rounded border border-transparent hover:border-rose-200 transition-colors cursor-pointer group">
                                    <LayoutTemplate size={14} className="text-rose-400 group-hover:text-rose-600" />
                                    <select 
                                        value={selectedHeaderStyle} 
                                        onChange={(e) => setSelectedHeaderStyle(e.target.value)}
                                        className="text-[11px] font-bold outline-none bg-transparent text-slate-600 cursor-pointer appearance-none w-[100px] uppercase tracking-wide"
                                    >
                                        <option value="none">No Letterhead</option>
                                        <option value="custom1">Format 1</option>
                                        <option value="custom2">Format 2</option>
                                        <option value="custom3">Format 3</option>
                                        <option value="custom4">Format 4</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="w-px h-6 bg-slate-300 mx-1 hidden lg:block shrink-0"></div>

                        <button onClick={handlePrint} disabled={isLoading} className="px-4 py-1.5 h-10 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 hover:text-rose-600 hover:border-rose-300 transition-all flex items-center gap-2 disabled:opacity-50 shrink-0">
                            <Printer size={16} /> Print
                        </button>
                        
                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 hover:bg-rose-100 hover:border-rose-200 hover:text-rose-600 rounded-full transition-all text-slate-400 shrink-0">
                            <X size={18} />
                        </button>
                    </div>

                </div>

                <div className="flex-1 bg-[#525659] relative w-full h-full">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-800/80 backdrop-blur-sm gap-3 z-10">
                            <Loader2 className="animate-spin text-rose-400" size={40} />
                            <p className="text-sm font-bold tracking-wide">Rendering Culture Report...</p>
                        </div>
                    ) : (
                        <div className="absolute inset-0 w-full h-full">
                            <PDFViewer key={`${selectedHeaderStyle}-${overrideCollectionDate}-${overrideReportedDate}`} width="100%" height="100%" style={{ border: 'none' }}>
                                <CultureReportDocument {...getDocumentProps()} />
                            </PDFViewer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/list/components/CultureReportModal.tsx CLOSE ---