"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useTransition, useEffect } from "react";
import {
  pullGlobalLibrary,
  queueLegacyMasterLibrary,
  reviewGlobalSubmission,
  runGlobalSync,
} from "@/app/actions/master-sync";
import CentralTestsLibraryView from "./components/CentralTestsLibraryView";
import CentralParametersLibraryView from "./components/CentralParametersLibraryView";
import CentralFormatsView from "./components/CentralFormatsView";
import CentralDepartmentsView from "./components/CentralDepartmentsView";
import {
  Building2,
  FlaskConical,
  CheckCircle2,
  Settings,
  ListChecks,
  Crown,
  LibraryBig,
  UserCog,
  IndianRupee,
  RefreshCw,
  Loader2,
  X,
  Eye,
  Check,
  Trash2,
} from "lucide-react";

type LibraryType = "Departments" | "Test" | "Format" | "Parameter" | "Queue";

type Entry = {
  id: string;
  name: string;
  code?: string | null;
  category?: string | null;
  unit?: string | null;
  globalTestId?: string | null;
  version?: number;
  isActive: boolean;
  payload: unknown;
  parameters?: Entry[];
  formats?: Entry[];
  globalTest?: { id: string; name: string } | null;
};

type Submission = {
  id: string;
  itemType: "Test" | "Parameter" | "Format";
  name: string;
  sourceCreatedAt: Date | string;
  status: string;
  duplicateWarning: string | null;
  sourceParentTestId: number | null;
  sourceParentTestName: string | null;
  payload: unknown;
  organization: { name: string };
};

