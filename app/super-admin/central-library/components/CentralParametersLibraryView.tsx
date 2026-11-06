"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Search,
  Filter,
  Loader2,
  FileText,
  Settings,
  Activity,
  Type,
  Edit,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  CloudDownload,
} from "lucide-react";
import {
  getCentralParameters,
  deleteCentralParameter,
  toggleCentralParameterStatus,
  pullCentralParametersData,
} from "@/app/actions/central-parameters";
import { getPullableUserAccounts } from "@/app/actions/central-tests";
import MusicBarLoader from "@/app/components/MusicBarLoader";

export default function CentralParametersLibraryView() {
  const [parameters, setParameters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isPending, startTransition] = useTransition();
  const filterRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [isGoToPopupOpen, setIsGoToPopupOpen] = useState(false);

  useEffect(() => {
    loadParameters();
    loadUserAccounts();
  }, []);

  const loadUserAccounts = async () => {
    try {
      const res = await getPullableUserAccounts();
      if (res && res.success) {
        setUserAccounts(res.data || []);
      }
    } catch (e) {
      console.error("Error loading user accounts:", e);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadParameters = async () => {
    setIsLoading(true);
    try {
      const res = await getCentralParameters();
      if (res && res.success) {
        setParameters(res.data || []);
      } else {
        setParameters([]);
      }
    } catch (error) {
      console.error("Central Parameters Load Error:", error);
      setParameters([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;

    startTransition(async () => {
      const res = await deleteCentralParameter(deleteConfirmId);
      setDeleteConfirmId(null);
      if (res.success) {
        setSuccessMessage("Deleted Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          loadParameters();
        }, 1200);
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: newStatus } : p))
    );

    startTransition(async () => {
      const res = await toggleCentralParameterStatus(id, currentStatus);
      if (!res.success) {
        setParameters((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: currentStatus } : p))
        );
      } else {
        setSuccessMessage(newStatus ? "Enabled Successfully!" : "Disabled Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 1200);
      }
    });
  };

  const handleDataPull = async () => {
    if (isPulling) return;
    setIsPulling(true);
    try {
      const res = await pullCentralParametersData(selectedUserId);
      if (res && res.success) {
        setSuccessMessage(res.message || "Parameter data pulled successfully!");
        setShowSuccessPopup(true);
        await loadParameters();
        setTimeout(() => setShowSuccessPopup(false), 2000);
      } else {
        alert(res?.message || "Failed to pull parameter data.");
      }
    } catch (err: any) {
      console.error("Data pull error:", err);
      alert("An unexpected error occurred during data pull.");
    } finally {
      setIsPulling(false);
    }
  };

  const getCategory = (inputType: string) => {
    if (inputType === "Numerical") return "Quantitative";
    return "Qualitative";
  };

  const filteredParams = parameters.filter((p) => {
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.displayName && p.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesStatus = true;
    if (filterStatus === "Active") matchesStatus = p.isActive === true;
    if (filterStatus === "Inactive") matchesStatus = p.isActive === false;

    let matchesType = true;
    const type = getCategory(p.inputType);
    if (filterType === "Quantitative") matchesType = type === "Quantitative";
    if (filterType === "Qualitative") matchesType = type === "Qualitative";

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredParams.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedParams = filteredParams.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeFilterCount = (filterStatus !== "All" ? 1 : 0) + (filterType !== "All" ? 1 : 0);

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-0 md:p-6 relative font-sans">
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex flex-col h-full overflow-hidden w-full flex-1">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden w-full h-full">
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white">
            <div className="flex items-center gap-2 text-slate-800">
              <Settings className="text-[#9575cd]" size={20} />
              <div>
                <h1 className="text-lg font-bold tracking-tight">Central Parameters Library</h1>
                <p className="text-xs text-slate-500">
                  Master parameter definitions synced across all tenant laboratories
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* User Account / ID Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isPulling}
                  className="h-[24px] xl:h-[26px] pl-2 pr-6 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[11px] xl:text-[12px] font-normal rounded-[5px] shadow-2xs outline-none focus:border-[#9575cd] appearance-none cursor-pointer transition-colors max-w-[190px] truncate disabled:opacity-60"
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
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-2.5 h-[24px] xl:h-[26px] rounded-[5px] text-[11px] xl:text-[12px] font-medium shadow-2xs flex items-center gap-1 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                title="Pull parameter data from selected user account"
              >
                {isPulling ? (
                  <Loader2 size={12} className="animate-spin text-[#9575cd]" />
                ) : (
                  <CloudDownload size={12} className="text-[#9575cd]" />
                )}
                <span>{isPulling ? "Pulling..." : "Data Pull"}</span>
              </button>
              <Link href="/super-admin/central-library/parameters/add" className="shrink-0">
                <button 
                  className="text-white px-2.5 xl:px-3 h-[24px] xl:h-[26px] rounded-[5px] text-[11px] xl:text-[12px] font-medium shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer hover:opacity-95"
                  style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                >
                  <Plus size={13} strokeWidth={2.5} /> Add Parameter
                </button>
              </Link>
            </div>
          </div>

          <div className="px-4 py-2 flex items-center gap-3 shrink-0 bg-white border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={13}
              />
              <input
                type="text"
                placeholder="Search central parameters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 text-[11px] xl:text-[12px] rounded-[5px] border border-slate-300 focus:border-[#9575cd] outline-none"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-[24px] xl:h-[26px] px-2.5 border rounded-[5px] flex items-center gap-1.5 text-[11px] xl:text-[12px] font-medium transition-colors shadow-2xs ${
                  showFilters || activeFilterCount > 0
                    ? "bg-purple-50 border-[#9575cd] text-[#9575cd]"
                    : "bg-white border-slate-300 text-slate-700"
                }`}
              >
                <Filter size={12} /> Filter
                {activeFilterCount > 0 && (
                  <span className="bg-[#9575cd] text-white text-[9px] px-1 py-0.2 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  size={11}
                  className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                      Status
                    </label>
                    <div className="space-y-1">
                      {["All", "Active", "Inactive"].map((status) => (
                        <label
                          key={status}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                        >
                          <input
                            type="radio"
                            name="status"
                            checked={filterStatus === status}
                            onChange={() => setFilterStatus(status)}
                            className="accent-[#9575cd]"
                          />
                          <span className="text-sm text-slate-700">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                      Type
                    </label>
                    <div className="space-y-1">
                      {["All", "Quantitative", "Qualitative"].map((type) => (
                        <label
                          key={type}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                        >
                          <input
                            type="radio"
                            name="type"
                            checked={filterType === type}
                            onChange={() => setFilterType(type)}
                            className="accent-[#9575cd]"
                          />
                          <span className="text-sm text-slate-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setFilterStatus("All");
                        setFilterType("All");
                        setShowFilters(false);
                      }}
                      className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-white">
            <div className="h-[28px] xl:h-[30px] bg-[#9575cd] border-b border-[#7e57c2] flex items-center px-4 shrink-0 text-white font-medium text-[11px] uppercase tracking-wider leading-none">
              <div className="w-36">Code</div>
              <div className="flex-1">Parameter Name</div>
              <div className="flex-1">Associated Test</div>
              <div className="w-20">Units</div>
              <div className="w-20">Type</div>
              <div className="w-20">Format</div>
              <div className="w-20 text-center">Status</div>
              <div className="w-20 text-center">Action</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <MusicBarLoader text="Loading Central Parameters..." />
                </div>
              ) : filteredParams.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <FileText size={48} className="mb-2 opacity-20" />
                  <p className="text-sm">No central parameters found.</p>
                </div>
              ) : (
                paginatedParams.map((param) => (
                  <div
                    key={param.id}
                    className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group"
                  >
                    <div
                      className="w-40 text-xs font-semibold text-slate-700 font-mono truncate pr-4"
                      title={param.code}
                    >
                      {param.code || "-"}
                    </div>
                    <div className="flex-1 text-sm font-medium text-slate-800 truncate pr-4">
                      {param.name}
                    </div>
                    <div className="flex-1 text-xs text-slate-500 truncate pr-4">
                      {param.globalTestName ? (
                        <span className="text-[#7e57c2] font-semibold">
                          {param.globalTestName}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">Global Library</span>
                      )}
                    </div>
                    <div className="w-24 text-xs text-slate-600 font-medium">
                      {param.unit || <span className="text-slate-300">-</span>}
                    </div>

                    <div className="w-24">
                      {getCategory(param.inputType) === "Quantitative" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          <Activity size={10} className="mr-1" /> QUANT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                          <Type size={10} className="mr-1" /> QUAL
                        </span>
                      )}
                    </div>

                    <div className="w-24 text-[11px] font-medium text-slate-500">
                      {param.inputType}
                    </div>

                    <div className="w-24 flex justify-center">
                      <button
                        onClick={() => handleToggleStatus(param.id, param.isActive)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#9575cd] focus:ring-offset-1 ${
                          param.isActive ? "bg-green-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            param.isActive ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="w-24 flex justify-center items-center gap-1">
                      <Link href={`/super-admin/central-library/parameters/edit/${param.id}`}>
                        <button className="p-1.5 hover:bg-purple-50 rounded text-slate-400 hover:text-[#9575cd] transition-colors">
                          <Edit size={14} />
                        </button>
                      </Link>

                      <button
                        onClick={() => handleDeleteClick(param.id)}
                        disabled={isPending}
                        className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                      >
                        {isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="h-14 border-t border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
              <div className="text-xs font-medium text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-700">
                  {filteredParams.length === 0 ? 0 : startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-700">
                  {Math.min(startIndex + ITEMS_PER_PAGE, filteredParams.length)}
                </span>{" "}
                of <span className="font-bold text-slate-700">{filteredParams.length}</span>{" "}
                parameters
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-700 min-w-[80px] text-center">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden p-0 bg-transparent">
        <div className="w-full h-full bg-white rounded-none border-0 overflow-hidden flex flex-col relative">
          <header className="flex flex-col gap-1.5 px-3 py-2 shrink-0 z-20 bg-white">
            <div className="flex items-center gap-1.5 w-full shrink-0">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search central parameters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isPulling}
                  className="h-6 pl-1 pr-4 bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold rounded shadow-2xs outline-none focus:border-[#9575cd] appearance-none max-w-[95px] truncate"
                  title="Select user account"
                >
                  <option value="ALL">All Users</option>
                  {userAccounts.map((u) => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.username}
                    </option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={handleDataPull}
                disabled={isPulling}
                className="h-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-2 rounded text-[10px] font-bold shrink-0 flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Pull parameter data"
              >
                {isPulling ? (
                  <Loader2 size={11} className="animate-spin text-[#9575cd]" />
                ) : (
                  <CloudDownload size={11} className="text-[#9575cd]" />
                )}
                <span>{isPulling ? "Pulling..." : "Pull"}</span>
              </button>

              <Link href="/super-admin/central-library/parameters/add">
                <button className="h-6 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-2 rounded text-[10px] font-bold shrink-0 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95">
                  <Plus size={12} strokeWidth={2.5} /> Add New
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-1.5 w-full py-0.5">
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-6 pl-2 pr-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors"
                >
                  <option value="All">All Types</option>
                  <option value="Quantitative">Quant</option>
                  <option value="Qualitative">Qual</option>
                </select>
                <ChevronDown
                  size={10}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-6 pl-2 pr-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown
                  size={10}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              <div className="ml-auto flex items-center shrink-0">
                <span className="text-[9.5px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                  {filteredParams.length === 0
                    ? "0 of 0"
                    : `${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredParams.length)} of ${filteredParams.length}`}
                </span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto w-full px-2.5 py-2 bg-white flex flex-col gap-2 pb-16 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <MusicBarLoader text="Loading Central Parameters..." />
              </div>
            ) : filteredParams.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <FileText size={32} className="mb-2 opacity-30" />
                <p className="text-[11px] font-medium">No central parameters found.</p>
              </div>
            ) : (
              paginatedParams.map((param) => {
                const isQuant = getCategory(param.inputType) === "Quantitative";
                return (
                  <div
                    key={param.id}
                    className="bg-white rounded-lg border border-slate-200 shadow-2xs p-2.5 flex flex-col gap-1.5 relative"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800 text-[11px] leading-tight truncate">
                            {param.name}
                          </span>
                          {isQuant ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7.5px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              QUANT
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[7.5px] font-bold bg-purple-50 text-purple-600 border border-purple-100">
                              QUAL
                            </span>
                          )}
                        </div>
                        {param.displayName && param.displayName !== param.name && (
                          <span className="text-[9px] text-slate-400 truncate">
                            {param.displayName}
                          </span>
                        )}
                        {param.globalTestName && (
                          <span className="text-[8.5px] text-[#7e57c2] font-semibold truncate">
                            Test: {param.globalTestName}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded text-[8px] border border-slate-200 shrink-0">
                        {param.code || "-"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span>
                        Unit: <strong className="text-slate-700">{param.unit || "-"}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Format: <strong className="text-slate-700">{param.inputType}</strong>
                      </span>
                      {param.decimals && param.inputType === "Numerical" && (
                        <>
                          <span>•</span>
                          <span>
                            Dec: <strong className="text-slate-700">{param.decimals}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(param.id, param.isActive)}
                          className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${
                            param.isActive ? "bg-green-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                              param.isActive ? "translate-x-[11px]" : "translate-x-[2px]"
                            }`}
                          />
                        </button>
                        <span className="text-[8.5px] font-medium text-slate-500">
                          {param.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/super-admin/central-library/parameters/edit/${param.id}`}
                          className="text-[#9575cd] flex items-center gap-0.5 text-[9px] font-bold active:opacity-70"
                        >
                          <Edit size={10} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(param.id)}
                          disabled={isPending}
                          className="text-red-500 flex items-center gap-0.5 text-[9px] font-bold active:opacity-70"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between rounded-none border-t border-slate-100">
            <Link
              href="/super-admin/central-library"
              className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-0.5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>{" "}
              Back
            </Link>

            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all shadow-2xs"
                title="Previous Page"
              >
                <ChevronLeft size={11} />
              </button>
              <span className="text-[9.5px] font-bold text-slate-700 min-w-[34px] text-center select-none">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-5 h-5 flex items-center justify-center rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all shadow-2xs"
                title="Next Page"
              >
                <ChevronRight size={11} />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsGoToPopupOpen(!isGoToPopupOpen)}
                className={`h-6 px-3 flex items-center justify-center font-medium text-[9px] rounded transition-colors border ${
                  isGoToPopupOpen
                    ? "bg-slate-200 text-slate-800 border-slate-300"
                    : "bg-slate-50 text-slate-500 border-slate-100"
                }`}
              >
                Go to
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="ml-1"
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </button>

              {isGoToPopupOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-in slide-in-from-bottom-2 fade-in duration-200 z-[60]">
                  <Link
                    href="/super-admin/central-library?tab=Departments"
                    className="block w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Departments
                  </Link>
                  <Link
                    href="/super-admin/central-library?tab=Test"
                    className="block w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Central Tests
                  </Link>
                  <Link
                    href="/super-admin/central-library?tab=Format"
                    className="block w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Formats
                  </Link>
                  <Link
                    href="/super-admin/central-library?tab=Queue"
                    className="block w-full text-left px-3 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Review Queue
                  </Link>
                  <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed md:absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[280px] md:max-w-sm overflow-hidden p-4 md:p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 border-[3px] md:border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1.5 md:mb-2">
              Delete Central Parameter?
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">
              Are you sure you want to delete this parameter from the central master library?
            </p>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-1.5 md:py-2.5 text-xs md:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 py-1.5 md:py-2.5 text-xs md:text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{" "}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed md:absolute inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[280px] md:max-w-sm w-full mx-4 border border-slate-100">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3 md:mb-5 border-[3px] md:border-[4px] border-emerald-100">
              <CheckCircle className="text-emerald-500" size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-base md:text-xl font-black text-slate-800 tracking-tight text-center">
              {successMessage}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}

