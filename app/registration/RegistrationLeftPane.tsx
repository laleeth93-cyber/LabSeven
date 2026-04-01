// --- BLOCK app/components/RegistrationLeftPane.tsx OPEN ---
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Users, SlidersHorizontal, Search, Loader2, ChevronDown, Calendar, Paperclip, X } from 'lucide-react';
import { searchPatients } from '@/app/actions/patient';
import { FieldData } from './NewRegistration';

interface Props {
  fields: FieldData[];
  formValues: Record<string, any>;
  setFormValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  multiSelectValues: Record<number, string[]>;
  setMultiSelectValues: React.Dispatch<React.SetStateAction<Record<number, string[]>>>;
  currentPatientId: string;
  setCurrentPatientId: (id: string) => void;
  referralsList: any[];
  onCustomizeClick: () => void;
}

export default function RegistrationLeftPane({
  fields, formValues, setFormValues, multiSelectValues, setMultiSelectValues,
  currentPatientId, setCurrentPatientId, referralsList, onCustomizeClick
}: Props) {
  
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const patientSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (patientSearchTimeout.current) clearTimeout(patientSearchTimeout.current);
    if (patientSearchQuery.length >= 2) {
      setIsSearchingPatient(true);
      patientSearchTimeout.current = setTimeout(async () => {
        const results = await searchPatients(patientSearchQuery);
        setPatientSearchResults(results);
        setIsSearchingPatient(false);
      }, 300);
    } else {
      setPatientSearchResults([]);
      setIsSearchingPatient(false);
    }
  }, [patientSearchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpenDropdownId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  const handleSelectPatient = (patient: any) => {
    setCurrentPatientId(patient.patientId);
    setFormValues(prev => ({
      ...prev,
      3: patient.firstName, 4: patient.lastName, 6: patient.gender, 9: patient.phone, 10: patient.email, 11: patient.address, 2: patient.designation,
      5: { Y: patient.ageY?.toString() || '', M: patient.ageM?.toString() || '', D: patient.ageD?.toString() || '' }
    }));
    setPatientSearchQuery('');
    setPatientSearchResults([]);
  };

  const handleInputChange = (fieldId: number, value: any) => setFormValues(prev => ({ ...prev, [fieldId]: value }));
  
  const handleAgeChange = (fieldId: number, part: 'Y' | 'M' | 'D', value: string) => {
    setFormValues(prev => {
      const currentAge = prev[fieldId] || { Y: '', M: '', D: '' };
      return { ...prev, [fieldId]: { ...currentAge, [part]: value } };
    });
  };

  const toggleOption = (fieldId: number, option: string) => {
    setMultiSelectValues(prev => {
      const current = prev[fieldId] || [];
      const newValues = current.includes(option) ? current.filter(item => item !== option) : [...current, option];
      handleInputChange(fieldId, newValues);
      return { ...prev, [fieldId]: newValues };
    });
  };

  const removeOption = (e: React.MouseEvent, fieldId: number, option: string) => {
    e.stopPropagation();
    setMultiSelectValues(prev => {
      const newValues = (prev[fieldId] || []).filter(item => item !== option);
      handleInputChange(fieldId, newValues);
      return { ...prev, [fieldId]: newValues };
    });
  };

  const visibleFields = fields.filter(f => f.isVisible).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="w-full md:w-[35%] h-full flex flex-col bg-white rounded-[10px] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden shrink-0 z-10">
      <div className="p-4 pb-3 bg-white border-b border-slate-100 shrink-0">
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-cyan-50 text-[#4dd0e1] shadow-sm"><Users size={16} /></div>
              <h2 className="text-base font-bold text-slate-700 tracking-tight">Registration</h2>
            </div>
            <button onClick={onCustomizeClick} className="flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-slate-600 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold shadow-sm transition-all active:scale-95">
              <SlidersHorizontal size={12} /> Customize
            </button>
         </div>
         
         <div className="relative w-full">
            <input 
              type="text" 
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              placeholder="Search old patient (Name/Phone)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-[5px] border border-cyan-200 text-[12px] bg-slate-50 text-slate-700 focus:bg-white focus:outline-none focus:border-[#4dd0e1] transition-all"
            />
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-500" />
            {isSearchingPatient && <Loader2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-500 animate-spin" />}
            
            {patientSearchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                  {patientSearchResults.map(p => (
                    <div key={p.id} onClick={() => handleSelectPatient(p)} className="px-3 py-2 border-b border-slate-50 hover:bg-cyan-50 cursor-pointer group">
                        <p className="text-[12px] font-bold text-slate-700 group-hover:text-[#00acc1]">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] text-slate-500">{p.patientId} • {p.phone}</p>
                    </div>
                  ))}
              </div>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
         <div className="flex flex-wrap gap-x-3 gap-y-3 items-end pb-8"> 
            {visibleFields.map((field) => {
              const isReferralNameField = field.category === 'Referral' && !field.label.toLowerCase().includes('type');
              let specificReferralList = referralsList;
              if (isReferralNameField) {
                  const lowerLabel = field.label.toLowerCase();
                  if (lowerLabel.includes('hospital')) specificReferralList = referralsList.filter(r => r.type === 'Hospital');
                  else if (lowerLabel.includes('doctor') || lowerLabel.includes('doc')) specificReferralList = referralsList.filter(r => r.type === 'Doctor');
                  else if (lowerLabel.includes('lab') || lowerLabel.includes('outsource')) specificReferralList = referralsList.filter(r => r.type === 'Lab' || r.type === 'Outsource');
              }

              let currentWidth = field.width;
              if (currentWidth.includes('px')) {
                  const pxVal = parseInt(currentWidth);
                  if (pxVal > 200) currentWidth = '100%';
                  else currentWidth = 'calc(50% - 6px)';
              }

              return (
                <div key={field.id} className="flex-none relative" style={{ width: currentWidth }}>
                  <label htmlFor={`field-${field.id}`} className="block text-[10px] font-bold text-slate-600 mb-1 truncate">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>

                  {field.label === 'Patient ID' ? (
                    <div className="py-0.5"><span className="text-sm font-bold text-[#e65100] tracking-wide font-mono bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{currentPatientId}</span></div>
                  ) : (
                    <>
                      {isReferralNameField ? (
                        <div className="relative w-full">
                            <select 
                              id={`field-${field.id}`}
                              value={formValues[field.id] || ''} 
                              onChange={(e) => handleInputChange(field.id, e.target.value)} 
                              className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-slate-700 appearance-none bg-white cursor-pointer"
                            >
                              <option value="">Select</option>
                              {specificReferralList.map(ref => <option key={ref.id} value={ref.name}>{ref.name} {ref.specialization ? `- ${ref.specialization}` : ''}</option>)}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                      ) : (
                        <>
                          {field.inputType === 'text' && (
                            <input id={`field-${field.id}`} type="text" placeholder={field.placeholder} value={formValues[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-slate-700 placeholder:text-slate-300" />
                          )}
                          {field.inputType === 'select' && (
                            <div className="relative w-full">
                              <select id={`field-${field.id}`} value={formValues[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-slate-700 appearance-none bg-white"><option value="">Select</option>{field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}</select>
                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                          )}
                          {field.inputType === 'multi-select' && (
                            <div className="relative w-full" ref={dropdownRef}>
                              <div id={`field-${field.id}`} onClick={() => setOpenDropdownId(openDropdownId === field.id ? null : field.id)} className="w-full px-1 py-1 min-h-[26px] rounded border border-slate-300 bg-white flex items-center flex-wrap gap-1 cursor-pointer focus-within:border-[#4dd0e1]">
                                {(multiSelectValues[field.id] || []).length === 0 && <span className="text-slate-400 text-[10px] px-1">Select...</span>}
                                {(multiSelectValues[field.id] || []).map(tag => (
                                  <div key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-1 rounded border border-slate-200 text-[9px] font-medium"><span>{tag}</span><div onClick={(e) => removeOption(e, field.id, tag)} className="cursor-pointer hover:text-red-500 rounded-full p-0.5"><X size={8} /></div></div>
                                ))}
                              </div>
                              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                              {openDropdownId === field.id && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                                    {field.options?.map((opt: string) => {
                                      const isSelected = (multiSelectValues[field.id] || []).includes(opt);
                                      return (
                                        <div key={opt} onClick={() => toggleOption(field.id, opt)} className={`px-3 py-1.5 text-[11px] cursor-pointer flex items-center justify-between ${isSelected ? 'bg-cyan-50 text-cyan-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                          <span>{opt}</span>{isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#4dd0e1]"></div>}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          )}
                          {field.inputType === 'age' && (
                            <div className="flex gap-1">
                              <input type="text" placeholder="Y" value={formValues[field.id]?.Y || ''} onChange={(e) => handleAgeChange(field.id, 'Y', e.target.value)} className="w-1/3 px-1 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-center" />
                              <input type="text" placeholder="M" value={formValues[field.id]?.M || ''} onChange={(e) => handleAgeChange(field.id, 'M', e.target.value)} className="w-1/3 px-1 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-center" />
                              <input type="text" placeholder="D" value={formValues[field.id]?.D || ''} onChange={(e) => handleAgeChange(field.id, 'D', e.target.value)} className="w-1/3 px-1 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-center" />
                            </div>
                          )}
                          {field.inputType === 'phone' && (
                            <div className="flex w-full">
                              <select className="w-12 px-1 py-1 rounded-l border border-r-0 border-slate-300 text-[10px] bg-slate-50 text-slate-700 focus:outline-none"><option>+91</option></select>
                              <input id={`field-${field.id}`} type="text" placeholder="Number" value={formValues[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="flex-1 w-full px-2 py-1 rounded-r border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-slate-700 min-w-0" />
                            </div>
                          )}
                          {field.inputType === 'textarea' && (
                            <textarea id={`field-${field.id}`} rows={2} placeholder={field.placeholder} value={formValues[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-slate-700 resize-none"></textarea>
                          )}
                          {field.inputType === 'date' && (
                            <div className="relative w-full">
                              <input id={`field-${field.id}`} type="text" placeholder="Select date" defaultValue="24-Jan-2026" onChange={(e) => handleInputChange(field.id, e.target.value)} className="w-full px-2 py-1 rounded border border-slate-300 text-[11px] focus:outline-none focus:border-[#4dd0e1] text-slate-700" />
                              <Calendar size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                          )}
                          {field.inputType === 'file' && (
                            <div className="relative w-full">
                              <input id={`file-upload-${field.id}`} type="file" className="hidden" onChange={(e) => handleInputChange(field.id, e.target.files?.[0]?.name)} />
                              <label htmlFor={`file-upload-${field.id}`} className="w-full flex items-center justify-between px-2 py-1 rounded border border-slate-300 text-[11px] text-slate-700 bg-slate-50 cursor-pointer hover:bg-slate-100 border-dashed overflow-hidden">
                                <span className="truncate">{formValues[field.id] ? formValues[field.id] : 'Choose file'}</span>
                                <Paperclip size={12} className="text-[#4dd0e1] shrink-0 ml-1" />
                              </label>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
         </div>
      </div>
    </div>
  );
}
// --- BLOCK app/components/RegistrationLeftPane.tsx CLOSE ---