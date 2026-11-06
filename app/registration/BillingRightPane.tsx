"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Hash, ReceiptText, Plus, Search, Loader2, Stethoscope, Trash2, ShieldAlert, CreditCard, ChevronDown, StickyNote } from 'lucide-react';
import { searchTests } from '@/app/actions/billing';
import type { BillItem } from './NewRegistration';
import EntryDateTimePicker from '@/app/results/entry/components/EntryDateTimePicker';

interface Props {
  currentBillNumber: string;
  billingDate: string;
  handleManualDateChange: (d: string) => void;
  onQuotationClick: () => void;
  handleOpenNotes: () => void;
  billItems: BillItem[];
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>;
  discountPercent: string; setDiscountPercent: React.Dispatch<React.SetStateAction<string>>;
  discountAmount: string; setDiscountAmount: React.Dispatch<React.SetStateAction<string>>;
  discountBy: string; setDiscountBy: React.Dispatch<React.SetStateAction<string>>;
  discountReason: string; setDiscountReason: React.Dispatch<React.SetStateAction<string>>;
  isDuePayment: boolean; setIsDuePayment: React.Dispatch<React.SetStateAction<boolean>>;
  advancePaid: string; setAdvancePaid: React.Dispatch<React.SetStateAction<string>>;
  selectedModes: string[]; setSelectedModes: React.Dispatch<React.SetStateAction<string[]>>;
  paymentDetails: Record<string, { amount: string, txnId: string }>; 
  setPaymentDetails: React.Dispatch<React.SetStateAction<Record<string, { amount: string, txnId: string }>>>;
  subTotal: number; finalDiscount: number; netAmount: number; dueAmount: number;
  handleSaveAndGenerate: () => void;
  isSaving: boolean;
  mobileView?: 'tests' | 'billing';
  mobileTimeline?: React.ReactNode;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  patientName?: string;
  patientAge?: string;
}

