"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, User, TestTube, Search, Tag, Calculator, Loader2, Printer, Trash2 } from 'lucide-react';
import { searchTests } from '@/app/actions/billing';
import { getLabProfile } from '@/app/actions/lab-profile'; // 🚨 FIX: Import lab profile fetcher
import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// --- PDF STYLES ---
const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#334155', backgroundColor: '#ffffff' },
  
  // 🚨 FIX: Added header styles for the Lab Profile
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#1e293b', paddingBottom: 15, marginBottom: 15 },
  brandColumn: { flexDirection: 'row', alignItems: 'center', width: '60%' },
  brandName: { fontSize: 20, fontWeight: 'black', textTransform: 'uppercase', color: '#0f172a', lineHeight: 1 },
  brandSub: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', letterSpacing: 1, marginTop: 4 },
  contactColumn: { width: '40%', alignItems: 'flex-end' },
  addressLine: { fontSize: 8, color: '#64748b', marginBottom: 2, textAlign: 'right' },
  
  docTitleBox: { backgroundColor: '#f8fafc', padding: 8, marginBottom: 20, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  docTitle: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase', letterSpacing: 2 },
  
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  col: { width: '45%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 9, color: '#64748b', fontWeight: 'bold' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#334155', textAlign: 'right' },
  table: { width: '100%', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e293b', padding: 8, color: '#ffffff', fontWeight: 'bold', fontSize: 9, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tCol1: { width: '10%' },
  tCol2: { width: '65%' },
  tCol3: { width: '25%', textAlign: 'right' },
  totalsContainer: { alignSelf: 'flex-end', width: '50%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#cbd5e1' },
  notesBox: { marginTop: 20, padding: 10, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

// --- PDF DOCUMENT COMPONENT ---
const QuotationDocument = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      
      {/* 🚨 FIX: Dynamic Lab Header */}
      <View style={pdfStyles.headerContainer}>
        <View style={pdfStyles.brandColumn}>
            {data.labProfile?.logoUrl && (
                <Image src={data.labProfile.logoUrl} style={{ width: 40, height: 40, marginRight: 12 }} />
            )}
            <View style={{ flexDirection: 'column' }}>
                <Text style={pdfStyles.brandName}>{data.labProfile?.name || 'Diagnostic Laboratory'}</Text>
                <Text style={pdfStyles.brandSub}>{data.labProfile?.tagline || 'Health & Diagnostics'}</Text>
            </View>
        </View>
        <View style={pdfStyles.contactColumn}>
            {data.labProfile?.address && <Text style={pdfStyles.addressLine}>{data.labProfile.address}</Text>}
            {data.labProfile?.phone && <Text style={pdfStyles.addressLine}>Ph: {data.labProfile.phone}</Text>}
            {data.labProfile?.email && <Text style={pdfStyles.addressLine}>{data.labProfile.email}</Text>}
        </View>
      </View>

      <View style={pdfStyles.docTitleBox}>
         <Text style={pdfStyles.docTitle}>Price Quotation Estimate</Text>
      </View>

      <View style={pdfStyles.grid}>
        <View style={pdfStyles.col}>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Patient Name:</Text><Text style={pdfStyles.value}>{data.patientName || 'N/A'}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Age / Gender:</Text><Text style={pdfStyles.value}>{data.patientAge || '-'} / {data.patientGender !== 'Select' ? data.patientGender : '-'}</Text></View>
        </View>
        <View style={pdfStyles.col}>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Phone:</Text><Text style={pdfStyles.value}>{data.patientPhone || 'N/A'}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Date:</Text><Text style={pdfStyles.value}>{new Date().toLocaleDateString('en-GB')}</Text></View>
        </View>
      </View>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.tCol1}>#</Text>
          <Text style={pdfStyles.tCol2}>Test / Package Description</Text>
          <Text style={pdfStyles.tCol3}>Amount (Rs)</Text>
        </View>
        {data.cartItems.map((item: any, i: number) => (
          <View key={i} style={pdfStyles.tableRow}>
            <Text style={pdfStyles.tCol1}>{i + 1}</Text>
            <Text style={pdfStyles.tCol2}>{item.name}</Text>
            <Text style={pdfStyles.tCol3}>{item.price.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.totalsContainer}>
         <View style={pdfStyles.totalRow}>
             <Text style={pdfStyles.label}>Sub Total:</Text>
             <Text style={pdfStyles.value}>{data.subTotal.toFixed(2)}</Text>
         </View>
         <View style={pdfStyles.totalRow}>
             <Text style={pdfStyles.label}>Discount:</Text>
             <Text style={[pdfStyles.value, { color: '#ef4444' }]}>- {data.finalDiscount.toFixed(2)}</Text>
         </View>
         <View style={pdfStyles.netRow}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>Net Amount:</Text>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>Rs. {data.netAmount.toFixed(2)}</Text>
         </View>
      </View>

      {data.notes && (
         <View style={pdfStyles.notesBox}>
            <Text style={[pdfStyles.label, { marginBottom: 4, textTransform: 'uppercase' }]}>Additional Notes:</Text>
            <Text style={{ fontSize: 9, color: '#334155' }}>{data.notes}</Text>
         </View>
      )}
      
      <Text style={pdfStyles.footer} fixed>
        This document is a generated price estimate and does not serve as a final invoice or receipt. Prices are subject to change.
      </Text>

    </Page>
  </Document>
);

// --- MAIN MODAL COMPONENT ---
interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuotationTestItem {
  id: number;
  name: string;
  code: string;
  price: number;
}

export default function QuotationModal({ isOpen, onClose }: QuotationModalProps) {
  
  const [labProfile, setLabProfile] = useState<any>(null); // 🚨 FIX: State to hold lab profile
  const [patientName, setPatientName] = useState('');
  const [patientGender, setPatientGender] = useState('Select');
  const [patientAge, setPatientAge] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<any[]>([]);
  const [isSearchingTests, setIsSearchingTests] = useState(false);
  const testSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [cartItems, setCartItems] = useState<QuotationTestItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrinting, setIsPrinting] = useState(false); 

  const subTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  
  const finalDiscount = discountPercent 
    ? (subTotal * parseFloat(discountPercent || '0')) / 100 
    : parseFloat(discountAmount || '0');
    
  const netAmount = Math.max(0, subTotal - (isNaN(finalDiscount) ? 0 : finalDiscount));

  useEffect(() => {
    if (!isOpen) return; 
    setCartItems([]);
    setDiscountPercent('');
    setDiscountAmount('');
    setTestSearchQuery('');
    
    // 🚨 FIX: Fetch Lab Profile when modal opens
    getLabProfile().then((res) => {
        if (res.success) setLabProfile(res.data);
    });
  }, [isOpen]);

  useEffect(() => {
    if (testSearchTimeout.current) clearTimeout(testSearchTimeout.current);
    if (testSearchQuery.length >= 2) {
      setIsSearchingTests(true);
      testSearchTimeout.current = setTimeout(async () => {
        const results = await searchTests(testSearchQuery);
        setTestSearchResults(results);
        setIsSearchingTests(false);
      }, 300);
    } else {
      setTestSearchResults([]);
      setIsSearchingTests(false);
    }
  }, [testSearchQuery]);

  const handleAddTest = (test: any) => {
    if (!cartItems.find(item => item.id === test.id)) {
        const displayName = (test.isOutsourced && test.outsourceLab) ? `${test.name} (${test.outsourceLab.name})` : test.name;
        setCartItems([...cartItems, { id: test.id, code: test.code, name: displayName, price: test.price }]);
    }
    setTestSearchQuery(''); 
    setTestSearchResults([]);
  };

  const handleRemoveTest = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  const handlePrint = async () => {
      setIsPrinting(true);
      try {
          // 🚨 FIX: Added labProfile to the data payload passed to the PDF
          const quotationData = {
              patientName, patientGender, patientAge, patientPhone,
              cartItems, subTotal, finalDiscount, netAmount, notes,
              labProfile 
          };

          const blob = await pdf(<QuotationDocument data={quotationData} />).toBlob();
          const url = URL.createObjectURL(blob);
          
          window.open(url, '_blank'); 
      } catch (error) {
          console.error("Error generating Quotation PDF:", error);
          alert("Failed to generate PDF. Please try again.");
      } finally {
          setIsPrinting(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden flex flex-col m-4 max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between border-b border-purple-100 shrink-0"
          style={{ background: 'linear-gradient(to right, #e3f2fd, #f3e5f5)' }}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 bg-purple-100 rounded text-[#9575cd]">
               <Calculator size={16} />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">Quotation</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/40 text-slate-600 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 relative">
          
          {/* Section: Patient Information */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-700">
              <User size={16} className="text-[#4dd0e1]" />
              <h4 className="font-bold text-xs">Patient Information (Optional)</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-slate-500">Patient Name</label>
                <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Name" className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1]" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-slate-500">Gender</label>
                <select value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1] bg-white">
                  <option>Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-slate-500">Age</label>
                <input type="text" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="Age" className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1]" />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-slate-500">Phone</label>
                <input type="text" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="Phone" className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1]" />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          {/* Section: Tests & Packages */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-700">
              <TestTube size={16} className="text-[#4dd0e1]" />
              <h4 className="font-bold text-xs">Add Tests to Quote</h4>
            </div>

            <div className="mb-3 relative">
               <div className="relative w-full">
                 <input 
                    type="text" 
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    placeholder="Search from your test library..." 
                    className="w-full pl-7 pr-2 py-1.5 rounded border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1]" 
                 />
                 {isSearchingTests ? <Loader2 size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" /> : <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />}
               </div>

               {/* Live Search Results Dropdown */}
               {testSearchResults.length > 0 && (
                   <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-[150px] overflow-y-auto z-[300]">
                      {testSearchResults.map((test) => (
                         <div key={test.id} onClick={() => handleAddTest(test)} className="px-3 py-2 border-b border-slate-50 hover:bg-cyan-50 cursor-pointer flex justify-between items-center group">
                            <div className="min-w-0 flex-1 pr-2">
                                <p className="text-[11px] font-bold text-slate-700 truncate">{test.isOutsourced && test.outsourceLab ? `${test.name} (${test.outsourceLab.name})` : test.name}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5 truncate">{test.code}</p>
                            </div>
                            <span className="text-[11px] font-black text-slate-800 shrink-0">₹{test.price}</span>
                         </div>
                      ))}
                   </div>
               )}
            </div>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden mb-2">
              <div className="bg-cyan-50/50 flex text-[10px] font-bold text-slate-600 py-1.5 border-b border-slate-200">
                <div className="w-8 px-1 text-center">#</div>
                <div className="flex-1 px-2">Test / Package</div>
                <div className="w-14 px-1 text-right">Price</div>
                <div className="w-10 px-1 text-center">Act</div>
              </div>
              
              <div className="max-h-[150px] overflow-y-auto">
                  {cartItems.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-[10px] bg-slate-50/20 italic">
                        No tests added
                      </div>
                  ) : (
                      cartItems.map((item, idx) => (
                         <div key={idx} className="flex items-center text-[10px] py-1.5 border-b border-slate-50 last:border-0">
                            <div className="w-8 px-1 text-center text-slate-400 font-bold">{idx + 1}</div>
                            <div className="flex-1 px-2 font-bold text-slate-700 truncate">{item.name}</div>
                            <div className="w-14 px-1 text-right font-bold text-slate-800">₹{item.price}</div>
                            <div className="w-10 px-1 text-center">
                               <button onClick={() => handleRemoveTest(idx)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                            </div>
                         </div>
                      ))
                  )}
              </div>
            </div>
            
            <div className="flex justify-between items-center px-1">
               <span className="text-[11px] font-bold text-slate-600">Total:</span>
               <span className="text-xs font-bold text-slate-800">₹ {subTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          {/* Section: Discount */}
          <div className="grid grid-cols-2 gap-2">
             <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-slate-500">Discount (%)</label>
                <div className="flex">
                   <input type="number" value={discountPercent} onChange={(e) => {setDiscountPercent(e.target.value); setDiscountAmount('');}} placeholder="0" className="w-full px-2 py-1 rounded-l border border-r-0 border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1]" />
                   <div className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-r text-[10px] text-slate-600 font-medium flex items-center">%</div>
                </div>
             </div>
             <div className="space-y-0.5">
                <label className="text-[10px] font-bold text-slate-500">Discount (₹)</label>
                 <div className="flex">
                   <input type="number" value={discountAmount} onChange={(e) => {setDiscountAmount(e.target.value); setDiscountPercent('');}} placeholder="0" className="w-full px-2 py-1 rounded-l border border-r-0 border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1]" />
                   <div className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-r text-[10px] text-slate-600 font-medium flex items-center">₹</div>
                </div>
             </div>
          </div>

          {/* Summary */}
          <div className="bg-cyan-50/50 rounded p-3 space-y-1.5 border border-cyan-100">
             <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-bold text-slate-700">₹ {subTotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Discount:</span>
                <span className="font-bold text-slate-700">₹ {(isNaN(finalDiscount) ? 0 : finalDiscount).toFixed(2)}</span>
             </div>
             <div className="h-px bg-cyan-200/50 my-1"></div>
             <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700">Total Amount:</span>
                <span className="font-bold text-slate-800">₹ {netAmount.toFixed(2)}</span>
             </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-0.5">
             <div className="flex items-center gap-1.5 mb-1">
               <div className="w-1 h-2.5 bg-[#4dd0e1] rounded-full"></div>
               <label className="text-[11px] font-bold text-slate-600">Additional Notes</label>
             </div>
             <textarea 
               rows={2}
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Validity, special instructions..."
               className="w-full px-2 py-1.5 rounded border border-slate-300 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4dd0e1] resize-none"
             ></textarea>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 px-4 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded text-slate-600 border border-slate-300 hover:bg-slate-50 font-bold text-[11px] shadow-sm transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handlePrint}
            disabled={cartItems.length === 0 || isPrinting}
            className="flex items-center gap-1.5 px-5 py-1.5 rounded text-white font-bold text-[11px] shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, #4dd0e1, #64b5f6)' }}
          >
            {isPrinting ? <Loader2 size={12} className="animate-spin" /> : <Printer size={12} />}
            {isPrinting ? 'Generating...' : 'Print Quotation'}
          </button>
        </div>

      </div>
    </div>
  );
}