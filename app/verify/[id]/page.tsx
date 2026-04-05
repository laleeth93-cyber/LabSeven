// --- BLOCK app/verify/[id]/page.tsx OPEN ---
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPublicDocumentData } from "@/app/actions/verify";
import { Loader2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { pdf } from '@react-pdf/renderer';
import PatientReportDocument from '@/app/list/components/PatientReportDocument';
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
                    // 🚨 FIX 1: Provide a fallback string so it never passes 'undefined'
                    setError(res.message || "Invalid verification link or document not found.");
                    setLoading(false);
                    return;
                }

                // 🚨 FIX 2 & 3: Tell TypeScript this is definitely our expected data shape
                const { bill, reportSettings } = res.data as any; 

                // 1. Generate QR Code for the PDF footer
                const qrUrl = window.location.href;
                const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 64, margin: 1 });

                // 2. Filter only approved results to show on the report
                const displayData = bill.items.filter((item: any) => item.status === 'Approved');

                // 3. Format Dates
                const colDate = new Date(bill.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const repDate = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                // 4. Mount the React-PDF Document Component
                const documentElement = (
                    <PatientReportDocument 
                        realData={bill}
                        displayData={displayData}
                        reportSettings={reportSettings || {}}
                        qrDataUrl={qrDataUrl}
                        barcodeUrl=""
                        collectedDate={colDate}
                        reportedDate={repDate}
                        activeImageBase64={null}
                        printHeaderFooter={true}
                        letterheadStyle="none"
                        separateDept={false}
                        separateTest={false}
                    />
                );

                // 5. Generate the physical PDF file in the browser memory
                const blob = await pdf(documentElement).toBlob();
                const url = URL.createObjectURL(blob);
                
                setPdfUrl(url);
                setLoading(false);

                // 6. Automatically redirect the mobile phone to open the PDF viewer!
                window.location.replace(url);

            } catch (err: any) {
                console.error("PDF Generation Error:", err);
                setError("Failed to generate the PDF document.");
                setLoading(false);
            }
        }
        generateAndOpenPdf();
    }, [params?.id]);

    // UI while the PDF is generating in the background
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <Loader2 className="animate-spin text-[#a07be1] mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 tracking-tight mb-2">Generating Report...</h2>
                <p className="text-slate-500 font-medium text-sm text-center">Please wait while we securely prepare your PDF document.</p>
            </div>
        );
    }

    // UI if the link is broken or the bill doesn't exist
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

    // Fallback UI in case mobile Safari blocks the auto-redirect popup
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