export default function CentralLibraryManager({
  initialData,
}: {
  initialData: {
    tests: Entry[];
    parameters: Entry[];
    formats: Entry[];
    submissions: Submission[];
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [tab, setTab] = useState<LibraryType>("Departments");
  const [isWorking, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [viewing, setViewing] = useState<Submission | null>(null);

  const pendingCount =
    initialData?.submissions?.filter((s) => s.status === "PendingReview").length || 0;

  const hqTabs = [
    { href: "/super-admin", label: "Tenant Labs", icon: <Building2 size={13} />, active: false },
    { href: "/super-admin/central-library", label: "Central Library", icon: <LibraryBig size={13} />, active: true },
    { href: "/super-admin/admins", label: "System Admins", icon: <UserCog size={13} />, active: false },
    { href: "/super-admin/recharge", label: "Message Recharge", icon: <IndianRupee size={13} />, active: false },
  ];

  const librarySubTabs: { key: LibraryType; label: string; icon: React.ReactNode }[] = [
    { key: "Departments", label: "Departments", icon: <Building2 size={13} /> },
    { key: "Test", label: "Test Library", icon: <FlaskConical size={13} /> },
    { key: "Format", label: "Formats", icon: <CheckCircle2 size={13} /> },
    { key: "Parameter", label: "Parameters", icon: <Settings size={13} /> },
    {
      key: "Queue",
      label: `Review Queue (${pendingCount})`,
      icon: <ListChecks size={13} />,
    },
  ];

  useEffect(() => {
    if (tabParam === "Departments" || tabParam === "Department") setTab("Departments");
    else if (tabParam === "Test" || tabParam === "Tests" || tabParam === "Test Library") setTab("Test");
    else if (tabParam === "Format" || tabParam === "Formats") setTab("Format");
    else if (tabParam === "Parameter" || tabParam === "Parameters") setTab("Parameter");
    else if (tabParam === "Queue" || tabParam === "Review Queue") setTab("Queue");
    else if (!tabParam) setTab("Departments");
  }, [tabParam]);

  const handlePull = () =>
    startTransition(async () => {
      const result = await pullGlobalLibrary();
      setMessage(result.message || "");
      if (result.success) router.refresh();
    });

  const handleSync = () => {
    if (
      !confirm(
        "Publish only approved submissions and add missing global IDs to active laboratories? Existing local configurations will not be overwritten."
      )
    )
      return;
    startTransition(async () => {
      const result = await runGlobalSync();
      setMessage(result.message || "");
      if (result.success) router.refresh();
    });
  };

  const handleLegacyBootstrap = () => {
    if (
      !confirm(
        "Queue existing organization 1 tests, parameters, and configured report formats for review? Nothing will be published until each item is approved and Global Sync is run."
      )
    )
      return;
    startTransition(async () => {
      const result = await queueLegacyMasterLibrary();
      setMessage(result.message || "");
      if (result.success) router.refresh();
    });
  };

  const handleReview = (
    submission: Submission,
    decision: "approve" | "reject" | "remove"
  ) =>
    startTransition(async () => {
      const result = await reviewGlobalSubmission(submission.id, decision);
      setMessage(
        result.success ? `Submission ${decision}d.` : result.message || "Review action failed."
      );
      if (result.success) router.refresh();
    });

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
      <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
        
        {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
          {/* Left: 20px Title in Calibri */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
              <Crown size={16} />
            </div>
            <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
              Master HQ
            </h2>
          </div>

          {/* Right: Desktop Module Tabs */}
          <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
            {hqTabs.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                  item.active ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Tabs Header */}
        <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
          {hqTabs.map((item) => (
            <Link 
              key={item.href}
              href={item.href}
              className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                item.active ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
        <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {/* Sub-tabs for Central Library */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <div className="h-[22px] xl:h-[24px] flex items-center bg-slate-100 rounded p-0.5 gap-0.5 border border-slate-200 shrink-0 text-[10px] xl:text-[11px]">
              {librarySubTabs.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setTab(item.key);
                    router.replace(`/super-admin/central-library?tab=${item.key}`, { scroll: false });
                  }}
                  className={`px-2 py-0.5 rounded transition-all whitespace-nowrap flex items-center gap-1 ${
                    tab === item.key
                      ? "bg-white shadow-2xs text-[#9575cd] font-semibold"
                      : "text-slate-600 hover:text-slate-900 font-medium"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              disabled={isWorking}
              onClick={handleLegacyBootstrap}
              className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors shadow-2xs"
              title="Bootstrap Master HQ Items to Review Queue"
            >
              Queue Legacy HQ
            </button>
            <button
              disabled={isWorking}
              onClick={handlePull}
              className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
              title="Pull newly created items from tenant labs"
            >
              Global Pull
            </button>
            <button
              disabled={isWorking}
              onClick={handleSync}
              className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all disabled:opacity-50 flex items-center gap-1"
              title="Publish approved items to all laboratories"
            >
              {isWorking ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              <span>Global Sync</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="px-3 pt-2 bg-[#f8fafc]">
            <p
              role="status"
              className="rounded-[5px] border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-[11px] font-medium text-[#7e57c2] shadow-2xs"
            >
              {message}
            </p>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 min-h-0 custom-scrollbar flex flex-col">
          {tab === "Departments" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <CentralDepartmentsView />
            </div>
          )}

          {tab === "Test" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <CentralTestsLibraryView initialType="All" />
            </div>
          )}

          {tab === "Format" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <CentralFormatsView />
            </div>
          )}

          {tab === "Parameter" && (
            <div className="flex-1 min-h-0 flex flex-col">
              <CentralParametersLibraryView />
            </div>
          )}

          {tab === "Queue" && (
            <div className="flex-1 flex flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
              {/* Header info */}
              <div className="p-2.5 xl:p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    Review Queue
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Incoming definitions from tenant laboratories waiting for Master HQ approval
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-[#5e35b1] border border-purple-200">
                  {pendingCount} Pending Items
                </span>
              </div>

              {/* Table */}
              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
                <table className="w-full text-left border-collapse border-spacing-0 whitespace-nowrap">
                  <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                    <tr>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Item</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Type</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Source Laboratory</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Created</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Parent Test</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Duplicate Warning</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                      <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-28" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialData?.submissions?.map((submission) => (
                      <tr key={submission.id} className="hover:bg-slate-50/80 transition-colors border-b border-[#d9d9d9]">
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                          <span className="font-semibold text-slate-800 text-[11px] xl:text-[12px]">{submission.name}</span>
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {submission.itemType}
                          </span>
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-slate-700 text-[11px]">
                          {submission.organization.name}
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-slate-500 text-[11px]">
                          {new Date(submission.sourceCreatedAt).toLocaleDateString('en-GB')}
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-slate-600 text-[11px]">
                          {submission.sourceParentTestName ||
                            (submission.sourceParentTestId
                              ? `Test #${submission.sourceParentTestId}`
                              : "—")}
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-amber-700 text-[11px] max-w-xs truncate">
                          {submission.duplicateWarning || "No matching definition"}
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                          <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                            submission.status === "PendingReview"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : submission.status === "Approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {submission.status.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </td>
                        <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="h-[22px] px-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-medium shadow-2xs"
                              onClick={() => setViewing(submission)}
                            >
                              <Eye size={11} className="inline mr-0.5" /> View
                            </button>
                            {submission.status === "PendingReview" && (
                              <>
                                <button
                                  disabled={isWorking}
                                  className="h-[22px] px-1.5 rounded bg-emerald-600 text-white text-[10px] font-medium hover:bg-emerald-700 transition-colors shadow-2xs"
                                  onClick={() => handleReview(submission, "approve")}
                                >
                                  <Check size={11} className="inline mr-0.5" /> Approve
                                </button>
                                <button
                                  disabled={isWorking}
                                  className="h-[22px] px-1.5 rounded bg-rose-600 text-white text-[10px] font-medium hover:bg-rose-700 transition-colors shadow-2xs"
                                  onClick={() => handleReview(submission, "reject")}
                                >
                                  <X size={11} className="inline mr-0.5" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!initialData?.submissions || initialData.submissions.length === 0) && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs italic">
                          No submissions. Use Global Pull to collect newly created laboratory items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pinned table footer */}
              <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <div>
                  Total Submissions: <strong className="text-slate-700">{initialData?.submissions?.length || 0}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Approved items are broadcast to tenant laboratories upon Global Sync
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[10px] bg-white border border-slate-200 shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] shrink-0">
              <h3 className="font-semibold text-[14px] xl:text-[15px] text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                {viewing.itemType}: {viewing.name}
              </h3>
              <button
                onClick={() => setViewing(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              <p className="text-[11px] text-slate-500 font-normal">
                Source: <strong className="text-slate-700">{viewing.organization.name}</strong> · Submitted on{" "}
                {new Date(viewing.sourceCreatedAt).toLocaleString()}
              </p>
              <pre className="overflow-auto rounded-[6px] bg-slate-900 p-3 text-[11px] text-slate-100 font-mono">
                {JSON.stringify(viewing.payload, null, 2)}
              </pre>
            </div>
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setViewing(null)}
                className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-normal text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
