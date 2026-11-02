import React from "react";
import CentralFormatsView from "../components/CentralFormatsView";

export default function CentralFormatsPage({
  searchParams,
}: {
  searchParams?: Promise<{ testId?: string }>;
}) {
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans">
      <CentralFormatsView />
    </div>
  );
}

