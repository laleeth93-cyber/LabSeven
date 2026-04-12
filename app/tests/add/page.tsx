// --- BLOCK app/tests/add/page.tsx OPEN ---
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, Save, Loader2, CheckCircle, Beaker } from 'lucide-react';
import RichTextEditorModal from '@/app/components/RichTextEditorModal';
import { createTest, generateTestCode, getOutsourceLabs } from '@/app/actions/tests';
import { getDepartments } from '@/app/actions/department';
import { getMasterData } from '@/app/actions/masters'; // 🚨 NEW: Fetch clinical dropdowns
import toast from 'react-hot-toast';

export default function AddTestPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [outsourceLabs, setOutsourceLabs] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [vacutainers, setVacutainers] = useState<any[]>([]);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [formData, setFormData] = useState({
    testType: 'Test', departmentId: '', testName: '', displayTestName: '', gender: 'Both', price: '', code: '',
    methodId: '', specimenId: '', vacutainerId: '', sampleVolume: '', barcodeCopies: '1', // 🚨 ADDED CLINICAL FIELDS
    minDays: '0', minHours: '0', minMinutes: '0', maxDays: '0', maxHours: '0', maxMinutes: '0',
    instructions: '', lmpRequired: false, idRequired: false, consentRequired: false,
    billingOnly: false, isCulture: false, isOutsourced: false, outsourceLabId: '', printNextPage: false
  });

  useEffect(() => {
    async function init() {
        try {
            const [dRes, code, lRes, mRes, sRes, vRes] = await Promise.all([
                getDepartments(), generateTestCode('Test'), getOutsourceLabs(),
                getMasterData('method'), getMasterData('specimen'), getMasterData('vacutainer')
            ]);
            
            if(lRes.success && lRes.data) setOutsourceLabs(lRes.data);
            if(mRes.success && mRes.data) setMethods(mRes.data);
            if(sRes.success && sRes.data) setSpecimens(sRes.data);
            if(vRes.success && vRes.data) setVacutainers(vRes.data);
            
            if(dRes.success && dRes.data) {
                setDepartments(dRes.data);
                if(dRes.data.length > 0) setFormData(prev => ({ ...prev, departmentId: dRes.data![0].id.toString(), code: code }));
                else setFormData(prev => ({ ...prev, code: code }));
            } else {
                 setFormData(prev => ({ ...prev, code: code }));
            }
        } catch(e) { console.error("Init failed", e); }
    }
    init();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        if (field === 'isOutsourced' && value === true) newData.billingOnly = true;
        if (field === 'isOutsourced' && value === false) newData.outsourceLabId = '';
        if (field === 'testType' && value !== 'Test') newData.departmentId = '';
        else if (field === 'testType' && value === 'Test' && !newData.departmentId && departments.length > 0) newData.departmentId = departments[0].id.toString();
        return newData;
    });

    if (field === 'testType') {
        generateTestCode(value).then(newCode => { setFormData(prev => ({ ...prev, code: newCode })); });
    }
  };

  const handleSave = () => {
    if(!formData.testName || !formData.price || !formData.code) {
      toast.error("Please fill in Test Name, Price, and Code."); 
      return;
    }
    startTransition(async () => {
      const res = await createTest(formData);
      if (res.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
            setShowSuccessPopup(false);
            router.push('/tests?tab=Formats'); // 🚨 Jumps straight to formats!
            router.refresh();
        }, 1500);
      } else {
        toast.error("Error: " + res.message);
      }
    });
  };

  const labelClass = "text-[11px] font-bold text-slate-500 uppercase h-4 flex items-center mb-1";
  const inputClass = "w-full text-xs font-medium border border-slate-300 rounded px-3 h-[38px] bg-white focus:ring-1 focus:ring-[#9575cd] outline-none transition-all placeholder:text-slate-400";

  return (
    <>
      <div className="flex flex-col w-full h-full bg-[#f8fafc] p-6 font-sans text-slate-700">
        <RichTextEditorModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} onSave={(content) => handleChange('instructions', content)} initialContent={formData.instructions} title="Pre-Collection Guidelines" />
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => router.push('/tests?tab=Test Library')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><ArrowLeft size={20} /></button>
             <h1 className="text-xl font-bold text-slate-800">Add New Test</h1>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden w-full flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 font-bold text-slate-700"><ChevronDown size={18} /><span>{formData.testName || 'New Test Definition'}</span></div>
              <button onClick={handleSave} disabled={isPending} className="px-6 py-2 text-xs font-bold text-white bg-[#9575cd] rounded hover:bg-[#7e57c2] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70">
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isPending ? 'Saving...' : 'Save & Format'}
              </button>
          </div>
          <div className="p-8 space-y-8 overflow-y-auto flex-1">
              
              {/* --- Core Details --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                      <label className={labelClass}>Test Type</label>
                      <div className="relative">
                          <select value={formData.testType} onChange={(e) => handleChange('testType', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}><option value="Test">Test</option><option value="Package">Package</option><option value="Other">Other</option></select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                      </div>
                  </div>
                  {formData.testType === 'Test' && (
                      <div className="lg:col-span-1">
                          <label className={labelClass}><span className="text-red-500 mr-0.5">*</span> Department</label>
                          <div className="relative">
                              <select value={formData.departmentId} onChange={(e) => handleChange('departmentId', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                                  {departments.length > 0 ? (departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)) : (<option value="">Loading...</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                          </div>
                      </div>
                  )}
                  <div className={formData.testType === 'Test' ? "lg:col-span-2" : "lg:col-span-3"}>
                      <label className={labelClass}><span className="text-red-500 mr-0.5">*</span> {formData.testType === 'Package' ? 'Package Name' : 'Test Name'}</label>
                      <input type="text" value={formData.testName} onChange={(e) => handleChange('testName', e.target.value)} placeholder={`Official Name (e.g. ${formData.testType === 'Package' ? 'Master Health Checkup' : 'CBC'})`} className={inputClass} />
                  </div>
                  <div className="lg:col-span-2">
                      <label className={labelClass}>Display Name</label>
                      <input type="text" value={formData.displayTestName} onChange={(e) => handleChange('displayTestName', e.target.value)} placeholder="Report/Display Name (Optional)" className={inputClass} />
                  </div>
                  <div className="lg:col-span-1">
                      <label className={labelClass}><span className="text-red-500 mr-0.5">*</span> Code</label>
                      <input type="text" value={formData.code} onChange={(e) => handleChange('code', e.target.value)} className={inputClass} />
                  </div>
                  <div className="lg:col-span-1">
                      <label className={labelClass}><span className="text-red-500 mr-0.5">*</span> Price</label>
                      <input type="number" value={formData.price} onChange={(e) => handleChange('price', e.target.value)} placeholder="0.00" className={inputClass} />
                  </div>
              </div>

              {/* 🚨 NEW: Clinical Details & TAT Section (Replaces Configuration Tab) */}
              {formData.testType === 'Test' && (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-6 border-t border-slate-100">
                      <div className="md:col-span-5 mb-[-10px]">
                          <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                              <Beaker size={14} className="text-[#9575cd]"/> Clinical & Turnaround Time
                          </h3>
                      </div>
                      
                      <div className="lg:col-span-1">
                          <label className={labelClass}>Method</label>
                          <select value={formData.methodId} onChange={(e) => handleChange('methodId', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                              <option value="">-- None --</option>
                              {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>
                      <div className="lg:col-span-1">
                          <label className={labelClass}>Specimen</label>
                          <select value={formData.specimenId} onChange={(e) => handleChange('specimenId', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                              <option value="">-- None --</option>
                              {specimens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                      </div>
                      <div className="lg:col-span-1">
                          <label className={labelClass}>Container</label>
                          <select value={formData.vacutainerId} onChange={(e) => handleChange('vacutainerId', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                              <option value="">-- None --</option>
                              {vacutainers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                      </div>
                      <div className="lg:col-span-1">
                          <label className={labelClass}>Sample Volume</label>
                          <input type="text" value={formData.sampleVolume} onChange={(e) => handleChange('sampleVolume', e.target.value)} placeholder="e.g. 2 ml" className={inputClass} />
                      </div>
                      <div className="lg:col-span-1">
                          <label className={labelClass}>Barcode Copies</label>
                          <input type="number" min="0" value={formData.barcodeCopies} onChange={(e) => handleChange('barcodeCopies', e.target.value)} className={inputClass} />
                      </div>

                      {/* Turnaround Time Row */}
                      <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                         <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                             <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">Report Available (Min)</label>
                             <div className="flex gap-2">
                                 <div className="flex-1"><input type="number" value={formData.minDays} onChange={(e) => handleChange('minDays', e.target.value)} className={inputClass} /><span className="text-[9px] text-center block mt-1 text-slate-500 font-bold uppercase">Days</span></div>
                                 <div className="flex-1"><input type="number" value={formData.minHours} onChange={(e) => handleChange('minHours', e.target.value)} className={inputClass} /><span className="text-[9px] text-center block mt-1 text-slate-500 font-bold uppercase">Hrs</span></div>
                                 <div className="flex-1"><input type="number" value={formData.minMinutes} onChange={(e) => handleChange('minMinutes', e.target.value)} className={inputClass} /><span className="text-[9px] text-center block mt-1 text-slate-500 font-bold uppercase">Mins</span></div>
                             </div>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                             <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 flex items-center gap-1.5">Deadline (Max)</label>
                             <div className="flex gap-2">
                                 <div className="flex-1"><input type="number" value={formData.maxDays} onChange={(e) => handleChange('maxDays', e.target.value)} className={inputClass} /><span className="text-[9px] text-center block mt-1 text-slate-500 font-bold uppercase">Days</span></div>
                                 <div className="flex-1"><input type="number" value={formData.maxHours} onChange={(e) => handleChange('maxHours', e.target.value)} className={inputClass} /><span className="text-[9px] text-center block mt-1 text-slate-500 font-bold uppercase">Hrs</span></div>
                                 <div className="flex-1"><input type="number" value={formData.maxMinutes} onChange={(e) => handleChange('maxMinutes', e.target.value)} className={inputClass} /><span className="text-[9px] text-center block mt-1 text-slate-500 font-bold uppercase">Mins</span></div>
                             </div>
                         </div>
                      </div>
                  </div>
              )}

              {/* --- Flags & Guidelines --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div>
                      <label className={labelClass}>Configuration Flags</label>
                      <div className="flex flex-col gap-2 mt-2">
                          <Checkbox label="Is Culture & Susceptibility Test" checked={formData.isCulture} onChange={(v) => handleChange('isCulture', v)} color="#ef4444" />
                          <div className="border-t border-slate-100 my-1 pt-1"></div>
                          <Checkbox label="LMP Required" checked={formData.lmpRequired} onChange={(v) => handleChange('lmpRequired', v)} />
                          <Checkbox label="ID Proof Required" checked={formData.idRequired} onChange={(v) => handleChange('idRequired', v)} />
                          <Checkbox label="Consent Form Required" checked={formData.consentRequired} onChange={(v) => handleChange('consentRequired', v)} />
                          <div className="border-t border-slate-100 my-1 pt-1"></div>
                          <Checkbox label="Is Billing Only (No Results)" checked={formData.billingOnly} onChange={(v) => handleChange('billingOnly', v)} />
                          <div className="flex flex-col gap-1">
                              <Checkbox label="Is Outsourced Test" checked={formData.isOutsourced} onChange={(v) => handleChange('isOutsourced', v)} />
                              {formData.isOutsourced && (
                                  <div className="ml-6 mt-1 mb-2">
                                      <select value={formData.outsourceLabId} onChange={(e) => handleChange('outsourceLabId', e.target.value)} className={`${inputClass} !h-8 !text-[11px]`}>
                                          <option value="">-- Select Outsource Lab --</option>
                                          {outsourceLabs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                      </select>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
                  <div>
                      <label className={labelClass}>Guidelines</label>
                      <div className="flex items-center gap-4 mt-2">
                           <button onClick={() => setIsEditorOpen(true)} className="text-xs text-[#9575cd] border border-[#d1c4e9] rounded px-4 py-2 bg-purple-50 hover:bg-purple-100 font-bold transition-colors">{formData.instructions ? 'Edit Guidelines' : '+ Add Guidelines'}</button>
                          {formData.instructions && <span className="text-[10px] text-green-600 font-bold">✓ Configured</span>}
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Created Successfully!</h2>
            <p className="text-slate-500 text-sm mt-1 text-center font-medium">Code: <span className="text-[#4dd0e1] font-mono font-bold ml-1">{formData.code}</span></p>
          </div>
        </div>
      )}
    </>
  );
}

function Checkbox({ label, checked, onChange, color = "#9575cd" }: { label: string, checked: boolean, onChange: (checked: boolean) => void, color?: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 border-slate-300 rounded cursor-pointer" style={{ accentColor: color, color: color }} />
        <span className={`text-xs font-medium transition-colors ${checked ? 'font-bold' : 'text-slate-600'}`} style={{ color: checked ? color : undefined }}>{label}</span>
    </label>
  );
}
// --- BLOCK app/tests/add/page.tsx CLOSE ---