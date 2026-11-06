"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Plus,
  Settings,
  Activity,
  Type,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getCentralParameterById,
  updateCentralParameter,
  deleteCentralParameter,
} from "@/app/actions/central-parameters";
import { getCentralTests } from "@/app/actions/central-tests";
import { getMasterData } from "@/app/actions/masters";
import RichTextEditorModal from "@/app/components/RichTextEditorModal";
import MusicBarLoader from "@/app/components/MusicBarLoader";
import toast from "react-hot-toast";

export default function EditCentralParameterPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic dropdowns
  const [operators, setOperators] = useState<any[]>([]);
  const [multivalueSets, setMultivalueSets] = useState<any[]>([]);
  const [uomList, setUomList] = useState<any[]>([]);
  const [methodsList, setMethodsList] = useState<any[]>([]);
  const [centralTests, setCentralTests] = useState<any[]>([]);

  // UI state
  const [parameterCategory, setParameterCategory] = useState<"Quantitative" | "Qualitative">("Quantitative");
  const [editingRangeIndex, setEditingRangeIndex] = useState<number | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    displayName: "",
    unit: "",
    method: "",
    inputType: "Numerical",
    isMultiValue: false,
    options: [] as string[],
    resultAlignment: "Beside",
    globalTestId: "",
    department: "HEMATOLOGY",
    price: "",
    decimals: "2",
    lowMessage: "",
    highMessage: "",
    panicMessage: "",
    interpretation: "",
    billingOnly: false,
    isFormula: false,
    isActive: true,
  });

  const [ranges, setRanges] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [testsRes, opsRes, multiRes, uomRes, methodRes, paramRes] = await Promise.all([
          getCentralTests(),
          getMasterData("operator"),
          getMasterData("multivalue"),
          getMasterData("uom"),
          getMasterData("method"),
          getCentralParameterById(id),
        ]);

        if (testsRes.success) setCentralTests(testsRes.data || []);
        if (opsRes.success) setOperators(opsRes.data || []);
        if (multiRes.success) setMultivalueSets(multiRes.data || []);
        if (uomRes.success) setUomList(uomRes.data || []);
        if (methodRes.success) setMethodsList(methodRes.data || []);

        if (paramRes.success && paramRes.data) {
          const p = paramRes.data;
          setFormData({
            code: p.code || "",
            name: p.name,
            displayName: p.displayName || "",
            unit: p.unit || "",
            method: p.method || "",
            inputType: p.inputType || "Numerical",
            isMultiValue: p.isMultiValue || false,
            options: p.options || [],
            resultAlignment: p.resultAlignment || "Beside",
            globalTestId: p.globalTestId || "",
            department: p.department || "HEMATOLOGY",
            price: p.price ? String(p.price) : "",
            decimals: p.decimals !== undefined ? String(p.decimals) : "2",
            lowMessage: p.lowMessage || "",
            highMessage: p.highMessage || "",
            panicMessage: p.panicMessage || "",
            interpretation: p.interpretation || "",
            billingOnly: p.billingOnly || false,
            isFormula: p.isFormula || false,
            isActive: p.isActive,
          });

          if (p.inputType === "Numerical") setParameterCategory("Quantitative");
          else setParameterCategory("Qualitative");

          if (p.ranges && p.ranges.length > 0) {
            setRanges(
              p.ranges.map((r: any) => ({
                ...r,
                normalOperator: r.normalOperator || "Between",
                criticalOperator: r.criticalOperator || "Between",
                normalValue: r.normalValue
                  ? Array.isArray(r.normalValue)
                    ? r.normalValue
                    : r.normalValue.split(",")
                  : [],
                abnormalValue: r.abnormalValue
                  ? Array.isArray(r.abnormalValue)
                    ? r.abnormalValue
                    : r.abnormalValue.split(",")
                  : [],
                criticalValue: r.criticalValue
                  ? Array.isArray(r.criticalValue)
                    ? r.criticalValue
                    : r.criticalValue.split(",")
                  : [],
              }))
            );
          } else {
            setRanges([
              {
                gender: "Both",
                minAge: 0,
                maxAge: 100,
                minAgeUnit: "Years",
                maxAgeUnit: "Years",
                normalOperator: "Between",
                lowRange: "",
                highRange: "",
                normalValue: [],
                abnormalValue: [],
                normalRange: "",
                criticalOperator: "Between",
                criticalLow: "",
                criticalHigh: "",
                criticalValue: [],
              },
            ]);
          }
        } else {
          toast.error("Central parameter not found.");
          router.push("/super-admin/central-library?tab=Parameter");
        }
      } catch (e) {
        console.error("Central Edit Parameter Init Failed:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id, router]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: "Quantitative" | "Qualitative") => {
    setParameterCategory(type);
    if (type === "Quantitative") handleChange("inputType", "Numerical");
    else if (formData.inputType === "Numerical") handleChange("inputType", "Small");
  };

  const handleMasterSetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const setId = e.target.value;
    setSelectedMasterId(setId);
    if (!setId) return setFormData((prev) => ({ ...prev, options: [] }));
    const selectedSet = multivalueSets.find((s) => s.id.toString() === setId);
    if (selectedSet && selectedSet.values) {
      const opts = selectedSet.values
        .split(",")
        .map((v: string) => v.trim())
        .filter((v: string) => v);
      setFormData((prev) => ({ ...prev, options: opts }));
    }
  };

  const handleRangeChange = (index: number, field: string, value: any) => {
    const newRanges = [...ranges];
    newRanges[index][field] = value;
    setRanges(newRanges);
  };

  const handleEditorSave = (content: string) => {
    if (editingRangeIndex !== null) {
      handleRangeChange(editingRangeIndex, "normalRange", content);
      setEditingRangeIndex(null);
    }
  };

  const addRangeRow = () => {
    setRanges([
      ...ranges,
      {
        gender: "Both",
        minAge: 0,
        maxAge: 100,
        minAgeUnit: "Years",
        maxAgeUnit: "Years",
        normalOperator: "Between",
        lowRange: "",
        highRange: "",
        normalValue: [],
        abnormalValue: [],
        criticalValue: [],
        normalRange: "",
        criticalOperator: "Between",
        criticalLow: "",
        criticalHigh: "",
      },
    ]);
  };

  const removeRangeRow = (index: number) => {
    if (ranges.length > 1) setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Parameter name is required.");
      return;
    }

    startTransition(async () => {
      const payload = {
        ...formData,
        ranges,
      };

      const res = await updateCentralParameter(id, payload);
      if (res.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          router.push("/super-admin/central-library?tab=Parameter");
          router.refresh();
        }, 1300);
      } else {
        toast.error("Error: " + res.message);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteCentralParameter(id);
      if (res.success) {
        setShowDeleteConfirm(false);
        router.push("/super-admin/central-library?tab=Parameter");
        router.refresh();
      } else {
        toast.error("Error: " + res.message);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <MusicBarLoader text="Loading Central Parameter..." />
      </div>
    );
  }

  const labelClass = "text-[11px] font-bold text-slate-500 uppercase h-4 flex items-center mb-1";
  const inputClass =
    "w-full text-xs font-medium border border-slate-300 rounded px-3 h-[38px] bg-white focus:ring-1 focus:ring-[#9575cd] outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative font-sans overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/central-library?tab=Parameter"
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Settings className="text-[#9575cd]" size={18} />
            <div>
              <h1 className="text-base font-bold text-slate-800">Edit Central Parameter</h1>
              <p className="text-[10px] text-slate-400 font-mono">{formData.code}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending}
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3.5 py-2 rounded text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-5 py-2 rounded text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isPending ? "Updating..." : "Update Central Parameter"}</span>
          </button>
        </div>
      </div>

      {/* Main Form Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Category Switch */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Parameter Classification</h2>
            <p className="text-xs text-slate-500">
              Select whether this parameter reports numerical data or qualitative values
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => handleTypeChange("Quantitative")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                parameterCategory === "Quantitative"
                  ? "bg-[#9575cd] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Activity size={13} /> Quantitative (Numerical)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("Qualitative")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                parameterCategory === "Qualitative"
                  ? "bg-[#9575cd] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Type size={13} /> Qualitative (Descriptive)
            </button>
          </div>
        </div>

        {/* General Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9575cd]">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className={labelClass}>Parameter Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleChange("displayName", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Associated Central Test</label>
              <select
                value={formData.globalTestId}
                onChange={(e) => handleChange("globalTestId", e.target.value)}
                className={inputClass}
              >
                <option value="">-- None (Global / Standalone) --</option>
                {centralTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Unit of Measurement (UOM)</label>
              <input
                type="text"
                list="uom-options"
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                className={inputClass}
              />
              <datalist id="uom-options">
                {uomList.map((u: any) => (
                  <option key={u.id} value={u.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass}>Method</label>
              <select
                value={formData.method}
                onChange={(e) => handleChange("method", e.target.value)}
                className={inputClass}
              >
                <option value="">-- Select Method --</option>
                {methodsList.map((m: any) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Result Alignment</label>
              <select
                value={formData.resultAlignment}
                onChange={(e) => handleChange("resultAlignment", e.target.value)}
                className={inputClass}
              >
                <option value="Beside">Beside (Same Line)</option>
                <option value="Below">Below (Separate Line)</option>
              </select>
            </div>

            {parameterCategory === "Quantitative" && (
              <div>
                <label className={labelClass}>Decimals to Display</label>
                <input
                  type="number"
                  min="0"
                  max="6"
                  value={formData.decimals}
                  onChange={(e) => handleChange("decimals", e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>

        {/* Input Format & Multi-value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9575cd]">
            Input Format & Selection Options
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Input Type</label>
              <select
                value={formData.inputType}
                onChange={(e) => handleChange("inputType", e.target.value)}
                className={inputClass}
              >
                {parameterCategory === "Quantitative" ? (
                  <>
                    <option value="Numerical">Numerical Value</option>
                    <option value="Small">Small Text Box</option>
                  </>
                ) : (
                  <>
                    <option value="Small">Small Text Box</option>
                    <option value="Medium">Medium Text Box</option>
                    <option value="Large">Large Text Area</option>
                    <option value="Multi-value">Dropdown List / Multi-value</option>
                    <option value="File">File Attachment / Scan</option>
                  </>
                )}
              </select>
            </div>

            {formData.inputType === "Multi-value" && (
              <div>
                <label className={labelClass}>Load from Master List</label>
                <select
                  value={selectedMasterId}
                  onChange={handleMasterSetChange}
                  className={inputClass}
                >
                  <option value="">-- Custom Options --</option>
                  {multivalueSets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.inputType === "Multi-value" && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Custom Options (Comma separated)</label>
                <input
                  type="text"
                  value={formData.options.join(", ")}
                  onChange={(e) =>
                    handleChange(
                      "options",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>

        {/* Reference Range Matrix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9575cd]">
                Reference Ranges Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Define normal biological ranges and critical panic limits by age and gender
              </p>
            </div>
            <button
              type="button"
              onClick={addRangeRow}
              className="bg-purple-50 text-[#9575cd] border border-purple-200 hover:bg-purple-100 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Plus size={14} /> Add Age Bracket
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full min-w-[850px] text-xs">
              <thead className="bg-[#9575cd] text-[10px] uppercase font-bold text-white border-b border-[#7e57c2]">
                <tr>
                  <th style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }} className="align-middle leading-none p-2.5 text-left">Gender</th>
                  <th style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }} className="align-middle leading-none p-2.5 text-left">Age Range</th>
                  <th style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }} className="align-middle leading-none p-2.5 text-left">Normal Operator</th>
                  <th style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }} className="align-middle leading-none p-2.5 text-left">Normal Range</th>
                  <th style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }} className="align-middle leading-none p-2.5 text-left">Critical Limits</th>
                  <th style={{ padding: '5px 8px', verticalAlign: 'middle', lineHeight: 1 }} className="align-middle leading-none p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranges.map((range, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <select
                        value={range.gender}
                        onChange={(e) => handleRangeChange(idx, "gender", e.target.value)}
                        className="text-xs border rounded p-1.5 bg-white w-24"
                      >
                        <option value="Both">Both</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </td>

                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={range.minAge}
                          onChange={(e) => handleRangeChange(idx, "minAge", e.target.value)}
                          className="w-12 text-xs border rounded p-1.5 text-center"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={range.maxAge}
                          onChange={(e) => handleRangeChange(idx, "maxAge", e.target.value)}
                          className="w-12 text-xs border rounded p-1.5 text-center"
                        />
                        <select
                          value={range.minAgeUnit}
                          onChange={(e) => {
                            handleRangeChange(idx, "minAgeUnit", e.target.value);
                            handleRangeChange(idx, "maxAgeUnit", e.target.value);
                          }}
                          className="text-xs border rounded p-1.5 bg-white w-20"
                        >
                          <option value="Years">Years</option>
                          <option value="Months">Months</option>
                          <option value="Days">Days</option>
                        </select>
                      </div>
                    </td>

                    <td className="p-2">
                      <select
                        value={range.normalOperator}
                        onChange={(e) => handleRangeChange(idx, "normalOperator", e.target.value)}
                        className="text-xs border rounded p-1.5 bg-white w-28"
                      >
                        <option value="Between">Between</option>
                        <option value="Less Than">Less Than</option>
                        <option value="Greater Than">Greater Than</option>
                        <option value="Equal To">Equal To</option>
                        <option value="Text">Free Text</option>
                      </select>
                    </td>

                    <td className="p-2">
                      {range.normalOperator === "Text" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={range.normalRange || ""}
                            onChange={(e) => handleRangeChange(idx, "normalRange", e.target.value)}
                            className="text-xs border rounded p-1.5 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingRangeIndex(idx)}
                            className="px-2 py-1 text-[10px] font-bold text-[#9575cd] border border-purple-200 rounded hover:bg-purple-50"
                          >
                            Rich Text
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={range.lowRange || ""}
                            onChange={(e) => handleRangeChange(idx, "lowRange", e.target.value)}
                            placeholder="Low"
                            className="w-20 text-xs border rounded p-1.5 text-center"
                          />
                          <span>-</span>
                          <input
                            type="number"
                            step="any"
                            value={range.highRange || ""}
                            onChange={(e) => handleRangeChange(idx, "highRange", e.target.value)}
                            placeholder="High"
                            className="w-20 text-xs border rounded p-1.5 text-center"
                          />
                        </div>
                      )}
                    </td>

                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={range.criticalLow || ""}
                          onChange={(e) => handleRangeChange(idx, "criticalLow", e.target.value)}
                          placeholder="Panic Low"
                          className="w-20 text-xs border rounded p-1.5 text-center border-red-200 bg-red-50/30 text-red-700"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          step="any"
                          value={range.criticalHigh || ""}
                          onChange={(e) => handleRangeChange(idx, "criticalHigh", e.target.value)}
                          placeholder="Panic High"
                          className="w-20 text-xs border rounded p-1.5 text-center border-red-200 bg-red-50/30 text-red-700"
                        />
                      </div>
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRangeRow(idx)}
                        disabled={ranges.length === 1}
                        className="text-slate-400 hover:text-red-500 disabled:opacity-30 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clinical Messages & Guidelines */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9575cd]">
            Clinical Alerts & Interpretation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Low Range Alert Message</label>
              <textarea
                value={formData.lowMessage}
                onChange={(e) => handleChange("lowMessage", e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2.5 h-16 outline-none focus:border-[#9575cd]"
              />
            </div>

            <div>
              <label className={labelClass}>High Range Alert Message</label>
              <textarea
                value={formData.highMessage}
                onChange={(e) => handleChange("highMessage", e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2.5 h-16 outline-none focus:border-[#9575cd]"
              />
            </div>

            <div>
              <label className={labelClass}>Critical / Panic Message</label>
              <textarea
                value={formData.panicMessage}
                onChange={(e) => handleChange("panicMessage", e.target.value)}
                className="w-full text-xs border border-red-200 bg-red-50/20 rounded p-2.5 h-16 outline-none focus:border-red-400 text-red-800"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Parameter Interpretation / Guidelines</label>
            <textarea
              value={formData.interpretation}
              onChange={(e) => handleChange("interpretation", e.target.value)}
              className="w-full text-xs border border-slate-300 rounded p-2.5 h-20 outline-none focus:border-[#9575cd]"
            />
          </div>
        </div>
      </div>

      {/* Rich Text Modal */}
      {editingRangeIndex !== null && (
        <RichTextEditorModal
          isOpen={true}
          onClose={() => setEditingRangeIndex(null)}
          title="Edit Parameter Range Description"
          initialContent={ranges[editingRangeIndex]?.normalRange || ""}
          onSave={handleEditorSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Central Parameter?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to permanently delete this parameter from the Central Library?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{" "}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[280px] md:max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 md:mb-5 border-[3px] md:border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base md:text-xl font-black text-slate-800 tracking-tight text-center">
              Updated Successfully!
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 text-center font-medium">
              {formData.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