export default function BillingRightPane({
  currentBillNumber, billingDate, handleManualDateChange, onQuotationClick, handleOpenNotes,
  billItems, setBillItems, discountPercent, setDiscountPercent, discountAmount, setDiscountAmount,
  discountBy, setDiscountBy, discountReason, setDiscountReason, isDuePayment, setIsDuePayment,
  advancePaid, setAdvancePaid, selectedModes, setSelectedModes, paymentDetails, setPaymentDetails,
  subTotal, finalDiscount, netAmount, dueAmount, handleSaveAndGenerate, isSaving,
  mobileView, mobileTimeline, onNextStep, onPrevStep, patientName, patientAge
}: Props) {
  
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<any[]>([]);
  const [isSearchingTests, setIsSearchingTests] = useState(false);
  const testSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null); // 🚨 Ref for scrolling the dropdown
  
  const [activeTab, setActiveTab] = useState('Tests/Packages');
  
  // 🚨 FIX: State to keep track of the currently selected test via keyboard
  const [focusedTestIndex, setFocusedTestIndex] = useState<number>(-1);

  useEffect(() => {
    if (testSearchTimeout.current) clearTimeout(testSearchTimeout.current);
    if (testSearchQuery.length >= 2) {
      setIsSearchingTests(true);
      testSearchTimeout.current = setTimeout(async () => {
        const results = await searchTests(testSearchQuery);
        setTestSearchResults(results);
        setIsSearchingTests(false);
        setFocusedTestIndex(-1); // 🚨 Reset selection when results change
      }, 300);
    } else {
      setTestSearchResults([]);
      setIsSearchingTests(false);
      setFocusedTestIndex(-1);
    }
  }, [testSearchQuery]);

  // 🚨 FIX: Auto-scroll the dropdown when navigating with arrows
  useEffect(() => {
    if (focusedTestIndex >= 0 && searchResultsRef.current) {
        const container = searchResultsRef.current;
        const focusedElement = container.children[focusedTestIndex] as HTMLElement;
        if (focusedElement) {
            focusedElement.scrollIntoView({ block: 'nearest' });
        }
    }
  }, [focusedTestIndex]);

  const handleAddTest = (test: any) => {
    if (!billItems.find(item => item.id === test.id)) {
        const displayName = (test.isOutsourced && test.outsourceLab) ? `${test.name} (${test.outsourceLab.name})` : test.name;
        setBillItems([...billItems, { id: test.id, code: test.code, name: displayName, price: test.price, type: test.type, isUrgent: false }]);
    }
    setTestSearchQuery(''); 
    setTestSearchResults([]);
    setFocusedTestIndex(-1);
    setTimeout(() => { if (searchInputRef.current) searchInputRef.current.focus(); }, 50); // Refocus input
  };

  // 🚨 FIX: Keyboard navigation logic (Arrows and Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (testSearchResults.length === 0) return;

      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedTestIndex(prev => (prev < testSearchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedTestIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
          e.preventDefault();
          if (focusedTestIndex >= 0 && focusedTestIndex < testSearchResults.length) {
              handleAddTest(testSearchResults[focusedTestIndex]);
          } else if (testSearchResults.length === 1) {
              // Automatically select the only test available if Enter is pressed
              handleAddTest(testSearchResults[0]);
          }
      } else if (e.key === 'Escape') {
          setTestSearchResults([]);
          setFocusedTestIndex(-1);
      }
  };

  const handleRemoveTest = (index: number) => {
    const newItems = [...billItems];
    newItems.splice(index, 1);
    setBillItems(newItems);
  };

  const handleModeToggle = (mode: string) => setSelectedModes(prev => prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]);
  const handlePaymentDetailChange = (mode: string, field: 'amount' | 'txnId', value: string) => {
    setPaymentDetails(prev => ({ ...prev, [mode]: { ...prev[mode], [field]: value } }));
  };

  return (
    <div className="w-full md:w-[65%] md:flex-1 md:min-w-0 h-full flex flex-col bg-white md:rounded-[10px] md:shadow-xl md:border border-transparent md:border-slate-200 overflow-y-auto md:overflow-hidden z-20 relative">
       
       {/* --- STICKY HEADER SECTION --- */}
       <div className="sticky top-0 z-40 flex flex-col w-full shrink-0 bg-white md:bg-transparent">

           {/* --- TOP HEADER --- */}
           <div className="pt-2 px-3 pb-2 md:px-2.5 xl:px-3 md:py-0 md:min-h-[38px] md:h-[38px] xl:min-h-[42px] xl:h-[42px] bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-1.5 xl:gap-2 overflow-visible w-full relative z-30">
              
              {/* MOBILE ONLY: Patient name bar */}
              {patientName && (
                <div className="md:hidden flex items-center gap-1.5 w-full mb-1">
                  <span className="text-[13px] font-medium text-slate-800 truncate">{patientName}</span>
                  {patientAge && (
                    <>
                      <span className="text-[13px] font-normal text-slate-300">•</span>
                      <span className="text-[13px] font-medium text-slate-800 shrink-0">{patientAge}</span>
                    </>
                  )}
                </div>
              )}

              {/* MOBILE ONLY: Timeline first */}
              <div className="md:hidden w-full">
                  {mobileTimeline}
              </div>

              {/* MOBILE ONLY: Date Picker, Notes & Quotation */}
              {mobileView !== 'tests' && (
                  <div className="md:hidden flex items-center justify-between gap-2 w-full mt-1">
                      {/* Date picker */}
                      <div className="flex-1 min-w-0 w-full [&>div]:w-full">
                         <EntryDateTimePicker 
                            date={billingDate} 
                            onChange={(d) => handleManualDateChange(d)}
                            label=""
                            align="right"
                            triggerClassName="flex items-center justify-between w-full bg-white border border-slate-300 rounded shadow-sm h-[26px] px-2 gap-1 cursor-pointer transition-all group select-none hover:border-[#9575cd] [&_span:last-child]:!text-[11px] [&_svg]:!w-3.5 [&_svg]:!h-3.5"
                            popupClassName="w-[280px] scale-[0.85] origin-top-left"
                         />
                      </div>
                      {/* Note & Quotation small icons */}
                      <div className="flex gap-2 shrink-0">
                          <button onClick={handleOpenNotes} className="w-[26px] h-[26px] flex justify-center items-center rounded text-[#9575cd] bg-purple-50 border border-purple-200 hover:bg-purple-100 shadow-sm transition-all active:scale-95">
                              <StickyNote size={11} />
                          </button>
                          <button onClick={onQuotationClick} className="w-[26px] h-[26px] flex justify-center items-center rounded text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 shadow-sm transition-all active:scale-95">
                              <ReceiptText size={11} />
                          </button>
                      </div>
                  </div>
              )}

              {/* DESKTOP ONLY: Invoice & Date */}
              <div className="hidden md:flex md:items-center md:w-auto gap-1.5 xl:gap-2 min-w-0 shrink-0">
                  <div className="h-[24px] xl:h-[26px] flex items-center gap-1 text-slate-800 font-mono font-normal text-[10px] xl:text-xs bg-white px-1.5 xl:px-2.5 rounded border border-slate-300 shadow-sm shrink-0">
                     <span className="text-[10px] font-normal text-slate-400 uppercase tracking-widest">INV:</span>
                     <span className="whitespace-nowrap">{currentBillNumber}</span>
                  </div>
                  
                  <div className="flex items-center min-w-0 w-full [&>div]:w-full">
                     <EntryDateTimePicker 
                        date={billingDate} 
                        onChange={(d) => handleManualDateChange(d)}
                        label=""
                        align="right"
                        triggerClassName="flex items-center justify-between bg-white border border-slate-300 rounded shadow-sm h-[24px] xl:h-[26px] px-1.5 xl:px-2.5 gap-1 cursor-pointer transition-all group select-none hover:border-[#9575cd] [&_span:last-child]:!text-[10px] xl:[&_span:last-child]:!text-xs [&_svg]:!w-3 [&_svg]:!h-3 xl:[&_svg]:!w-3.5 xl:[&_svg]:!h-3.5 whitespace-nowrap shrink-0"
                        popupClassName="scale-100"
                     />
                  </div>
              </div>
              
              {/* DESKTOP ONLY: Timeline */}
              <div className="hidden md:block">
                  {mobileTimeline}
              </div>
              
              {/* DESKTOP ONLY: Note & Quotation Buttons */}
              <div className="hidden md:flex gap-1.5 xl:gap-2 w-auto shrink-0">
                  <button onClick={handleOpenNotes} className="h-[24px] xl:h-[26px] flex justify-center items-center gap-1 px-1.5 xl:px-2.5 rounded text-[#9575cd] bg-purple-50 border border-purple-200 hover:bg-purple-100 font-normal text-[10px] xl:text-[12px] shadow-sm transition-all active:scale-95 whitespace-nowrap">
                      <StickyNote size={14} /> <span>Note</span>
                  </button>
                  <button onClick={onQuotationClick} className="h-[24px] xl:h-[26px] flex justify-center items-center gap-1 px-1.5 xl:px-2.5 rounded text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-normal text-[10px] xl:text-[12px] shadow-sm transition-all active:scale-95 whitespace-nowrap">
                      <ReceiptText size={14} /> <span>Quotation</span>
                  </button>
              </div>
           </div> {/* Closes TOP HEADER */}

       {/* --- SEARCH BAR SECTION (Also Sticky) --- */}
       <div className={`px-2 pt-1 pb-1 md:px-2.5 xl:px-3 md:py-0 border-b border-slate-200 bg-white shrink-0 flex flex-row items-center justify-between gap-1.5 xl:gap-2 overflow-visible min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] ${mobileView === 'billing' ? 'hidden md:flex' : ''}`}>
          <div className="flex items-center w-full relative overflow-visible flex-1">
             <input 
                ref={searchInputRef}
                type="text" 
                value={testSearchQuery} 
                onChange={(e) => setTestSearchQuery(e.target.value)} 
                onKeyDown={handleSearchKeyDown} // 🚨 FIX: Attached Keyboard Event
                placeholder="Search tests..." 
                className="w-full pl-7 md:pl-7 xl:pl-8 pr-2 h-[24px] xl:h-[26px] rounded-[5px] md:rounded-md border border-slate-200 md:border-slate-300 text-[11px] xl:text-[12px] font-normal text-slate-800 placeholder:text-[11px] xl:placeholder:text-[12px] focus:outline-none focus:border-[#9575cd] md:focus:ring-1 md:focus:ring-[#9575cd]/50 transition-all bg-white md:bg-slate-50 shadow-sm md:shadow-none" 
             />
             {isSearchingTests ? <Loader2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9575cd] animate-spin md:left-2.5 md:w-[13px] md:h-[13px]" /> : <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 md:left-2.5 md:w-[13px] md:h-[13px]" />}
             
             {testSearchResults.length > 0 && (
                 <div ref={searchResultsRef} className="absolute top-[calc(100%+4px)] left-0 w-[150%] md:w-[120%] bg-white border border-slate-200 rounded-lg shadow-2xl max-h-[250px] overflow-y-auto z-[9999]">
                    {testSearchResults.map((test, index) => {
                       const isFocused = focusedTestIndex === index;
                       return (
                           <div 
                              key={test.id} 
                              onClick={() => handleAddTest(test)} 
                              onMouseEnter={() => setFocusedTestIndex(index)} // Sync mouse hover with keyboard focus
                              className={`px-3 py-2 md:px-4 md:py-2.5 border-b border-slate-50 cursor-pointer flex justify-between items-center group transition-colors ${isFocused ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
                           >
                              <div className="min-w-0 flex-1 pr-2">
                                  <p className={`text-[11px] md:text-[12px] font-normal truncate ${isFocused ? 'text-[#7e57c2]' : 'text-slate-700 group-hover:text-[#7e57c2]'}`}>
                                      {test.isOutsourced && test.outsourceLab ? `${test.name} (${test.outsourceLab.name})` : test.name}
                                  </p>
                                  <p className={`text-[9px] mt-0.5 truncate ${isFocused ? 'text-[#9575cd]' : 'text-slate-400'}`}>
                                      {test.code} • {test.department?.name || 'General'}
                                  </p>
                              </div>
                              <span className={`text-[10px] md:text-xs font-normal px-1.5 py-0.5 rounded border transition-colors shrink-0 ${isFocused ? 'bg-white border-purple-200 text-slate-800 shadow-sm' : 'text-slate-800 bg-slate-100 border-slate-200 group-hover:bg-white group-hover:border-purple-200'}`}>
                                  ₹{test.price}
                              </span>
                           </div>
                       );
                    })}
                 </div>
             )}
          </div>
          
          <div className="shrink-0 md:hidden">
             <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value)}
                className="px-1.5 h-[26px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[5px] text-[11px] font-normal text-slate-700 focus:outline-none focus:border-[#9575cd] cursor-pointer shadow-sm transition-all"
             >
                <option value="Tests/Packages">Tests / Packages</option>
                <option value="Other Charges">Other Charges</option>
             </select>
          </div>
          
          <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
             {['Tests/Packages', 'Other Charges'].map(tab => (
               <button 
                 key={tab} 
                 onClick={() => setActiveTab(tab)} 
                 className={`h-full whitespace-nowrap px-1.5 xl:px-2.5 rounded text-[10px] xl:text-[11px] font-normal transition-all flex items-center justify-center leading-none ${activeTab === tab ? "bg-white shadow-sm text-slate-800 font-medium" : "text-slate-500 hover:text-slate-700"}`}
               >
                 {tab}
               </button>
             ))}
          </div>
       </div>
       </div> {/* Closes STICKY HEADER SECTION */}

       {/* --- TEST LIST TABLE AREA --- */}
       <div className={`flex-none md:flex-1 h-full md:h-auto overflow-hidden bg-white p-0 md:p-2.5 xl:p-3 flex flex-col min-h-0 z-10 pb-20 md:pb-0 ${mobileView === 'billing' ? 'hidden md:flex' : 'flex'}`}>
          
          {/* MOBILE VIEW: CARDS (md:hidden) */}
          <div className="block md:hidden overflow-y-auto p-2 space-y-2 h-full custom-scrollbar">
             {billItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-slate-400 opacity-60 px-4 pt-10">
                   <Stethoscope size={40} className="mb-2 text-slate-300" strokeWidth={1.5} />
                   <span className="text-xs font-normal tracking-wide">No tests added yet</span>
                   <span className="text-[11px] font-medium mt-0.5">Search tests above</span>
                </div>
             ) : (
                billItems.map((item, index) => (
                   <div key={`${item.id}-${index}`} className="relative bg-white border border-slate-200 rounded-md shadow-2xs p-2 border-l-2 border-l-[#9575cd]">
                      <div className="pr-7">
                         <p className="text-[12px] font-normal text-slate-800 leading-tight">{item.name}</p>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[9px] font-normal text-slate-400">{item.code}</p>
                            <span className="text-slate-300 text-[8px]">•</span>
                            <p className="text-[10px] font-medium text-slate-700">₹{item.price.toFixed(2)}</p>
                         </div>
                      </div>
                      <button onClick={() => handleRemoveTest(index)} className="absolute top-1/2 -translate-y-1/2 right-2 text-red-400 bg-red-50 border border-red-100 p-1.5 rounded active:scale-95">
                         <Trash2 size={12} />
                      </button>
                   </div>
                ))
             )}
          </div>

          {/* DESKTOP VIEW: DISTINCT SEPARATE BLOCK TABLE (hidden md:flex) */}
          <div className="hidden md:flex flex-col flex-1 min-h-0 w-full h-full overflow-hidden">
             <div className="w-full h-full overflow-auto custom-scrollbar rounded-[6px] border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left text-sm border-collapse min-w-0 bg-white border-spacing-0">
                   <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                      <tr>
                         <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-10">Sr.</th>
                         <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left">Test / Package</th>
                         <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-right w-24">Price</th>
                         <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-12">Urg.</th>
                         <th style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-center w-10">Del</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {billItems.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="py-12 text-center align-middle">
                               <div className="flex flex-col items-center justify-center text-slate-400 opacity-60 px-4">
                                  <Stethoscope size={40} className="mb-2 text-slate-300" strokeWidth={1.5} />
                                  <span className="text-xs font-normal tracking-wide">No tests added yet</span>
                                  <span className="text-[11px] font-medium mt-0.5">Search tests above</span>
                               </div>
                            </td>
                         </tr>
                      ) : (
                         billItems.map((item, index) => (
                            <tr key={`${item.id}-${index}`} className="hover:bg-purple-50/40 transition-colors">
                               <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-500 text-center w-10">
                                  {index + 1}
                               </td>
                               <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                  <p className="text-[11px] font-normal text-slate-800 leading-tight">{item.name}</p>
                                  <p className="text-[9px] font-normal text-slate-400 mt-0.5">{item.code}</p>
                               </td>
                               <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-[11px] font-normal text-slate-800 text-right w-24 whitespace-nowrap">
                                  ₹{item.price.toFixed(2)}
                               </td>
                               <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center w-12">
                                  <input type="checkbox" className="rounded text-[#9575cd] focus:ring-[#9575cd] border-slate-300 w-3.5 h-3.5 cursor-pointer accent-[#9575cd]" />
                               </td>
                               <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center w-10">
                                  <button onClick={() => handleRemoveTest(index)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all active:scale-95 inline-flex items-center justify-center">
                                     <Trash2 size={13} />
                                  </button>
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
       </div>

       {/* --- BOTTOM SECTION --- */}
       <div className={`bg-white shrink-0 flex flex-col md:flex-row w-full md:border-t border-transparent md:border-slate-200 z-10 ${mobileView === 'tests' ? 'hidden md:flex' : 'flex'}`}>
          
          <div className="w-full md:w-1/3 p-2 md:p-2 xl:p-2.5 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-1 md:gap-1.5 xl:gap-2 shrink-0 min-w-0">
              
              {/* MOBILE ONLY: Total Amount before Discount */}
              <div className="md:hidden flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-[5px] border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wider">Total Amount</span>
                  <span className="text-[12px] font-normal text-slate-800">₹{subTotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-1.5 xl:gap-2">
                  <div className="flex-1 space-y-0.5 md:space-y-1">
                      <label className="text-[10px] xl:text-[11px] font-normal text-slate-500 uppercase tracking-wide block truncate whitespace-nowrap">Discount (%)</label>
                      <input type="number" value={discountPercent} onChange={(e) => {setDiscountPercent(e.target.value); setDiscountAmount('')}} className="w-full h-[24px] xl:h-[26px] px-1.5 xl:px-2 rounded-[5px] border border-slate-300 text-[10px] xl:text-[11px] font-normal focus:border-[#9575cd] focus:outline-none" placeholder="0" />
                  </div>
                  <div className="flex-1 space-y-0.5 md:space-y-1">
                      <label className="text-[10px] xl:text-[11px] font-normal text-slate-500 uppercase tracking-wide block truncate whitespace-nowrap">Discount (₹)</label>
                      <input type="number" value={discountAmount} onChange={(e) => {setDiscountAmount(e.target.value); setDiscountPercent('')}} className="w-full h-[24px] xl:h-[26px] px-1.5 xl:px-2 rounded-[5px] border border-slate-300 text-[10px] xl:text-[11px] font-normal focus:border-[#9575cd] focus:outline-none" placeholder="0" />
                  </div>
              </div>
              <div className="space-y-0.5 md:space-y-1">
                  <label className="text-[10px] xl:text-[11px] font-normal text-slate-500 uppercase tracking-wide block truncate whitespace-nowrap">Authorized By</label>
                  <select value={discountBy} onChange={(e) => setDiscountBy(e.target.value)} className="w-full h-[24px] xl:h-[26px] px-1.5 xl:px-2 rounded-[5px] border border-slate-300 text-[10px] xl:text-[11px] font-normal bg-white focus:border-[#9575cd] focus:outline-none cursor-pointer"><option value="">Select Doctor/Admin</option><option value="Dr. Smith">Dr. Smith</option></select>
              </div>
              <div className="space-y-0.5 md:space-y-1 flex-1 flex flex-col min-h-[40px] md:min-h-[60px]">
                  <label className="text-[10px] xl:text-[11px] font-normal text-slate-500 uppercase tracking-wide block truncate whitespace-nowrap">Reason</label>
                  <textarea value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className="w-full px-1.5 md:px-2 py-0.5 md:py-1.5 rounded md:rounded-[5px] border border-slate-300 text-[12px] font-normal resize-none flex-1 focus:border-[#9575cd] focus:outline-none"></textarea>
              </div>
          </div>

          <div className="w-full md:w-1/3 px-2 pt-1.5 pb-1 md:p-2 xl:p-2.5 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col shrink-0 min-w-0">
              <div className="flex items-center gap-1.5 xl:gap-2 mb-1 md:mb-1.5 bg-slate-50 p-1 md:p-1.5 rounded-md border border-slate-200">
                  <label className="text-[11px] xl:text-[12px] font-normal text-slate-700 cursor-pointer flex items-center gap-1.5 whitespace-nowrap truncate">
                      <input type="checkbox" checked={isDuePayment} onChange={(e) => setIsDuePayment(e.target.checked)} className="w-3.5 h-3.5 md:w-4 md:h-4 rounded text-blue-500 focus:ring-blue-500 border-slate-300" />
                      Keep Due Payment
                  </label>
                  <ShieldAlert size={12} className="text-amber-500 ml-auto md:w-3.5 md:h-3.5" />
              </div>
              
              <h4 className="text-[10px] xl:text-[11px] font-normal text-slate-500 uppercase tracking-wide mb-1 md:mb-1.5">Payment</h4>
              <div className="flex gap-1 xl:gap-1.5 mb-1.5 md:mb-2 items-center w-full">
                
                {/* MOBILE ONLY: Unified Amount Input */}
                <input 
                    type="number" 
                    placeholder="Amt" 
                    value={selectedModes.length > 0 ? (paymentDetails[selectedModes[0]]?.amount || '') : ''} 
                    onChange={(e) => {
                        if (selectedModes.length > 0) {
                            handlePaymentDetailChange(selectedModes[0], 'amount', e.target.value);
                        } else {
                            handleModeToggle('Cash');
                            setTimeout(() => handlePaymentDetailChange('Cash', 'amount', e.target.value), 0);
                        }
                    }}
                    className="md:hidden flex-1 min-w-0 h-[26px] px-2 rounded-[5px] border border-slate-300 text-[11px] focus:outline-none focus:border-blue-400 font-medium bg-white shadow-sm" 
                />

                {['Cash', 'UPI', 'Card'].map(mode => (
                    <label key={mode} className="flex-1 min-w-0 flex items-center justify-center gap-1 cursor-pointer bg-slate-50 px-1 xl:px-1.5 h-[24px] xl:h-[26px] rounded-[5px] border border-slate-200 hover:border-blue-300 transition-colors">
                      <input type="checkbox" checked={selectedModes.includes(mode)} onChange={() => handleModeToggle(mode)} className="w-3 h-3 rounded text-blue-500 border-slate-300 shrink-0" />
                      <span className="text-[11px] xl:text-[12px] font-normal text-slate-700 whitespace-nowrap">{mode}</span>
                    </label>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 md:space-y-2 min-h-0 md:min-h-[80px]">
                  {selectedModes.map(mode => (
                      <div key={mode} className={`gap-1 xl:gap-1.5 items-center ${mode === 'Cash' ? 'hidden md:flex' : 'flex'}`}>
                          <div className="w-9 xl:w-12 text-[11px] xl:text-[12px] font-normal text-slate-600 shrink-0 truncate">{mode}</div>
                          <input type="number" placeholder="Amt" value={paymentDetails[mode]?.amount || ''} onChange={(e) => handlePaymentDetailChange(mode, 'amount', e.target.value)} className="hidden md:block w-12 lg:w-14 xl:w-18 h-[24px] xl:h-[26px] px-1 xl:px-1.5 rounded border border-slate-300 text-[10px] xl:text-[11px] font-normal focus:outline-none focus:border-blue-400 shrink-0" />
                          <input type="text" placeholder="Txn ID" disabled={mode === 'Cash'} value={paymentDetails[mode]?.txnId || ''} onChange={(e) => handlePaymentDetailChange(mode, 'txnId', e.target.value)} className="flex-1 min-w-0 h-[24px] xl:h-[26px] px-1 xl:px-1.5 rounded border border-slate-300 text-[10px] xl:text-[11px] font-normal disabled:bg-slate-100 focus:outline-none focus:border-blue-400" />
                      </div>
                  ))}
                  {isDuePayment && (
                      <div className="flex gap-1.5 md:gap-2 pt-1.5 md:pt-2 border-t border-slate-100 mt-1.5 md:mt-2">
                           <div className="w-9 xl:w-12 pt-0.5 md:pt-1 text-[11px] xl:text-[12px] font-normal text-slate-600 shrink-0 truncate">Advance</div>
                           <input type="number" placeholder="Amt" value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} className="w-12 lg:w-14 xl:w-18 h-[24px] xl:h-[26px] px-1 xl:px-1.5 rounded border border-slate-300 text-[10px] xl:text-[11px] font-normal focus:outline-none focus:border-amber-400 bg-amber-50 shrink-0" />
                      </div>
                  )}
              </div>
          </div>

          <div className="w-full md:w-1/3 bg-slate-50 p-2 md:p-2 xl:p-2.5 flex flex-col justify-between shrink-0 min-w-0">
              <div className="space-y-1 md:space-y-1.5 xl:space-y-2">
                  <div className="flex justify-between items-center"><span className="text-[11px] xl:text-[12px] font-normal text-slate-600 uppercase tracking-wide whitespace-nowrap">Sub Total</span><span className="text-[11px] xl:text-[12px] font-normal text-slate-800 whitespace-nowrap">₹{subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[11px] xl:text-[12px] font-normal text-slate-600 uppercase tracking-wide whitespace-nowrap">Discount</span><span className="text-[11px] xl:text-[12px] font-normal text-emerald-600 whitespace-nowrap">- ₹{finalDiscount.toFixed(2)}</span></div>
                  <div className="h-px bg-slate-200 w-full my-0.5 md:my-1"></div>
                  <div className="flex justify-between items-center"><span className="text-[11px] xl:text-[12px] font-medium text-slate-800 whitespace-nowrap">NET AMOUNT</span><span className="text-sm md:text-base xl:text-lg font-medium text-[#9575cd] whitespace-nowrap">₹{netAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center mt-0.5 md:mt-1"><span className="text-[11px] xl:text-[12px] font-normal text-slate-600 uppercase tracking-wide whitespace-nowrap">DUE AMOUNT</span><span className={`text-[11px] xl:text-[12px] font-normal px-1 xl:px-1.5 py-0.5 rounded border whitespace-nowrap ${dueAmount > 0 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-green-50 text-green-500 border-green-200'}`}>₹{dueAmount.toFixed(2)}</span></div>
              </div>

              <div className="hidden md:flex gap-2 w-full mt-2 xl:mt-3">
                 <button 
                   onClick={handleSaveAndGenerate} 
                   disabled={isSaving} 
                   className="flex-1 py-1.5 xl:py-2 rounded-md text-white font-medium text-[11px] xl:text-[12px] uppercase tracking-wider shadow-sm shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-1.5 whitespace-nowrap" 
                   style={{ background: 'linear-gradient(135deg, #9575cd, #7e57c2)' }}
                 >
                   {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                   {isSaving ? 'Processing...' : 'Generate Bill'}
                 </button>
              </div>
          </div>
       </div>

       <div className="md:hidden sticky bottom-0 p-1.5 bg-white shrink-0 flex justify-between w-full z-40 border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={onPrevStep} className="px-3 py-1 text-slate-600 bg-slate-100 rounded-md font-medium text-[10px] active:scale-95 transition-all flex items-center gap-1 shadow-sm border border-slate-200">
             <ChevronDown className="rotate-[90deg]" size={10} /> Back
          </button>
          
          {mobileView === 'tests' ? (
             <button 
                onClick={onNextStep} 
                disabled={billItems.length === 0}
                className={`px-3 py-1 text-white rounded-md font-medium text-[10px] flex items-center gap-1 shadow-sm ${billItems.length === 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 transition-all shadow-purple-200'}`} 
                style={{ background: billItems.length === 0 ? '#94a3b8' : 'linear-gradient(135deg, #9575cd, #7e57c2)' }}
             >
                Next <ChevronDown className="rotate-[-90deg]" size={10} />
             </button>
          ) : (
             <button onClick={handleSaveAndGenerate} disabled={isSaving} className="px-3 py-1 text-white rounded-md font-medium text-[10px] active:scale-95 transition-all flex items-center gap-1 shadow-sm shadow-purple-200 disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #9575cd, #7e57c2)' }}>
                {isSaving ? <Loader2 size={10} className="animate-spin" /> : <CreditCard size={10} />}
                {isSaving ? 'Processing...' : 'Generate Bill'}
             </button>
          )}
       </div>
    </div>
  );
}