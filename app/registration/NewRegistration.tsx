"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, CheckCircle, Type, X, User, Receipt, WifiOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; 

import { registerPatient, getNextPatientId } from '@/app/actions/patient'; 
import { getReferrals } from '@/app/actions/referral'; 
import { createBill, getNextBillNumber } from '@/app/actions/billing'; 

// Import our new Offline-First tools!
import { localDB } from '@/lib/local-db/db';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

import InvoiceModal from './InvoiceModal';
import RegistrationLeftPane from './RegistrationLeftPane';
import BillingRightPane from './BillingRightPane';

const RichTextEditor = dynamic(() => import('@/app/components/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 flex items-center justify-center text-slate-400"><Loader2 className="animate-spin mr-2" /> Loading Editor...</div>
});

export interface FieldData {
  id: number; label: string; category: string; isVisible: boolean; order: number | null; width: string; required: boolean; placeholder?: string; inputType: 'text' | 'select' | 'date' | 'textarea' | 'file' | 'age' | 'phone' | 'multi-select'; options?: string[];
}
export interface BillItem {
  id: number; code: string; name: string; price: number; type: string; isUrgent: boolean;
}
interface NewRegistrationProps {
  onCustomizeClick: () => void; onQuotationClick: () => void; fields: FieldData[];
}

