// --- BLOCK app/components/BarcodeModal.tsx OPEN ---
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Barcode as BarcodeIcon, FlaskConical, Eye, CheckSquare, Square, Info, Loader2, ListChecks } from 'lucide-react';
import JsBarcode from 'jsbarcode';

// --- INTERFACES ---
interface BarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    billId: string;
    patientName: string;
    ageGender: string;
    date: string;
    items?: { id: number; name: string; price: number }[];
  } | null;
}

const SAMPLE_TYPES = ["Serum", "EDTA", "Fluoride", "Urine", "Whole Blood", "Swab", "Other"];

// --- COMPONENT ---
export default function BarcodeModal({ isOpen, onClose, data }: BarcodeModalProps) {
  const [sampleTypes, setSampleTypes] = useState<Record<number, string>>({});
  const [barcodeNumbers, setBarcodeNumbers] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [previewItem, setPreviewItem] = useState<{ name: string; sample: string; barcode: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Mobile Tab State
  const [activeMobileTab, setActiveMobileTab] = useState<'tests' | 'preview'>('tests');

  useEffect(() => {
    if (data && data.items) {
      const initialTypes: Record<number, string> = {};
      const initialBarcodes: Record<number, string> = {};
      
      const shortBillId = String(data.billId || '').slice(-4);
      
      data.items.forEach((item, index) => {
        let type = "Serum";
        const lowerName = item.name.toLowerCase();
        if (lowerName.includes("cbc") || lowerName.includes("hb") || lowerName.includes("esr")) type = "EDTA";
        else if (lowerName.includes("glucose") || lowerName.includes("sugar")) type = "Fluoride";
        else if (lowerName.includes("urine")) type = "Urine";
        else if (lowerName.includes("swab")) type = "Swab";
        
        initialTypes[item.id] = type;
        initialBarcodes[item.id] = shortBillId; 

        if (index === 0) {
            setPreviewItem({ name: item.name, sample: type, barcode: shortBillId });
        }
      });

      setSampleTypes(initialTypes);
      setBarcodeNumbers(initialBarcodes);
      setSelectedIds(data.items.map(i => i.id));
    }
  }, [data]);

  useEffect(() => {
    if (previewItem && previewCanvasRef.current) {
        try {
            JsBarcode(previewCanvasRef.current, previewItem.barcode || "0000", {
                format: "CODE128", displayValue: false, height: 40, width: 2, margin: 0, background: "#ffffff"
            });
        } catch (e) { console.error(e); }
    }
  }, [previewItem, activeMobileTab]); // Re-render barcode when tab changes to ensure canvas is ready

  const toggleSelectAll = () => {
    if (!data?.items) return;
    if (selectedIds.length === data.items.length) setSelectedIds([]);
    else setSelectedIds(data.items.map(i => i.id));
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id));
    else setSelectedIds(prev => [...prev, id]);
  };

  const handleBarcodeChange = (id: number, value: string) => {
    setBarcodeNumbers(prev => ({ ...prev, [id]: value }));
  };

  const handlePreviewClick = (item: { id: number; name: string }) => {
    const sample = sampleTypes[item.id] || "Serum";
    const shortBillId = String(data?.billId || '').slice(-4);
    const barcodeVal = barcodeNumbers[item.id] || shortBillId || "";
    setPreviewItem({ name: item.name, sample, barcode: barcodeVal });
    setActiveMobileTab('preview'); // Auto-switch to preview tab on mobile
  };

  const handlePrintWindow = (printItems: { name: string; sample: string; barcode: string }[]) => {
    if (!data) return;
    setIsPrinting(true);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("⚠️ Popup Blocker Detected! Please allow popups for this site to print barcodes.");
        setIsPrinting(false);
        return;
    }

    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Print Barcodes</title>
        <style>
            @page { size: 50mm 25mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: white; color: black; -webkit-font-smoothing: none; }
            .sticker { width: 50mm; height: 25mm; box-sizing: border-box; page-break-after: always; page-break-inside: avoid; display: flex; flex-direction: column; padding: 1.5mm 2mm; overflow: hidden; }
            .row { display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin-bottom: 1px; }
            .name { font-size: 10px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 4px; line-height: 1; }
            .date { font-size: 8px; white-space: nowrap; line-height: 1; }
            .divider { width: 100%; border-bottom: 1px solid black; margin-bottom: 2px; }
            .age { font-size: 8px; line-height: 1; }
            .sample { font-size: 9px; font-weight: bold; line-height: 1; }
            .img-container { flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; overflow: hidden; margin-top: 1px; }
            img { height: 10mm; width: auto; max-width: 100%; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; }
            .barcode-text { font-size: 9px; font-family: monospace; font-weight: bold; text-align: center; margin-top: 1px; line-height: 1; }
            .test-text { font-size: 8px; font-weight: bold; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; margin-top: 1px; line-height: 1; }
        </style>
    </head>
    <body>
    `;

    printItems.forEach((item) => {
        const nameText = data.patientName.length > 20 ? data.patientName.substring(0, 20) + "..." : data.patientName;
        const testText = item.name.length > 35 ? item.name.substring(0, 35) + "..." : item.name;
        
        let imgData = "";
        try {
            const canvas = document.createElement("canvas");
            JsBarcode(canvas, item.barcode || "0000", { format: "CODE128", displayValue: false, width: 2, height: 40, margin: 0 });
            imgData = canvas.toDataURL("image/png");
        } catch (e) { console.error("Barcode canvas error:", e); }

        htmlContent += `
        <div class="sticker">
            <div class="row"><span class="name">${nameText}</span><span class="date">${data.date.split(',')[0]}</span></div>
            <div class="divider"></div>
            <div class="row" style="margin-bottom: 2px;"><span class="age">${data.ageGender}</span><span class="sample">${item.sample}</span></div>
            <div class="img-container"><img src="${imgData}" /></div>
            <div class="barcode-text">${item.barcode}</div>
            <div class="test-text">${testText}</div>
        </div>
        `;
    });

    htmlContent += `<script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };</script></body></html>`;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsPrinting(false);
  };

  const handlePrintSingle = (item: { id: number; name: string }) => {
    const sample = sampleTypes[item.id] || "Serum";
    const shortBillId = String(data?.billId || '').slice(-4);
    const barcodeVal = barcodeNumbers[item.id] || shortBillId || "";
    if (!barcodeVal) return;
    handlePrintWindow([{ name: item.name, sample, barcode: barcodeVal }]);
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0 || !data?.items) return;
    const shortBillId = String(data.billId || '').slice(-4);
    
    const queue = selectedIds.map(id => {
        const item = data.items!.find(i => i.id === id);
        if (!item) return null;
        return { name: item.name, sample: sampleTypes[item.id] || "Serum", barcode: barcodeNumbers[item.id] || shortBillId || "" };
    }).filter(Boolean) as { name: string; sample: string; barcode: string }[];

    if (queue.length > 0) handlePrintWindow(queue);
  };

  if (!isOpen || !data) return null;
  const allSelected = data.items && data.items.length > 0 && selectedIds.length === data.items.length;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 p-2 md:p-4">
      <div className="bg-white rounded-[6px] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col h-[90vh] md:max-h-[85vh]">
        
        {/* HEADER */}
        <div className="min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] px-3 md:px-4 bg-white md:bg-slate-50/80 border-b border-slate-200 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-2">
             <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs"><BarcodeIcon size={14} /></div>
             <div className="flex items-center gap-2">
                 <h3 className="font-semibold text-slate-800 text-[14px] xl:text-[15px] leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>Barcode Manager</h3>
                 <span className="text-[10px] xl:text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 leading-none">
                     Print Barcode Stickers
                 </span>
             </div>
           </div>
           <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"><X size={16} /></button>
        </div>

        {/* MOBILE TABS */}
        <div className="md:hidden flex px-2 bg-slate-50 border-b border-slate-200 shrink-0 gap-1 min-h-[36px] h-[36px]">
            <button 
                onClick={() => setActiveMobileTab('tests')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${activeMobileTab === 'tests' ? 'border-[#9575cd] text-[#9575cd] font-semibold bg-white' : 'border-transparent text-slate-500'}`}
            >
                <ListChecks size={13} /> Select Tests
            </button>
            <button 
                onClick={() => setActiveMobileTab('preview')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium border-b-2 transition-colors ${activeMobileTab === 'preview' ? 'border-[#9575cd] text-[#9575cd] font-semibold bg-white' : 'border-transparent text-slate-500'}`}
            >
                <Eye size={13} /> Preview
            </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row relative">
            
            {/* LEFT PANEL: TEST LIST */}
            <div className={`w-full md:w-2/3 flex flex-col bg-white md:border-r border-slate-200 h-full ${activeMobileTab === 'tests' ? 'flex' : 'hidden md:flex'}`}>
                <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center shrink-0">
                    <span className="text-[10px] xl:text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Test List</span>
                    <span className="text-[10px] xl:text-[11px] font-semibold text-[#9575cd] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">{selectedIds.length} / {data.items?.length || 0} Selected</span>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar bg-white relative">
                    <div className="min-w-[500px] md:min-w-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#9575cd] sticky top-0 z-10 shadow-sm text-[10px] md:text-xs text-white uppercase border-b border-[#7e57c2] align-middle leading-none">
                                <tr>
                                    <th style={{ verticalAlign: 'middle', lineHeight: 1 }} className="p-2 md:p-2.5 pl-3 md:pl-4 border-b border-[#7e57c2] w-[40px] md:w-[50px]">
                                        <button onClick={toggleSelectAll} className="flex items-center justify-center text-white hover:text-white/80">
                                            {allSelected ? <CheckSquare size={16} className="text-white" /> : <Square size={16} className="text-white" />}
                                        </button>
                                    </th>
                                    <th style={{ verticalAlign: 'middle', lineHeight: 1 }} className="p-2 md:p-2.5 border-b border-[#7e57c2] w-[30%]">Test Name</th>
                                    <th style={{ verticalAlign: 'middle', lineHeight: 1 }} className="p-2 md:p-2.5 border-b border-[#7e57c2] w-[25%]">Sample</th>
                                    <th style={{ verticalAlign: 'middle', lineHeight: 1 }} className="p-2 md:p-2.5 border-b border-[#7e57c2] w-[25%]">Barcode No.</th>
                                    <th style={{ verticalAlign: 'middle', lineHeight: 1 }} className="p-2 md:p-2.5 pr-3 md:pr-4 border-b border-[#7e57c2] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[11px] md:text-xs">
                                {data.items?.map((item, index) => {
                                  const isSelected = selectedIds.includes(item.id);
                                  return (
                                    <tr key={index} className={`hover:bg-slate-50 group transition-colors ${isSelected ? 'bg-purple-50/30' : ''}`}>
                                        <td className="p-2 md:p-3 pl-3 md:pl-4">
                                            <button onClick={() => toggleSelectOne(item.id)} className="flex items-center justify-center">
                                                {isSelected ? <CheckSquare size={16} className="text-purple-600" /> : <Square size={16} className="text-slate-300 hover:text-slate-500" />}
                                            </button>
                                        </td>
                                        <td className="p-2 md:p-3 font-medium text-slate-700 truncate max-w-[120px] md:max-w-none" title={item.name}>{item.name}</td>
                                        <td className="p-2 md:p-3">
                                            <div className="relative">
                                                <select value={sampleTypes[item.id] || "Serum"} onChange={(e) => { setSampleTypes(prev => ({ ...prev, [item.id]: e.target.value })); if (previewItem?.name === item.name) setPreviewItem(prev => prev ? ({...prev, sample: e.target.value}) : null); }} className="w-full border border-slate-200 rounded py-1 pl-1 pr-5 bg-slate-50 focus:bg-white focus:border-purple-400 outline-none appearance-none cursor-pointer text-slate-600 font-medium">
                                                    {SAMPLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <FlaskConical size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </td>
                                        <td className="p-2 md:p-3">
                                            <input type="text" value={barcodeNumbers[item.id] || ""} onChange={(e) => { handleBarcodeChange(item.id, e.target.value); if (previewItem?.name === item.name) setPreviewItem(prev => prev ? ({...prev, barcode: e.target.value}) : null); }} className="w-full font-mono border border-slate-200 rounded py-1 px-2 text-slate-700 focus:border-blue-400 outline-none" />
                                        </td>
                                        <td className="p-2 md:p-3 pr-3 md:pr-4 text-right">
                                            <div className="flex items-center justify-end gap-1 md:gap-2">
                                                <button onClick={() => handlePreviewClick(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all" title="Preview"><Eye size={16} /></button>
                                                <button onClick={() => handlePrintSingle(item)} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all" title="Print Single"><Printer size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="px-3 py-2 border-t border-slate-200 bg-white md:bg-slate-50/80 shrink-0">
                    <button 
                        onClick={handlePrintSelected} 
                        disabled={selectedIds.length === 0 || isPrinting} 
                        className={`flex items-center justify-center gap-1.5 w-full h-[26px] xl:h-[28px] rounded-[5px] text-[11px] xl:text-[12px] font-medium transition-all shadow-2xs ${
                            selectedIds.length > 0 
                                ? 'text-white hover:opacity-95' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                        style={selectedIds.length > 0 ? { background: 'linear-gradient(to right, #9575cd, #b39ddb)' } : {}}
                    >
                        {isPrinting ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                        <span>{selectedIds.length > 0 ? `Print ${selectedIds.length} Selected` : 'Select Tests to Print'}</span>
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: LIVE PREVIEW */}
            <div className={`w-full md:w-1/3 bg-slate-50 flex flex-col h-full ${activeMobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
                 <div className="px-3 py-1.5 border-b border-slate-200 shrink-0 bg-slate-50/80">
                     <span className="text-[10px] xl:text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Live Preview</span>
                 </div>
                 
                 <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
                    {previewItem ? (
                        <div className="animate-in zoom-in-95 duration-200 transform scale-100">
                            <div className="w-[220px] h-[115px] bg-white border border-slate-300 shadow-sm rounded-[6px] p-2 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-[#9575cd]"></div>
                                <div className="flex justify-between items-end border-b border-slate-100 pb-1 mb-1 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-800 truncate max-w-[130px]">{data.patientName}</span>
                                    <span className="text-[8.5px] text-slate-500">{data.date.split(',')[0]}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[8.5px] text-slate-500">{data.ageGender}</span>
                                    <span className="text-[8.5px] font-semibold text-[#9575cd] bg-purple-50 px-1 rounded border border-purple-100">{previewItem.sample}</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center bg-slate-50/50 rounded border border-slate-100 mb-1">
                                     {activeMobileTab === 'preview' || typeof window !== 'undefined' ? (
                                        <canvas ref={previewCanvasRef} className="h-7 w-full object-contain mix-blend-multiply" />
                                     ) : null}
                                </div>
                                <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-600">
                                    <span>{previewItem.barcode}</span>
                                    <span className="font-sans font-medium truncate max-w-[100px]">{previewItem.name}</span>
                                </div>
                            </div>
                            <p className="text-center text-[10px] text-slate-400 mt-3">Previewing: <span className="font-semibold text-slate-700">{previewItem.name}</span></p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <Eye size={28} className="mx-auto mb-2 opacity-25" />
                            <p className="text-[11px]">Select an item to preview</p>
                            <button onClick={() => setActiveMobileTab('tests')} className="mt-3 px-3 py-1 bg-white border border-slate-200 text-[#9575cd] rounded-[5px] shadow-2xs text-[11px] font-medium md:hidden">Go back to Tests</button>
                        </div>
                    )}
                 </div>

                 <div className="px-3 py-2 bg-white md:bg-slate-50/80 border-t border-slate-200 shrink-0">
                    <button onClick={onClose} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-medium text-slate-700 hover:bg-slate-50 rounded-[5px] border border-slate-300 transition shadow-2xs">Close Window</button>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
// --- BLOCK app/components/BarcodeModal.tsx CLOSE ---