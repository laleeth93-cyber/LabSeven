"use client";

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { getPendingWorklist, getResultEntryData } from '@/app/actions/result-entry';

import WorklistPanel from './components/WorklistPanel';
import ResultEntryForm from './components/ResultEntryForm';
import MusicBarLoader from '@/app/components/MusicBarLoader';

// 🔥 Simple cache (keeps your idea)
const cache: Record<number, any> = {};

export default function ClientResultEntry({ initialBills }: any) {

  // ✅ Worklist (already optimized in your backend)
  const { data: fetchRes } = useSWR(
    'pending-worklist-entry',
    async () => await getPendingWorklist(),
    {
      fallbackData: { success: true, data: initialBills },
      revalidateOnFocus: false
    }
  );

  const bills = fetchRes?.success ? fetchRes.data : [];

  // 🔹 STATES
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [basicData, setBasicData] = useState<any>(null);
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Required for WorklistPanel (fix error)
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("Pending");

  // 🚀 MAIN LOGIC (OPTIMIZED)
  useEffect(() => {
    if (!selectedBillId) {
      setBasicData(null);
      setFullData(null);
      return;
    }

    // ✅ STEP 1: Show basic instantly
    const bill = bills.find((b: any) => b.id === selectedBillId);
    if (bill) {
      setBasicData(bill);
    }

    // ✅ STEP 2: Load full data in background
    fetchFullData(selectedBillId);

  }, [selectedBillId]);

  // 🚀 Fetch full data
  const fetchFullData = async (id: number) => {

    // ✅ Cache check
    if (cache[id]) {
      setFullData(cache[id]);
      setupTestIds(cache[id]);
      return;
    }

    setLoading(true);

    try {
      const res = await getResultEntryData(id);

      if (res && res.success) {
        cache[id] = res.data;
        setFullData(res.data);
        setupTestIds(res.data);
      } else {
        setFullData(null);
        setSelectedTestIds([]);
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setFullData(null);
      setSelectedTestIds([]);
    }

    setLoading(false);
  };

  // 🔹 Setup test selection (same logic you had)
  const setupTestIds = (data: any) => {
    if (!data?.items) return;

    let ids: number[] = [];

    if (activeTab === 'Pending') {
      ids = data.items.filter((i: any) => i.status === 'Pending').map((i: any) => i.id);
    } else if (activeTab === 'Partial') {
      ids = data.items.filter((i: any) => i.status === 'Entered').map((i: any) => i.id);
    } else if (activeTab === 'Completed') {
      ids = data.items.filter((i: any) => i.status === 'Approved' || i.status === 'Printed').map((i: any) => i.id);
    } else {
      ids = data.items.map((i: any) => i.id);
    }

    setSelectedTestIds(ids);
  };

  // 🔹 Toggle test selection (required prop)
  const handleToggleTest = (id: number) => {
    setSelectedTestIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="flex h-full">

      {/* 🟢 LEFT PANEL */}
      <WorklistPanel
        bills={bills}
        selectedBillId={selectedBillId}
        onSelect={setSelectedBillId}
        selectedTestIds={selectedTestIds}
        onToggleTest={handleToggleTest}
        activeTab={activeTab}
      />

      {/* 🟢 RIGHT PANEL */}
      <div className="flex-1 p-4">

        {/* 🚀 INSTANT BASIC UI */}
        {basicData && (
          <div className="mb-3">
            <h2 className="font-bold text-lg">
              {basicData.patient?.firstName} {basicData.patient?.lastName}
            </h2>
          </div>
        )}

        {/* 🚀 LOADING STATE */}
        {loading && !fullData && (
          <div className="flex justify-center items-center h-full">
            <MusicBarLoader />
          </div>
        )}

        {/* 🚀 FULL FORM */}
        {fullData && (
          <ResultEntryForm
            bill={fullData}
            filterTestIds={selectedTestIds}
          />
        )}

      </div>
    </div>
  );
}