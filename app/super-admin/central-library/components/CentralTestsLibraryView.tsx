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
  FlaskConical,
  Edit,
  ChevronDown,
  LayoutGrid,
  Archive,
  MoreHorizontal,
  Microscope,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CloudDownload,
} from "lucide-react";
import MusicBarLoader from "@/app/components/MusicBarLoader";
import {
  getCentralTests,
  deleteCentralTest,
  toggleCentralTestStatus,
  pullCentralTestsData,
  getPullableUserAccounts,
} from "@/app/actions/central-tests";

export default function CentralTestsLibraryView({
  initialType = "All",
}: {
  initialType?: string;
}) {
  const [tests, setTests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState("All");
  const [filterType, setFilterType] = useState(initialType);
  const [filterStatus, setFilterStatus] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isPending, startTransition] = useTransition();
  const filterRef = useRef<HTMLDivElement>(null);
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");

  useEffect(() => {
    loadTests();
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
    setFilterType(initialType);
  }, [initialType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterType, filterStatus]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (mobileFilterRef.current && !mobileFilterRef.current.contains(event.target as Node)) {
        setShowMobileFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const res = await getCentralTests();
      if (res && res.success) {
        setTests(res.data || []);
      } else {
        setTests([]);
      }
    } catch (error) {
      console.error("Central Tests Load Error:", error);
      setTests([]);
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
      const res = await deleteCentralTest(deleteConfirmId);
      setDeleteConfirmId(null);

      if (res.success) {
        setSuccessMessage("Deleted Successfully!");
        setShowSuccessPopup(true);
        setTimeout(() => {
          setShowSuccessPopup(false);
          loadTests();
        }, 1200);
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !currentStatus } : t))
    );

    startTransition(async () => {
      await toggleCentralTestStatus(id, currentStatus);
      setSuccessMessage(!currentStatus ? "Enabled Successfully!" : "Disabled Successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 1200);
    });
  };

  const handleDataPull = async () => {
    if (isPulling) return;
    setIsPulling(true);
    try {
      const res = await pullCentralTestsData(selectedUserId);
      if (res && res.success) {
        setSuccessMessage(res.message || "Test data pulled successfully!");
        setShowSuccessPopup(true);
        await loadTests();
        setTimeout(() => setShowSuccessPopup(false), 2000);
      } else {
        alert(res?.message || "Failed to pull test data.");
      }
    } catch (err: any) {
      console.error("Data pull error:", err);
      alert("An unexpected error occurred during data pull.");
    } finally {
      setIsPulling(false);
    }
  };

  const uniqueDepartments = Array.from(
    new Set(tests.map((t) => t.department || t.category).filter(Boolean))
  ).sort() as string[];

  const stats = {
    total: tests.length,
    test: tests.filter((t) => (t.type || "Test") === "Test").length,
    package: tests.filter((t) => t.type === "Package").length,
    other: tests.filter((t) => t.type === "Other").length,
    outsource: tests.filter((t) => t.isOutsourced === true).length,
  };

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.displayName && t.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesDept = true;
    if (filterDepartment !== "All") {
      const deptName = t.department || t.category || "";
      matchesDept = deptName === filterDepartment;
    }

    let matchesType = true;
    if (filterType === "Outsource") {
      matchesType = t.isOutsourced === true;
    } else if (filterType !== "All") {
      matchesType = (t.type || "Test") === filterType;
    }

    let matchesStatus = true;
    if (filterStatus === "Active") matchesStatus = t.isActive === true;
    if (filterStatus === "Inactive") matchesStatus = t.isActive === false;

    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTests = filteredTests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const activeFilterCount =
    (filterDepartment !== "All" ? 1 : 0) + (filterStatus !== "All" ? 1 : 0);

  const colWidths = {
    code: "w-28",
    name: "flex-1 min-w-[160px]",
    display: "flex-1 min-w-[150px]",
    dept: "w-32",
    price: "w-24",
    type: "w-24",
    status: "w-20",
    action: "w-20",
  };

  return (
    <div className="flex flex-col w-full h-full p-0 relative font-sans">
      {/* --- DESKTOP LAYOUT --- */}
      <div className="hidden md:flex flex-col h-full overflow-hidden">
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-slate-800">
              <FlaskConical className="text-[#9575cd]" size={24} />
              <div>
                <h1 className="text-xl font-bold tracking-tight">Central Tests Overview</h1>
                <p className="text-xs text-slate-500">Master templates and definitions synced across all tenant labs</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* User Account / ID Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={isPulling}
                  className="h-8 pl-2.5 pr-7 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md shadow-2xs outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] appearance-none cursor-pointer transition-colors max-w-[210px] truncate disabled:opacity-60"
                  title="Select user account to pull data from"
                >
                  <option value="ALL">All User Accounts</option>
                  {userAccounts.map((u) => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.username} ({u.orgName})
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={handleDataPull}
                disabled={isPulling}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 h-8 rounded-md text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 cursor-pointer shrink-0"
                title="Pull test data from selected user account"
              >
                {isPulling ? (
                  <Loader2 size={14} className="animate-spin text-[#9575cd]" />
                ) : (
                  <CloudDownload size={14} className="text-[#9575cd]" />
                )}
                <span>{isPulling ? "Pulling Data..." : "Data Pull"}</span>
              </button>
              <Link href="/super-admin/central-library/tests/add" className="shrink-0">
                <button className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-3.5 h-8 rounded-md text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer">
                  <Plus size={15} /> ADD NEW CENTRAL TEST
                </button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard
              label="Total Tests"
              count={stats.total}
              icon={<LayoutGrid size={18} />}
              color="text-slate-600"
              bg="bg-white"
              border="border-slate-200"
              isActive={filterType === "All"}
              onClick={() => setFilterType("All")}
            />
            <StatCard
              label="Tests"
              count={stats.test}
              icon={<FlaskConical size={18} />}
              color="text-blue-600"
              bg="bg-blue-50"
              border="border-blue-100"
              isActive={filterType === "Test"}
              onClick={() => setFilterType("Test")}
            />
            <StatCard
              label="Packages"
              count={stats.package}
              icon={<Archive size={18} />}
              color="text-purple-600"
              bg="bg-purple-50"
              border="border-purple-100"
              isActive={filterType === "Package"}
              onClick={() => setFilterType("Package")}
            />
            <StatCard
              label="Others"
              count={stats.other}
              icon={<MoreHorizontal size={18} />}
              color="text-orange-600"
              bg="bg-orange-50"
              border="border-orange-100"
              isActive={filterType === "Other"}
              onClick={() => setFilterType("Other")}
            />
            <StatCard
              label="Outsourced"
              count={stats.outsource}
              icon={<Microscope size={18} />}
              color="text-teal-600"
              bg="bg-teal-50"
              border="border-teal-100"
              isActive={filterType === "Outsource"}
              onClick={() => setFilterType("Outsource")}
            />
          </div>
        </div>

        <div className="flex-1 bg-white border-t border-slate-200 flex flex-col overflow-hidden w-full h-full rounded-none shadow-none">
          <div className="px-6 py-4 flex items-center gap-4 shrink-0 bg-white border-b border-slate-50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search central tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] outline-none"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 px-4 border rounded-lg flex items-center gap-2 text-xs font-bold transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? "bg-purple-50 border-[#9575cd] text-[#9575cd]"
                    : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <Filter size={14} /> FILTER{" "}
                {activeFilterCount > 0 && (
                  <span className="bg-[#9575cd] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  size={12}
                  className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
                />
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                      Department
                    </label>
                    <div className="relative">
                      <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full text-sm font-medium border border-slate-200 rounded-md px-3 h-9 bg-white focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none appearance-none text-slate-700"
                      >
                        <option value="All">All Departments</option>
                        {uniqueDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                      Status
                    </label>
                    <div className="space-y-1">
                      {["All", "Active", "Inactive"].map((s) => (
                        <label
                          key={s}
                          className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded transition-colors"
                        >
                          <input
                            type="radio"
                            checked={filterStatus === s}
                            onChange={() => setFilterStatus(s)}
                            className="accent-[#9575cd] w-4 h-4"
                          />
                          <span className="text-sm text-slate-700 font-medium">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setFilterDepartment("All");
                        setFilterType(initialType);
                        setFilterStatus("All");
                        setShowFilters(false);
                      }}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 shrink-0 gap-4">
            <div className={`${colWidths.code} text-[10px] font-bold text-slate-500 uppercase`}>Code</div>
            <div className={`${colWidths.name} text-[10px] font-bold text-slate-500 uppercase`}>Test Name</div>
            <div className={`${colWidths.display} text-[10px] font-bold text-slate-500 uppercase`}>Display Name</div>
            <div className={`${colWidths.dept} text-[10px] font-bold text-slate-500 uppercase`}>Department</div>
            <div className={`${colWidths.price} text-[10px] font-bold text-slate-500 uppercase`}>Price</div>
            <div className={`${colWidths.type} text-center text-[10px] font-bold text-slate-500 uppercase`}>Type</div>
            <div className={`${colWidths.status} text-center text-[10px] font-bold text-slate-500 uppercase`}>Status</div>
            <div className={`${colWidths.action} text-center text-[10px] font-bold text-slate-500 uppercase`}>Action</div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <MusicBarLoader text="Loading Central Tests..." />
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <FileText size={48} className="mb-2 opacity-20" />
                <p className="text-sm">No central tests found.</p>
                <Link href="/super-admin/central-library/tests/add" className="mt-2 text-xs text-[#9575cd] font-bold hover:underline">
                  + Add First Central Test
                </Link>
              </div>
            ) : (
              paginatedTests.map((test) => (
                <div
                  key={test.id}
                  className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group gap-4"
                >
                  <div className={`${colWidths.code} text-xs font-semibold text-slate-700 font-mono truncate`}>
                    {test.code}
                  </div>
                  <div className={`${colWidths.name} text-sm font-medium text-slate-800 truncate`}>
                    {test.name}
                  </div>
                  <div className={`${colWidths.display} text-xs text-slate-500 truncate`}>
                    {test.displayName || "-"}
                  </div>
                  <div className={`${colWidths.dept} text-xs text-slate-600 font-medium truncate`}>
                    {test.department || "-"}
                  </div>
                  <div className={`${colWidths.price} text-xs font-bold text-slate-700`}>
                    {Number(test.price)?.toFixed(2)}
                  </div>
                  <div className={`${colWidths.type} flex justify-center`}>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        test.type === "Package"
                          ? "bg-purple-50 text-purple-600 border-purple-100"
                          : test.type === "Other"
                          ? "bg-orange-50 text-orange-600 border-orange-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                    >
                      {test.type || "Test"}
                    </span>
                  </div>

                  <div className={`${colWidths.status} flex justify-center`}>
                    <button
                      onClick={() => handleToggleStatus(test.id, test.isActive)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        test.isActive ? "bg-green-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          test.isActive ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className={`${colWidths.action} flex justify-center items-center gap-2`}>
                    <Link href={`/super-admin/central-library/tests/edit/${test.id}`}>
                      <button className="p-1.5 hover:bg-purple-50 rounded text-slate-400 hover:text-[#9575cd] transition-colors" title="Edit Central Test">
                        <Edit size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(test.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Central Test"
                    >
                      <Trash2 size={14} />
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
                {filteredTests.length === 0 ? 0 : startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-700">
                {Math.min(startIndex + ITEMS_PER_PAGE, filteredTests.length)}
              </span>{" "}
              of <span className="font-bold text-slate-700">{filteredTests.length}</span> central tests
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

      {/* --- MOBILE LAYOUT --- */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden p-0 bg-transparent">
        <div className="w-full h-full bg-white rounded-none border-0 overflow-hidden flex flex-col relative">
          <header className="flex flex-col gap-1.5 px-2 py-2 shrink-0 z-20 bg-white border-b border-slate-100">
            <div className="flex items-center gap-1.5 w-full shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                <input
                  type="text"
                  placeholder="Search central tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 h-6 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#9575cd] transition-all"
                />
              </div>

              <div className="relative" ref={mobileFilterRef}>
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={`h-6 px-2 border rounded flex items-center gap-1 text-[10px] font-bold transition-colors ${
                    showMobileFilters || activeFilterCount > 0
                      ? "bg-purple-50 border-[#9575cd] text-[#9575cd]"
                      : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <Filter size={11} />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-[#9575cd] text-white text-[8px] px-1 py-0.2 rounded-full leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {showMobileFilters && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-3 animate-in fade-in zoom-in-95 duration-100">
                    <div className="mb-2.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                        Department
                      </label>
                      <div className="relative">
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 rounded px-2 h-7 bg-white focus:border-[#9575cd] outline-none appearance-none text-slate-700"
                        >
                          <option value="All">All Departments</option>
                          {uniqueDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                      </div>
                    </div>

                    <div className="mb-2.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">
                        Status
                      </label>
                      <div className="flex gap-1.5">
                        {["All", "Active", "Inactive"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFilterStatus(s)}
                            className={`flex-1 py-1 text-[10px] font-semibold rounded border transition-colors ${
                              filterStatus === s
                                ? "bg-purple-50 border-[#9575cd] text-[#9575cd]"
                                : "border-slate-200 text-slate-600 bg-white"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => {
                          setFilterDepartment("All");
                          setFilterStatus("All");
                          setShowMobileFilters(false);
                        }}
                        className="flex-1 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="flex-1 py-1 text-[10px] font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
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
                title="Pull test data"
              >
                {isPulling ? (
                  <Loader2 size={11} className="animate-spin text-[#9575cd]" />
                ) : (
                  <CloudDownload size={11} className="text-[#9575cd]" />
                )}
                <span>{isPulling ? "Pulling..." : "Pull"}</span>
              </button>

              <Link href="/super-admin/central-library/tests/add">
                <button className="h-6 bg-[#9575cd] hover:bg-[#7e57c2] text-white px-2 rounded text-[10px] font-bold shrink-0 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95">
                  <Plus size={12} strokeWidth={2.5} /> Add New
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "All", label: "All", count: stats.total },
                { id: "Test", label: "Tests", count: stats.test },
                { id: "Package", label: "Packages", count: stats.package },
                { id: "Other", label: "Others", count: stats.other },
                { id: "Outsource", label: "Outsourced", count: stats.outsource },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setFilterType(chip.id)}
                  className={`shrink-0 px-2 h-5 rounded-full text-[9px] font-semibold flex items-center gap-1 border transition-all ${
                    filterType === chip.id
                      ? "bg-[#9575cd] text-white border-[#9575cd] shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`px-1 py-0 rounded-full text-[8px] ${
                      filterType === chip.id ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {chip.count}
                  </span>
                </button>
              ))}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto w-full px-0 py-0 bg-white flex flex-col pb-24 custom-scrollbar divide-y divide-slate-100">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <MusicBarLoader text="Loading Central Tests..." />
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <FileText size={32} className="mb-1 opacity-25" />
                <p className="text-xs font-medium">No central tests found.</p>
              </div>
            ) : (
              <>
                {paginatedTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white rounded-none border-0 shadow-none px-3 py-2.5 flex flex-col gap-1.5 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium text-slate-800 text-xs truncate">{test.name}</span>
                        {test.displayName && test.displayName !== test.name && (
                          <span className="text-[10px] text-slate-400 truncate">{test.displayName}</span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 bg-slate-50 px-1 py-0.5 rounded text-[8px] border border-slate-200 shrink-0">
                        {test.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {test.department && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-medium truncate max-w-[120px]">
                            {test.department}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            test.type === "Package"
                              ? "bg-purple-50 text-purple-600 border-purple-100"
                              : "bg-blue-50 text-blue-600 border-blue-100"
                          }`}
                        >
                          {test.type || "Test"}
                        </span>
                        {test.isOutsourced && (
                          <span className="bg-teal-50 text-teal-600 border border-teal-100 px-1.5 py-0.5 rounded text-[9px] font-medium">
                            Outsourced
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] text-slate-400 mr-0.5">₹</span>
                        <span className="font-bold text-slate-800 text-xs">
                          {Number(test.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-0.5 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(test.id, test.isActive)}
                          disabled={isPending}
                          className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${
                            test.isActive ? "bg-green-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                              test.isActive ? "translate-x-[11px]" : "translate-x-[2px]"
                            }`}
                          />
                        </button>
                        <span className="text-[9px] text-slate-500">
                          {test.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/super-admin/central-library/tests/edit/${test.id}`}
                          className="text-[#9575cd] flex items-center gap-1 text-[9px] font-medium active:opacity-70"
                        >
                          <Edit size={10} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(test.id)}
                          className="text-red-500 flex items-center gap-1 text-[9px] font-medium active:opacity-70"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center pt-2 pb-1 text-[9px] text-slate-400 shrink-0">
                    <span>
                      Showing {filteredTests.length === 0 ? 0 : startIndex + 1}-
                      {Math.min(startIndex + ITEMS_PER_PAGE, filteredTests.length)} of{" "}
                      {filteredTests.length} tests
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white p-2 z-[50] pb-safe flex items-center justify-between border-t border-slate-100 shadow-sm">
            <button
              onClick={() => window.history.back()}
              className="h-6 px-2 flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600 font-medium text-[9px] rounded shrink-0 active:scale-95 transition-all"
            >
              <ChevronLeft size={12} className="mr-0.5" /> Back
            </button>

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

            <div className="text-[10px] font-semibold text-slate-400">
              Central HQ
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[280px] md:max-w-sm overflow-hidden p-4 md:p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 border-[3px] md:border-[4px] border-red-100">
              <AlertTriangle className="text-red-500" size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1.5 md:mb-2">Delete Central Test?</h3>
            <p className="text-xs md:text-sm text-slate-500 mb-4 md:mb-6">
              Are you sure you want to delete this central test? This action will remove the central definition.
            </p>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-7 md:h-auto py-1 md:py-2.5 text-xs md:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 h-7 md:h-auto py-1 md:py-2.5 text-xs md:text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded shadow-sm transition-colors flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-70"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-[260px] md:max-w-sm w-full mx-4 border border-slate-100">
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

function StatCard({ label, count, icon, color, bg, border, isActive, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-all duration-200 ${bg} border ${border} ${
        isActive
          ? "shadow-md opacity-100 ring-2 ring-[#9575cd]/30"
          : "shadow-none hover:shadow-sm opacity-60 hover:opacity-100"
      } rounded-lg p-4 flex items-center justify-between cursor-pointer active:scale-[0.98]`}
    >
      <div>
        <p className={`text-[11px] font-bold uppercase ${color} opacity-80 mb-1`}>{label}</p>
        <p className={`text-2xl font-black ${color}`}>{count}</p>
      </div>
      <div className={`p-3 rounded-full bg-white bg-opacity-60 ${color}`}>{icon}</div>
    </button>
  );
}
