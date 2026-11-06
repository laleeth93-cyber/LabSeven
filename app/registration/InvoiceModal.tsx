"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { X, Printer, Download, CheckCircle, ScanBarcode, ArrowRight, FileText, Send, Loader2, Edit } from 'lucide-react';
import { generateTRFHtml, TRFData } from '@/app/components/TRFDocument';
import BarcodeModal from '@/app/components/BarcodeModal'; 
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode'; 
import { getLabProfile } from '@/app/actions/lab-profile';

import { pdf } from '@react-pdf/renderer';
import InvoiceDocument from './InvoiceDocument'; 
import WhatsAppConfirmModal from '@/app/components/WhatsAppConfirmModal';
import { toast } from 'react-hot-toast';

export interface InvoiceItem { id: number; name: string; price: number; }
export interface InvoiceData {
  id?: number;
  organizationId?: number;
  billId: string; billDate: string; patientName: string; ageGender: string;
  referredBy: string; paymentType: string; items: InvoiceItem[];
  subTotal: number; discount: number; totalAmount: number;
  paidAmount: number; balanceDue: number;
  phone?: string; 
  barcodeUrl?: string; note?: string; noteImage?: string; 
  labProfile?: any;
  authorSign?: any;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: (isNavigating?: boolean) => void;
  onEdit?: () => void; 
  data: InvoiceData | null;
  autoSendWhatsApp?: boolean;
  whatsappManualEnabled?: boolean;
  whatsappLimit?: number;
}

