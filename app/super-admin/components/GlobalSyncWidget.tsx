"use client";

import Link from "next/link";
import { LibraryBig } from "lucide-react";

export default function GlobalSyncWidget() {
  return (
    <Link
      href="/super-admin/central-library"
      className="h-[24px] xl:h-[26px] px-2.5 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
      style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
    >
      <LibraryBig size={13} />
      <span>Central Library</span>
    </Link>
  );
}
