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
 
import { getMessageStationSettings } from '@/app/actions/message-station';
import dynamic from 'next/dynamic';
 
const PatientReportModal = dynamic(() => import('@/app/list/components/PatientReportModal'), { ssr: false });

import RichTextEditorModal from '@/app/components/RichTextEditorModal';
import HistoryModal from './HistoryModal';
import TestItemCard from './TestItemCard';
import CultureSensitivityModal from './CultureSensitivityModal';

import { getFlag, recalculateFormulas } from './ResultEntryUtils';
import { Loader2, Printer, Activity, CheckCircle, Save, Unlock, AlertCircle } from 'lucide-react';

export default function ResultEntryForm({ bill, onSaveSuccess, filterTestIds = [], entryDateTime, onPrint, onDeltaPrint, onBackToList }: any) {

  const [results, setResults] = useState<any>({});
  const [flags, setFlags] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savingItemId, setSavingItemId] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [signatureUsers, setSignatureUsers] = useState<any[]>([]);
  const [sig1Id, setSig1Id] = useState<string>("");
  const [sig2Id, setSig2Id] = useState<string>("");
  const [isSignPopupOpen, setIsSignPopupOpen] = useState(false);

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

  const [reportSettings, setReportSettings] = useState({ whatsappReportAuto: false, whatsappReportManual: true });
  const [waAutoSendBillId, setWaAutoSendBillId] = useState<number | null>(null);

  useEffect(() => {
    getMessageStationSettings().then(res => {
        if (res.success && res.data) setReportSettings({
            whatsappReportAuto: res.data.whatsappReportAuto ?? false,
            whatsappReportManual: res.data.whatsappReportManual ?? true
        });
    });
  }, []);

  const safeItems = Array.isArray(bill?.items) ? bill.items : [];
  const visibleItems = safeItems.filter((item: any) => filterTestIds.includes(item?.id));
  
  const validItems = visibleItems.filter((item: any) => item?.test?.isConfigured !== false);
  const allApproved = validItems.length > 0 && validItems.every((item: any) => item?.status === 'Approved' || item?.status === 'Printed');
  const hasApproved = validItems.some((item: any) => item?.status === 'Approved' || item?.status === 'Printed');

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
            if (item?.test?.isConfigured === false) return;
            
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
    
    const isUnapproving = (item.status === 'Approved' || item.status === 'Printed') && status === 'Entered';
    const res = await saveTestResults(bill.id, dataToSave, status, sig1Id ? parseInt(sig1Id) : null, sig2Id ? parseInt(sig2Id) : null, [item.id]);
    
    if (res.success) {
        setSuccessMessage(isUnapproving ? "Test Unapproved Successfully!" : (status === 'Approved' ? "Test Approved Successfully!" : "Test Saved Successfully!"));
        setShowSuccessPopup(true);
        setTimeout(() => { 
            setShowSuccessPopup(false); 
            if (status === 'Approved' && reportSettings.whatsappReportAuto) {
                setWaAutoSendBillId(bill.id);
            } else {
                if (onSaveSuccess) onSaveSuccess(isUnapproving || status !== 'Approved'); 
            }
        }, 1500);
    } else {
        alert("Error: " + res.message);
    }
    setSavingItemId(null);
  };

  const handleBulkSubmit = async (status: 'Entered' | 'Approved') => {
    setIsSaving(true);
    const dataToSave: any[] = [];
    const isUnlocking = status === 'Entered';
    const targetItems = isUnlocking 
        ? (validItems.filter((i: any) => i.status === 'Approved' || i.status === 'Printed').length > 0 
            ? validItems.filter((i: any) => i.status === 'Approved' || i.status === 'Printed') 
            : validItems)
        : validItems;
    const targetItemIds = targetItems.map((i: any) => i.id);
    
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
    
    const res = await saveTestResults(bill.id, dataToSave, status, sig1Id ? parseInt(sig1Id) : null, sig2Id ? parseInt(sig2Id) : null, targetItemIds);
    
    if (res.success) {
        setSuccessMessage(isUnlocking ? "Tests Unlocked Successfully!" : (status === 'Approved' ? "All Tests Approved!" : "All Tests Saved!"));
        setShowSuccessPopup(true);
        setTimeout(() => { 
            setShowSuccessPopup(false); 
            if (status === 'Approved' && reportSettings.whatsappReportAuto) {
                setWaAutoSendBillId(bill.id);
            } else {
                if (onSaveSuccess) onSaveSuccess(isUnlocking || status !== 'Approved'); 
            }
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
        if (onSaveSuccess) onSaveSuccess(true);
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
        
        {RichTextEditorModal && <RichTextEditorModal isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} onSave={handleSaveNote} initialContent={currentNoteContent} title={`Notes`}/>}
        {RichTextEditorModal && <RichTextEditorModal isOpen={isResultEditorOpen} onClose={() => setIsResultEditorOpen(false)} onSave={handleSaveResultContent} initialContent={currentResultContent} title={`Result Editor`}/>}
        {HistoryModal && <HistoryModal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} paramName={selectedHistoryParam} isLoading={isHistoryLoading} data={historyData} />}
        {CultureSensitivityModal && <CultureSensitivityModal isOpen={isCultureModalOpen} onClose={() => setIsCultureModalOpen(false)} onSave={handleSaveCultureData} initialData={activeCultureItem?.initialData} />}
        
        <div className="hidden md:block w-full bg-white shrink-0 border-b border-slate-200 relative z-10">
            <div className="w-full px-2.5 xl:px-3 py-1 bg-white md:bg-slate-50/40 flex items-center justify-between gap-2 min-h-[36px] h-[36px] xl:min-h-[38px] xl:h-[38px]">
                <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[11px] xl:text-[12px] text-slate-600 font-normal">Selected <span className="font-semibold text-[#9575cd]">{visibleItems.length}</span> tests</span>
                </div>
                
                {validItems.length > 0 && (
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        {/* Sig 1 */}
                        <div className="flex items-center gap-1">
                            <label className="text-[10px] xl:text-[11px] text-slate-500 font-normal uppercase tracking-wide">Sig 1:</label>
                            <select value={sig1Id} onChange={handleSig1Change} disabled={allApproved} className="cursor-pointer h-[24px] xl:h-[26px] border border-slate-200 rounded-[5px] text-[11px] xl:text-[12px] font-normal text-slate-700 px-1.5 outline-none focus:border-[#9575cd] bg-white w-28 xl:w-32 hover:bg-slate-50 transition-colors">
                                <option value="" className="font-normal text-slate-500">-- None --</option>
                                {signatureUsers.map(u => <option key={u.id} value={String(u.id)} className="font-medium text-slate-800">{u.signName || u.name}</option>)}
                            </select>
                        </div>

                        {/* Sig 2 */}
                        <div className="flex items-center gap-1">
                            <label className="text-[10px] xl:text-[11px] text-slate-500 font-normal uppercase tracking-wide">Sig 2:</label>
                            <select value={sig2Id} onChange={(e) => setSig2Id(e.target.value)} disabled={allApproved} className="cursor-pointer h-[24px] xl:h-[26px] border border-slate-200 rounded-[5px] text-[11px] xl:text-[12px] font-normal text-slate-700 px-1.5 outline-none focus:border-[#9575cd] bg-white w-28 xl:w-32 hover:bg-slate-50 transition-colors">
                                <option value="" className="font-normal text-slate-500">-- None --</option>
                                {signatureUsers.filter(u => String(u.id) !== sig1Id).map(u => <option key={u.id} value={String(u.id)} className="font-medium text-slate-800">{u.signName || u.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="h-4 w-[1px] bg-slate-200"></div>
                        
                        {/* Print & Delta */}
                        <button onClick={onPrint} className="h-[24px] xl:h-[26px] px-2 xl:px-2.5 bg-white text-slate-700 hover:text-[#9575cd] border border-slate-200 hover:border-[#9575cd] text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                            <Printer size={13} />
                            <span>Print</span>
                        </button>
                        <button onClick={onDeltaPrint} className="h-[24px] xl:h-[26px] px-2 xl:px-2.5 bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                            <Activity size={13} />
                            <span>Delta</span>
                        </button>

                        <div className="h-4 w-[1px] bg-slate-200"></div>
                        
                        {/* Action buttons */}
                        {allApproved ? (
                            <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                                <span>Unlock</span>
                            </button>
                        ) : hasApproved ? (
                            <>
                                <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                                    <span>Unlock</span>
                                </button>
                                <button onClick={() => handleBulkSubmit('Approved')} disabled={isSaving} className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 bg-[#9575cd] hover:bg-[#8565bd] text-white border border-[#9575cd] text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                    <span>Approve All</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 bg-white text-slate-700 hover:text-[#9575cd] border border-slate-300 text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    <span>Save All</span>
                                </button>
                                <button onClick={() => handleBulkSubmit('Approved')} disabled={isSaving} className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 bg-[#9575cd] hover:bg-[#8565bd] text-white border border-[#9575cd] text-[11px] xl:text-[12px] font-normal rounded-[5px] flex items-center gap-1 shadow-sm transition-all active:scale-95">
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                    <span>Approve All</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3 pb-24 md:pb-3 bg-white">
            {validItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <AlertCircle size={48} className="opacity-20" />
                    <p className="text-sm font-medium">No configured tests found.</p>
                    <p className="text-xs">If this is an old test, it might not have parameters configured.</p>
                </div>
            ) : (
                validItems.map((item: any) => (
                    TestItemCard && <TestItemCard
                        key={item.id}
                        item={item}
                        bill={bill}
                        parameters={loadedParameters[item.test.id as number] || []}
                        isParamsLoading={isParamsLoading}
                        results={results}
                        flags={flags}
                        hasHistory={hasHistory}
                        savingItemId={savingItemId}
                        onInputChange={(itemId: number, param: any, val: string) => handleInputChange(itemId, param, val, loadedParameters[item.test.id as number], false)}
                        onSaveItem={(savedItem: any, status: 'Entered'|'Approved') => handleSaveItem(savedItem, status)}
                        onOpenNote={(noteItem: any) => handleOpenNote(noteItem)}
                        onOpenResultEditor={(itemId: number, param: any) => handleOpenResultEditor(itemId, param)}
                        onViewHistory={handleViewHistory}
                        onOpenCultureModal={(itemId: number) => handleOpenCultureModal(itemId)}
                    />
                ))
            )}
        </div>

        {/* SUCCESS POPUP OVERLAY */}
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

        {/* MOBILE FIXED FOOTER */}
        {validItems.length > 0 && (
            <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white p-1.5 z-[150] pb-safe">
                
                {/* SIGNATURE POPUP */}
                {isSignPopupOpen && (
                    <div className="absolute bottom-full right-24 mb-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-2.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Signature 1</label>
                                <select value={sig1Id} onChange={handleSig1Change} disabled={allApproved} className="cursor-pointer h-6 border border-slate-200 rounded text-[10px] font-medium text-slate-700 px-1.5 outline-none focus:ring-1 focus:ring-[#9575cd] bg-slate-50 w-full hover:bg-slate-100 transition-colors">
                                    <option value="" className="font-normal text-slate-500">-- None --</option>
                                    {signatureUsers.map(u => <option key={u.id} value={String(u.id)} className="font-medium text-slate-800">{u.signName || u.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Signature 2</label>
                                <select value={sig2Id} onChange={(e) => setSig2Id(e.target.value)} disabled={allApproved} className="cursor-pointer h-6 border border-slate-200 rounded text-[10px] font-medium text-slate-700 px-1.5 outline-none focus:ring-1 focus:ring-[#9575cd] bg-slate-50 w-full hover:bg-slate-100 transition-colors">
                                    <option value="" className="font-normal text-slate-500">-- None --</option>
                                    {signatureUsers.filter(u => String(u.id) !== sig1Id).map(u => <option key={u.id} value={String(u.id)} className="font-medium text-slate-800">{u.signName || u.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {/* Triangle Arrow */}
                        <div className="absolute -bottom-2 right-10 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                    </div>
                )}
                
                <div className="flex items-center justify-between gap-1 w-full">
                    <button onClick={onBackToList} className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5"><path d="m15 18-6-6 6-6"/></svg> Back
                    </button>
                    
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                        {allApproved ? (
                            <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="h-6 flex items-center justify-center px-3 bg-red-50 text-red-500 border border-red-100 text-[9px] font-medium rounded gap-1">
                                {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Unlock size={10} />}
                                Unlock All
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsSignPopupOpen(!isSignPopupOpen)} className={`h-6 px-2 flex items-center justify-center font-medium text-[9px] rounded transition-colors border ${isSignPopupOpen ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                    Sign
                                </button>
                                <button onClick={() => { setIsSignPopupOpen(false); handleBulkSubmit('Entered'); }} disabled={isSaving} className="h-6 px-2.5 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded">
                                    {isSaving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} className="mr-0.5" />} Save
                                </button>
                                <button onClick={() => { setIsSignPopupOpen(false); handleBulkSubmit('Approved'); }} disabled={isSaving} className="h-6 px-2.5 flex items-center justify-center bg-purple-50 text-[#9575cd] border border-purple-100 font-medium text-[9px] rounded">
                                    {isSaving ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} className="mr-0.5" />} Approve
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {waAutoSendBillId && <PatientReportModal isOpen={true} onClose={() => { setWaAutoSendBillId(null); if (onSaveSuccess) onSaveSuccess(); }} billId={waAutoSendBillId} autoSendWhatsApp={true} />}
    </div>
  );
}