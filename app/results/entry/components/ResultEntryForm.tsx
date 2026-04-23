"use client";

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Loader2, RotateCcw, PenTool, ChevronDown, CheckCircle } from 'lucide-react';
import { saveTestResults, saveTestNote, checkHistoryAvailability, getParameterHistory, getSignatureUsers, getTestParameters } from '@/app/actions/result-entry';
import RichTextEditorModal from '@/app/components/RichTextEditorModal';
import { getFlag, recalculateFormulas } from './ResultEntryUtils';
import HistoryModal from './HistoryModal';
import TestItemCard from './TestItemCard';
import CultureSensitivityModal from './CultureSensitivityModal';

export default function ResultEntryForm({ bill, onSaveSuccess, filterTestIds, entryDateTime }: any) {
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

  const visibleItems = bill?.items.filter((item: any) => filterTestIds.includes(item.id)) || [];
  const validItems = visibleItems.filter((item: any) => item.test.isConfigured);
  const allApproved = validItems.length > 0 && validItems.every((item: any) => item.status === 'Approved' || item.status === 'Printed');

  useEffect(() => { getSignatureUsers().then(res => { if (res.success && res.data) setSignatureUsers(res.data); }); }, []);

  useEffect(() => {
    if (bill && visibleItems.length > 0) {
      let isMounted = true;
      setIsParamsLoading(true);

      const fetchAllParams = async () => {
          const testIds = Array.from(new Set(visibleItems.map((i: any) => i.test.id)));
          
          const paramPromises = testIds.map(async (testId) => {
              const res = await getTestParameters(testId as number);
              return { testId, params: res.success ? res.data : [] };
          });

          const fetchedParams = await Promise.all(paramPromises);
          if (!isMounted) return;

          const paramMap: Record<number, any[]> = {};
          fetchedParams.forEach(fp => { paramMap[fp.testId as number] = fp.params; });
          setLoadedParameters(paramMap);

          const initialResults: any = {};
          const initialFlags: any = {};
          const allParamIds: number[] = [];
          
          visibleItems.forEach((item: any) => {
            if (!item.test.isConfigured) return;
            // 🚨 TS FIX: Cast as number
            const testParams = paramMap[item.test.id as number] || [];
            
            testParams.forEach((tp: any) => { 
                if (tp.parameter && tp.parameter.id) allParamIds.push(tp.parameter.id); 
                if (tp.isCultureField) allParamIds.push(-999);
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
      const newSig1 = e.target.value; setSig1Id(newSig1);
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
    let newFlags = { ...flags, [key]: isCulture ? 'Normal' : getFlag(value, parameter, bill.patient) }; 

    if (testParameters && !isCulture) {
        const calculated = recalculateFormulas(newResults, newFlags, billItemId, testParameters, bill.patient);
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
    // 🚨 TS FIX: Cast as number
    const testParams = loadedParameters[item.test.id as number] || [];

    testParams.forEach((tp: any) => {
        if (tp.parameter) {
            const key = `${item.id}-${tp.parameter.id}`;
            if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: tp.parameter.id, value: results[key], flag: flags[key] || 'Normal' });
        }
        if (tp.isCultureField) {
            const key = `${item.id}--999`;
            if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: null, value: results[key], flag: 'Normal' });
        }
    });

    const res = await saveTestResults(bill.id, dataToSave, status, sig1Id ? parseInt(sig1Id) : null, sig2Id ? parseInt(sig2Id) : null);
    if (res.success) {
        setSuccessMessage(status === 'Approved' ? "Test Approved Successfully!" : "Test Saved Successfully!");
        setShowSuccessPopup(true); setTimeout(() => { setShowSuccessPopup(false); if (onSaveSuccess) onSaveSuccess(); }, 1500);
    } else alert("Error: " + res.message);
    setSavingItemId(null);
  };

  const handleBulkSubmit = async (status: 'Entered' | 'Approved') => {
    setIsSaving(true);
    const dataToSave: any[] = [];
    validItems.forEach((item: any) => {
        // 🚨 TS FIX: Cast as number
        const testParams = loadedParameters[item.test.id as number] || [];
        testParams.forEach((tp: any) => {
            if (tp.parameter) {
                const key = `${item.id}-${tp.parameter.id}`;
                if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: tp.parameter.id, value: results[key], flag: flags[key] || 'Normal' });
            }
            if (tp.isCultureField) {
                const key = `${item.id}--999`;
                if (results[key] !== undefined) dataToSave.push({ billItemId: item.id, parameterId: null, value: results[key], flag: 'Normal' });
            }
        });
    });

    const res = await saveTestResults(bill.id, dataToSave, status, sig1Id ? parseInt(sig1Id) : null, sig2Id ? parseInt(sig2Id) : null);
    if (res.success) {
        setSuccessMessage(status === 'Approved' ? "All Tests Approved!" : "All Tests Saved!");
        setShowSuccessPopup(true); setTimeout(() => { setShowSuccessPopup(false); if (onSaveSuccess) onSaveSuccess(); }, 1500);
    } else alert("Error: " + res.message);
    setIsSaving(false);
  };

  const handleOpenNote = (item: any) => { setActiveNoteItem(item); setCurrentNoteContent(item.notes || ""); setIsNoteOpen(true); };
  const handleSaveNote = async (content: string) => {
    if (!activeNoteItem) return;
    const res = await saveTestNote(activeNoteItem.id, content);
    if (res.success) { setIsNoteOpen(false); setActiveNoteItem(null); if (onSaveSuccess) onSaveSuccess(); }
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
          // 🚨 TS FIX: Cast as number
          const testParams = loadedParameters[item.test.id as number] || [];
          const param = testParams.find((p: any) => p.parameter && p.parameter.id === activeResultParam.paramId)?.parameter;
          if (param) handleInputChange(activeResultParam.itemId, param, content, testParams);
          setIsResultEditorOpen(false); setActiveResultParam(null);
      }
  };

  const handleViewHistory = async (paramId: number, paramName: string) => {
    setIsHistoryLoading(true); setSelectedHistoryParam(paramName); setShowHistoryModal(true);
    const res = await getParameterHistory(bill.patientId, paramId);
    if(res.success) setHistoryData(res);
    setIsHistoryLoading(false);
  };

  const handleOpenCultureModal = (itemId: number) => {
      const existingDataStr = results[`${itemId}--999`];
      let initialData = null;
      if (existingDataStr) { try { initialData = JSON.parse(existingDataStr); } catch(e) {} }
      setActiveCultureItem({ itemId, paramId: -999, initialData });
      setIsCultureModalOpen(true);
  };

  const handleSaveCultureData = (cultureData: any) => {
      if (activeCultureItem) { handleInputChange(activeCultureItem.itemId, null, JSON.stringify(cultureData), undefined, true); }
      setIsCultureModalOpen(false); setActiveCultureItem(null);
  };

  if (!bill || visibleItems.length === 0) return <div className="p-8 text-center text-slate-400">No tests selected</div>;

  return (
    <div className="flex flex-col h-full bg-white relative w-full overflow-hidden">
        <RichTextEditorModal isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} onSave={handleSaveNote} initialContent={currentNoteContent} title={`Notes`}/>
        <RichTextEditorModal isOpen={isResultEditorOpen} onClose={() => setIsResultEditorOpen(false)} onSave={handleSaveResultContent} initialContent={currentResultContent} title={`Result Editor`}/>
        <HistoryModal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} paramName={selectedHistoryParam} isLoading={isHistoryLoading} data={historyData} />
        <CultureSensitivityModal isOpen={isCultureModalOpen} onClose={() => setIsCultureModalOpen(false)} onSave={handleSaveCultureData} initialData={activeCultureItem?.initialData} />

        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-white shrink-0 gap-4">
            <div>
                <h3 className="text-sm font-bold text-slate-800">Result Entry</h3>
                <p className="text-xs text-slate-400">Entering results for <span className="font-bold text-[#9575cd]">{visibleItems.length}</span> selected tests</p>
            </div>
            {validItems.length > 0 && (
                <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <span className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold text-slate-400 z-10">Sig 1</span>
                            <select value={sig1Id} onChange={handleSig1Change} disabled={allApproved} className="h-8 border border-slate-200 rounded text-xs pl-2 pr-6 outline-none bg-slate-50 w-full sm:w-32">
                                <option value="">-- None --</option>
                                {signatureUsers.map(u => <option key={u.id} value={String(u.id)}>{u.signName || u.name}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none"/>
                        </div>
                        <div className="relative flex-1 sm:flex-none">
                            <span className="absolute -top-2 left-2 bg-white px-1 text-[9px] font-bold text-slate-400 z-10">Sig 2</span>
                            <select value={sig2Id} onChange={(e) => setSig2Id(e.target.value)} disabled={allApproved} className="h-8 border border-slate-200 rounded text-xs pl-2 pr-6 outline-none bg-slate-50 w-full sm:w-32">
                                <option value="">-- None --</option>
                                {signatureUsers.filter(u => String(u.id) !== sig1Id).map(u => <option key={u.id} value={String(u.id)}>{u.signName || u.name}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none"/>
                        </div>
                    </div>
                    <div className="hidden sm:block h-6 w-px bg-slate-200"></div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {allApproved ? (
                            <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="w-full sm:w-auto justify-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded flex items-center gap-2">
                                {isSaving ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={14} />} Unapprove All
                            </button>
                        ) : (
                            <div className="flex w-full sm:w-auto items-center gap-2">
                                <button onClick={() => handleBulkSubmit('Entered')} disabled={isSaving} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded flex items-center gap-2">
                                    {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} <span className="hidden sm:inline">Save Draft</span><span className="sm:hidden">Save</span>
                                </button>
                                <button onClick={() => handleBulkSubmit('Approved')} disabled={isSaving} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-[#9575cd] text-white text-xs font-bold rounded flex items-center gap-2">
                                    {isSaving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>} <span className="hidden sm:inline">Approve All</span><span className="sm:hidden">Approve</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 w-full bg-slate-50/50">
            {visibleItems.map((item: any) => (
                <TestItemCard 
                    key={item.id} item={item} bill={bill} results={results} flags={flags} 
                    hasHistory={hasHistory} savingItemId={savingItemId}
                    // 🚨 TS FIX: Cast as number
                    testParams={loadedParameters[item.test.id as number] || []} 
                    isParamsLoading={isParamsLoading}                 
                    onOpenNote={handleOpenNote} onSaveItem={handleSaveItem} 
                    onOpenResultEditor={handleOpenResultEditor} onInputChange={handleInputChange} 
                    onViewHistory={handleViewHistory} onOpenCultureModal={handleOpenCultureModal} 
                />
            ))}
        </div>

        {showSuccessPopup && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 w-full max-w-[100vw]">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4 border border-slate-100">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100"><CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} /></div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">{successMessage}</h2>
              <p className="text-slate-500 text-sm mt-1 text-center font-medium">Bill No: <span className="text-[#4dd0e1] font-mono font-bold ml-1">{String(bill?.billNumber || '').slice(-4)}</span></p>
            </div>
          </div>
        )}
    </div>
  );
}