export default function InvoiceModal({ isOpen, onClose, onEdit, data, autoSendWhatsApp, whatsappManualEnabled = true, whatsappLimit = 0 }: InvoiceModalProps) {
  const router = useRouter(); 
  const { data: session } = useSession();
  const orgId = (session?.user as any)?.orgId;

  const [isClient, setIsClient] = useState(false);
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>(''); 
  const [noteImage, setNoteImage] = useState<string>(''); 
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [labProfile, setLabProfile] = useState<any>(null);
  
  const [isTrfLoading, setIsTrfLoading] = useState(false);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [isSendingWA, setIsSendingWA] = useState(false); 
  const [isWAConfirmOpen, setIsWAConfirmOpen] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isOpen) {
        getLabProfile().then(res => {
            if (res.success && res.data) setLabProfile(res.data);
        });
    }
  }, [isOpen]);

  const profile = data?.labProfile || labProfile;

  const hasLetterhead = profile?.letterheadUrl && 
                        profile.letterheadUrl !== 'null' && 
                        profile.letterheadUrl !== 'undefined' && 
                        profile.letterheadUrl.trim() !== '';

  useEffect(() => {
    if (data?.billId) {
      try {
        const canvas = document.createElement('canvas');
        const shortBillId = String(data.billId || '').slice(-4);
        JsBarcode(canvas, shortBillId, {
          format: "CODE128", displayValue: false, height: 20, width: 1, margin: 0, background: "transparent"
        });
        setBarcodeUrl(canvas.toDataURL());

        const targetOrgId = data.organizationId || orgId;
        const verificationTarget = data.id || data.billId;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://labseven.in';
        const orgQuery = targetOrgId ? `&org=${targetOrgId}` : '';
        const verificationUrl = `${origin}/verify/${verificationTarget}?type=invoice${orgQuery}`;
        QRCode.toDataURL(verificationUrl, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } })
            .then(url => setQrUrl(url))
            .catch(err => console.error("QR Error:", err));

      } catch (e) { console.error(e); }
    }
  }, [data, orgId]);

  useEffect(() => {
    if (isOpen && data?.note) {
      const timer = setTimeout(() => {
        const element = document.getElementById('invoice-note-content');
        if (element) {
          html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true } as any)
            .then((canvas: HTMLCanvasElement) => setNoteImage(canvas.toDataURL('image/png')))
            .catch((err: Error) => console.error(err));
        }
      }, 800); 
      return () => clearTimeout(timer);
    } else { setNoteImage(''); }
  }, [isOpen, data]);

  const hasAutoSent = useRef(false);
  useEffect(() => {
      if (isOpen && autoSendWhatsApp && isClient && data && !hasAutoSent.current && !isSendingWA) {
          hasAutoSent.current = true;
          // Wait for DOM and images to settle before capturing HTML
          const timer = setTimeout(async () => {
              const el = document.getElementById('invoice-printable-area');
              if (el) {
                  // Ensure we have the lab profile so the WhatsApp payload has the correct lab name and phone
                  let currentProfile = labProfile;
                  if (!currentProfile) {
                      try {
                          const res = await getLabProfile();
                          if (res?.success && res.data) {
                              setLabProfile(res.data);
                          }
                      } catch (e) {
                          console.error("Failed to fetch lab profile for auto-send", e);
                      }
                  }
                  
                  const phone = data.phone || (data as any).patientPhone || '';
                  handleConfirmWhatsapp(phone, false);
              }
          }, 1500);
          // Removed clearTimeout so the timeout is guaranteed to run once
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoSendWhatsApp, isClient, data]); 

  if (!isClient || !isOpen || !data) return null;

  const barcodeModalData = {
    billId: data.billId, patientName: data.patientName,
    ageGender: data.ageGender, date: data.billDate, items: data.items 
  };

  const trfData: TRFData = {
    billId: data.billId, patientName: data.patientName, ageGender: data.ageGender,
    date: data.billDate, referredBy: data.referredBy, phone: (data as any).phone || "", items: data.items
  };

  const handleOpenTRF = async () => {
    setIsTrfLoading(true);
    try {
      const trfHtml = generateTRFHtml(trfData);
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>TRF - ${data.billId}</title><style>*, *::before, *::after { box-sizing: border-box !important; } body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head><body>${trfHtml}</body></html>`;
      const response = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html: fullHtml, paperSize: 'A4', printOrientation: 'portrait' }) });
      if (!response.ok) throw new Error("PDF generation failed");
      const blob = await response.blob();
      window.open(URL.createObjectURL(blob), '_blank'); 
    } catch (e) { alert("Failed to open TRF."); } finally { setIsTrfLoading(false); }
  };

  const handlePrintInvoice = () => {
      const element = document.getElementById('invoice-printable-area');
      if (!element) return;

      setIsInvoiceLoading(true);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeWindow = iframe.contentWindow;
      const iframeDoc = iframeWindow?.document;
      if (!iframeDoc || !iframeWindow) return;

      const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <meta charset="utf-8">
              <title>Invoice - ${data.billId}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                  *, *::before, *::after { box-sizing: border-box !important; }
                  body { background: white; font-family: sans-serif; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  @media print {
                      @page { size: A4 portrait; margin: 0; }
                      body { padding: 0; margin: 0; }
                      #invoice-printable-area { width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; border: none !important; margin: 0 !important; }
                  }
              </style>
          </head>
          <body style="display: flex; justify-content: center; background: white;">
              ${element.outerHTML}
          </body>
          </html>
      `;

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      const images = Array.from(iframeDoc.getElementsByTagName('img'));
      Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve; 
          });
      })).then(() => {
          setTimeout(() => {
              setIsInvoiceLoading(false);
              iframeWindow.focus();
              iframeWindow.print();
              setTimeout(() => {
                  if (document.body.contains(iframe)) document.body.removeChild(iframe);
              }, 1000);
          }, 500);
      });
  };

  const handleDownloadInvoice = () => handlePrintInvoice();

  const handleSendWhatsapp = async () => {
      setIsWAConfirmOpen(true);
  };

  const handleConfirmWhatsapp = async (phoneToUse: string, shouldSave: boolean) => {
      setIsWAConfirmOpen(false); 
      
      if (Number(whatsappLimit) <= 0) {
          toast.error("Your message credits are 0. Please recharge to send messages.");
          return;
      }

      if (shouldSave) {
          try {
              await fetch('/api/whatsapp/update-phone', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ billNumber: data.billId, phone: phoneToUse })
              });
              data.phone = phoneToUse;
              if ((data as any).patientPhone) (data as any).patientPhone = phoneToUse;
          } catch (error) {
              console.error('Failed to save phone number:', error);
          }
      }

      setIsSendingWA(true);
      try {
          const element = document.getElementById('invoice-printable-area');
          if (!element) throw new Error("Invoice area not found");

          const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                  <meta charset="utf-8">
                  <title>Invoice - ${data.billId}</title>
                  <script src="https://cdn.tailwindcss.com"></script>
                  <style>
                      *, *::before, *::after { box-sizing: border-box !important; }
                      body { background: white; font-family: sans-serif; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                      @media print {
                          @page { size: A4 portrait; margin: 0; }
                          body { padding: 0; margin: 0; }
                          #invoice-printable-area { width: 210mm !important; min-height: 297mm !important; box-shadow: none !important; border: none !important; margin: 0 !important; }
                      }
                  </style>
              </head>
              <body style="display: flex; justify-content: center; background: white;">
                  ${element.outerHTML}
              </body>
              </html>
          `;

          const pdfResponse = await fetch('/api/generate-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ html: htmlContent, paperSize: 'A4', printOrientation: 'portrait', enableJs: true })
          });

          if (!pdfResponse.ok) {
              const errText = await pdfResponse.text();
              throw new Error(`Failed to generate PDF: ${errText}`);
          }

          const blob = await pdfResponse.blob();

          const formData = new FormData();
          formData.append('file', blob, `${data.billId}_Receipt.pdf`);
          formData.append('folder', 'receipts'); 

          const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData
          });

          if (!uploadRes.ok) {
              throw new Error("Failed to upload receipt PDF to server/Cloudflare.");
          }

          const uploadData = await uploadRes.json();
          const uploadedPdfUrl = uploadData.url; 

          if (!uploadedPdfUrl) {
              throw new Error("Upload succeeded, but no URL was returned.");
          }

          // --- DISPATCH WHATSAPP API WITH LAB DATA INCLUDED ---
          const res = await fetch('/api/whatsapp/bill-receipt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  clientId: orgId || profile?.organizationId || profile?.id,
                  phone: phoneToUse, 
                  patientName: data.patientName,
                  labName: profile?.name || 'Smart Lab',
                  labPhone: profile?.phone || '',
                  amount: data.paidAmount, 
                  pdfUrl: uploadedPdfUrl 
              })
          });

          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error?.message || "WhatsApp dispatch failed");
          }
          
          toast.success("WhatsApp Invoice sent successfully!");
      } catch (error: any) {
          console.error("WhatsApp Error:", error);
          toast.error(`Failed to send WhatsApp invoice: ${error.message}`);
      } finally {
          setIsSendingWA(false);
      }
  };

  const handleEnterResults = () => { if (data?.billId) { onClose(true); router.push(`/results/entry?billNumber=${data.billId}`); } };

  const plainBtnClass = "h-[26px] xl:h-[28px] px-2.5 xl:px-3 rounded-[5px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] xl:text-[12px] font-medium shadow-2xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center justify-center gap-1.5";
  const mainGradient = { background: 'linear-gradient(to right, #9575cd, #b39ddb)' };
  const gradientBtnClass = "h-[26px] xl:h-[28px] px-2.5 xl:px-3 rounded-[5px] text-white text-[11px] xl:text-[12px] font-medium shadow-2xs transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center justify-center gap-1.5";
  const iconBtnClass = "h-[26px] xl:h-[28px] px-2.5 rounded-[5px] text-white shadow-2xs transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1 text-[11px] xl:text-[12px] font-medium";

  return (
    <>
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 md:p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-[850px] rounded-[6px] border border-slate-200 shadow-2xl flex flex-col h-[95vh] md:max-h-[90vh] overflow-hidden">
        
        {/* MODAL HEADER MATCHING PATIENT LIST & RESULT ENTRY */}
        <div className="min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] px-3 xl:px-4 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 print:hidden">
           <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                 <FileText size={15} />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] xl:text-[15px] font-semibold text-slate-800 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                   Invoice Generated
                </h3>
                <span className="font-mono text-[10px] xl:text-[11px] font-medium text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 leading-none">
                   #{data.billId}
                </span>
                <span className="text-[10px] xl:text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 leading-none hidden sm:inline">
                   Ready to Print
                </span>
              </div>
           </div>
           <button 
              onClick={() => onClose()} 
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Close"
           >
              <X size={16} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 flex justify-center items-start print:p-0 print:bg-white print:overflow-visible">
            
            <div className="w-full flex justify-center origin-top transform scale-[0.40] sm:scale-[0.55] md:scale-[0.80] lg:scale-[0.95] xl:scale-100 mb-[-50%] md:mb-[-15%] lg:mb-0 mt-4 md:mt-6">
                
                <div 
                    id="invoice-printable-area" 
                    className="bg-white shadow-md md:shadow-lg border border-slate-200 shrink-0 mx-auto"
                    style={{ position: 'relative', width: '794px', minHeight: '1123px', display: 'flex', flexDirection: 'column' }}
                >
                    
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
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-8">
                            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Bill ID:</span> <span className="font-bold text-slate-700">{data.billId}</span></div>
                            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Date:</span> <span className="font-bold text-slate-700">{data.billDate}</span></div>
                            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Patient:</span> <span className="font-bold text-slate-700">{data.patientName}</span></div>
                            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Referred By:</span> <span className="font-bold text-slate-700">{data.referredBy}</span></div>
                            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Age/Gender:</span> <span className="font-bold text-slate-700">{data.ageGender}</span></div>
                            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="font-bold text-slate-500">Mode:</span> <span className="font-bold text-slate-700">{data.paymentType}</span></div>
                        </div>

                        <div className="mb-4">
                            <table className="w-full text-xs border-collapse mb-4">
                                <thead>
                                    <tr className="bg-[#9575cd] text-white">
                                    <th className="py-1.5 pl-3 text-left rounded-l-sm font-medium text-[11px] uppercase tracking-wider" style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }}>TEST DESCRIPTION</th>
                                    <th className="py-1.5 pr-3 text-right rounded-r-sm w-32 font-medium text-[11px] uppercase tracking-wider" style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }}>AMOUNT (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item: { name: string; price: number }, i: number) => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="py-2 pl-3 text-slate-700 font-medium">{item.name}</td>
                                        <td className="py-2 pr-3 text-right font-bold text-slate-800">{Number(item.price || 0).toFixed(2)}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-start pt-4 border-t border-slate-100">
                            <div className="w-[50%] flex items-end gap-6 pb-1">
                                {barcodeUrl && (
                                <div className="opacity-90 flex flex-col items-center">
                                    <img src={barcodeUrl} alt="Barcode" className="h-5 w-[80px] mb-1" />
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest">{String(data.billId || '').slice(-4)}</p>
                                </div>
                                )}
                                
                                <div className="opacity-90 flex flex-col items-center">
                                    <div className="p-1 bg-white border border-slate-200 rounded flex items-center justify-center w-[44px] h-[44px]">
                                        {qrUrl ? <img src={qrUrl} alt="QR Code" className="w-full h-full" /> : <div className="w-full h-full bg-slate-50"></div>}
                                    </div>
                                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 tracking-wider">Scan to Verify</p>
                                </div>
                            </div>

                            <div className="w-[45%] flex flex-col">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-slate-500"><span>Sub Total</span><span>{Number(data.subTotal || 0).toFixed(2)}</span></div>
                                    {Number(data.discount || 0) > 0 && <div className="flex justify-between text-xs text-red-500"><span>Discount</span><span>- {Number(data.discount || 0).toFixed(2)}</span></div>}
                                    <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-900 pt-2 mt-1"><span>Net Amount</span><span>₹ {Number(data.totalAmount || 0).toFixed(2)}</span></div>
                                    <div className="flex justify-between text-xs font-bold bg-green-50 text-green-600 px-1 py-1 rounded"><span>Paid Amount</span><span>{Number(data.paidAmount || 0).toFixed(2)}</span></div>
                                    {Number(data.balanceDue || 0) > 0 && <div className="flex justify-between text-xs font-bold bg-red-50 text-red-600 px-1 py-1 rounded"><span>Balance Due</span><span>{Number(data.balanceDue || 0).toFixed(2)}</span></div>}
                                </div>
                            </div>
                        </div>

                        {data.note && (
                        <div className="mt-6 mb-2 border border-slate-200 rounded p-3 bg-slate-50/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Note / Instructions:</p>
                            <div id="invoice-note-content" className="text-xs text-slate-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data.note }} />
                        </div>
                        )}

                        <div className="mt-auto pt-12 text-center self-end w-48 ml-auto flex flex-col items-center justify-end min-h-[60px]">
                            {data.authorSign ? (
                                <>
                                    {data.authorSign.signatureUrl ? (
                                        <img src={data.authorSign.signatureUrl} alt="Signature" className="h-10 w-auto object-contain mb-1" />
                                    ) : (
                                        <div className="w-32 border-b border-dashed border-slate-400 mb-1 mt-6"></div>
                                    )}
                                    <p className="text-[10px] font-bold text-slate-800 leading-tight">{data.authorSign.name}</p>
                                    {data.authorSign.designation && <p className="text-[8px] text-slate-500 leading-tight">{data.authorSign.designation}</p>}
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

        <div className="px-3 py-2 xl:px-4 xl:py-2.5 border-t border-slate-200 bg-white md:bg-slate-50/80 flex flex-col md:flex-row justify-between items-center gap-2 print:hidden shrink-0">
           <div className="flex items-center justify-between md:justify-start gap-1.5 xl:gap-2 w-full md:w-auto">
              
              <button 
                  onClick={() => {
                      if (onEdit) {
                          onEdit(); 
                      } else {
                          onClose(true);
                          router.push(`/registration?editBill=${data.billId}`); 
                      }
                  }} 
                  className={plainBtnClass}
              > 
                  <Edit size={13} /> <span className="hidden sm:inline">Edit</span>
              </button>
              
              <button onClick={() => setIsBarcodeOpen(true)} className={plainBtnClass}> 
                  <ScanBarcode size={13} /> <span className="hidden sm:inline">Barcode</span>
              </button>
              <button onClick={handleOpenTRF} disabled={isTrfLoading} className={plainBtnClass}>
                  {isTrfLoading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} TRF
              </button>
              <button onClick={handleEnterResults} className={`${plainBtnClass} !text-[#9575cd] border-purple-200 bg-purple-50 hover:bg-purple-100`}> 
                  Results <ArrowRight size={13} /> 
              </button>
           </div>
           <div className="flex items-center gap-1.5 xl:gap-2 w-full md:w-auto">
              <button onClick={handleDownloadInvoice} disabled={isInvoiceLoading} className={iconBtnClass} style={mainGradient} title="Download PDF"> 
                  {isInvoiceLoading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} 
                  <span className="hidden sm:inline">Download</span>
              </button>
              
              {whatsappManualEnabled && (
              <button onClick={handleSendWhatsapp} disabled={isSendingWA} className={gradientBtnClass} style={mainGradient}> 
                  {isSendingWA ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} 
                  <span className="hidden sm:inline">{isSendingWA ? 'Sending WA...' : 'WhatsApp'}</span> 
              </button>
              )}

              <button onClick={handlePrintInvoice} disabled={isInvoiceLoading} className={gradientBtnClass} style={mainGradient}> 
                  {isInvoiceLoading ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />} <span className="hidden md:inline">Print</span>
              </button>
           </div>
        </div>
      </div>
    </div>
    
    <WhatsAppConfirmModal
        isOpen={isWAConfirmOpen}
        onClose={() => setIsWAConfirmOpen(false)}
        onConfirm={handleConfirmWhatsapp}
        patientName={data?.patientName || ''}
        existingPhone={data?.phone || (data as any)?.patientPhone}
        documentType="Invoice"
    />

    <BarcodeModal isOpen={isBarcodeOpen} onClose={() => setIsBarcodeOpen(false)} data={barcodeModalData} />
    </>
  );
}