export default function NewRegistration({ onCustomizeClick, onQuotationClick, fields }: NewRegistrationProps) {
  
  const isOnline = useNetworkStatus();

  // ==========================================
  // MOBILE UI & SHARED STATES
  // ==========================================
  const [activeMobileTab, setActiveMobileTab] = useState<'patient' | 'billing'>('patient');
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [multiSelectValues, setMultiSelectValues] = useState<Record<number, string[]>>({ 29: ['Hard Copy'] });
  const [currentPatientId, setCurrentPatientId] = useState('');
  const [referralsList, setReferralsList] = useState<any[]>([]);

  // ==========================================
  // BILLING SHARED STATES
  // ==========================================
  const [currentBillNumber, setCurrentBillNumber] = useState('');
  const [billingDate, setBillingDate] = useState(''); 
  const [isManualTime, setIsManualTime] = useState(false);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountBy, setDiscountBy] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [isDuePayment, setIsDuePayment] = useState(false);
  const [advancePaid, setAdvancePaid] = useState('');
  const [selectedModes, setSelectedModes] = useState<string[]>(['Cash']);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, { amount: string, txnId: string }>>({
    'Cash': { amount: '0', txnId: '-' }, 'UPI': { amount: '0', txnId: '' }, 'Card': { amount: '0', txnId: '' }
  });
  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false);
  const [notesContent, setNotesContent] = useState('');
  const [tempNotesContent, setTempNotesContent] = useState('');

  // ==========================================
  // GLOBAL WORKFLOW STATES
  // ==========================================
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const getLocalISOString = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 19);
  };

  useEffect(() => {
    const initializeSerialNumbers = async () => {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      
      if (isOnline) {
        // Fetch exact serial numbers from the database
        const nextPatId = await getNextPatientId();
        const nextBillId = await getNextBillNumber();
        
        setCurrentPatientId(nextPatId || `${dateStr}-0001`);
        setCurrentBillNumber(nextBillId || `INV-${dateStr}-0001`);
      } else {
        // Fallback for when the clinic's internet goes down
        setCurrentPatientId(`${dateStr}-OFF-${Math.floor(1000 + Math.random() * 9000)}`);
        setCurrentBillNumber(`INV-${dateStr}-OFF-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    };

    initializeSerialNumbers();
    setBillingDate(getLocalISOString());

    const fetchRefs = async () => {
      try {
          const [docs, labs, hosps, out] = await Promise.all([ getReferrals('Doctor'), getReferrals('Lab'), getReferrals('Hospital'), getReferrals('Outsource') ]);
          let combined: any[] = [];
          if (docs.success) combined.push(...docs.data);
          if (labs.success) combined.push(...labs.data);
          if (hosps.success) combined.push(...hosps.data);
          if (out.success) combined.push(...out.data);
          setReferralsList(combined.filter((r: any) => r.isActive));
      } catch (e) { console.error("Failed to load referrals", e); }
    };
    fetchRefs();
  }, [isOnline]); 

  useEffect(() => {
    if (isManualTime) return;
    const interval = setInterval(() => setBillingDate(getLocalISOString()), 1000);
    return () => clearInterval(interval);
  }, [isManualTime]);

  const handleManualDateChange = (newDate: string) => { setIsManualTime(true); setBillingDate(newDate); };
  const handleOpenNotes = () => { setTempNotesContent(notesContent); setIsNotesEditorOpen(true); };
  const handleSaveNotes = () => { setNotesContent(tempNotesContent); setIsNotesEditorOpen(false); };

  const subTotal = billItems.reduce((sum, item) => sum + item.price, 0);
  const discPerc = parseFloat(discountPercent) || 0;
  const discAmtInput = parseFloat(discountAmount) || 0;
  const finalDiscount = discPerc > 0 ? (subTotal * discPerc / 100) : discAmtInput;
  const netAmount = Math.max(0, subTotal - finalDiscount);
  
  const paidFromModes = selectedModes.reduce((acc, mode) => acc + (parseFloat(paymentDetails[mode]?.amount) || 0), 0);
  const paidAdvance = parseFloat(advancePaid) || 0;
  const totalPaid = Math.max(paidFromModes, paidAdvance); 
  const dueAmount = Math.max(0, netAmount - totalPaid);

  const visibleFields = fields.filter(f => f.isVisible).sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleSaveAndGenerate = async () => {
    const missingFields: string[] = [];
    visibleFields.forEach(field => {
      if (field.required && field.label !== 'Patient ID') {
        const val = formValues[field.id];
        if (field.inputType === 'multi-select') {
           if ((multiSelectValues[field.id] || []).length === 0) missingFields.push(field.label);
        } else if (field.inputType === 'age') {
          if (!val || (!val.Y && !val.M && !val.D)) missingFields.push(field.label);
        } else if (!val || val.toString().trim() === '' || val === 'Select') {
          missingFields.push(field.label);
        }
      }
    });

    if (missingFields.length > 0) {
        setActiveMobileTab('patient');
        return alert(`Please fill required registration fields:\n- ${missingFields.join('\n- ')}`);
    }
    if (billItems.length === 0) {
        setActiveMobileTab('billing');
        return alert("❌ Cannot generate a bill without selecting tests.");
    }

    setIsSaving(true); 

    try {
      const refFields = fields.filter(f => (f.category === 'Referral' && !f.label.toLowerCase().includes('type')) || f.label.toLowerCase().includes('doctor') || f.label.toLowerCase().includes('hospital') || f.label.toLowerCase().includes('lab'));
      let docName = ''; let hospName = ''; let labName = '';

      for (const f of refFields) {
          const val = formValues[f.id];
          if (typeof val === 'string' && val.trim() && val.trim().toLowerCase() !== 'self' && !val.trim().toLowerCase().startsWith('select')) {
              const lowerLabel = f.label.toLowerCase();
              if (lowerLabel.includes('hospital')) hospName = val.trim();
              else if (lowerLabel.includes('lab') || lowerLabel.includes('outsource')) labName = val.trim();
              else docName = val.trim();
          }
      }

      let finalReferralString = '';
      if (!docName && !hospName && !labName) finalReferralString = 'Self'; 
      else {
          if (docName) finalReferralString += docName;
          if (hospName) finalReferralString += (finalReferralString ? ` (${hospName})` : `(${hospName})`);
          if (labName) finalReferralString += (finalReferralString ? ` - ${labName}` : `- ${labName}`);
      }

      let primaryRefName = docName || hospName || labName || 'Self';
      const matchedRef = referralsList.find(r => r.name === primaryRefName);

      const dbPatientData = {
        patientId: currentPatientId, 
        firstName: formValues[3] || '', lastName: formValues[4] || '', gender: formValues[6] || 'Not specified',
        phone: formValues[9] || '', email: formValues[10] || '', address: formValues[11] || '',
        age: formValues[5] || { Y: 0, M: 0, D: 0 }, prefix: formValues[2] || 'Mr.',
        height: formValues[7], weight: formValues[8],
        referralType: matchedRef ? matchedRef.type : (primaryRefName.toLowerCase() !== 'self' ? 'Other' : 'Self'),
        refDoctor: finalReferralString.trim(),
      };

      // 🚨 FIX: Forcefully convert browser local time into an Absolute UTC string to prevent Vercel timezone shifting
      const [datePart, timePart] = billingDate.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
      const safeLocalDate = new Date(year, month - 1, day, hour, minute, second || 0);
      const absoluteUtcDate = safeLocalDate.toISOString();

      const billPayload = {
        billNumber: currentBillNumber, 
        date: absoluteUtcDate, // 🚨 Now properly sends the exact time
        patientId: currentPatientId,
        subTotal, discountPercent: parseFloat(discountPercent) || 0, discountAmount: finalDiscount,
        netAmount, paidAmount: totalPaid, dueAmount, paymentMode: selectedModes[0] || 'Cash',
        discountReason: discountReason, items: billItems.map(item => ({ testId: item.id, price: item.price })),
        referredBy: dbPatientData.refDoctor || 'Self', 
      };

      const fullName = `${dbPatientData.prefix} ${dbPatientData.firstName} ${dbPatientData.lastName}`.trim();
      const ageString = `${dbPatientData.age.Y || 0} Y / ${dbPatientData.gender}`;

      const finalInvoiceData = {
        billId: currentBillNumber, billDate: new Date(billingDate).toLocaleString('en-GB'),
        patientName: fullName, ageGender: ageString, referredBy: dbPatientData.refDoctor || 'Self',
        paymentType: selectedModes.join(', '), items: billItems.map(item => ({ id: item.id, name: item.name, price: item.price })),
        subTotal, discount: finalDiscount, totalAmount: netAmount, paidAmount: totalPaid, balanceDue: dueAmount, note: notesContent
      };

      setInvoiceData(finalInvoiceData);

      if (!isOnline) {
        await localDB.registrations.add({
          id: uuidv4(),
          patientData: dbPatientData,
          billPayload: billPayload,
          invoiceData: finalInvoiceData,
          sync_status: 'pending',
          created_at: new Date().toISOString()
        });

        setShowSuccessPopup(true);
        setTimeout(() => {
            setShowSuccessPopup(false);
            setIsInvoiceOpen(true);
        }, 1500);
        return; 
      }

      const regResult = await registerPatient(dbPatientData);
      if (!regResult.success || !regResult.patient) throw new Error("Patient Registration Failed");

      billPayload.patientId = regResult.patient.patientId; 
      const billResult = await createBill(billPayload);
      if (!billResult.success) throw new Error("Bill Creation Failed");

      setShowSuccessPopup(true);
      setTimeout(() => {
          setShowSuccessPopup(false);
          setIsInvoiceOpen(true);
      }, 1500);

    } catch (error: any) {
      alert(`❌ ${error.message || 'Critical Error: Could not save.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-500 bg-slate-50 md:bg-transparent">
      
      {!isOnline && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 z-50 shadow-sm">
          <WifiOff size={14} className="animate-pulse" /> 
          You are currently offline. Registrations will be saved locally and synced automatically when your connection returns.
        </div>
      )}

      <div className="md:hidden flex px-2 pt-2 bg-white border-b border-slate-200 shrink-0 gap-2 mb-2">
         <button onClick={() => setActiveMobileTab('patient')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeMobileTab === 'patient' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}><User size={16} /> Patient Details</button>
         <button onClick={() => setActiveMobileTab('billing')} className={`flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors ${activeMobileTab === 'billing' ? 'border-[#9575cd] text-[#9575cd]' : 'border-transparent text-slate-500'}`}><Receipt size={16} /> Billing {billItems.length > 0 && (<span className="bg-rose-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1">{billItems.length}</span>)}</button>
      </div>

      <div className="flex flex-1 overflow-hidden p-2 md:p-0 flex-col md:flex-row gap-0 md:gap-4 relative">
          
          <div className={`${activeMobileTab === 'patient' ? 'block w-full h-full' : 'hidden'} md:contents`}>
            <RegistrationLeftPane fields={fields} formValues={formValues} setFormValues={setFormValues} multiSelectValues={multiSelectValues} setMultiSelectValues={setMultiSelectValues} currentPatientId={currentPatientId} setCurrentPatientId={setCurrentPatientId} referralsList={referralsList} onCustomizeClick={onCustomizeClick} />
          </div>
          
          <div className={`${activeMobileTab === 'billing' ? 'block w-full h-full' : 'hidden'} md:contents`}>
            <BillingRightPane currentBillNumber={currentBillNumber} billingDate={billingDate} handleManualDateChange={handleManualDateChange} onQuotationClick={onQuotationClick} handleOpenNotes={handleOpenNotes} billItems={billItems} setBillItems={setBillItems} discountPercent={discountPercent} setDiscountPercent={setDiscountPercent} discountAmount={discountAmount} setDiscountAmount={setDiscountAmount} discountBy={discountBy} setDiscountBy={setDiscountBy} discountReason={discountReason} setDiscountReason={setDiscountReason} isDuePayment={isDuePayment} setIsDuePayment={setIsDuePayment} advancePaid={advancePaid} setAdvancePaid={setAdvancePaid} selectedModes={selectedModes} setSelectedModes={setSelectedModes} paymentDetails={paymentDetails} setPaymentDetails={setPaymentDetails} subTotal={subTotal} finalDiscount={finalDiscount} netAmount={netAmount} dueAmount={dueAmount} handleSaveAndGenerate={handleSaveAndGenerate} isSaving={isSaving} />
          </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100"><CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} /></div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">
              {!isOnline ? "Saved Locally!" : "Registration Complete!"}
            </h2>
            <div className="flex gap-4 mt-3">
               <p className="text-slate-500 text-xs font-medium">ID: <span className="text-[#4dd0e1] font-mono font-bold ml-1">{currentPatientId}</span></p>
               <p className="text-slate-500 text-xs font-medium">INV: <span className="text-[#9575cd] font-mono font-bold ml-1">{currentBillNumber}</span></p>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3"><Loader2 className="animate-spin text-slate-400" size={20} /><p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">Loading Invoice Preview...</p></div>
          </div>
        </div>
      )}

      {isNotesEditorOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white w-full max-w-4xl h-[600px] max-h-[90vh] rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b border-purple-100" style={{ background: 'linear-gradient(to right, #f3e5f5, #e1bee7)' }}>
                <div className="flex items-center gap-2"><div className="p-1.5 bg-white/50 rounded text-[#9575cd]"><Type size={18} /></div><h3 className="font-bold text-slate-800 text-base">Add Bill Note</h3></div>
                <button onClick={() => setIsNotesEditorOpen(false)} className="p-1 rounded-full hover:bg-white/50 text-slate-600 transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 bg-white relative flex flex-col min-h-0"><RichTextEditor value={tempNotesContent} onChange={setTempNotesContent} placeholder="Start typing your note here..." /></div>
              <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsNotesEditorOpen(false)} className="px-6 py-2 rounded text-slate-600 font-bold text-sm bg-white border border-slate-300 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleSaveNotes} className="px-6 py-2 rounded text-white font-bold text-sm shadow-md transition-all active:scale-95" style={{ background: 'linear-gradient(to right, #ba68c8, #f06292)' }}>Save Note</button>
              </div>
            </div>
          </div>
      )}

      <InvoiceModal 
         isOpen={isInvoiceOpen}
         onClose={() => { setIsInvoiceOpen(false); window.location.reload(); }} 
         data={invoiceData}
      />
    </div>
  );
}