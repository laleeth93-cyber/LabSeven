import React from "react";
import CentralTestsLibraryView from "../components/CentralTestsLibraryView";

export default function CentralTestsPage() {
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans">
      <CentralTestsLibraryView initialType="All" />
    </div>
  );
}

