"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertCircle, FileCode2, ArrowLeft, CloudDownload, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import CentralTestListPanel from "../formats/components/CentralTestListPanel";
import CentralFormatEditor from "../formats/components/CentralFormatEditor";
import {
  getCentralTestsForFormats,
  getCentralTestFormatDetails,
  pullCentralFormatsData,
} from "@/app/actions/central-formats";
import { getPullableUserAccounts } from "@/app/actions/central-tests";
import MusicBarLoader from "@/app/components/MusicBarLoader";

export default function CentralFormatsView({
  initialTestId,
}: {
  initialTestId?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");

  const [allTests, setAllTests] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [availableParams, setAvailableParams] = useState<any[]>([]);

  const [selectedTestId, setSelectedTestId] = useState<string | null>(initialTestId || null);
  const [selectedTestFull, setSelectedTestFull] = useState<any>(null);

  const [sidebarTab, setSidebarTab] = useState<"pending" | "completed">("pending");
  const [mobileView, setMobileView] = useState<"list" | "editor">(initialTestId ? "editor" : "list");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const tRes = await getCentralTestsForFormats();
      if (tRes.success && tRes.data) {
        setAllTests(tRes.data);

        // Extract departments
        const depts = Array.from(
          new Set(tRes.data.map((t: any) => t.department).filter(Boolean))
        ).map((name, idx) => ({ id: idx + 1, name }));
        setDepartments(depts);

        // If initialTestId was passed or if tests exist
        const targetId = initialTestId || (tRes.data.length > 0 ? tRes.data[0].id : null);
        if (targetId) {
          setSelectedTestId(targetId);
          const fullRes = await getCentralTestFormatDetails(targetId);
          if (fullRes.success && fullRes.data) {
            setSelectedTestFull(fullRes.data.test);
            setAvailableParams(fullRes.data.availableParams || []);
          }
        }
      }
    } catch (err) {
      console.error("Central Formats Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const refreshData = async () => {
    const res = await getCentralTestsForFormats();
    if (res.success && res.data) {
      setAllTests(res.data);
      if (selectedTestId) {
        const fullRes = await getCentralTestFormatDetails(selectedTestId);
        if (fullRes.success && fullRes.data) {
          setSelectedTestFull(fullRes.data.test);
          setAvailableParams(fullRes.data.availableParams || []);
        }
      }
    }
  };

  const { pendingList, completedList } = useMemo(() => {
    const pending: any[] = [];
    const completed: any[] = [];

    allTests.forEach((test) => {
      if (test.isConfigured) completed.push(test);
      else pending.push(test);
    });

    return { pendingList: pending, completedList: completed };
  }, [allTests]);

  const handleSelectTest = async (test: any) => {
    setSelectedTestId(test.id);
    setIsLoadingDetails(true);
    setMobileView("editor");

    try {
      const res = await getCentralTestFormatDetails(test.id);
      if (res.success && res.data) {
        setSelectedTestFull(res.data.test);
        setAvailableParams(res.data.availableParams || []);
      }
    } catch (e) {
      console.error("Error loading test details:", e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDataPull = async () => {
    if (isPulling) return;
    setIsPulling(true);
    try {
      const res = await pullCentralFormatsData(selectedUserId);
      if (res && res.success) {
        setSuccessMessage(res.message || "Format data pulled successfully!");
        setShowSuccessPopup(true);
        await loadData();
        setTimeout(() => setShowSuccessPopup(false), 2000);
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

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <MusicBarLoader text="Loading Central Formats..." />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50 font-sans">
      {/* DESKTOP HEADER */}
      <div className="hidden md:flex h-16 border-b border-slate-200 bg-white px-6 shrink-0 items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <CheckCircle2 className="text-[#9575cd]" size={20} />
          <div>
            <h1 className="text-lg font-bold tracking-tight">Central Formats Library</h1>
            <p className="text-xs text-slate-500">
              Master report templates and layout configurations synced across all tenant laboratories
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
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
            title="Pull report format data from selected user account"
          >
            {isPulling ? (
              <Loader2 size={14} className="animate-spin text-[#9575cd]" />
            ) : (
              <CloudDownload size={14} className="text-[#9575cd]" />
            )}
            <span>{isPulling ? "Pulling Data..." : "Data Pull"}</span>
          </button>
        </div>
      </div>

      {/* DESKTOP SPLIT VIEW */}
      <div className="hidden md:flex w-full flex-1 overflow-hidden p-6 gap-6">
        {/* Left Side: Test List Panel */}
        <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="h-12 border-b border-slate-200 grid grid-cols-2 shrink-0 bg-slate-50">
            <button
              onClick={() => setSidebarTab("pending")}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 ${
                sidebarTab === "pending"
                  ? "border-amber-500 text-amber-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <AlertCircle size={14} className="text-amber-500" />
              <span>Pending ({pendingList.length})</span>
            </button>

            <button
              onClick={() => setSidebarTab("completed")}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold transition-all border-b-2 ${
                sidebarTab === "completed"
                  ? "border-emerald-500 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Configured ({completedList.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {sidebarTab === "pending" ? (
              <CentralTestListPanel
                title="Pending Setup"
                colorClass="text-amber-600"
                dotColor="bg-amber-500"
                tests={pendingList}
                departments={departments}
                selectedTestId={selectedTestId}
                onSelectTest={handleSelectTest}
              />
            ) : (
              <CentralTestListPanel
                title="Configured Formats"
                colorClass="text-emerald-600"
                dotColor="bg-emerald-500"
                tests={completedList}
                departments={departments}
                selectedTestId={selectedTestId}
                onSelectTest={handleSelectTest}
              />
            )}
          </div>
        </div>

        {/* Right Side: Format Editor Panel */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {isLoadingDetails ? (
            <div className="w-full h-full flex items-center justify-center">
              <MusicBarLoader text="Loading Format Details..." />
            </div>
          ) : selectedTestFull ? (
            <CentralFormatEditor
              test={selectedTestFull}
              availableParams={availableParams}
              onSaveComplete={refreshData}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <FileCode2 size={48} className="mb-3 opacity-25" />
              <h3 className="text-sm font-bold text-slate-600 mb-1">No Central Test Selected</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Pick a test from the left panel to edit its report format, column layout, and parameters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE RESPONSIVE VIEW */}
      <div className="flex md:hidden w-full h-full flex-col overflow-hidden bg-white">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden h-10 border-b border-slate-100 bg-white px-2.5 items-center justify-between shrink-0 gap-1.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="text-[#9575cd]" size={13} /> Formats
          </span>
          <div className="flex items-center gap-1.5">
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
              title="Pull format data"
            >
              {isPulling ? (
                <Loader2 size={11} className="animate-spin text-[#9575cd]" />
              ) : (
                <CloudDownload size={11} className="text-[#9575cd]" />
              )}
              <span>{isPulling ? "Pulling..." : "Pull"}</span>
            </button>
          </div>
        </div>

        {mobileView === "list" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-10 border-b border-slate-200 grid grid-cols-2 shrink-0 bg-slate-50">
              <button
                onClick={() => setSidebarTab("pending")}
                className={`flex items-center justify-center gap-1 text-[11px] font-bold border-b-2 ${
                  sidebarTab === "pending"
                    ? "border-amber-500 text-amber-700 bg-white"
                    : "border-transparent text-slate-500"
                }`}
              >
                <AlertCircle size={12} className="text-amber-500" />
                <span>Pending ({pendingList.length})</span>
              </button>

              <button
                onClick={() => setSidebarTab("completed")}
                className={`flex items-center justify-center gap-1 text-[11px] font-bold border-b-2 ${
                  sidebarTab === "completed"
                    ? "border-emerald-500 text-emerald-700 bg-white"
                    : "border-transparent text-slate-500"
                }`}
              >
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>Configured ({completedList.length})</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {sidebarTab === "pending" ? (
                <CentralTestListPanel
                  title="Pending Tests"
                  colorClass="text-amber-600"
                  dotColor="bg-amber-500"
                  tests={pendingList}
                  departments={departments}
                  selectedTestId={selectedTestId}
                  onSelectTest={handleSelectTest}
                />
              ) : (
                <CentralTestListPanel
                  title="Configured Formats"
                  colorClass="text-emerald-600"
                  dotColor="bg-emerald-500"
                  tests={completedList}
                  departments={departments}
                  selectedTestId={selectedTestId}
                  onSelectTest={handleSelectTest}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {isLoadingDetails ? (
              <div className="w-full h-full flex items-center justify-center">
                <MusicBarLoader text="Loading Format Details..." />
              </div>
            ) : selectedTestFull ? (
              <CentralFormatEditor
                test={selectedTestFull}
                availableParams={availableParams}
                onSaveComplete={refreshData}
                onBack={() => setMobileView("list")}
              />
            ) : null}
          </div>
        )}
      </div>
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

