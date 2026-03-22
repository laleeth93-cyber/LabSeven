// --- BLOCK app/parameters/edit/[id]/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, List, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, Plus, X, Settings, Activity, Type, Check, Lock, FileText, Trash2, Database, ChevronDown, CheckCircle } from 'lucide-react';
import { getParameter, updateParameter } from '@/app/actions/parameters';
import { getMasterData } from '@/app/actions/masters';
import RichTextEditorModal from '../../../components/RichTextEditorModal';

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

  // --- SUCCESS POPUP STATE ---
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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

  const handleBack = () => { router.push('/tests?tab=Parameters'); };

  const inputClass = "w-full text-xs font-semibold border border-slate-300 rounded px-2 h-[34px] bg-white focus:ring-1 focus:ring-[#9575cd] focus:border-[#9575cd] outline-none transition-all placeholder:text-slate-400";
  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1 block truncate";
  const sectionTitleClass = "text-sm font-bold text-slate-800 uppercase border-b border-slate-100 pb-3 mb-6 flex items-center gap-2";
  const tableInputClass = "w-full h-8 text-xs border border-transparent hover:border-slate-300 focus:border-[#9575cd] focus:bg-white bg-transparent rounded px-1 outline-none text-center font-medium";
  const tableSelectClass = "w-full h-8 text-xs border border-transparent hover:border-slate-300 focus:border-[#9575cd] focus:bg-white bg-transparent rounded px-0 outline-none font-medium cursor-pointer";

  if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-500 gap-2"><Loader2 className="animate-spin"/> Loading Parameter...</div>;

  return (
    <div className="h-screen w-full bg-[#f1f5f9] flex flex-col overflow-hidden font-sans relative">

      <RichTextEditorModal isOpen={editingRangeIndex !== null} onClose={() => setEditingRangeIndex(null)} onSave={handleEditorSave} initialContent={editingRangeIndex !== null ? ranges[editingRangeIndex].normalRange : ''} title="Edit Normal Range Text"/>

      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-[#9575cd] hover:bg-slate-200 transition-colors"><ArrowLeft size={18} /></button>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Edit Parameter</h1>
          </div>
          <button onClick={handleSave} disabled={isPending} className="px-6 py-2 bg-[#9575cd] text-white text-xs font-bold rounded-full shadow-md hover:bg-[#7e57c2] active:scale-95 transition-all flex items-center gap-2">
              {isPending ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} UPDATE PARAMETER
          </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
           <div className="w-full space-y-6">

               {/* CARD 1: DEFINITIONS */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full">
                   <h2 className={sectionTitleClass}><Settings size={18} className="text-[#9575cd]"/> Parameter Definitions</h2>
                   <div className="grid grid-cols-12 gap-6 w-full">
                      
                      <div className="col-span-12 md:col-span-2">
                          <label className={labelClass}>Code</label>
                          <input type="text" disabled className={`${inputClass} bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed`} value={formData.code} />
                      </div>

                      <div className="col-span-12 md:col-span-4"><label className={labelClass}><span className="text-red-500">*</span> Name</label><input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass} placeholder="Name" /></div>
                      <div className="col-span-12 md:col-span-4"><label className={labelClass}>Display Name</label><input type="text" value={formData.displayName} onChange={(e) => handleChange('displayName', e.target.value)} className={inputClass} placeholder="Print Name" /></div>
                      
                      {/* UNITS */}
                      <div className="col-span-12 md:col-span-2">
                          <label className={labelClass}>Units</label>
                          <div className="relative">
                              <select value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}><option value="">Select...</option>{uomList.map(u => (<option key={u.id} value={u.name}>{u.name}</option>))}</select>
                              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                          </div>
                      </div>

                      {/* ROW 2 */}
                      <div className="col-span-12 md:col-span-2">
                          <label className={labelClass}>Method</label>
                          <div className="relative">
                              <select value={formData.method} onChange={(e) => handleChange('method', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}><option value="">Select...</option>{methodsList.map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}</select>
                              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                          </div>
                      </div>

                      <div className="col-span-12 md:col-span-2">
                          <label className={labelClass}>Type</label>
                          <div className="flex items-center gap-1 h-[34px] px-1 border border-slate-200 rounded bg-slate-50/50 w-full">
                              <RadioOption label="Quant" selected={parameterCategory === 'Quantitative'} onClick={() => handleTypeChange('Quantitative')} />
                              <RadioOption label="Qual" selected={parameterCategory === 'Qualitative'} onClick={() => handleTypeChange('Qualitative')} />
                          </div>
                      </div>

                      <div className="col-span-12 md:col-span-3">
                          <label className={labelClass}>Input Format</label>
                          <div className="flex items-center gap-1 h-[34px] px-1 border border-slate-200 rounded bg-slate-50/50 w-full">
                              <RadioOption label="Num" selected={formData.inputType === 'Numerical'} onClick={() => { handleChange('inputType', 'Numerical'); setParameterCategory('Quantitative'); }} />
                              <RadioOption label="Small" selected={formData.inputType === 'Small'} onClick={() => { handleChange('inputType', 'Small'); setParameterCategory('Qualitative'); }} />
                              <RadioOption label="Big" selected={formData.inputType === 'Big'} onClick={() => { handleChange('inputType', 'Big'); setParameterCategory('Qualitative'); }} />
                          </div>
                      </div>

                      <div className="col-span-12 md:col-span-2">
                          <label className={labelClass}>Decimals</label>
                          <div className="relative">
                              <input type="number" min="0" max="5" value={formData.decimals} onChange={(e) => handleChange('decimals', e.target.value)} disabled={formData.inputType !== 'Numerical'} className={`${inputClass} ${formData.inputType !== 'Numerical' ? 'bg-slate-100 text-slate-400' : ''}`} />
                          </div>
                      </div>
                      
                      <div className="col-span-12 md:col-span-3">
                           <label className={labelClass}>Show Result</label>
                           <div className="flex items-center gap-1 h-[34px] px-1 border border-slate-200 rounded bg-slate-50/50 w-full">
                               <RadioOption label="Beside" icon={<AlignHorizontalJustifyCenter size={12}/>} selected={formData.resultAlignment === 'Beside'} onClick={() => handleChange('resultAlignment', 'Beside')} />
                               <RadioOption label="Beneath" icon={<AlignVerticalJustifyCenter size={12}/>} selected={formData.resultAlignment === 'Beneath'} onClick={() => handleChange('resultAlignment', 'Beneath')} />
                           </div>
                      </div>

                      <div className="col-span-12">
                           <label className={labelClass}>Data Constraints</label>
                           <div className="flex flex-col mt-1 p-4 border border-slate-200 rounded bg-slate-50/30 w-full transition-all">
                                <label className="flex items-center gap-2 cursor-pointer group mb-3 w-fit">
                                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.isMultiValue ? 'bg-[#9575cd] border-[#9575cd]' : 'bg-white border-slate-300'}`}>
                                         {formData.isMultiValue && <List size={12} className="text-white" />}
                                     </div>
                                     <input type="checkbox" className="hidden" checked={formData.isMultiValue} onChange={(e) => handleChange('isMultiValue', e.target.checked)} />
                                     <span className="text-xs font-semibold text-slate-600 group-hover:text-[#9575cd]">Enable Dropdown Selection (Multiple Value Set)</span>
                                </label>
                                
                                {formData.isMultiValue && (
                                    <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-white border border-slate-200 rounded-lg w-full md:w-1/2 shadow-sm">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Select Master Set</label>
                                        <div className="relative mb-3">
                                            <select value={selectedMasterId} onChange={handleMasterSetChange} className="w-full text-xs border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#9575cd] bg-slate-50 cursor-pointer appearance-none">
                                                <option value="">-- Choose from Masters --</option>
                                                {multivalueSets.map((set) => <option key={set.id} value={set.id}>{set.name}</option>)}
                                            </select>
                                            <Database size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                        </div>

                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Available Options (Read Only)</label>
                                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-2 bg-slate-50 border border-slate-100 rounded">
                                            {formData.options.length === 0 && <span className="text-[10px] text-slate-400 italic">No set selected or set is empty.</span>}
                                            {formData.options.map((opt, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm">{opt}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                           </div>
                      </div>
                   </div>
               </div>

               {/* CARD 2: RULES SECTION (Tables) */}
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full animate-in fade-in slide-in-from-bottom-2 min-h-[500px]">
                   <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <h2 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                             {parameterCategory === 'Quantitative' ? <><Activity size={18} className="text-[#9575cd]"/> Quantitative Rules (Ranges)</> : <><Type size={18} className="text-[#9575cd]"/> Qualitative Rules (Text)</>}
                        </h2>
                        <div className="flex gap-3">
                            <button onClick={addRangeRow} className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 hover:bg-[#9575cd] hover:text-white px-3 py-1.5 rounded transition-colors"><Plus size={14}/> ADD RULE</button>
                        </div>
                   </div>

                   {parameterCategory === 'Quantitative' && (
                       <div className="overflow-x-auto border border-slate-200 rounded-lg">
                           <table className="w-full min-w-[1400px] border-collapse text-left">
                               <thead className="bg-slate-50 border-b border-slate-200">
                                   <tr>
                                       {['Gender', 'Min Age', 'Max Age', 'Min UOM', 'Max UOM', 'NV Operator', 'Low Range', 'High Range', 'Normal Range', 'CV Operator', 'CV Min', 'CV Max', 'Critical Value', ''].map((h, i) => (
                                           <th key={i} className="px-2 py-2 text-[9px] font-bold text-slate-500 uppercase border-r border-slate-200 last:border-0 whitespace-nowrap">{h}</th>
                                       ))}
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {ranges.map((row, i) => (
                                       <tr key={i} className="hover:bg-slate-50/50 group">
                                           <td className="p-1 border-r"><select value={row.gender} onChange={(e) => handleRangeChange(i, 'gender', e.target.value)} className={tableSelectClass}><option>Both</option><option>Male</option><option>Female</option></select></td>
                                           <td className="p-1 border-r"><input type="number" value={row.minAge} onChange={(e) => handleRangeChange(i, 'minAge', e.target.value)} className={tableInputClass} /></td>
                                           <td className="p-1 border-r"><input type="number" value={row.maxAge} onChange={(e) => handleRangeChange(i, 'maxAge', e.target.value)} className={tableInputClass} /></td>
                                           <td className="p-1 border-r"><select value={row.minAgeUnit} onChange={(e) => handleRangeChange(i, 'minAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                           <td className="p-1 border-r"><select value={row.maxAgeUnit} onChange={(e) => handleRangeChange(i, 'maxAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                           
                                           <td className="p-1 border-r">
                                               <select value={row.normalOperator || ''} onChange={(e) => handleRangeChange(i, 'normalOperator', e.target.value)} className={tableSelectClass}>
                                                   <option value="">Select...</option>
                                                   <option value="Between">Between</option>
                                                   {operators.map(op => <option key={op.id} value={op.symbol || op.name}>{op.symbol || op.name}</option>)}
                                               </select>
                                           </td>
                                           
                                           <td className="p-1 border-r bg-green-50/20"><input type="number" placeholder="Low" value={row.lowRange} onChange={(e) => handleRangeChange(i, 'lowRange', e.target.value)} className={tableInputClass} /></td>
                                           <td className="p-1 border-r bg-green-50/20"><input type="number" placeholder="High" value={row.highRange} onChange={(e) => handleRangeChange(i, 'highRange', e.target.value)} className={tableInputClass} /></td>
                                           <td className="p-1 border-r bg-green-50/20 relative group">
                                               <div className="flex items-center"><input type="text" placeholder="Text" value={row.normalRange} onChange={(e) => handleRangeChange(i, 'normalRange', e.target.value)} className={`${tableInputClass} pr-6`} /><button onClick={() => setEditingRangeIndex(i)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#9575cd] bg-transparent"><FileText size={12}/></button></div>
                                           </td>
                                           
                                           <td className="p-1 border-r">
                                               <select value={row.criticalOperator || ''} onChange={(e) => handleRangeChange(i, 'criticalOperator', e.target.value)} className={tableSelectClass}>
                                                   <option value="">Select...</option>
                                                   <option value="Between">Between</option>
                                                   {operators.map(op => <option key={op.id} value={op.symbol || op.name}>{op.symbol || op.name}</option>)}
                                               </select>
                                           </td>
                                           
                                           <td className="p-1 border-r bg-red-50/20"><input type="number" placeholder="Min" value={row.criticalLow} onChange={(e) => handleRangeChange(i, 'criticalLow', e.target.value)} className={`${tableInputClass} text-red-600`} /></td>
                                           <td className="p-1 border-r bg-red-50/20"><input type="number" placeholder="Max" value={row.criticalHigh} onChange={(e) => handleRangeChange(i, 'criticalHigh', e.target.value)} className={`${tableInputClass} text-red-600`} /></td>
                                           <td className="p-1 border-r bg-red-50/20"><input type="text" placeholder="Text" value={row.criticalValue} onChange={(e) => handleRangeChange(i, 'criticalValue', e.target.value)} className={`${tableInputClass} text-red-600`} /></td>
                                           <td className="p-1 text-center"><button onClick={() => removeRangeRow(i)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button></td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   )}

                   {parameterCategory === 'Qualitative' && (
                       <div className="overflow-visible border border-slate-200 rounded-lg">
                           <table className="w-full min-w-[1000px] border-collapse text-left">
                               <thead className="bg-slate-50 border-b border-slate-200">
                                   <tr>
                                       {['Gender', 'Min Age', 'Max Age', 'Min UOM', 'Max UOM', 'Normal Values (Select)', 'Abnormal Values (Select)', 'Normal Range', 'Critical Value (Select)', ''].map((h, i) => (
                                           <th key={i} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase border-r border-slate-200 last:border-0 whitespace-nowrap">{h}</th>
                                       ))}
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {ranges.map((row, i) => (
                                       <tr key={i} className="hover:bg-slate-50/50 group">
                                           <td className="p-1 border-r"><select value={row.gender} onChange={(e) => handleRangeChange(i, 'gender', e.target.value)} className={tableSelectClass}><option>Both</option><option>Male</option><option>Female</option></select></td>
                                           <td className="p-1 border-r"><input type="number" value={row.minAge} onChange={(e) => handleRangeChange(i, 'minAge', e.target.value)} className={tableInputClass} /></td>
                                           <td className="p-1 border-r"><input type="number" value={row.maxAge} onChange={(e) => handleRangeChange(i, 'maxAge', e.target.value)} className={tableInputClass} /></td>
                                           <td className="p-1 border-r"><select value={row.minAgeUnit} onChange={(e) => handleRangeChange(i, 'minAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                           <td className="p-1 border-r"><select value={row.maxAgeUnit} onChange={(e) => handleRangeChange(i, 'maxAgeUnit', e.target.value)} className={tableSelectClass}><option>Years</option><option>Months</option><option>Days</option></select></td>
                                           
                                           <td className="p-1 border-r bg-green-50/20 min-w-[150px]">
                                              <MultiSelectDropdown options={formData.options.filter(opt => !(row.abnormalValue || []).includes(opt))} selected={row.normalValue || []} onChange={(val) => toggleMultiSelectValue(i, 'normalValue', val)} />
                                           </td>
                                           
                                           <td className="p-1 border-r bg-yellow-50/20 min-w-[150px]">
                                              <MultiSelectDropdown options={formData.options.filter(opt => !(row.normalValue || []).includes(opt))} selected={row.abnormalValue || []} onChange={(val) => toggleMultiSelectValue(i, 'abnormalValue', val)} />
                                           </td>
                                           
                                           <td className="p-1 border-r bg-slate-50/20 relative group">
                                               <div className="flex items-center"><input type="text" placeholder="Range Info" value={row.normalRange} onChange={(e) => handleRangeChange(i, 'normalRange', e.target.value)} className={`${tableInputClass} pr-6`} /><button onClick={() => setEditingRangeIndex(i)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#9575cd] bg-transparent"><FileText size={12}/></button></div>
                                           </td>
                                           
                                           <td className="p-1 border-r bg-red-50/20 min-w-[150px]">
                                              <MultiSelectDropdown options={formData.options} selected={Array.isArray(row.criticalValue) ? row.criticalValue : []} onChange={(val) => toggleMultiSelectValue(i, 'criticalValue', val)} />
                                           </td>
                                           
                                           <td className="p-1 text-center"><button onClick={() => removeRangeRow(i)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button></td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   )}

               </div>

           </div>
      </div>

      {/* --- SUCCESS POPUP OVERLAY --- */}
      {showSuccessPopup && (
        <div className="absolute inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Updated Successfully!</h2>
            <p className="text-slate-500 text-sm mt-1 text-center font-medium">{formData.name}</p>
          </div>
        </div>
      )}

    </div>
  );
}

function RadioOption({ label, selected, onClick, icon }: { label: string, selected: boolean, onClick: () => void, icon?: React.ReactNode }) {
    return (
        <div onClick={onClick} className={`flex-1 flex items-center gap-1.5 cursor-pointer transition-all ${selected ? 'opacity-100 bg-white shadow-sm' : 'opacity-60 hover:opacity-100'} justify-center h-full rounded px-1`}>
            <div className={`w-3 h-3 rounded-full border-[1.5px] flex items-center justify-center ${selected ? 'border-[#9575cd]' : 'border-slate-400'}`}>
                {selected && <div className="w-1.5 h-1.5 rounded-full bg-[#9575cd]"></div>}
            </div>
            {icon && <span className={`${selected ? 'text-[#9575cd]' : 'text-slate-500'}`}>{icon}</span>}
            <span className={`text-[9px] font-bold uppercase ${selected ? 'text-[#9575cd]' : 'text-slate-600'}`}>{label}</span>
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
            <div className="w-full h-8 flex items-center px-2 cursor-pointer border border-transparent hover:border-slate-300 rounded overflow-hidden" onClick={() => setIsOpen(!isOpen)}>
                {selected.length > 0 ? <span className="text-xs truncate text-slate-700 font-medium">{selected.join(', ')}</span> : <span className="text-[10px] text-slate-400 italic">Select...</span>}
            </div>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-1 w-full min-w-[200px] bg-white border border-slate-200 shadow-xl rounded-md z-50 max-h-[250px] overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100 origin-bottom-left">
                    {options.length === 0 && <div className="p-2 text-[10px] text-slate-400 text-center">No options defined</div>}
                    {options.map((opt) => (
                        <div key={opt} onClick={() => onChange(opt)} className="flex items-center gap-2 px-2 py-2 hover:bg-slate-50 cursor-pointer rounded-sm border-b border-slate-50 last:border-0">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${selected.includes(opt) ? 'bg-[#9575cd] border-[#9575cd]' : 'border-slate-300 bg-white'}`}>
                                {selected.includes(opt) && <Check size={10} className="text-white"/>}
                            </div>
                            <span className={`text-xs ${selected.includes(opt) ? 'text-[#9575cd] font-bold' : 'text-slate-700'}`}>{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/parameters/edit/[id]/page.tsx CLOSE ---