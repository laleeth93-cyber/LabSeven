"use client";

import Link from "next/link";
import { LibraryBig } from "lucide-react";

export default function GlobalSyncWidget() {
  return (
    <Link
      href="/super-admin/central-library"
      className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-700 px-3 text-[10px] font-bold text-white shadow-sm sm:h-9 sm:text-xs"
    >
      <LibraryBig size={14} />
      Central Library
    </Link>
  );
}
