"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  getCentralDepartments,
  saveCentralDepartment,
  deleteCentralDepartment,
  toggleCentralDepartmentStatus,
  generateCentralDepartmentCode,
} from "@/app/actions/central-departments";
import MusicBarLoader from "@/app/components/MusicBarLoader";

export default function CentralDepartmentsView() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getCentralDepartments();
      if (res && res.success) {
        setDepartments(res.data || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error("Central Departments Load Error:", error);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    setEditingId(null);
    const autoCode = await generateCentralDepartmentCode();
    setFormData({ name: "", code: autoCode, description: "", isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description || "",
      isActive: item.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return alert("Department Name is required");

    startTransition(async () => {
      const res = await saveCentralDepartment({ ...formData, id: editingId });
      if (res.success) {
        setIsModalOpen(false);
        setSuccessMessage(editingId ? "Updated Successfully!" : "Created Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          loadData();
        }, 1200);
      } else {
        alert(res.message || "Failed to save department");
      }
    });
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;

    startTransition(async () => {
      const res = await deleteCentralDepartment(deleteConfirmId);
      setDeleteConfirmId(null);
      if (res.success) {
        setSuccessMessage("Deleted Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          loadData();
        }, 1200);
      } else {
        alert(res.message || "Failed to delete department");
      }
    });
  };

  const handleToggle = (id: number, currentStatus: boolean) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isActive: !currentStatus } : d))
    );

    startTransition(async () => {
      await toggleCentralDepartmentStatus(id, currentStatus);

      setSuccessMessage(!currentStatus ? "Enabled Successfully!" : "Disabled Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 1200);
    });
  };

  const filteredList = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 space-y-2">
      {/* FILTER & ACTIONS BAR AS SEPARATE CARD BLOCK */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-2 xl:p-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleAdd}
            className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
            style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
          >
            <Plus size={13} strokeWidth={2.5} /> Add Department
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW AS SEPARATE BLOCK */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse border-spacing-0 whitespace-nowrap">
            <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
              <tr>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Code</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Department Name</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Description</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <MusicBarLoader text="Loading Departments..." />
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs italic">
                    No central departments found.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors border-b border-[#d9d9d9]">
                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="font-mono text-slate-600 text-[11px] font-medium">
                      {item.code}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                      <span className="font-semibold text-slate-800 text-[11px] xl:text-[12px]">{item.name}</span>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-slate-500 text-[11px] truncate max-w-md">
                      {item.description || "-"}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <button
                        onClick={() => handleToggle(item.id, item.isActive)}
                        disabled={isPending}
                        className={`h-[20px] px-2 text-[10px] font-semibold rounded shadow-2xs transition-colors ${
                          item.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {item.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="h-[22px] w-[22px] rounded border border-slate-200 text-teal-600 hover:bg-teal-50 flex items-center justify-center shadow-2xs transition-colors"
                          title="Edit Department"
                        >
                          <Edit size={13} strokeWidth={2}/>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="h-[22px] w-[22px] rounded border border-rose-200 text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-2xs transition-colors"
                          title="Delete Department"
                        >
                          <Trash2 size={13} strokeWidth={2}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PINNED TABLE FOOTER */}
        <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div>
            Showing: <strong className="text-slate-700">{filteredList.length} of {departments.length} Departments</strong>
          </div>
          <div className="text-[10px] text-slate-400">
            Departments automatically seed into new laboratory accounts
          </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-2 pb-6">
        {filteredList.map((item) => (
          <article key={item.id} className="rounded-[6px] border border-slate-200 bg-white p-2.5 shadow-2xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-xs" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>{item.name}</span>
              <span className="font-mono text-[9px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                {item.code}
              </span>
            </div>
            {item.description && (
              <p className="text-[10px] text-slate-400">{item.description}</p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <button
                onClick={() => handleToggle(item.id, item.isActive)}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${
                  item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
              >
                {item.isActive ? "Active" : "Disabled"}
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEdit(item)}
                  className="h-6 w-6 rounded border border-slate-200 text-teal-600 flex items-center justify-center"
                >
                  <Edit size={12} />
                </button>
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  className="h-6 w-6 rounded border border-rose-200 text-rose-600 flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in p-3">
          <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
              <h3 className="font-semibold text-[15px] xl:text-[16px] text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                {editingId ? <Edit size={14} className="text-[#9575cd]"/> : <Plus size={14} className="text-[#9575cd]"/>}
                {editingId ? "Edit" : "Add"} Central Department
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                  Department Name <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"
                  placeholder="e.g. Hematology"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                  Code (Auto)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  readOnly
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-mono border border-slate-200 rounded-[5px] px-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-[11px] border border-slate-300 rounded-[5px] px-2.5 py-1.5 focus:outline-none focus:border-[#9575cd] h-14 resize-none"
                  placeholder="Optional details..."
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-normal text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center border border-slate-200">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-rose-100">
              <AlertTriangle className="text-rose-500" size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-[16px] font-semibold text-slate-800 mb-1 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              Delete Central Department?
            </h3>
            <p className="text-[12px] text-slate-500 mb-4 font-normal">
              Are you sure you want to delete this central department? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="h-[26px] px-3 text-[11px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="h-[26px] px-3.5 text-[11px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-[5px] shadow-2xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-[10px] p-5 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200 max-w-xs w-full border border-slate-200">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2.5 border-2 border-emerald-100">
              <CheckCircle className="text-emerald-500" size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 tracking-tight text-center" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              {successMessage}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}
