"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileCode2 } from "lucide-react";
import {
  getCentralTestFormatDetails,
  getCentralFormatById,
} from "@/app/actions/central-formats";
import CentralFormatEditor from "../../components/CentralFormatEditor";
import MusicBarLoader from "@/app/components/MusicBarLoader";
import toast from "react-hot-toast";

export default function EditCentralFormatPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [availableParams, setAvailableParams] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        // First try loading as testId
        let dRes = await getCentralTestFormatDetails(id);
        if (dRes.success && dRes.data) {
          setTestDetails(dRes.data.test);
          setAvailableParams(dRes.data.availableParams || []);
        } else {
          // If not found, try as GlobalFormat id
          const fRes = await getCentralFormatById(id);
          if (fRes.success && fRes.data && fRes.data.globalTestId) {
            dRes = await getCentralTestFormatDetails(fRes.data.globalTestId);
            if (dRes.success && dRes.data) {
              setTestDetails(dRes.data.test);
              setAvailableParams(dRes.data.availableParams || []);
            }
          } else {
            toast.error("Format configuration not found.");
            router.push("/super-admin/central-library?tab=Format");
          }
        }
      } catch (e) {
        console.error("Central Edit Format Init Error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <MusicBarLoader text="Loading Format Details..." />
      </div>
    );
  }

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
            <div>
              <h1 className="text-base font-bold text-slate-800">
                Edit Central Format: {testDetails?.name}
              </h1>
              <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                {testDetails?.code}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {testDetails && (
          <CentralFormatEditor
            test={testDetails}
            availableParams={availableParams}
            onSaveComplete={() => {
              router.push("/super-admin/central-library?tab=Format");
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}
