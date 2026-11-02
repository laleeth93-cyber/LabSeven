"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Building2, CheckCircle } from "lucide-react";
import {
  saveCentralDepartment,
  generateCentralDepartmentCode,
} from "@/app/actions/central-departments";
import toast from "react-hot-toast";

export default function AddCentralDepartmentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    async function init() {
      const code = await generateCentralDepartmentCode();
      if (code) setFormData((prev) => ({ ...prev, code }));
    }
    init();
  }, []);

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required.");
      return;
    }

    startTransition(async () => {
      const res = await saveCentralDepartment(formData);
      if (res.success) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          router.push("/super-admin/central-library?tab=Departments");
          router.refresh();
        }, 1200);
      } else {
        toast.error("Error: " + res.message);
      }
    });
  };

  const labelClass = "text-[11px] font-bold text-slate-500 uppercase h-4 flex items-center mb-1";
  const inputClass =
    "w-full text-xs font-medium border border-slate-300 rounded px-3 h-[38px] bg-white focus:ring-1 focus:ring-[#9575cd] outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/central-library?tab=Departments"
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="text-[#9575cd]" size={18} />
            <h1 className="text-base font-bold text-slate-800">Add New Central Department</h1>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-5 py-2 rounded text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{isPending ? "Saving..." : "Save Department"}</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <label className={labelClass}>Department Code (Auto)</label>
            <input
              type="text"
              value={formData.code}
              readOnly
              className={`${inputClass} font-mono bg-slate-50 text-slate-500 cursor-not-allowed`}
            />
          </div>

          <div>
            <label className={labelClass}>Department Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Hematology, Biochemistry, Microbiology"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>Description / Clinical Notes</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded p-2.5 h-24 outline-none focus:border-[#9575cd]"
              placeholder="Optional description of this department..."
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="accent-[#9575cd] rounded"
              />
              <span className="text-xs font-bold text-slate-700">Active Department</span>
            </label>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[280px] md:max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 md:mb-5 border-[3px] md:border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base md:text-xl font-black text-slate-800 tracking-tight text-center">
              Created Successfully!
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

