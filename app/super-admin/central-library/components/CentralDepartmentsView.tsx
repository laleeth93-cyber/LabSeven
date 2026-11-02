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
      await deleteCentralDepartment(deleteConfirmId);
      setDeleteConfirmId(null);

      setSuccessMessage("Deleted Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        loadData();
      }, 1200);
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
    <div className="flex flex-col w-full h-full bg-slate-50 p-2 md:p-6 font-sans relative">
      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[280px] md:max-w-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                {editingId ? "Edit" : "Add"} Central Department
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-[11px] h-7 border border-slate-300 rounded px-2 outline-none focus:border-[#9575cd]"
                  placeholder="e.g. Hematology"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                  Code (Auto)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  readOnly
                  className="w-full text-[11px] h-7 border border-slate-200 rounded px-2 outline-none bg-slate-100 text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-[11px] border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-[#9575cd] h-12 resize-none"
                  placeholder="Optional details..."
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-7 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex-1 h-7 text-[10px] font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}{" "}
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Department?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this central master department?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex flex-col h-full overflow-hidden">
        {/* HEADER */}
        <div className="h-16 bg-white border border-slate-200 rounded-t-xl flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-800">
            <Building2 className="text-[#9575cd]" size={20} />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Central Department Master</h1>
              <p className="text-xs text-slate-500">
                Master laboratory departments seeded across all newly created tenant laboratories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/super-admin/central-library/departments/add">
              <button className="border border-[#9575cd] text-[#9575cd] hover:bg-purple-50 px-3 py-2 rounded-md text-xs font-bold transition-all">
                Full Page Add
              </button>
            </Link>
            <button
              onClick={handleAdd}
              className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={16} /> ADD NEW
            </button>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white border-x border-b border-slate-200 px-6 py-4 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search central departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] outline-none transition-all"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="flex-1 bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden flex flex-col">
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
            <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Code</div>
            <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">
              Department Name
            </div>
            <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">
              Description
            </div>
            <div className="w-20 text-center text-[10px] font-bold text-slate-500 uppercase">
              Status
            </div>
            <div className="w-24 text-center text-[10px] font-bold text-slate-500 uppercase">
              Action
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <MusicBarLoader text="Loading Departments..." />
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <p className="text-xs">No central departments found.</p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group gap-4"
                >
                  <div className="w-24 text-xs font-mono font-semibold text-slate-600">
                    {item.code}
                  </div>
                  <div className="flex-1 text-sm font-medium text-slate-700">{item.name}</div>
                  <div className="flex-1 text-xs text-slate-400 truncate">
                    {item.description || "-"}
                  </div>

                  <div className="w-20 flex justify-center">
                    <button
                      onClick={() => handleToggle(item.id, item.isActive)}
                      disabled={isPending}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                        item.isActive ? "bg-green-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                          item.isActive ? "translate-x-3.5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="w-24 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-[#9575cd] transition-colors p-1"
                      title="Quick Edit Modal"
                    >
                      <Edit size={14} />
                    </button>

                    <Link
                      href={`/super-admin/central-library/departments/edit/${item.id}`}
                      className="text-slate-400 hover:text-purple-600 transition-colors text-[10px] font-bold"
                      title="Full Page Edit"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden flex-col h-full overflow-hidden bg-white rounded-lg border border-slate-200">
        <div className="p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-[#9575cd]" size={16} />
            <h1 className="text-xs font-bold text-slate-800">Departments</h1>
          </div>
          <button
            onClick={handleAdd}
            className="h-6 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-2.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus size={12} /> Add
          </button>
        </div>

        <div className="p-2 border-b border-slate-100">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 h-7 text-[10px] border border-slate-200 rounded outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-white border border-slate-200 rounded-lg flex flex-col gap-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">{item.name}</span>
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
                  className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    item.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-[#9575cd] text-[10px] font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="text-red-500 text-[10px] font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[280px] w-full border border-slate-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 border-[3px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base font-black text-slate-800 text-center">{successMessage}</h2>
          </div>
        </div>
      )}
    </div>
  );
}

