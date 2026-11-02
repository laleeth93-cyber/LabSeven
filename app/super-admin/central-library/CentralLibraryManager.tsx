"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
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

  const tabs: { key: LibraryType; label: string; icon: React.ReactNode }[] = [
    { key: "Departments", label: "Departments", icon: <Building2 size={14} /> },
    { key: "Test", label: "Test Library", icon: <FlaskConical size={14} /> },
    { key: "Format", label: "Formats", icon: <CheckCircle2 size={14} /> },
    { key: "Parameter", label: "Parameters", icon: <Settings size={14} /> },
    {
      key: "Queue",
      label: `Review Queue (${pendingCount})`,
      icon: <ListChecks size={14} />,
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
    <main className="flex h-full w-full flex-col overflow-hidden bg-slate-50 font-sans">
      {/* Top Header Bar */}
      <div className="hidden md:flex bg-white border-b border-slate-200 shrink-0 z-20 shadow-xs px-6 pt-3 justify-between items-center">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                router.replace(`/super-admin/central-library?tab=${item.key}`, { scroll: false });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                tab === item.key
                  ? "border-[#9575cd] text-[#9575cd] bg-purple-50/50 rounded-t-md"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-md"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pb-2">
          <button
            disabled={isWorking}
            onClick={handleLegacyBootstrap}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
            title="Bootstrap Master HQ Items to Review Queue"
          >
            Queue Legacy HQ
          </button>
          <button
            disabled={isWorking}
            onClick={handlePull}
            className="rounded bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
            title="Pull newly created items from tenant labs"
          >
            Global Pull
          </button>
          <button
            disabled={isWorking}
            onClick={handleSync}
            className="rounded bg-emerald-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-2xs"
            title="Publish approved items to all laboratories"
          >
            Global Sync
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-white border-b border-slate-200 px-2 py-1.5 overflow-x-auto no-scrollbar gap-1 shrink-0">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setTab(item.key);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full whitespace-nowrap transition-colors ${
              tab === item.key
                ? "bg-[#9575cd] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="mx-3 sm:mx-6 mt-3">
          <p
            role="status"
            className="rounded-lg border border-purple-200 bg-purple-50/80 p-3 text-xs font-semibold text-[#7e57c2] shadow-2xs"
          >
            {message}
          </p>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {tab === "Departments" && (
          <div className="h-full overflow-hidden">
            <CentralDepartmentsView />
          </div>
        )}

        {tab === "Test" && (
          <div className="h-full overflow-hidden">
            <CentralTestsLibraryView initialType="All" />
          </div>
        )}

        {tab === "Format" && (
          <div className="h-full overflow-hidden">
            <CentralFormatsView />
          </div>
        )}

        {tab === "Parameter" && (
          <div className="h-full overflow-hidden">
            <CentralParametersLibraryView />
          </div>
        )}

        {tab === "Queue" && (
          <div className="p-3 sm:p-6 overflow-y-auto h-full">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800">Review Queue</h2>
              <p className="text-xs text-slate-500">
                Incoming submissions from connected laboratories waiting for Super Admin approval
              </p>
            </div>
            <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="p-3">Item</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Source laboratory</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Parent test</th>
                    <th className="p-3">Duplicate warning</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData?.submissions?.map((submission) => (
                    <tr key={submission.id} className="border-t border-slate-100 align-top">
                      <td className="p-3 font-semibold text-slate-800">{submission.name}</td>
                      <td className="p-3">{submission.itemType}</td>
                      <td className="p-3">{submission.organization.name}</td>
                      <td className="p-3 whitespace-nowrap">
                        {new Date(submission.sourceCreatedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        {submission.sourceParentTestName ||
                          (submission.sourceParentTestId
                            ? `Test #${submission.sourceParentTestId}`
                            : "—")}
                      </td>
                      <td className="max-w-xs p-3 text-amber-700">
                        {submission.duplicateWarning || "No matching central definition"}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {submission.status.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-slate-50 transition-colors"
                            onClick={() => setViewing(submission)}
                          >
                            View
                          </button>
                          {submission.status === "PendingReview" && (
                            <>
                              <button
                                disabled={isWorking}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 transition-colors"
                                onClick={() => handleReview(submission, "approve")}
                              >
                                Approve
                              </button>
                              <button
                                disabled={isWorking}
                                className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-700 transition-colors"
                                onClick={() => handleReview(submission, "reject")}
                              >
                                Reject
                              </button>
                              <button
                                disabled={isWorking}
                                className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 transition-colors"
                                onClick={() => handleReview(submission, "remove")}
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!initialData?.submissions || initialData.submissions.length === 0) && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No submissions. Use Global Pull to collect newly created laboratory items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </div>
        )}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">
                {viewing.itemType}: {viewing.name}
              </h2>
              <button
                onClick={() => setViewing(null)}
                className="rounded border px-3 py-1 text-sm hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <p className="mb-2 text-xs text-slate-500">
              Source: {viewing.organization.name} · created{" "}
              {new Date(viewing.sourceCreatedAt).toLocaleString()}
            </p>
            <pre className="overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-100 font-mono">
              {JSON.stringify(viewing.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
