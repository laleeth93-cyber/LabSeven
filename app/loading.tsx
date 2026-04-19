import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-[#9575cd]" size={40} />
        <p className="text-sm font-bold text-slate-500 animate-pulse">Loading Lab Seven...</p>
      </div>
    </div>
  );
}