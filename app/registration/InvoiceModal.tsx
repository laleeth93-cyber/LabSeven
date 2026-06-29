import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Printer, Download, CheckCircle, ScanBarcode, ArrowRight, FileText, Send, Loader2 } from 'lucide-react';
import { generateTRFHtml, TRFData } from '@/app/components/TRFDocument';
import BarcodeModal from '@/app/components/BarcodeModal'; 
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';

// 🚨 FIXED: Removed the crashing 'qrcode.react' library and returned to the safe 'qrcode' image generator
import QRCode from 'qrcode'; 
import { getLabProfile } from '@/app/actions/lab-profile';

export interface InvoiceItem { id: number; name: string; price: number; }
export interface InvoiceData {
  billId: string; billDate: string; patientName: string; ageGender: string;
  referredBy: string; paymentType: string; items: InvoiceItem[];
  subTotal: number; discount: number; totalAmount: number;
  paidAmount: number; balanceDue: number;
  barcodeUrl?: string; note?: string; noteImage?: string; 
  labProfile?: any;
  authorSign?: any;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

export default function InvoiceModal({ isOpen, onClose, data }: InvoiceModalProps) {
  const router = useRouter(); 
  const [isClient, setIsClient] = useState(false);
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>(''); 
  const [noteImage, setNoteImage] = useState<string>(''); 
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [labProfile, setLabProfile] = useState<any>(null);
  
  const [isTrfLoading, setIsTrfLoading] = useState(false);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

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

        // 🚨 FIXED: Safely generates the QR code as a base64 image URL so it cannot crash the React renderer
        const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://labseven.in'}/verify/${data.billId}?type=invoice`;
        QRCode.toDataURL(verificationUrl, { margin: 0, width: 64, color: { dark: '#000000', light: '#ffffff' } })
            .then(url => setQrUrl(url))
            .catch(err => console.error("QR Error:", err));

      } catch (e) { console.error(e); }
    }
  }, [data]);

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
  const handleEnterResults = () => { if (data?.billId) { onClose(); router.push(`/results/entry?billNumber=${data.billId}`); } };

  const plainBtnClass = "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded border border-slate-300 bg-white text-slate-700 text-xs md:text-sm font-bold shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-1 md:flex-none";
  const mainGradient = { background: 'linear-gradient(135deg, #9575cd, #7e57c2)' };
  const gradientBtnClass = "flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded text-white text-xs md:text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-1 md:flex-none";
  const iconBtnClass = "p-2 flex items-center justify-center rounded text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 md:p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-[850px] rounded-lg shadow-2xl flex flex-col h-[95vh] md:max-h-[90vh] overflow-hidden">
        
        <div className="flex justify-between items-center p-3 px-4 md:px-6 border-b border-purple-100 shadow-sm print:hidden shrink-0" style={{ background: 'linear-gradient(to right, #b3e5fc, #e1bee7)' }}>
           <div className="flex items-center gap-2">
              <div className="bg-white/40 p-1.5 rounded text-[#9575cd] hidden md:block"><CheckCircle size={18} /></div>
              <div>
                <h3 className="font-bold text-slate-700 text-sm md:text-base leading-tight">Invoice Generated</h3>
                <p className="text-[9px] md:text-[10px] text-slate-500">Ready to Print or Download</p>
              </div>
           </div>
           <button onClick={onClose} className="p-1.5 hover:bg-white/40 rounded-full text-slate-600 hover:text-red-500 transition-colors"><X size={20} /></button>
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
                                    <tr className="bg-slate-800 text-white">
                                    <th className="py-2 pl-3 text-left rounded-l-sm">TEST DESCRIPTION</th>
                                    <th className="py-2 pr-3 text-right rounded-r-sm w-32">AMOUNT (₹)</th>
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
                                        {/* 🚨 FIXED: Safely rendering the QR image instead of the broken react component */}
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

        <div className="p-3 md:p-4 border-t border-slate-200 bg-white flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3 print:hidden shrink-0">
           <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto">
              <button onClick={() => setIsBarcodeOpen(true)} className={plainBtnClass}> 
                  <ScanBarcode size={16} /> <span className="hidden sm:inline">Barcode</span>
              </button>
              <button onClick={handleOpenTRF} disabled={isTrfLoading} className={plainBtnClass}>
                  {isTrfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} TRF
              </button>
              <button onClick={handleEnterResults} className={`${plainBtnClass} !text-[#9575cd] border-[#9575cd] bg-purple-50`}> 
                  Results <ArrowRight size={16} /> 
              </button>
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto">
              <button onClick={handleDownloadInvoice} disabled={isInvoiceLoading} className={iconBtnClass} style={mainGradient} title="Download PDF"> 
                  {isInvoiceLoading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />} 
              </button>
              <button className={gradientBtnClass} style={mainGradient}> <Send size={16} /> <span className="hidden sm:inline">Send</span> </button>
              <button onClick={handlePrintInvoice} disabled={isInvoiceLoading} className={gradientBtnClass} style={mainGradient}> 
                  {isInvoiceLoading ? <Loader2 size={16} className="animate-spin md:mr-1" /> : <Printer size={16} className="md:mr-1" />} <span className="hidden md:inline">Print</span>
              </button>
           </div>
        </div>
      </div>
    </div>
    
    <BarcodeModal isOpen={isBarcodeOpen} onClose={() => setIsBarcodeOpen(false)} data={barcodeModalData} />
    </>
  );
}