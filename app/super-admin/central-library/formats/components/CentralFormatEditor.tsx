"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import {
  Save,
  Loader2,
  Trash2,
  Plus,
  FileText,
  Calculator,
  Target,
  CheckCircle,
  Search,
  ChevronDown,
  X,
  CloudDownload,
} from "lucide-react";
import {
  saveCentralTestFormat,
  createCentralFormatVersion,
  pullCentralFormatsData,
} from "@/app/actions/central-formats";
import { getPullableUserAccounts } from "@/app/actions/central-tests";
import RichTextEditorModal from "@/app/components/RichTextEditorModal";
import FormulaModal from "@/app/components/FormulaModal";
import CountTargetModal from "@/app/components/CountTargetModal";

function SequenceInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (val: number) => void;
}) {
  const [localValue, setLocalValue] = useState<string>(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setLocalValue(value.toString());
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    setTimeout(() => {
      const num = parseInt(localValue);
      if (!isNaN(num) && num !== value) onCommit(num);
      else setLocalValue(value.toString());
    }, 50);
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="w-12 text-[10px] text-center border border-slate-200 rounded px-1 h-6 focus:border-[#9575cd] outline-none font-bold text-slate-700"
    />
  );
}

interface CentralFormatEditorProps {
  test: any;
  availableParams: any[];
  onSaveComplete: () => void;
  onBack?: () => void;
}

