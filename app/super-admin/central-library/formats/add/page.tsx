"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileCode2, FlaskConical, Search } from "lucide-react";
import { getCentralTestsForFormats, getCentralTestFormatDetails } from "@/app/actions/central-formats";
import CentralFormatEditor from "../components/CentralFormatEditor";
import MusicBarLoader from "@/app/components/MusicBarLoader";

export default function AddCentralFormatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTestId = searchParams.get("testId");

  const [tests, setTests] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>(queryTestId || "");
  const [testDetails, setTestDetails] = useState<any>(null);
  const [availableParams, setAvailableParams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const res = await getCentralTestsForFormats();
        if (res.success && res.data) {
          setTests(res.data);
          const initialId = queryTestId || (res.data.length > 0 ? res.data[0].id : "");
          if (initialId) {
            setSelectedTestId(initialId);
            const dRes = await getCentralTestFormatDetails(initialId);
            if (dRes.success && dRes.data) {
              setTestDetails(dRes.data.test);
              setAvailableParams(dRes.data.availableParams || []);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [queryTestId]);

  const handleSelectTest = async (id: string) => {
    setSelectedTestId(id);
    setIsLoading(true);
    try {
      const dRes = await getCentralTestFormatDetails(id);
      if (dRes.success && dRes.data) {
        setTestDetails(dRes.data.test);
        setAvailableParams(dRes.data.availableParams || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !testDetails) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <MusicBarLoader text="Loading Format Setup..." />
      </div>
    );
  }

  const filteredTests = tests.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* Top Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/central-library?tab=Format"
            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <FileCode2 className="text-[#9575cd]" size={18} />
            <h1 className="text-base font-bold text-slate-800">Add New Central Format Configuration</h1>
          </div>
        </div>

        {/* Test Selector Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Central Test:</span>
          <select
            value={selectedTestId}
            onChange={(e) => handleSelectTest(e.target.value)}
            className="text-xs font-bold border border-slate-300 rounded px-3 py-1.5 bg-white text-slate-800 outline-none focus:border-[#9575cd]"
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden">
        {testDetails ? (
          <CentralFormatEditor
            test={testDetails}
            availableParams={availableParams}
            onSaveComplete={() => {
              router.push("/super-admin/central-library?tab=Format");
              router.refresh();
            }}
          />
        ) : (
          <div className="p-8 text-center text-slate-400">Please select a central test above</div>
        )}
      </div>
    </div>
  );
}
