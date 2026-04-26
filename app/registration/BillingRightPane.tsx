"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Hash, ReceiptText, Plus, Search, Loader2, Stethoscope, Trash2, ShieldAlert, CreditCard } from 'lucide-react';
import { searchTests } from '@/app/actions/billing';
import { BillItem } from './NewRegistration';

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
}

export default function BillingRightPane({
  currentBillNumber, billingDate, handleManualDateChange, onQuotationClick, handleOpenNotes,
  billItems, setBillItems, discountPercent, setDiscountPercent, discountAmount, setDiscountAmount,
  discountBy, setDiscountBy, discountReason, setDiscountReason, isDuePayment, setIsDuePayment,
  advancePaid, setAdvancePaid, selectedModes, setSelectedModes, paymentDetails, setPaymentDetails,
  subTotal, finalDiscount, netAmount, dueAmount, handleSaveAndGenerate, isSaving
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
    <div className="w-full h-full flex flex-col bg-white rounded-[10px] md:shadow-xl shadow-slate-200/50 md:border border-slate-200 overflow-y-auto md:overflow-hidden z-20 relative">
       
       {/* --- TOP HEADER --- */}
       <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-30">
          <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 flex items-center gap-1.5 text-slate-800 font-mono font-bold text-xs bg-white px-2 md:px-3 rounded border border-slate-300 shadow-sm">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1 hidden md:inline">INV:</span>
                 <Hash size={12} className="text-[#9575cd] md:hidden"/> 
                 {currentBillNumber}
              </div>
              
              <div className="h-8 flex items-center">
                 <input 
                    type="datetime-local" 
                    value={billingDate.slice(0, 16)} 
                    onChange={(e) => handleManualDateChange(e.target.value + ':00')} 
                    className="h-8 px-2 text-[10px] md:text-[11px] font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] w-[180px] md:w-auto"
                 />
              </div>
          </div>
          
          <div className="flex gap-2">
              <button onClick={onQuotationClick} className="h-8 flex items-center gap-1.5 px-2 md:px-3 rounded text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 font-bold text-[10px] md:text-xs shadow-sm transition-all active:scale-95">
                  <ReceiptText size={14} /> <span className="hidden md:inline">Quotation</span>
              </button>
              <button onClick={handleOpenNotes} className="h-8 flex items-center gap-1.5 px-2 md:px-3 rounded text-[#9575cd] bg-purple-50 border border-purple-200 hover:bg-purple-100 font-bold text-[10px] md:text-xs shadow-sm transition-all active:scale-95">
                  <Plus size={14} /> <span className="hidden md:inline">Note</span>
              </button>
          </div>
       </div>

       {/* --- SEARCH BAR SECTION --- */}
       <div className="p-3 border-b border-slate-200 bg-white shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 overflow-visible">
          <div className="flex items-center gap-3 w-full md:flex-1 max-w-md relative overflow-visible">
             <input 
                ref={searchInputRef}
                type="text" 
                value={testSearchQuery} 
                onChange={(e) => setTestSearchQuery(e.target.value)} 
                onKeyDown={handleSearchKeyDown} // 🚨 FIX: Attached Keyboard Event
                placeholder="Search tests (e.g., CBC)..." 
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#9575cd]/50 focus:border-[#9575cd] transition-all bg-slate-50 focus:bg-white" 
             />
             {isSearchingTests ? <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9575cd] animate-spin" /> : <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
             
             {testSearchResults.length > 0 && (
                 <div ref={searchResultsRef} className="absolute top-[calc(100%+4px)] left-0 w-full md:w-[120%] bg-white border border-slate-200 rounded-lg shadow-2xl max-h-[250px] overflow-y-auto z-[9999]">
                    {testSearchResults.map((test, index) => {
                       const isFocused = focusedTestIndex === index;
                       return (
                           <div 
                              key={test.id} 
                              onClick={() => handleAddTest(test)} 
                              onMouseEnter={() => setFocusedTestIndex(index)} // Sync mouse hover with keyboard focus
                              className={`px-4 py-2.5 border-b border-slate-50 cursor-pointer flex justify-between items-center group transition-colors ${isFocused ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
                           >
                              <div className="min-w-0 flex-1 pr-2">
                                  <p className={`text-[13px] font-bold truncate ${isFocused ? 'text-[#7e57c2]' : 'text-slate-700 group-hover:text-[#7e57c2]'}`}>
                                      {test.isOutsourced && test.outsourceLab ? `${test.name} (${test.outsourceLab.name})` : test.name}
                                  </p>
                                  <p className={`text-[10px] mt-0.5 truncate ${isFocused ? 'text-[#9575cd]' : 'text-slate-400'}`}>
                                      {test.code} • {test.department?.name || 'General'}
                                  </p>
                              </div>
                              <span className={`text-sm font-black px-2 py-0.5 rounded border transition-colors shrink-0 ${isFocused ? 'bg-white border-purple-200 text-slate-800 shadow-sm' : 'text-slate-800 bg-slate-100 border-slate-200 group-hover:bg-white group-hover:border-purple-200'}`}>
                                  ₹{test.price}
                              </span>
                           </div>
                       );
                    })}
                 </div>
             )}
          </div>
          
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1 w-full md:w-auto overflow-x-auto custom-scrollbar">
             {['Tests/Packages', 'Other Charges'].map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 md:flex-none whitespace-nowrap px-4 py-1.5 rounded-md text-[11px] font-bold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-800 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
             ))}
          </div>
       </div>

       {/* --- TEST LIST TABLE --- */}
       <div className="flex-none md:flex-1 h-[250px] md:h-auto overflow-auto bg-slate-50/30 custom-scrollbar border-b border-slate-200 md:border-none z-10">
          <div className="min-w-[450px] md:min-w-0">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                    <tr>
                    <th className="py-2.5 px-3 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-10 md:w-16">Sr.</th>
                    <th className="py-2.5 px-3 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Test / Package Info</th>
                    <th className="py-2.5 px-3 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-24 md:w-28 text-right">Price</th>
                    <th className="py-2.5 px-2 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-12 md:w-20 text-center">Urg.</th>
                    <th className="py-2.5 px-2 text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-12 md:w-16 text-center">Del</th>
                    </tr>
                </thead>
                <tbody>
                    {billItems.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="h-48 text-center align-middle">
                            <div className="flex flex-col items-center justify-center text-slate-400 opacity-60 px-4">
                            <Stethoscope size={48} className="mb-3 text-slate-300" strokeWidth={1.5} />
                            <span className="text-sm font-bold tracking-wide">No tests added yet</span>
                            <span className="text-xs font-medium mt-1">Search tests above</span>
                            </div>
                        </td>
                    </tr>
                    ) : (
                    billItems.map((item, index) => (
                        <tr key={`${item.id}-${index}`} className="border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 text-xs font-bold text-slate-400">{index + 1}</td>
                            <td className="py-3 px-3">
                            <p className="text-xs md:text-[13px] font-bold text-slate-800 leading-tight">{item.name}</p>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-0.5">{item.code}</p>
                            </td>
                            <td className="py-3 px-3 text-xs md:text-[13px] font-black text-slate-800 text-right">₹{item.price.toFixed(2)}</td>
                            <td className="py-3 px-2 text-center"><input type="checkbox" className="rounded text-[#9575cd] focus:ring-[#9575cd] border-slate-300 w-3.5 h-3.5 md:w-4 md:h-4 cursor-pointer" /></td>
                            <td className="py-3 px-2 text-center">
                            <button onClick={() => handleRemoveTest(index)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))
                    )}
                </tbody>
            </table>
          </div>
       </div>

       {/* --- BOTTOM SECTION --- */}
       <div className="bg-white shrink-0 flex flex-col md:flex-row w-full md:border-t border-slate-200">
          
          <div className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col gap-3 shrink-0">
              <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Discount (%)</label>
                      <input type="number" value={discountPercent} onChange={(e) => {setDiscountPercent(e.target.value); setDiscountAmount('')}} className="w-full px-2 py-1.5 rounded-[5px] border border-slate-300 text-xs focus:border-[#9575cd] focus:outline-none" placeholder="0" />
                  </div>
                  <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Discount (₹)</label>
                      <input type="number" value={discountAmount} onChange={(e) => {setDiscountAmount(e.target.value); setDiscountPercent('')}} className="w-full px-2 py-1.5 rounded-[5px] border border-slate-300 text-xs focus:border-[#9575cd] focus:outline-none" placeholder="0" />
                  </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Authorized By</label>
                  <select value={discountBy} onChange={(e) => setDiscountBy(e.target.value)} className="w-full px-2 py-1.5 rounded-[5px] border border-slate-300 text-xs bg-white focus:border-[#9575cd] focus:outline-none"><option value="">Select Doctor/Admin</option><option value="Dr. Smith">Dr. Smith</option></select>
              </div>
              <div className="space-y-1 flex-1 flex flex-col min-h-[60px]">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reason</label>
                  <textarea value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className="w-full px-2 py-1.5 rounded-[5px] border border-slate-300 text-[11px] resize-none flex-1 focus:border-[#9575cd] focus:outline-none"></textarea>
              </div>
          </div>

          <div className="w-full md:w-1/3 p-4 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col shrink-0">
              <div className="flex items-center gap-3 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                      <input type="checkbox" checked={isDuePayment} onChange={(e) => setIsDuePayment(e.target.checked)} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-slate-300" />
                      Keep Due Payment
                  </label>
                  <ShieldAlert size={14} className="text-amber-500 ml-auto" />
              </div>
              
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Modes</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {['Cash', 'UPI', 'Card'].map(mode => (
                    <label key={mode} className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2 py-1 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                      <input type="checkbox" checked={selectedModes.includes(mode)} onChange={() => handleModeToggle(mode)} className="w-3.5 h-3.5 rounded text-blue-500 border-slate-300" />
                      <span className="text-[11px] font-bold text-slate-700">{mode}</span>
                    </label>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 min-h-[80px]">
                  {selectedModes.map(mode => (
                      <div key={mode} className="flex gap-2">
                          <div className="w-12 md:w-16 pt-1.5 text-[11px] font-bold text-slate-600">{mode}</div>
                          <input type="number" placeholder="Amt" value={paymentDetails[mode]?.amount} onChange={(e) => handlePaymentDetailChange(mode, 'amount', e.target.value)} className="w-16 md:w-20 px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-blue-400 font-medium" />
                          <input type="text" placeholder="Txn ID" disabled={mode === 'Cash'} value={paymentDetails[mode]?.txnId} onChange={(e) => handlePaymentDetailChange(mode, 'txnId', e.target.value)} className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-300 text-[11px] disabled:bg-slate-100 focus:outline-none focus:border-blue-400 font-medium" />
                      </div>
                  ))}
                  {isDuePayment && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                           <div className="w-12 md:w-16 pt-1.5 text-[11px] font-bold text-slate-600">Advance</div>
                           <input type="number" placeholder="Amt" value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} className="w-16 md:w-20 px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-amber-400 font-medium bg-amber-50" />
                      </div>
                  )}
              </div>
          </div>

          <div className="w-full md:w-1/3 bg-slate-50 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Sub Total</span><span className="text-sm font-bold text-slate-700">₹{subTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Discount</span><span className="text-sm font-bold text-emerald-600">- ₹{finalDiscount.toFixed(2)}</span></div>
                  <div className="h-px bg-slate-200 w-full my-1"></div>
                  <div className="flex justify-between items-center"><span className="text-xs font-black text-slate-800">NET AMOUNT</span><span className="text-xl font-black text-[#9575cd]">₹{netAmount.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center mt-2"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">DUE AMOUNT</span><span className={`text-sm font-black px-2 py-0.5 rounded border ${dueAmount > 0 ? 'bg-red-50 text-red-500 border-red-200' : 'bg-green-50 text-green-500 border-green-200'}`}>₹{dueAmount.toFixed(2)}</span></div>
              </div>

              <button 
                onClick={handleSaveAndGenerate} 
                disabled={isSaving} 
                className="w-full mt-4 md:mt-0 py-3 rounded-lg text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2" 
                style={{ background: 'linear-gradient(135deg, #9575cd, #7e57c2)' }}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {isSaving ? 'Processing...' : 'Save & Generate'}
              </button>
          </div>
       </div>
    </div>
  );
}