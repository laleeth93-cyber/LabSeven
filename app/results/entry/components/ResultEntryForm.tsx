"use client";

import React, { useState, useEffect } from 'react';
import { 
    saveTestResults, 
    saveTestNote, 
    checkHistoryAvailability, 
    getParameterHistory, 
    getSignatureUsers, 
    getTestParametersBatch 
} from '@/app/actions/result-entry';
import RichTextEditorModal from '@/app/components/RichTextEditorModal';
import { getFlag, recalculateFormulas } from './ResultEntryUtils';
import HistoryModal from './HistoryModal';
import TestItemCard from './TestItemCard';
import CultureSensitivityModal from './CultureSensitivityModal';
import { Loader2, Printer, Activity, CheckCircle, Save, Unlock } from 'lucide-react';

export default function ResultEntryForm({ bill, onSaveSuccess, filterTestIds = [], entryDateTime, onPrint, onDeltaPrint }: any) {
  const [results, setResults] = useState<any>({});
  const [flags, setFlags] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [signatureUsers, setSignatureUsers] = useState<any[]>([]);
  const [sig1Id, setSig1Id] = useState<string>("");
  const [sig2Id, setSig2Id] = useState<string>("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [activeNoteItem, setActiveNoteItem] = useState<any>(null);
  const [currentNoteContent, setCurrentNoteContent] = useState("");
  const [isResultEditorOpen, setIsResultEditorOpen] = useState(false);
  const [activeResultParam, setActiveResultParam] = useState<{itemId: number, paramId: number, name: string} | null>(null);
  const [currentResultContent, setCurrentResultContent] = useState("");
  const [hasHistory, setHasHistory] = useState<number[]>([]);
  const [historyData, setHistoryData] = useState<any>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryParam, setSelectedHistoryParam] = useState<string>("");
  const [isCultureModalOpen, setIsCultureModalOpen] = useState(false);
  const [activeCultureItem, setActiveCultureItem] = useState<{itemId: number, paramId: number, initialData: any} | null>(null);
  const [loadedParameters, setLoadedParameters] = useState<Record<number, any[]>>({});
  const [isParamsLoading, setIsParamsLoading] = useState(true);

  const safeItems = Array.isArray(bill?.items) ? bill.items : [];
  const visibleItems = safeItems.filter((item: any) => filterTestIds.includes(item?.id));
  const validItems = visibleItems.filter((item: any) => item?.test?.isConfigured);
  const allApproved = validItems.length > 0 && validItems.every((item: any) => item?.status === 'Approved' || item?.status === 'Printed');

  useEffect(() => { 
      getSignatureUsers().then(res => { 
          if (res.success && res.data) setSignatureUsers(res.data); 
      }); 
  }, []);

  useEffect(() => {
    if (bill && visibleItems.length > 0) {
      let isMounted = true;
      setIsParamsLoading(true);
      
      const fetchAllParams = async () => {
          const testIds = Array.from(new Set(visibleItems.map((i: any) => i?.test?.id).filter(Boolean))) as number[];
          const res = await getTestParametersBatch(testIds);
          if (!isMounted) return;
          
          const paramMap: Record<number, any[]> = {};
          if (res.success && res.data) {
              res.data.forEach((test: any) => {
                  paramMap[test.id as number] = test.parameters || [];
              });
          }
          setLoadedParameters(paramMap);
          
          const initialResults: any = {};
          const initialFlags: any = {};
          const allParamIds: number[] = [];
          
          visibleItems.forEach((item: any) => {
            if (!item?.test?.isConfigured) return;
            const testParams = paramMap[item.test.id as number] || [];
            
            testParams.forEach((tp: any) => {
                 if (tp?.parameter && tp.parameter.id) allParamIds.push(tp.parameter.id);
                 if (tp?.isCultureField) allParamIds.push(-999);
            });
            
            if (item.results && item.results.length > 0) {
               item.results.forEach((r: any) => {
                  const keyId = r.parameterId === null ? -999 : r.parameterId;
                  if (keyId !== null && keyId !== undefined) {
                      initialResults[`${item.id}-${keyId}`] = r.resultValue;
                      initialFlags[`${item.id}-${keyId}`] = r.flag;
                  }
               });
            }
          });
          
          setResults(initialResults);
          setFlags(initialFlags);
          checkHistory(bill.patientId, allParamIds.filter(id => id !== -999));
          setIsParamsLoading(false);
      };
      
      fetchAllParams();
      return () => { isMounted = false; };
    }
  }, [bill, filterTestIds]);

  useEffect(() => {
    if (bill && signatureUsers.length > 0) {
        if (bill.approvedBy1Id) setSig1Id(String(bill.approvedBy1Id));
        else {
            const defaultUser = signatureUsers.find(u => u.isDefaultSignature);
            setSig1Id(defaultUser ? String(defaultUser.id) : "");
        }
        setSig2Id(bill.approvedBy2Id ? String(bill.approvedBy2Id) : "");
    }
  }, [bill, signatureUsers]);

  const handleSig1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSig1 = e.target.value; 
      setSig1Id(newSig1);
      if (newSig1 === sig2Id && newSig1 !== "") setSig2Id("");
  };

  const checkHistory = async (patientId: number, paramIds: number[]) => {
    if(paramIds.length === 0) return;
    const res = await checkHistoryAvailability(patientId, paramIds, bill.id);
    if(res.success && res.data) setHasHistory(res.data);
  };

  const handleInputChange = (billItemId: number, parameter: any, value: string, testParameters?: any[], isCulture: boolean = false) => {
    const keyId = isCulture ? -999 : parameter?.id;
    if (keyId === undefined) return;
    
    const key = `${billItemId}-${keyId}`;
    let newResults = { ...results, [key]: value };
    let newFlags = { ...flags, [key]: isCulture ? 'Normal' : getFlag(value, parameter, bill?.patient) };
    
    if (testParameters && !isCulture) {
        const calculated = recalculateFormulas(newResults, newFlags, billItemId, testParameters, bill?.patient);
        if (calculated) {
            newResults = calculated.results;
            newFlags = calculated.flags;
        }
    }
    
    setResults(newResults);
    setFlags(newFlags);
  };

  const handleSaveItem = async (item: any, status: 'Entered' | 'Approved') => {
    if (!item?.test?.id) return;
    setSavingItemId(item.id);
    const dataToSave: any[] = [];
    const testParams = loadedParameters[item.test.id as number] || [];
    
    testParams.forEach((tp: any) => {
        if (tp?.parameter) {
            const key = `${item.id}-${tp.parameter.id}`;
            if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: tp.parameter.id, value: results[key], flag: flags[key] || 'Normal' });
        }
        if (tp?.isCultureField) {
            const key = `${item.id}--999`;
            if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: null, value: results[key], flag: 'Normal' });
        }
    });
    
    const res = await saveTestResults(bill.id, dataToSave, status, sig1Id ? parseInt(sig1Id) : null, sig2Id ? parseInt(sig2Id) : null);
    if (res.success) {
        setSuccessMessage(status === 'Approved' ? "Test Approved Successfully!" : "Test Saved Successfully!");
        setShowSuccessPopup(true); 
        setTimeout(() => { 
            setShowSuccessPopup(false); 
            if (onSaveSuccess) onSaveSuccess(); 
        }, 1500);
    } else {
        alert("Error: " + res.message);
    }
    setSavingItemId(null);
  };

  const handleBulkSubmit = async (status: 'Entered' | 'Approved') => {
    setIsSaving(true);
    const dataToSave: any[] = [];
    
    validItems.forEach((item: any) => {
        if (!item?.test?.id) return;
        const testParams = loadedParameters[item.test.id as number] || [];
        testParams.forEach((tp: any) => {
            if (tp?.parameter) {
                const key = `${item.id}-${tp.parameter.id}`;
                if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: tp.parameter.id, value: results[key], flag: flags[key] || 'Normal' });
            }
            if (tp?.isCultureField) {
                const key = `${item.id}--999`;
                if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: null, value: results[key], flag: 'Normal' });
            }
        });
    });
    
    const res = await saveTestResults(bill.id, dataToSave, status, sig1Id ? parseInt(sig1Id) : null, sig2Id ? parseInt(sig2Id) : null);
    if (res.success) {
        setSuccessMessage(status === 'Approved' ? "All Tests Approved!" : "All Tests Saved!");
        setShowSuccessPopup(true); 
        setTimeout(() => { 
            setShowSuccessPopup(false); 
            if (onSaveSuccess) onSaveSuccess(); 
        }, 1500);
    } else {
        alert("Error: " + res.message);
    }
    setIsSaving(false);
  };

  const handleOpenNote = (item: any) => { 
      setActiveNoteItem(item); 
      setCurrentNoteContent(item.notes || ""); 
      setIsNoteOpen(true); 
  };
  
  const handleSaveNote = async (content: string) => {
    if (!activeNoteItem) return;
    const res = await saveTestNote(activeNoteItem.id, content);
    if (res.success) { 
        setIsNoteOpen(false); 
        setActiveNoteItem(null); 
        if (onSaveSuccess) onSaveSuccess(); 
    }
  };

  const handleOpenResultEditor = (itemId: number, param: any) => {
      if (!param) return;
      setActiveResultParam({ itemId, paramId: param.id, name: param.name });
      setCurrentResultContent(results[`${itemId}-${param.id}`] || "");
      setIsResultEditorOpen(true);
  };

  const handleSaveResultContent = (content: string) => {
      if (activeResultParam) {
          const item = validItems.find((i: any) => i.id === activeResultParam.itemId);
          if (item?.test?.id) {
              const testParams = loadedParameters[item.test.id as number] || [];
              const param = testParams.find((p: any) => p?.parameter && p.parameter.id === activeResultParam.paramId)?.parameter;
              if (param) handleInputChange(activeResultParam.itemId, param, content, testParams);
          }
          setIsResultEditorOpen(false); 
          setActiveResultParam(null);
      }
  };

  const handleViewHistory = async (paramId: number, paramName: string) => {
    setIsHistoryLoading(true); 
    setSelectedHistoryParam(paramName); 
    setShowHistoryModal(true);
    const res = await getParameterHistory(bill.patientId, paramId);
    if(res.success) setHistoryData(res);
    setIsHistoryLoading(false);
  };

  const handleOpenCultureModal = (itemId: number) => {
      const existingDataStr = results[`${itemId}--999`];
      let initialData = null;
      if (existingDataStr) { 
          try { initialData = JSON.parse(existingDataStr); } catch(e) {} 
      }
      setActiveCultureItem({ itemId, paramId: -999, initialData });
      setIsCultureModalOpen(true);
  };

  const handleSaveCultureData = (cultureData: any) => {
      if (activeCultureItem) { 
          handleInputChange(activeCultureItem.itemId, null, JSON.stringify(cultureData), undefined, true); 
      }
      setIsCultureModalOpen(false); 
      setActiveCultureItem(null);
  };

  if (!bill || visibleItems.length === 0) return <div className="p-8 text-center text-slate-400">No tests selected</div>;

  return (
    <div className="flex flex-col h-full relative w-full overflow-hidden">
        
        <RichTextEditorModal isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} onSave={handleSaveNote} initialContent={currentNoteContent} title={`Notes`}/>
        <RichTextEditorModal isOpen={isResultEditorOpen} onClose={() => setIsResultEditorOpen(false)} onSave={handleSaveResultContent} initialContent={currentResultContent} title={`Result Editor`}/>
        <HistoryModal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} paramName={selectedHistoryParam} isLoading={isHistoryLoading} data={historyData} />
        <CultureSensitivityModal isOpen={isCultureModalOpen} onClose={() => setIsCultureModalOpen(false)} onSave={handleSaveCultureData} initialData={activeCultureItem?.initialData} />
        
        <div className="w-full bg-white shrink-0 border-b border-slate-200 shadow-sm relative z-10">
            <div className="w-full px-4 sm:px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="shrink-0 pb-1">
                    <h3 className="text-lg md:text-base font-bold text-slate-800">Result Entry Form</h3>
                    <p className="text-sm md:text-xs text-slate-500">Selected <span className="font-bold text-[#9575cd]">{visibleItems.length}</span> tests</p>
                </div>
                
                {validItems.length > 0 && (
                    <div className="flex items-end gap-2 lg:gap-1.5 xl:gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar shrink-0 flex-nowrap">
                        
                        <div className="flex items-end gap-2 xl:gap-3 shrink-0">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Sig 1</label>
                                <select value={sig1Id} onChange={handleSig1Change} disabled={allApproved} className="cursor-pointer h-10 lg:h-8 xl:h-9 border border-slate-200 rounded-lg text-sm lg:text-xs xl:text-sm font-semibold text-slate-700 px-2 outline-none focus:ring-2 focus:ring-[#9575cd] bg-slate-50 w-32 lg:w-24 xl:w-36 hover:bg-slate-100 transition-colors">
                                    <option value="" className="font-normal text-slate-500">-- None --</option>
                                    {signatureUsers.map(u => <option key={u.id} value={String(u.id)} className="font-medium text-slate-800">{u.signName || u.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Sig 2</label>
                                <select value={sig2Id} onChange={(e) => setSig2Id(e.target.value)} disabled={allApproved} className="cursor-pointer h-10 lg:h-8 xl:h-9 border border-slate-200 rounded-lg text-sm lg:text-xs xl:text-sm font-semibold text-slate-700 px-2 outline-none focus:ring-2 focus:ring-[#9575cd] bg-slate-50 w-32 lg:w-24 xl:w-36 hover:bg-slate-100 transition-colors">
                                    <option value="" className="font-normal text-slate-500">-- None --</option>
                                    {signatureUsers.filter(u => String(u.id) !== sig1Id).map(u => <option key={u.id} value={String(u.id)} className="font-medium text-slate-800">{u.signName || u.name}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div className="h-6 lg:h-5 xl:h-6 w-px bg-slate-200 shrink-0 mb-2 lg:mb-1.5 xl:mb-1.5 rounded-full"></div>
                        
                        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                            <button onClick={onPrint} className="whitespace-nowrap h-10 lg:h-8 xl:h-9 flex items-center justify-center px-3 lg:px-2 xl:px-4 bg-white text-slate-700 hover:text-[#9575cd] border border-slate-200 hover:border-[#9575cd] text-sm lg:text-xs xl:text-sm font-bold rounded-lg gap-1.5 xl:gap-2 transition-colors">
                                <Printer size={16} />
                                Print
                            </button>
                            <button onClick={onDeltaPrint} className="whitespace-nowrap h-10 lg:h-8 xl:h-9 flex items-center justify-center px-3 lg:px-2 xl:px-4 bg-white text-slate-700 hover:text-indigo-500 border border-slate-200 hover:border-indigo-300 text-sm lg:text-xs xl:text-sm font-bold rounded-lg gap-1.5 xl:gap-2 transition-colors">
                                <Activity size={16} />
                                Delta
                            </button>
                        </div>

                        <div className="h-6 lg:h-5 xl:h-6 w-px bg-slate-200 shrink-0 mb-2 lg:mb-1.5 xl:mb-1.5 rounded-full"></div>
                        
                        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                            {allApproved ? (
                                <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="whitespace-nowrap h-10 lg:h-8 xl:h-9 flex items-center justify-center px-4 lg:px-3 xl:px-5 bg-red-50 text-red-600 border border-red-200 text-sm lg:text-xs xl:text-sm font-bold rounded-lg gap-1.5 xl:gap-2 hover:bg-red-100 transition-colors">
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                                    Unlock
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="whitespace-nowrap h-10 lg:h-8 xl:h-9 flex items-center justify-center px-4 lg:px-3 xl:px-5 bg-white text-slate-700 hover:text-[#9575cd] border border-slate-200 hover:border-[#9575cd] text-sm lg:text-xs xl:text-sm font-bold rounded-lg gap-1.5 xl:gap-2 transition-colors">
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save All
                                    </button>
                                    <button onClick={() => handleBulkSubmit('Approved')} disabled={isSaving} className="whitespace-nowrap h-10 lg:h-8 xl:h-9 flex items-center justify-center px-4 lg:px-3 xl:px-5 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm lg:text-xs xl:text-sm font-bold rounded-lg gap-1.5 xl:gap-2 transition-colors shadow-sm">
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                        Approve All
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Main Test Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 custom-scrollbar">
            {isParamsLoading ? (
                <div className="flex items-center justify-center h-40">
                    <Loader2 size={32} className="animate-spin text-[#9575cd]" />
                </div>
            ) : validItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                    <p className="text-sm font-medium">No valid tests to display.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20">
                    {validItems.map((item: any) => (
                        <TestItemCard
                            key={item.id}
                            item={item}
                            testParameters={loadedParameters[item.test.id as number] || []}
                            results={results}
                            flags={flags}
                            handleInputChange={handleInputChange}
                            handleSaveItem={handleSaveItem}
                            handleOpenNote={handleOpenNote}
                            handleOpenResultEditor={handleOpenResultEditor}
                            handleViewHistory={handleViewHistory}
                            handleOpenCultureModal={handleOpenCultureModal}
                            hasHistory={hasHistory}
                            savingItemId={savingItemId}
                            bill={bill}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* --- SUCCESS POPUP OVERLAY --- */}
        {showSuccessPopup && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
                </div>
            </div>
        )}

    </div>
  );
}