export default function CentralFormatEditor({
  test,
  availableParams = [],
  onSaveComplete,
  onBack,
}: CentralFormatEditorProps) {
  const [isPending, startTransition] = useTransition();

  const [tableRows, setTableRows] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

  const [newRowType, setNewRowType] = useState("Parameter");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItemToAdd, setSelectedItemToAdd] = useState<any>(null);
  const [newRowSubtitle, setNewRowSubtitle] = useState("");

  const [showInterpretationModal, setShowInterpretationModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [activeFormulaRowIndex, setActiveFormulaRowIndex] = useState<number | null>(null);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPullableUserAccounts()
      .then((res) => {
        if (res && res.success) setUserAccounts(res.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (test) {
      let parsedCultureCols = ["Result", "Value", "Interpretation", "BreakPoint", "MIC"];
      if (test.cultureColumns) {
        try {
          parsedCultureCols = JSON.parse(test.cultureColumns);
        } catch (e) {
          parsedCultureCols = test.cultureColumns.split(",");
        }
      }

      setFormData({
        resultType: test.resultType || "Parameter",
        template: test.template || "Default",
        printNextPage: test.printNextPage || false,
        billingOnly: test.billingOnly || false,
        reportTitle: test.reportTitle || "",
        colCaption1: test.colCaption1 || "PARAMETER",
        colCaption2: test.colCaption2 || "Result",
        colCaption3: test.colCaption3 || "UOM",
        colCaption4: test.colCaption4 || "BIO.REF.RANGE",
        colCaption5: test.colCaption5 || "Method",
        labEquiName: test.labEquiName || "",
        isFormulaNeeded: test.isFormulaNeeded || false,
        isCountNeeded: test.isCountNeeded || false,
        targetCount: test.targetCount || "",
        isInterpretationNeeded: test.isInterpretationNeeded || false,
        interpretation: test.interpretation || "",
        cultureColumns: parsedCultureCols,
        showTestNameOnReport: test.showTestNameOnReport || false,
      });

      const params = Array.isArray(test.parameters) ? test.parameters : [];
      const mappedParams = params
        .map((tp: any, index: number) => {
          let code = tp.code || "-";
          let name = tp.name || (tp.isHeading ? "Subtitle" : "Parameter");
          if (tp.isCultureField) {
            code = "CULT-INFO";
            name = "Susceptibility Info";
          }
          return {
            uiId: tp.uiId || Math.random().toString(36).substr(2, 9),
            parameterId: tp.parameterId || tp.id,
            isCultureField: tp.isCultureField || false,
            code,
            name,
            isActive: tp.isActive ?? true,
            order: tp.order !== undefined ? tp.order : index + 1,
            isHeading: tp.isHeading || false,
            headingText: tp.headingText || "",
            formula: tp.formula || "",
            isCountDependent: tp.isCountDependent || false,
          };
        })
        .sort((a: any, b: any) => a.order - b.order);

      setTableRows(mappedParams);
      setNewRowType("Parameter");
      setSearchQuery("");
      setSelectedItemToAdd(null);
      setNewRowSubtitle("");
    }
  }, [test]);

  const handleSaveLibraryVersion = () => {
    if (!test?.id) return;
    const name = prompt("Name this new central report format version:");
    if (!name?.trim()) return;
    const payload = {
      ...formData,
      cultureColumns: JSON.stringify(formData.cultureColumns || []),
      parameters: tableRows.map((row) => ({
        parameterId: row.parameterId,
        order: row.order,
        isHeading: row.isHeading,
        headingText: row.headingText,
        isActive: row.isActive,
        formula: row.formula,
        isCountDependent: row.isCountDependent,
        isCultureField: row.isCultureField,
        code: row.code,
        name: row.name,
      })),
    };
    startTransition(async () => {
      const result = await createCentralFormatVersion(test.id, name.trim(), payload);
      if (result.success) {
        alert("New central format version saved successfully.");
        onSaveComplete();
      } else {
        alert(result.message || "Could not save central format version.");
      }
    });
  };

  const handleSave = () => {
    if (!test?.id) return;

    startTransition(async () => {
      const payload = {
        ...formData,
        cultureColumns: JSON.stringify(formData.cultureColumns || []),
        parameters: tableRows.map((row) => ({
          parameterId: row.parameterId,
          order: row.order,
          isHeading: row.isHeading,
          headingText: row.headingText,
          isActive: row.isActive,
          formula: row.formula,
          isCountDependent: row.isCountDependent,
          isCultureField: row.isCultureField,
          code: row.code,
          name: row.name,
        })),
      };

      const res = await saveCentralTestFormat(test.id, payload);

      if (res.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          onSaveComplete();
        }, 1200);
      } else {
        alert("Error: " + res.message);
      }
    });
  };

  const handleDataPull = async () => {
    if (isPulling) return;
    setIsPulling(true);
    try {
      const res = await pullCentralFormatsData(selectedUserId);
      if (res && res.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          onSaveComplete();
        }, 1200);
      } else {
        alert(res?.message || "Failed to pull format data.");
      }
    } catch (err: any) {
      console.error("Data pull error:", err);
      alert("An unexpected error occurred during data pull.");
    } finally {
      setIsPulling(false);
    }
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    setTableRows((prev) => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      return newRows;
    });
  };

  const handleOrderCommit = (oldIndex: number, newOrderVal: number) => {
    if (isNaN(newOrderVal) || newOrderVal < 1) return;
    let targetIndex = newOrderVal - 1;
    if (targetIndex >= tableRows.length) targetIndex = tableRows.length - 1;
    if (targetIndex < 0) targetIndex = 0;

    if (targetIndex === oldIndex) return;

    setTableRows((prev) => {
      const newRows = [...prev];
      const [movedItem] = newRows.splice(oldIndex, 1);
      newRows.splice(targetIndex, 0, movedItem);
      return newRows.map((row, idx) => ({ ...row, order: idx + 1 }));
    });
  };

  const handleAddNewRow = () => {
    if (newRowType === "Culture Block") {
      if (tableRows.some((row) => row.isCultureField)) {
        return alert("Susceptibility Info is already added to this test.");
      }

      setTableRows((prev) => [
        ...prev,
        {
          uiId: Math.random().toString(36).substr(2, 9),
          parameterId: null,
          isCultureField: true,
          code: "CULT-INFO",
          name: "Susceptibility Info",
          isActive: true,
          order: prev.length + 1,
          isHeading: false,
          headingText: "",
          formula: "",
          isCountDependent: false,
        },
      ]);
      return;
    }

    if (newRowType === "Subtitle") {
      if (!newRowSubtitle.trim()) return alert("Please enter heading text");
      setTableRows((prev) => [
        ...prev,
        {
          uiId: Math.random().toString(36).substr(2, 9),
          parameterId: null,
          code: "-",
          name: "Subtitle",
          isActive: true,
          order: prev.length + 1,
          isHeading: true,
          headingText: newRowSubtitle,
          formula: "",
          isCountDependent: false,
        },
      ]);
      setNewRowSubtitle("");
      return;
    }

    if (!selectedItemToAdd) return alert("Please select a parameter to add");

    setTableRows((prev) => [
      ...prev,
      {
        uiId: Math.random().toString(36).substr(2, 9),
        parameterId: selectedItemToAdd.id,
        code: selectedItemToAdd.code || "-",
        name: selectedItemToAdd.name,
        isActive: true,
        order: prev.length + 1,
        isHeading: false,
        headingText: "",
        formula: "",
        isCountDependent: false,
      },
    ]);

    setSelectedItemToAdd(null);
    setSearchQuery("");
  };

  const handleDeleteRow = (index: number) => {
    setTableRows((prev) => {
      const newRows = prev.filter((_, idx) => idx !== index);
      return newRows.map((row, idx) => ({ ...row, order: idx + 1 }));
    });
  };

  const filteredParams = availableParams.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 relative font-sans overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 hover:bg-slate-100 rounded text-slate-500"
            >
              <X size={16} />
            </button>
          )}
          <div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>{test?.name}</span>
              <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                {test?.code}
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Department: {test?.department || "General"} | Parameters: {tableRows.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* User Account Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isPulling}
              className="h-7 pl-2 pr-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded shadow-2xs outline-none focus:border-[#9575cd] appearance-none cursor-pointer max-w-[180px] truncate disabled:opacity-60"
              title="Select user account to pull data from"
            >
              <option value="ALL">All User Accounts</option>
              {userAccounts.map((u) => (
                <option key={u.id} value={u.id.toString()}>
                  {u.username} ({u.orgName})
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleDataPull}
            disabled={isPulling}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 h-7 rounded text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="Pull format data from selected user account"
          >
            {isPulling ? (
              <Loader2 size={13} className="animate-spin text-[#9575cd]" />
            ) : (
              <CloudDownload size={13} className="text-[#9575cd]" />
            )}
            <span>{isPulling ? "Pulling..." : "Data Pull"}</span>
          </button>
          <button
            onClick={handleSaveLibraryVersion}
            disabled={isPending}
            className="border border-[#9575cd] text-[#9575cd] hover:bg-purple-50 px-3 py-1.5 h-7 rounded text-xs font-bold transition-colors disabled:opacity-50"
          >
            Save as Version
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-3.5 py-1.5 h-7 rounded text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-70"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isPending ? "Saving..." : "Save Central Format"}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {/* Format Configuration Flags & Options */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9575cd]">
            Format Options & Page Layout
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Result Type
              </label>
              <select
                value={formData.resultType || "Parameter"}
                onChange={(e) => setFormData({ ...formData, resultType: e.target.value })}
                className="w-full border rounded p-2 text-xs bg-white focus:border-[#9575cd] outline-none"
              >
                <option value="Parameter">Parameter (Standard)</option>
                <option value="Descriptive">Descriptive (Paragraph)</option>
                <option value="Culture">Culture & Sensitivity</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Report Template
              </label>
              <select
                value={formData.template || "Default"}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                className="w-full border rounded p-2 text-xs bg-white focus:border-[#9575cd] outline-none"
              >
                <option value="Default">Default Table Layout</option>
                <option value="Template 1">Minimal Column Layout</option>
                <option value="Template 2">Compact Clinical Layout</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Custom Report Section Title
              </label>
              <input
                type="text"
                value={formData.reportTitle || ""}
                onChange={(e) => setFormData({ ...formData, reportTitle: e.target.value })}
                placeholder="Overrides test name on PDF report header..."
                className="w-full border rounded p-2 text-xs bg-white focus:border-[#9575cd] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.printNextPage || false}
                onChange={(e) => setFormData({ ...formData, printNextPage: e.target.checked })}
                className="accent-[#9575cd] rounded"
              />
              <span className="font-semibold text-slate-700">Print on Next Page</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showTestNameOnReport || false}
                onChange={(e) =>
                  setFormData({ ...formData, showTestNameOnReport: e.target.checked })
                }
                className="accent-[#9575cd] rounded"
              />
              <span className="font-semibold text-slate-700">Show Test Name on Report</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.billingOnly || false}
                onChange={(e) => setFormData({ ...formData, billingOnly: e.target.checked })}
                className="accent-[#9575cd] rounded"
              />
              <span className="font-semibold text-slate-700">Billing Only</span>
            </label>

            <button
              type="button"
              onClick={() => setShowInterpretationModal(true)}
              className="text-[#9575cd] font-bold hover:underline flex items-center gap-1 ml-auto"
            >
              <FileText size={12} /> Format Guidelines / Notes
            </button>
          </div>
        </div>

        {/* Add Row Section */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9575cd]">
            Add Parameter or Section Heading
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={newRowType}
              onChange={(e) => {
                setNewRowType(e.target.value);
                setSelectedItemToAdd(null);
                setSearchQuery("");
                setNewRowSubtitle("");
              }}
              className="border rounded p-2 text-xs bg-white focus:border-[#9575cd] outline-none w-full sm:w-44"
            >
              <option value="Parameter">Add Central Parameter</option>
              <option value="Subtitle">Add Subheading / Title</option>
              <option value="Culture Block">Add Susceptibility Block</option>
            </select>

            {newRowType === "Parameter" && (
              <div className="relative flex-1 w-full" ref={searchContainerRef}>
                <div
                  onClick={() => setShowDropdown(true)}
                  className="w-full border rounded p-2 text-xs bg-white flex items-center justify-between cursor-pointer focus-within:border-[#9575cd]"
                >
                  <span className={selectedItemToAdd ? "font-bold text-slate-800" : "text-slate-400"}>
                    {selectedItemToAdd
                      ? `${selectedItemToAdd.name} (${selectedItemToAdd.code})`
                      : "Search and pick a central parameter..."}
                  </span>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>

                {showDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto p-2">
                    <div className="relative mb-2">
                      <Search
                        size={12}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Type to filter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 text-xs border rounded outline-none focus:border-[#9575cd]"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredParams.slice(0, 50).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedItemToAdd(p);
                            setShowDropdown(false);
                          }}
                          className="p-1.5 hover:bg-purple-50 rounded text-xs cursor-pointer flex justify-between items-center"
                        >
                          <span className="font-semibold text-slate-700">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.code}</span>
                        </div>
                      ))}
                      {filteredParams.length === 0 && (
                        <div className="p-2 text-center text-xs text-slate-400">
                          No matching parameters
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {newRowType === "Subtitle" && (
              <input
                type="text"
                placeholder="Enter heading title (e.g. Differential Leukocyte Count)..."
                value={newRowSubtitle}
                onChange={(e) => setNewRowSubtitle(e.target.value)}
                className="w-full sm:flex-1 border rounded p-2 text-xs bg-white focus:border-[#9575cd] outline-none"
              />
            )}

            <button
              type="button"
              onClick={handleAddNewRow}
              className="w-full sm:w-auto bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Plus size={14} /> Add to Table
            </button>
          </div>
        </div>

        {/* Parameters Sequence Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Parameters Print Sequence & Display
              </h2>
              <p className="text-[10px] text-slate-400">
                Change order number to reposition rows. Toggle visibility and configure formulas.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total Rows: {tableRows.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs">
              <thead className="bg-slate-100/60 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-16 text-center">Order</th>
                  <th className="p-2.5 w-28 text-left">Code</th>
                  <th className="p-2.5 text-left">Parameter / Subtitle</th>
                  <th className="p-2.5 w-24 text-center">Formulas</th>
                  <th className="p-2.5 w-20 text-center">Active</th>
                  <th className="p-2.5 w-16 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.map((row, idx) => (
                  <tr
                    key={row.uiId || idx}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      row.isHeading ? "bg-amber-50/30 font-semibold" : ""
                    }`}
                  >
                    <td className="p-2 text-center">
                      <SequenceInput
                        value={row.order}
                        onCommit={(val) => handleOrderCommit(idx, val)}
                      />
                    </td>

                    <td className="p-2 font-mono text-[11px] text-slate-500">{row.code}</td>

                    <td className="p-2">
                      {row.isHeading ? (
                        <input
                          type="text"
                          value={row.headingText || ""}
                          onChange={(e) => handleRowChange(idx, "headingText", e.target.value)}
                          placeholder="Heading title..."
                          className="w-full border border-amber-300 rounded px-2 py-1 text-xs bg-amber-50/50 font-bold text-slate-800"
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{row.name}</span>
                          {row.isCultureField && (
                            <span className="text-[10px] text-rose-600 font-bold">
                              Culture & Susceptibility Matrix
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="p-2 text-center">
                      {!row.isHeading && !row.isCultureField && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveFormulaRowIndex(idx);
                              setShowFormulaModal(true);
                            }}
                            className={`p-1 rounded border text-[10px] font-bold ${
                              row.formula
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "text-slate-400 border-slate-200 hover:bg-slate-100"
                            }`}
                            title="Configure Calculated Formula"
                          >
                            <Calculator size={13} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveFormulaRowIndex(idx);
                              setShowCountModal(true);
                            }}
                            className={`p-1 rounded border text-[10px] font-bold ${
                              row.isCountDependent
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                : "text-slate-400 border-slate-200 hover:bg-slate-100"
                            }`}
                            title="Count Target Calculation"
                          >
                            <Target size={13} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRowChange(idx, "isActive", !row.isActive)}
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                          row.isActive ? "bg-green-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                            row.isActive ? "translate-x-3.5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      No parameters configured for this central test format yet. Add parameters
                      above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInterpretationModal && (
        <RichTextEditorModal
          isOpen={true}
          onClose={() => setShowInterpretationModal(false)}
          title="Format Report Guidelines / Interpretation"
          initialContent={formData.interpretation || ""}
          onSave={(content) => {
            setFormData({ ...formData, interpretation: content });
            setShowInterpretationModal(false);
          }}
        />
      )}

      {showFormulaModal && activeFormulaRowIndex !== null && (
        <FormulaModal
          isOpen={true}
          onClose={() => {
            setShowFormulaModal(false);
            setActiveFormulaRowIndex(null);
          }}
          targetParamName={tableRows[activeFormulaRowIndex]?.name || ""}
          availableParams={tableRows
            .filter((r) => !r.isHeading)
            .map((r, i) => ({ id: r.parameterId || i + 1, code: r.code, name: r.name }))}
          initialFormula={tableRows[activeFormulaRowIndex]?.formula || ""}
          onSave={(formulaStr) => {
            handleRowChange(activeFormulaRowIndex, "formula", formulaStr);
            setShowFormulaModal(false);
            setActiveFormulaRowIndex(null);
          }}
        />
      )}

      {showCountModal && (
        <CountTargetModal
          isOpen={true}
          onClose={() => {
            setShowCountModal(false);
            setActiveFormulaRowIndex(null);
          }}
          initialTargetCount={formData.targetCount}
          availableParams={tableRows
            .filter((r) => !r.isHeading)
            .map((r) => ({
              uiId: r.uiId,
              code: r.code,
              name: r.name,
              isCountDependent: r.isCountDependent,
            }))}
          onSave={(targetCount, selectedUiIds) => {
            setFormData((prev: any) => ({ ...prev, targetCount }));
            setTableRows((prev: any[]) =>
              prev.map((row: any) => ({
                ...row,
                isCountDependent: selectedUiIds.includes(row.uiId),
              }))
            );
            setShowCountModal(false);
            setActiveFormulaRowIndex(null);
          }}
        />
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[280px] md:max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 md:mb-5 border-[3px] md:border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base md:text-xl font-black text-slate-800 tracking-tight text-center">
              Format Saved Successfully!
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 text-center font-medium">
              {test?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
