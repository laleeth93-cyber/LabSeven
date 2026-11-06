// --- BLOCK app/parameters/edit/[id]/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, List, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Plus, Settings, Activity, Type, Check, Lock, FileText, Trash2, Database, ChevronDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { getParameter, updateParameter, deleteParameter } from '@/app/actions/parameters';
import { getMasterData } from '@/app/actions/masters';
import RichTextEditorModal from '../../../components/RichTextEditorModal';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function EditParameterPage() {
  const router = useRouter();
  const params = useParams();
  const paramId = params?.id ? parseInt(Array.isArray(params.id) ? params.id[0] : params.id) : null;

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // --- DYNAMIC DATA ---
  const [operators, setOperators] = useState<any[]>([]);
  const [multivalueSets, setMultivalueSets] = useState<any[]>([]);
  const [uomList, setUomList] = useState<any[]>([]);
  const [methodsList, setMethodsList] = useState<any[]>([]); 

  const [parameterCategory, setParameterCategory] = useState<'Quantitative' | 'Qualitative'>('Quantitative');
  const [editingRangeIndex, setEditingRangeIndex] = useState<number | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState('');

  // --- SUCCESS & DELETE POPUP STATE ---
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    code: '', name: '', displayName: '', unit: '', method: '', inputType: 'Numerical', isMultiValue: false, options: [] as string[],
    resultAlignment: 'Beside', department: 'HEMATOLOGY', price: '', decimals: '2', lowMessage: '', highMessage: '', panicMessage: '', interpretation: '', isActive: true
  });

  const [ranges, setRanges] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
        if (!paramId) return;

        const [opsRes, multiRes, uomRes, methodRes] = await Promise.all([
            getMasterData('operator'), getMasterData('multivalue'), getMasterData('uom'), getMasterData('method')
        ]);
        
        if(opsRes.success) setOperators(opsRes.data);
        if(multiRes.success) setMultivalueSets(multiRes.data);
        if(uomRes.success) setUomList(uomRes.data);
        if(methodRes.success) setMethodsList(methodRes.data);

        const res = await getParameter(paramId);
        
        if (res.success && res.data) {
            const p = res.data;
            setFormData({
                code: p.code || '', name: p.name, displayName: p.displayName || '', unit: p.unit || '', method: p.method || '', inputType: p.inputType || 'Numerical',
                isMultiValue: p.isMultiValue || false, options: p.options || [], resultAlignment: p.resultAlignment || 'Beside', department: p.department || 'HEMATOLOGY',
                price: p.price ? p.price.toString() : '', decimals: p.decimals ? p.decimals.toString() : '2', lowMessage: p.lowMessage || '', highMessage: p.highMessage || '',
                panicMessage: p.panicMessage || '', interpretation: p.interpretation || '', isActive: p.isActive
            });

            if (p.inputType === 'Numerical') setParameterCategory('Quantitative');
            else setParameterCategory('Qualitative');

            if (p.ranges && p.ranges.length > 0) {
                setRanges(p.ranges.map((r: any) => ({
                    ...r,
                    normalOperator: r.normalOperator || '', criticalOperator: r.criticalOperator || '',
                    normalValue: r.normalValue ? r.normalValue.split(',') : [], abnormalValue: r.abnormalValue ? r.abnormalValue.split(',') : [], criticalValue: r.criticalValue ? r.criticalValue.split(',') : [],
                })));
            } else {
                setRanges([{ gender: 'Both', minAge: 0, maxAge: 100, minAgeUnit: 'Years', maxAgeUnit: 'Years', normalOperator: '', lowRange: '', highRange: '', normalValue: [], abnormalValue: [], normalRange: '', criticalOperator: '', criticalLow: '', criticalHigh: '', criticalValue: [] }]);
            }
        }
        setIsLoading(false);
    }
    loadData();
  }, [paramId]);

  const handleChange = (field: string, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };

  const handleTypeChange = (type: 'Quantitative' | 'Qualitative') => {
      setParameterCategory(type);
      if (type === 'Quantitative') handleChange('inputType', 'Numerical');
      else if (formData.inputType === 'Numerical') handleChange('inputType', 'Small');
  };

  const handleMasterSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const setId = e.target.value;
      setSelectedMasterId(setId);
      if (!setId) return setFormData(prev => ({ ...prev, options: [] }));
      const selectedSet = multivalueSets.find(s => s.id.toString() === setId);
      if (selectedSet && selectedSet.values) {
          const opts = selectedSet.values.split(',').map((v: string) => v.trim()).filter((v: string) => v);
          setFormData(prev => ({ ...prev, options: opts }));
      }
  };

  const handleRangeChange = (index: number, field: string, value: any) => {
    const newRanges = [...ranges];
    newRanges[index][field] = value;
    setRanges(newRanges);
  };

  const toggleMultiSelectValue = (rowIndex: number, field: 'normalValue' | 'abnormalValue' | 'criticalValue', value: string) => {
      const currentValues = Array.isArray(ranges[rowIndex][field]) ? ranges[rowIndex][field] : [];
      let newValues = currentValues.includes(value) ? currentValues.filter((v: string) => v !== value) : [...currentValues, value];
      handleRangeChange(rowIndex, field, newValues);
  };

  const handleEditorSave = (content: string) => {
    if (editingRangeIndex !== null) { handleRangeChange(editingRangeIndex, 'normalRange', content); setEditingRangeIndex(null); }
  };

  const addRangeRow = () => {
    setRanges([...ranges, { gender: 'Both', minAge: 0, maxAge: 100, minAgeUnit: 'Years', maxAgeUnit: 'Years', normalOperator: '', lowRange: '', highRange: '', normalValue: [], abnormalValue: [], criticalValue: [], normalRange: '', criticalOperator: '', criticalLow: '', criticalHigh: '' }]);
  };

  const removeRangeRow = (index: number) => {
    if(ranges.length > 1) setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if(!formData.name) return alert("Parameter Name is required.");
    if(!paramId) return alert("Missing ID");

    const processedRanges = ranges.map(r => ({
        ...r,
        normalValue: Array.isArray(r.normalValue) ? r.normalValue.join(',') : r.normalValue,
        abnormalValue: Array.isArray(r.abnormalValue) ? r.abnormalValue.join(',') : r.abnormalValue,
        criticalValue: Array.isArray(r.criticalValue) ? r.criticalValue.join(',') : r.criticalValue,
    }));

    const payload = { ...formData, ranges: processedRanges };
    
    startTransition(async () => {
      const res = await updateParameter(paramId, payload);
      if(res.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
            setShowSuccessPopup(false);
            router.push('/tests?tab=Parameters');
            router.refresh();
        }, 1500);
      } else alert("Error: " + res.message);
    });
  };

  const confirmDelete = () => {
    if (!paramId) return;
    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteParameter(paramId);
      if (res.success) {
        setShowDeleteConfirm(false);
        router.push('/tests?tab=Parameters');
        router.refresh();
      } else {
        alert("Error: " + res.message);
        setIsDeleting(false);
      }
    });
  };

  const handleBack = () => { router.push('/tests?tab=Parameters'); };

  const labelClass = "text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4";
  const inputClass = "w-full text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 h-[26px] xl:h-[28px] bg-white focus:outline-none focus:border-[#9575cd] transition-all placeholder:text-slate-400 text-slate-800";
  const sectionTitleClass = "text-[12px] xl:text-[13px] font-semibold text-slate-800 uppercase border-b border-slate-100 pb-2 mb-3.5 flex items-center gap-1.5";
  const tableInputClass = "w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-200 rounded px-1.5 outline-none bg-white focus:border-[#9575cd] text-center text-slate-800 transition-all";
  const tableSelectClass = "w-full h-[22px] xl:h-[24px] text-[11px] font-normal border border-slate-200 rounded px-1 outline-none cursor-pointer bg-white focus:border-[#9575cd] text-slate-800 transition-all";

  const mLabelClass = "text-[8px] font-bold text-slate-500 uppercase mb-0.5 block tracking-wider";
  const mInputClass = "w-full text-[10px] font-medium border border-slate-200 rounded px-1.5 h-6 bg-white focus:ring-1 focus:ring-[#9575cd] focus:border-[#9575cd] outline-none transition-all placeholder:text-slate-400";

  if (isLoading) return (
      <div className="h-full flex items-center justify-center bg-white">
          <MusicBarLoader text="Loading Parameter..." />
      </div>
  );

  return (
    <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10 font-sans">

      <RichTextEditorModal isOpen={editingRangeIndex !== null} onClose={() => setEditingRangeIndex(null)} onSave={handleEditorSave} initialContent={editingRangeIndex !== null ? ranges[editingRangeIndex].normalRange : ''} title="Edit Normal Range Text"/>

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex flex-col h-full overflow-hidden w-full flex-1 bg-white">
        {/* TOOLBAR / HEADER: 38px / 42px */}
        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 bg-white md:bg-slate-50 border-b border-slate-200 shrink-0 flex items-center justify-between gap-2 z-10 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
            {/* Left: Back & Title & Code */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleBack} 
                className="h-[24px] xl:h-[26px] px-2 rounded-[5px] border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] xl:text-[12px] font-normal flex items-center gap-1 transition-all"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
              <div className="h-4 w-px bg-slate-300 mx-0.5"></div>
              <h1 className="text-[20px] font-semibold text-slate-800 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                Edit Parameter
              </h1>
              <span className="font-mono text-[11px] font-medium text-[#9575cd] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 leading-tight">
                {formData.code}
              </span>
              {formData.name && (
                <span className="text-[11px] font-normal text-slate-500 truncate max-w-[200px]">
                  ({formData.name})
                </span>
              )}
            </div>

            {/* Right: Delete & Update */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] xl:text-[12px] font-normal flex items-center gap-1 transition-all active:scale-95"
              >
                <Trash2 size={12} />
                <span>Delete Parameter</span>
              </button>
              <button 
                onClick={handleSave} 
                disabled={isPending} 
                className="h-[24px] xl:h-[26px] px-3 rounded-[5px] bg-[#9575cd] hover:bg-[#8565bd] text-white text-[11px] xl:text-[12px] font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-60 leading-none"
              >
                {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                <span>{isPending ? 'Updating...' : 'Update Parameter'}</span>
              </button>
            </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-3 md:p-3.5 xl:p-4 custom-scrollbar">
             <div className="w-full space-y-3.5">

                 {/* CARD 1: DEFINITIONS */}
                 <div className="bg-white rounded-[8px] border border-slate-200 p-3.5 xl:p-4 w-full shadow-2xs">
                     <h2 className={sectionTitleClass}><Settings size={15} className="text-[#9575cd]"/> Parameter Definitions</h2>
                     <div className="grid grid-cols-12 gap-3 xl:gap-4 w-full">
                        
                        <div className="col-span-12 md:col-span-2">
                            <label className={labelClass}>Code</label>
                            <input type="text" disabled className={`${inputClass} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed font-mono`} value={formData.code} />
                        </div>

                        <div className="col-span-12 md:col-span-4">
                          <label className={labelClass}><span className="text-red-500 mr-0.5">*</span> Parameter Name</label>
                          <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} placeholder="e.g. Hemoglobin" />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                          <label className={labelClass}>Display Name</label>
                          <input type="text" value={formData.displayName} onChange={(e) => handleChange('displayName', e.target.value)} className={inputClass} placeholder="Report / Print Name" />
                        </div>
                        
                        {/* UNITS */}
                        <div className="col-span-12 md:col-span-2">
                            <label className={labelClass}>Units</label>
                            <div className="relative">
                                <select value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-6`}><option value="">Select...</option>{uomList.map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}</select>
                                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                            </div>
                        </div>

                        {/* ROW 2 */}
                        <div className="col-span-12 md:col-span-2">
                            <label className={labelClass}>Method</label>
                            <div className="relative">
                                <select value={formData.method} onChange={(e) => handleChange('method', e.target.value)} className={`${inputClass} appearance-none cursor-pointer pr-6`}><option value="">Select...</option>{methodsList.map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}</select>
                                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-2">
                            <label className={labelClass}>Type</label>
                            <div className="flex items-center gap-1 h-[26px] xl:h-[28px] px-1 border border-slate-300 rounded-[5px] bg-slate-50/50 w-full">
                                <RadioOption label="Quant" selected={parameterCategory === 'Quantitative'} onClick={() => handleTypeChange('Quantitative')} />
                                <RadioOption label="Qual" selected={parameterCategory === 'Qualitative'} onClick={() => handleTypeChange('Qualitative')} />
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-3">
                            <label className={labelClass}>Input Format</label>
                            <div className="flex items-center gap-1 h-[26px] xl:h-[28px] px-1 border border-slate-300 rounded-[5px] bg-slate-50/50 w-full">
                                <RadioOption label="Num" selected={formData.inputType === 'Numerical'} onClick={() => { handleChange('inputType', 'Numerical'); setParameterCategory('Quantitative'); }} />
                                <RadioOption label="Small" selected={formData.inputType === 'Small'} onClick={() => { handleChange('inputType', 'Small'); setParameterCategory('Qualitative'); }} />
                                <RadioOption label="Big" selected={formData.inputType === 'Big'} onClick={() => { handleChange('inputType', 'Big'); setParameterCategory('Qualitative'); }} />
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-2">
                            <label className={labelClass}>Decimals</label>
                            <div className="relative">
                                <input type="number" min="0" max="5" value={formData.decimals} onChange={(e) => handleChange('decimals', e.target.value)} disabled={formData.inputType !== 'Numerical'} className={`${inputClass} ${formData.inputType !== 'Numerical' ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`} />
                            </div>
                        </div>
                        
                        <div className="col-span-12 md:col-span-3">
                             <label className={labelClass}>Show Result</label>
                             <div className="flex items-center gap-1 h-[26px] xl:h-[28px] px-1 border border-slate-300 rounded-[5px] bg-slate-50/50 w-full">
                                 <RadioOption label="Beside" icon={<AlignHorizontalJustifyCenter size={11}/>} selected={formData.resultAlignment === 'Beside'} onClick={() => handleChange('resultAlignment', 'Beside')} />
                                 <RadioOption label="Beneath" icon={<AlignVerticalJustifyCenter size={11}/>} selected={formData.resultAlignment === 'Beneath'} onClick={() => handleChange('resultAlignment', 'Beneath')} />
                             </div>
                        </div>

                        <div className="col-span-12">
                             <label className={labelClass}>Data Constraints</label>
                             <div className="flex flex-col mt-0.5 p-3 border border-slate-200 rounded-[6px] bg-slate-50/40 w-full transition-all">
                                  <label className="flex items-center gap-2 cursor-pointer group mb-2.5 w-fit">
                                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.isMultiValue ? 'bg-[#9575cd] border-[#9575cd]' : 'bg-white border-slate-300'}`}>
                                           {formData.isMultiValue && <Check size={11} className="text-white" />}
                                       </div>
                                       <input type="checkbox" className="hidden" checked={formData.isMultiValue} onChange={(e) => handleChange('isMultiValue', e.target.checked)} />
                                       <span className="text-[11px] xl:text-[12px] font-medium text-slate-700 group-hover:text-[#9575cd]">Enable Dropdown Selection (Multiple Value Set)</span>
                                  </label>
                                  
                                  {formData.isMultiValue && (
                                      <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-white border border-slate-200 rounded-[6px] w-full md:w-1/2 shadow-sm space-y-2">
                                          <div>
                                            <label className="text-[10px] font-semibold text-slate-600 uppercase mb-1 block">Select Master Set</label>
                                            <div className="relative">
                                                <select value={selectedMasterId} onChange={handleMasterSetChange} className={`${inputClass} bg-slate-50 cursor-pointer appearance-none pr-6`}>
                                                    <option value="">-- Choose from Masters --</option>
                                                    {multivalueSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
                                                </select>
                                                <Database size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                            </div>
                                          </div>

                                          <div>
                                            <label className="text-[10px] font-semibold text-slate-600 uppercase mb-1 block">Available Options (Read Only)</label>
                                            <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-[4px] custom-scrollbar">
                                                {formData.options.length === 0 && <span className="text-[10px] text-slate-400 italic">No set selected or set is empty.</span>}
                                                {formData.options.map((opt, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs">{opt}</span>
                                                ))}
                                            </div>
                                          </div>
                                      </div>
                                  )}
                             </div>
                        </div>
                     </div>
                 </div>

                 {/* CARD 2: RULES SECTION (Tables) */}
                 <div className="bg-white rounded-[8px] border border-slate-200 p-3.5 xl:p-4 w-full shadow-2xs">
                     <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                          <h2 className="text-[12px] xl:text-[13px] font-semibold text-slate-800 uppercase flex items-center gap-1.5">
                               {parameterCategory === 'Quantitative' ? <><Activity size={15} className="text-[#9575cd]"/> Quantitative Rules (Ranges)</> : <><Type size={15} className="text-[#9575cd]"/> Qualitative Rules (Text)</>}
                          </h2>
                          <div className="flex gap-2">
                              <button onClick={addRangeRow} className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1 transition-all shadow-2xs"><Plus size={12}/> ADD RULE</button>
                          </div>
                     </div>

                     {parameterCategory === 'Quantitative' && (
                         <div className="overflow-x-auto border border-slate-200 rounded-[6px] custom-scrollbar">
                             <table className="w-full min-w-[1300px] border-collapse text-left border-spacing-0">
                                 <thead className="bg-[#9575cd] border-b border-[#7e57c2] text-white">
                                     <tr>
                                         {['Gender', 'Min Age', 'Max Age', 'Min UOM', 'Max UOM', 'NV Operator', 'Low Range', 'High Range', 'Normal Range', 'CV Operator', 'CV Min', 'CV Max', 'Critical Value', ''].map((h, i) => (
                                             <th key={i} style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left whitespace-nowrap">{h}</th>
                                         ))}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {ranges.map((row, i) => (
                                         <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24"><select value={row.gender} onChange={(e) => handleRangeChange(i, 'gender', e.target.value)} className={tableSelectClass}><option>Both</option><option>Male</option><option>Female</option></select></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-20"><input type="number" value={row.minAge} onChange={(e) => handleRangeChange(i, 'minAge', e.target.value)} className={tableInputClass} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-20"><input type="number" value={row.maxAge} onChange={(e) => handleRangeChange(i, 'maxAge', e.target.value)} className={tableInputClass} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24"><select value={row.minAgeUnit} onChange={(e) => handleRangeChange(i, 'minAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24"><select value={row.maxAgeUnit} onChange={(e) => handleRangeChange(i, 'maxAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-28">
                                                 <select value={row.normalOperator || ''} onChange={(e) => handleRangeChange(i, 'normalOperator', e.target.value)} className={tableSelectClass}>
                                                     <option value="">Select...</option>
                                                     <option value="Between">Between</option>
                                                     {operators.map(op => <option key={op.id} value={op.symbol || op.name}>{op.symbol || op.name}</option>)}
                                                 </select>
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24 bg-green-50/20"><input type="number" placeholder="Low" value={row.lowRange} onChange={(e) => handleRangeChange(i, 'lowRange', e.target.value)} className={tableInputClass} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24 bg-green-50/20"><input type="number" placeholder="High" value={row.highRange} onChange={(e) => handleRangeChange(i, 'highRange', e.target.value)} className={tableInputClass} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle min-w-[160px] bg-green-50/20 relative">
                                                 <div className="flex items-center gap-1"><input type="text" placeholder="Text" value={row.normalRange} onChange={(e) => handleRangeChange(i, 'normalRange', e.target.value)} className={tableInputClass} /><button onClick={() => setEditingRangeIndex(i)} className="p-1 text-slate-400 hover:text-[#9575cd] bg-transparent shrink-0" title="Open Text Editor"><FileText size={13}/></button></div>
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-28">
                                                 <select value={row.criticalOperator || ''} onChange={(e) => handleRangeChange(i, 'criticalOperator', e.target.value)} className={tableSelectClass}>
                                                     <option value="">Select...</option>
                                                     <option value="Between">Between</option>
                                                     {operators.map(op => <option key={op.id} value={op.symbol || op.name}>{op.symbol || op.name}</option>)}
                                                 </select>
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24 bg-red-50/20"><input type="number" placeholder="Min" value={row.criticalLow} onChange={(e) => handleRangeChange(i, 'criticalLow', e.target.value)} className={`${tableInputClass} text-red-600 font-medium`} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24 bg-red-50/20"><input type="number" placeholder="Max" value={row.criticalHigh} onChange={(e) => handleRangeChange(i, 'criticalHigh', e.target.value)} className={`${tableInputClass} text-red-600 font-medium`} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle min-w-[140px] bg-red-50/20"><input type="text" placeholder="Text" value={row.criticalValue} onChange={(e) => handleRangeChange(i, 'criticalValue', e.target.value)} className={`${tableInputClass} text-red-600 font-medium`} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center w-12">
                                               {ranges.length > 1 && (
                                                 <button onClick={() => removeRangeRow(i)} className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none" title="Remove Rule"><Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2} /></button>
                                               )}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}

                     {parameterCategory === 'Qualitative' && (
                         <div className="overflow-visible border border-slate-200 rounded-[6px]">
                             <table className="w-full min-w-[1000px] border-collapse text-left border-spacing-0">
                                 <thead className="bg-[#9575cd] border-b border-[#7e57c2] text-white">
                                     <tr>
                                         {['Gender', 'Min Age', 'Max Age', 'Min UOM', 'Max UOM', 'Normal Values (Select)', 'Abnormal Values (Select)', 'Normal Range', 'Critical Value (Select)', ''].map((h, i) => (
                                             <th key={i} style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#7e57c2] font-medium text-white text-[11px] uppercase tracking-wider align-middle leading-none text-left whitespace-nowrap">{h}</th>
                                         ))}
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                     {ranges.map((row, i) => (
                                         <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24"><select value={row.gender} onChange={(e) => handleRangeChange(i, 'gender', e.target.value)} className={tableSelectClass}><option>Both</option><option>Male</option><option>Female</option></select></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-20"><input type="number" value={row.minAge} onChange={(e) => handleRangeChange(i, 'minAge', e.target.value)} className={tableInputClass} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-20"><input type="number" value={row.maxAge} onChange={(e) => handleRangeChange(i, 'maxAge', e.target.value)} className={tableInputClass} /></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24"><select value={row.minAgeUnit} onChange={(e) => handleRangeChange(i, 'minAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle w-24"><select value={row.maxAgeUnit} onChange={(e) => handleRangeChange(i, 'maxAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle bg-green-50/20 min-w-[150px]">
                                                <MultiSelectDropdown options={formData.options.filter(opt => !(row.abnormalValue || []).includes(opt))} selected={row.normalValue || []} onChange={(val) => toggleMultiSelectValue(i, 'normalValue', val)} />
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle bg-yellow-50/20 min-w-[150px]">
                                                <MultiSelectDropdown options={formData.options.filter(opt => !(row.normalValue || []).includes(opt))} selected={row.abnormalValue || []} onChange={(val) => toggleMultiSelectValue(i, 'abnormalValue', val)} />
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle bg-slate-50/20 relative min-w-[160px]">
                                                 <div className="flex items-center gap-1"><input type="text" placeholder="Range Info" value={row.normalRange} onChange={(e) => handleRangeChange(i, 'normalRange', e.target.value)} className={tableInputClass} /><button onClick={() => setEditingRangeIndex(i)} className="p-1 text-slate-400 hover:text-[#9575cd] bg-transparent shrink-0" title="Open Text Editor"><FileText size={13}/></button></div>
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle bg-red-50/20 min-w-[150px]">
                                                <MultiSelectDropdown options={formData.options} selected={Array.isArray(row.criticalValue) ? row.criticalValue : []} onChange={(val) => toggleMultiSelectValue(i, 'criticalValue', val)} />
                                             </td>
                                             
                                             <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] align-middle text-center w-12">
                                               {ranges.length > 1 && (
                                                 <button onClick={() => removeRangeRow(i)} className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition-all inline-flex items-center justify-center leading-none" title="Remove Rule"><Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" strokeWidth={2} /></button>
                                               )}
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     )}

                 </div>

             </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden p-0 bg-transparent">
        <div className="w-full h-full bg-white rounded-none border-0 overflow-hidden flex flex-col relative">

          {/* Form Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2.5 pt-2 pb-3 space-y-2.5 custom-scrollbar">

            {/* CARD 1: DEFINITIONS */}
            <div className="bg-slate-50/40 rounded-lg border border-slate-200 p-2.5 space-y-2">
              <h3 className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-1">
                <Settings size={12} className="text-[#9575cd]"/> Parameter Definitions
              </h3>

              {/* Code & Name */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className={mLabelClass}>Code</label>
                  <input 
                    type="text" 
                    disabled 
                    className={`${mInputClass} bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed font-mono`} 
                    value={formData.code} 
                  />
                </div>

                <div className="col-span-2">
                  <label className={mLabelClass}><span className="text-red-500">*</span> Parameter Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                    className={mInputClass} 
                    placeholder="e.g. Hemoglobin" 
                  />
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className={mLabelClass}>Display Name</label>
                <input 
                  type="text" 
                  value={formData.displayName} 
                  onChange={(e) => handleChange('displayName', e.target.value)} 
                  className={mInputClass} 
                  placeholder="Report / Print Name" 
                />
              </div>

              {/* Units & Method */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={mLabelClass}>Units</label>
                  <div className="relative">
                    <select 
                      value={formData.unit} 
                      onChange={(e) => handleChange('unit', e.target.value)} 
                      className={`${mInputClass} appearance-none cursor-pointer pr-4`}
                    >
                      <option value="">Select...</option>
                      {uomList.map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}</select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                </div>

                <div>
                  <label className={mLabelClass}>Method</label>
                  <div className="relative">
                    <select 
                      value={formData.method} 
                      onChange={(e) => handleChange('method', e.target.value)} 
                      className={`${mInputClass} appearance-none cursor-pointer pr-4`}
                    >
                      <option value="">Select...</option>
                      {methodsList.map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                </div>
              </div>

              {/* Type & Decimals */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={mLabelClass}>Type</label>
                  <div className="flex items-center gap-0.5 h-7 p-0.5 border border-slate-200 rounded-md bg-slate-50/70 w-full">
                    <MobileRadioOption label="Quant" selected={parameterCategory === 'Quantitative'} onClick={() => handleTypeChange('Quantitative')} />
                    <MobileRadioOption label="Qual" selected={parameterCategory === 'Qualitative'} onClick={() => handleTypeChange('Qualitative')} />
                  </div>
                </div>

                <div>
                  <label className={mLabelClass}>Decimals</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="5" 
                    value={formData.decimals} 
                    onChange={(e) => handleChange('decimals', e.target.value)} 
                    disabled={formData.inputType !== 'Numerical'} 
                    className={`${mInputClass} !h-7 ${formData.inputType !== 'Numerical' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`} 
                  />
                </div>
              </div>

              {/* Input Format */}
              <div>
                <label className={mLabelClass}>Input Format</label>
                <div className="flex items-center gap-1 h-7 p-0.5 border border-slate-200 rounded-md bg-slate-50/70 w-full">
                  <MobileRadioOption label="Num" selected={formData.inputType === 'Numerical'} onClick={() => { handleChange('inputType', 'Numerical'); setParameterCategory('Quantitative'); }} />
                  <MobileRadioOption label="Small" selected={formData.inputType === 'Small'} onClick={() => { handleChange('inputType', 'Small'); setParameterCategory('Qualitative'); }} />
                  <MobileRadioOption label="Big" selected={formData.inputType === 'Big'} onClick={() => { handleChange('inputType', 'Big'); setParameterCategory('Qualitative'); }} />
                </div>
              </div>

              {/* Show Result */}
              <div>
                <label className={mLabelClass}>Show Result</label>
                <div className="flex items-center gap-1 h-7 p-0.5 border border-slate-200 rounded-md bg-slate-50/70 w-full">
                  <MobileRadioOption label="Beside" icon={<AlignHorizontalJustifyCenter size={11} className="shrink-0"/>} selected={formData.resultAlignment === 'Beside'} onClick={() => handleChange('resultAlignment', 'Beside')} />
                  <MobileRadioOption label="Beneath" icon={<AlignVerticalJustifyCenter size={11} className="shrink-0"/>} selected={formData.resultAlignment === 'Beneath'} onClick={() => handleChange('resultAlignment', 'Beneath')} />
                </div>
              </div>

              {/* Data Constraints */}
              <div className="pt-1 border-t border-slate-100">
                <label className={mLabelClass}>Data Constraints</label>
                <div className="p-2 border border-slate-200 rounded bg-white space-y-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                    <input 
                      type="checkbox" 
                      checked={formData.isMultiValue} 
                      onChange={(e) => handleChange('isMultiValue', e.target.checked)} 
                      className="w-3 h-3 md:w-4 md:h-4 border-slate-300 rounded cursor-pointer shrink-0" 
                      style={{ accentColor: '#9575cd' }} 
                    />
                    <span className={`text-[9.5px] font-semibold transition-colors leading-tight ${formData.isMultiValue ? 'text-[#9575cd]' : 'text-slate-600'}`}>
                      Enable Dropdown Selection (Multiple Value Set)
                    </span>
                  </label>

                  {formData.isMultiValue && (
                    <div className="animate-in fade-in slide-in-from-top-1 p-2 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 shadow-2xs">
                      <div>
                        <label className={mLabelClass}>Select Master Set</label>
                        <div className="relative">
                          <select 
                            value={selectedMasterId} 
                            onChange={handleMasterSetChange} 
                            className={`${mInputClass} appearance-none cursor-pointer pr-5`}
                          >
                            <option value="">-- Choose from Masters --</option>
                            {multivalueSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
                          </select>
                          <Database size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                        </div>
                      </div>

                      <div>
                        <label className={mLabelClass}>Available Options (Read Only)</label>
                        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-1 bg-white border border-slate-200 rounded">
                          {formData.options.length === 0 && <span className="text-[9px] text-slate-400 italic">No set selected or set is empty.</span>}
                          {formData.options.map((opt, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[8.5px] font-medium text-slate-700 shadow-2xs">{opt}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* CARD 2: RULES */}
            <div className="bg-slate-50/40 rounded-lg border border-slate-200 p-2.5 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  {parameterCategory === 'Quantitative' ? <><Activity size={13} className="text-[#9575cd]"/> Quantitative Rules</> : <><Type size={13} className="text-[#9575cd]"/> Qualitative Rules</>}
                </h3>
                <button 
                  type="button"
                  onClick={addRangeRow} 
                  className="h-5 px-2 bg-white border border-slate-200 hover:bg-[#9575cd] hover:text-white text-[9px] font-bold text-slate-700 rounded flex items-center gap-1 transition-colors active:scale-95 shadow-2xs"
                >
                  <Plus size={11}/> ADD RULE
                </button>
              </div>

              {/* Mobile Rule Cards */}
              <div className="space-y-2">
                {ranges.map((row, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-2.5 shadow-2xs space-y-2">
                    {/* Header: Rule number & Remove */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-[#9575cd]/15 text-[#9575cd] flex items-center justify-center text-[9px] font-bold">{i + 1}</span>
                        Rule #{i + 1}
                      </span>
                      {ranges.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeRangeRow(i)} 
                          className="text-red-500 hover:text-red-700 active:scale-90 p-0.5 rounded transition-colors flex items-center gap-0.5 text-[9px] font-semibold"
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      )}
                    </div>

                    {/* Gender & Age Range */}
                    <div className="grid grid-cols-5 gap-1.5">
                      <div className="col-span-2">
                        <label className={mLabelClass}>Gender</label>
                        <div className="relative">
                          <select 
                            value={row.gender} 
                            onChange={(e) => handleRangeChange(i, 'gender', e.target.value)}
                            className={`${mInputClass} appearance-none cursor-pointer pr-4`}
                          >
                            <option>Both</option>
                            <option>Male</option>
                            <option>Female</option>
                          </select>
                          <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="col-span-3">
                        <label className={mLabelClass}>Age Range (Min - Max)</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            value={row.minAge} 
                            onChange={(e) => handleRangeChange(i, 'minAge', e.target.value)} 
                            className={`${mInputClass} w-10 text-center px-1`} 
                            placeholder="0"
                          />
                          <select 
                            value={row.minAgeUnit} 
                            onChange={(e) => handleRangeChange(i, 'minAgeUnit', e.target.value)} 
                            className={`${mInputClass} w-14 text-[8.5px] px-0.5 text-center`}
                          >
                            <option>Years</option>
                            <option>Months</option>
                            <option>Days</option>
                          </select>
                          <span className="text-slate-400 text-[10px]">-</span>
                          <input 
                            type="number" 
                            value={row.maxAge} 
                            onChange={(e) => handleRangeChange(i, 'maxAge', e.target.value)} 
                            className={`${mInputClass} w-10 text-center px-1`} 
                            placeholder="100"
                          />
                          <select 
                            value={row.maxAgeUnit} 
                            onChange={(e) => handleRangeChange(i, 'maxAgeUnit', e.target.value)} 
                            className={`${mInputClass} w-14 text-[8.5px] px-0.5 text-center`}
                          >
                            <option>Years</option>
                            <option>Months</option>
                            <option>Days</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Quantitative Fields */}
                    {parameterCategory === 'Quantitative' ? (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {/* Normal Range Sub-card */}
                        <div className="bg-emerald-50/40 rounded border border-emerald-100 p-2 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">Normal Range (NV)</span>
                            <button 
                              type="button"
                              onClick={() => setEditingRangeIndex(i)} 
                              className="text-[8.5px] font-bold text-[#9575cd] flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-purple-100 active:scale-95 transition-all shadow-2xs"
                            >
                              <FileText size={9} /> Text Editor
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className={mLabelClass}>NV Operator</label>
                              <select 
                                value={row.normalOperator || ''} 
                                onChange={(e) => handleRangeChange(i, 'normalOperator', e.target.value)}
                                className={`${mInputClass} text-[9px] px-1`}
                              >
                                <option value="">Select...</option>
                                <option value="Between">Between</option>
                                {operators.map(op => <option key={op.id} value={op.symbol || op.name}>{op.symbol || op.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={mLabelClass}>Low Range</label>
                              <input 
                                type="number" 
                                placeholder="Low" 
                                value={row.lowRange} 
                                onChange={(e) => handleRangeChange(i, 'lowRange', e.target.value)} 
                                className={mInputClass} 
                              />
                            </div>
                            <div>
                              <label className={mLabelClass}>High Range</label>
                              <input 
                                type="number" 
                                placeholder="High" 
                                value={row.highRange} 
                                onChange={(e) => handleRangeChange(i, 'highRange', e.target.value)} 
                                className={mInputClass} 
                              />
                            </div>
                          </div>

                          <div>
                            <label className={mLabelClass}>Range Display Text</label>
                            <input 
                              type="text" 
                              placeholder="Normal Range Text" 
                              value={row.normalRange} 
                              onChange={(e) => handleRangeChange(i, 'normalRange', e.target.value)} 
                              className={mInputClass} 
                            />
                          </div>
                        </div>

                        {/* Critical Values Sub-card */}
                        <div className="bg-rose-50/40 rounded border border-rose-100 p-2 space-y-1.5">
                          <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wide block">Critical Values (CV)</span>

                          <div className="grid grid-cols-3 gap-1.5">
                            <div>
                              <label className={mLabelClass}>CV Operator</label>
                              <select 
                                value={row.criticalOperator || ''} 
                                onChange={(e) => handleRangeChange(i, 'criticalOperator', e.target.value)}
                                className={`${mInputClass} text-[9px] px-1`}
                              >
                                <option value="">Select...</option>
                                <option value="Between">Between</option>
                                {operators.map(op => <option key={op.id} value={op.symbol || op.name}>{op.symbol || op.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={mLabelClass}>CV Min</label>
                              <input 
                                type="number" 
                                placeholder="Min" 
                                value={row.criticalLow} 
                                onChange={(e) => handleRangeChange(i, 'criticalLow', e.target.value)} 
                                className={`${mInputClass} text-rose-600 font-semibold`} 
                              />
                            </div>
                            <div>
                              <label className={mLabelClass}>CV Max</label>
                              <input 
                                type="number" 
                                placeholder="Max" 
                                value={row.criticalHigh} 
                                onChange={(e) => handleRangeChange(i, 'criticalHigh', e.target.value)} 
                                className={`${mInputClass} text-rose-600 font-semibold`} 
                              />
                            </div>
                          </div>

                          <div>
                            <label className={mLabelClass}>Critical Text</label>
                            <input 
                              type="text" 
                              placeholder="Critical Value Text" 
                              value={row.criticalValue} 
                              onChange={(e) => handleRangeChange(i, 'criticalValue', e.target.value)} 
                              className={`${mInputClass} text-rose-600 font-semibold`} 
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Qualitative Fields */
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="bg-emerald-50/40 rounded border border-emerald-100 p-2 space-y-1">
                          <label className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide block">Normal Values (Select)</label>
                          <MobileMultiSelectDropdown 
                            options={formData.options.filter(opt => !(row.abnormalValue || []).includes(opt))} 
                            selected={row.normalValue || []} 
                            onChange={(val) => toggleMultiSelectValue(i, 'normalValue', val)} 
                          />
                        </div>

                        <div className="bg-amber-50/40 rounded border border-amber-100 p-2 space-y-1">
                          <label className="text-[9px] font-bold text-amber-800 uppercase tracking-wide block">Abnormal Values (Select)</label>
                          <MobileMultiSelectDropdown 
                            options={formData.options.filter(opt => !(row.normalValue || []).includes(opt))} 
                            selected={row.abnormalValue || []} 
                            onChange={(val) => toggleMultiSelectValue(i, 'abnormalValue', val)} 
                          />
                        </div>

                        <div className="bg-slate-50 rounded border border-slate-200 p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className={mLabelClass}>Normal Range / Info</label>
                            <button 
                              type="button"
                              onClick={() => setEditingRangeIndex(i)} 
                              className="text-[8.5px] font-bold text-[#9575cd] flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-purple-100 active:scale-95 transition-all shadow-2xs"
                            >
                              <FileText size={9} /> Text Editor
                            </button>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Range Info" 
                            value={row.normalRange} 
                            onChange={(e) => handleRangeChange(i, 'normalRange', e.target.value)} 
                            className={mInputClass} 
                          />
                        </div>

                        <div className="bg-rose-50/40 rounded border border-rose-100 p-2 space-y-1">
                          <label className="text-[9px] font-bold text-rose-800 uppercase tracking-wide block">Critical Values (Select)</label>
                          <MobileMultiSelectDropdown 
                            options={formData.options} 
                            selected={Array.isArray(row.criticalValue) ? row.criticalValue : []} 
                            onChange={(val) => toggleMultiSelectValue(i, 'criticalValue', val)} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* MOBILE FIXED FOOTER */}
          <div className="shrink-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between border-t border-slate-100 shadow-sm">
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={handleBack} 
                className="h-6 px-2.5 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5"><path d="m15 18-6-6 6-6"/></svg> Back
              </button>
              
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)} 
                className="h-6 px-2 flex items-center justify-center bg-red-50 border border-red-100 text-red-600 font-bold text-[9px] rounded shrink-0 active:scale-95 transition-all hover:bg-red-100 gap-1"
              >
                <Trash2 size={10} /> Delete
              </button>
            </div>
            
            <button 
              type="button"
              onClick={handleSave} 
              disabled={isPending} 
              className="h-6 px-3 bg-[#9575cd] hover:bg-[#7e57c2] text-white font-bold text-[10px] rounded shrink-0 shadow-sm flex items-center gap-1 active:scale-95 transition-all disabled:opacity-70"
            >
              {isPending ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
              <span>{isPending ? 'Saving...' : 'Update Parameter'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 border-[3px] border-red-100">
              <AlertTriangle className="text-red-500" size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Delete Parameter?</h3>
            <p className="text-xs text-slate-500 mb-5 font-normal">Are you sure you want to delete <strong className="text-slate-700">{formData.name}</strong>? This action cannot be undone.</p>
            <div className="flex gap-2.5">
               <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 text-xs font-normal text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors">Cancel</button>
               <button onClick={confirmDelete} disabled={isDeleting || isPending} className="flex-1 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-[5px] shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                 {isDeleting ? <Loader2 size={13} className="animate-spin"/> : <Trash2 size={13}/>} Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS POPUP OVERLAY --- */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-xs w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-[3px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight text-center">Updated Successfully!</h2>
            <p className="text-slate-500 text-xs mt-1 text-center font-normal">{formData.name}</p>
          </div>
        </div>
      )}

    </div>
  );
}

function RadioOption({ label, selected, onClick, icon }: { label: string, selected: boolean, onClick: () => void, icon?: React.ReactNode }) {
    return (
        <div onClick={onClick} className={`flex-1 flex items-center gap-1.5 cursor-pointer transition-all ${selected ? 'opacity-100 bg-white shadow-2xs' : 'opacity-65 hover:opacity-100'} justify-center h-full rounded px-1.5`}>
            <div className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center ${selected ? 'border-[#9575cd]' : 'border-slate-400'}`}>
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#9575cd]"></div>}
            </div>
            {icon && <span className={`${selected ? 'text-[#9575cd]' : 'text-slate-500'}`}>{icon}</span>}
            <span className={`text-[10px] xl:text-[11px] font-medium ${selected ? 'text-[#9575cd]' : 'text-slate-600'}`}>{label}</span>
        </div>
    );
}

function MobileRadioOption({ label, selected, onClick, icon }: { label: string, selected: boolean, onClick: () => void, icon?: React.ReactNode }) {
    return (
        <div 
            onClick={onClick} 
            className={`flex-1 flex items-center justify-center gap-1.5 cursor-pointer transition-all h-full rounded px-2 min-w-0 ${
                selected ? 'opacity-100 bg-white shadow-2xs font-bold text-[#9575cd]' : 'opacity-65 hover:opacity-100 text-slate-600'
            }`}
        >
            <div className={`w-3 h-3 rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-colors ${selected ? 'border-[#9575cd]' : 'border-slate-300'}`}>
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#9575cd]"></div>}
            </div>
            {icon && <span className={`shrink-0 ${selected ? 'text-[#9575cd]' : 'text-slate-500'}`}>{icon}</span>}
            <span className={`text-[9.5px] font-bold uppercase tracking-tight whitespace-nowrap truncate ${selected ? 'text-[#9575cd]' : 'text-slate-600'}`}>
                {label}
            </span>
        </div>
    );
}

function MultiSelectDropdown({ options, selected, onChange }: { options: string[], selected: string[], onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative w-full h-full" ref={wrapperRef}>
            <div className="w-full h-[22px] xl:h-[24px] flex items-center px-1.5 cursor-pointer border border-slate-200 bg-white hover:border-[#9575cd] rounded overflow-hidden" onClick={() => setIsOpen(!isOpen)}>
                {selected.length > 0 ? <span className="text-[11px] truncate text-slate-700 font-normal">{selected.join(', ')}</span> : <span className="text-[10px] text-slate-400 italic">Select...</span>}
            </div>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-full min-w-[200px] bg-white border border-slate-200 shadow-xl rounded-md z-50 max-h-[220px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100 origin-bottom-left custom-scrollbar">
                    {options.length === 0 && <div className="p-2 text-[10px] text-slate-400 text-center">No options defined</div>}
                    {options.map((opt) => (
                        <div key={opt} onClick={() => onChange(opt)} className="flex items-center gap-2 px-2 py-1.5 hover:bg-purple-50/50 cursor-pointer rounded-sm border-b border-slate-50 last:border-0">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selected.includes(opt) ? 'bg-[#9575cd] border-[#9575cd]' : 'border-slate-300 bg-white'}`}>
                                {selected.includes(opt) && <Check size={10} className="text-white"/>}
                            </div>
                            <span className={`text-[11px] ${selected.includes(opt) ? 'text-[#9575cd] font-medium' : 'text-slate-700'}`}>{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function MobileMultiSelectDropdown({ options, selected, onChange }: { options: string[], selected: string[], onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div 
              className="w-full h-6 flex items-center justify-between px-1.5 cursor-pointer border border-slate-200 bg-white rounded overflow-hidden" 
              onClick={() => setIsOpen(!isOpen)}
            >
                {selected.length > 0 ? (
                  <span className="text-[9.5px] truncate text-slate-700 font-semibold">{selected.join(', ')}</span>
                ) : (
                  <span className="text-[9px] text-slate-400 italic">Select values...</span>
                )}
                <ChevronDown size={10} className="text-slate-400 shrink-0 ml-1" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] bg-white border border-slate-200 shadow-xl rounded-md z-[60] max-h-[180px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100 custom-scrollbar">
                    {options.length === 0 && <div className="p-2 text-[9px] text-slate-400 text-center">No options defined</div>}
                    {options.map((opt) => (
                        <div key={opt} onClick={() => onChange(opt)} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-50 cursor-pointer rounded-sm border-b border-slate-50 last:border-0">
                            <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${selected.includes(opt) ? 'bg-[#9575cd] border-[#9575cd]' : 'border-slate-300 bg-white'}`}>
                                {selected.includes(opt) && <Check size={8} className="text-white"/>}
                            </div>
                            <span className={`text-[10px] ${selected.includes(opt) ? 'text-[#9575cd] font-bold' : 'text-slate-700'}`}>{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/parameters/edit/[id]/page.tsx CLOSE ---
