"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

interface CentralTestListPanelProps {
  title: string;
  colorClass: string;
  dotColor: string;
  tests: any[];
  departments: any[];
  selectedTestId: string | null;
  onSelectTest: (test: any) => void;
}

export default function CentralTestListPanel({
  title,
  colorClass,
  dotColor,
  tests,
  departments,
  selectedTestId,
  onSelectTest,
}: CentralTestListPanelProps) {
  const [deptFilter, setDeptFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter]);

  const getDeptName = (dept: any) => {
    if (!dept) return "";
    if (typeof dept === "string") return dept;
    return dept.name || "";
  };

  const filteredList = tests.filter((test) => {
    const deptName = getDeptName(test.department);
    const matchesDept = deptFilter === "All" || deptName === deptFilter;
    const matchesSearch =
      (test.name && test.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (test.code && test.code.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-100 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-slate-700 mb-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${colorClass}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
            {title} ({filteredList.length})
          </span>
        </div>

        <div className="relative">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full text-[10px] font-bold border border-slate-200 rounded px-2 h-7 bg-white focus:border-[#9575cd] outline-none text-slate-700"
          >
            <option value="All">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <Filter
            size={10}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-6 pr-2 h-7 text-[10px] border border-slate-200 rounded bg-white focus:border-[#9575cd] outline-none shadow-2xs text-slate-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {paginatedList.map((test: any) => (
          <button
            key={test.id}
            onClick={() => onSelectTest(test)}
            className={`w-full text-left px-3 py-2 rounded-md border text-[10px] transition-all flex flex-col gap-0.5 ${
              selectedTestId === test.id
                ? "bg-[#9575cd] border-[#9575cd] text-white shadow-md"
                : "bg-white border-slate-200 hover:bg-purple-50 text-slate-600"
            }`}
          >
            <span className="font-bold truncate">{test.name}</span>
            <div
              className={`flex justify-between w-full text-[9px] ${
                selectedTestId === test.id ? "text-purple-100" : "text-slate-400"
              }`}
            >
              <span>{test.code}</span>
              <span className="uppercase tracking-tighter opacity-80">
                {getDeptName(test.department).substring(0, 8)}..
              </span>
            </div>
          </button>
        ))}

        {paginatedList.length === 0 && (
          <div className="p-4 text-center text-slate-400 text-xs">No tests found</div>
        )}
      </div>

      <div className="p-2 border-t border-slate-100 flex items-center justify-between text-[10px] bg-slate-50 shrink-0">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={12} />
        </button>
        <span className="font-bold text-slate-600">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

