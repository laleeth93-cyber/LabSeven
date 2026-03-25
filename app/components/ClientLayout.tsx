"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // SET TO FALSE BY DEFAULT TO START COLLAPSED
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 🚨 FULL SCREEN LOGIN CHECK 🚨
  // If we are on the login page, skip drawing the Sidebar and Header!
  if (pathname === "/login") {
    return <main className="w-full min-h-screen bg-slate-50">{children}</main>;
  }

  // 1. Determine which Sidebar item is active based on the URL
  let activeView = 'dashboard';
  if (pathname === '/') {
    activeView = searchParams.get('view') || 'dashboard';
  } else if (pathname.startsWith('/tests')) {
    activeView = 'tests';
  } else if (pathname.startsWith('/results')) {
    activeView = 'entry'; 
  } else if (pathname.startsWith('/parameters')) {
    activeView = 'parameters';
  }

  // 2. Handle Navigation Logic
  const handleSetActiveView = (view: string) => {
    if (view === 'dashboard' || view === 'registration') {
      router.push(`/?view=${view}`);
    } else if (view === 'tests') {
      router.push('/tests');
    } else if (view === 'entry') {
      router.push('/results'); 
    } else if (view === 'parameters') {
      router.push('/parameters');
    } else {
      // Default fallback
      router.push(`/${view}`);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#eceff1]">
      {/* GLOBAL HEADER */}
      <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className="flex flex-1 overflow-hidden">
        {/* GLOBAL SIDEBAR */}
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          activeView={activeView} 
          setActiveView={handleSetActiveView} 
        />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-hidden h-full bg-[#eceff1] relative">
           {children}
        </main>
      </div>
    </div>
  );
}