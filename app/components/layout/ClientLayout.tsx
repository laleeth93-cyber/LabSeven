// --- BLOCK app/components/layout/ClientLayout.tsx OPEN ---
"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'; 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const pathname = usePathname();

  // Activate the Global Sync Listener
  useNetworkStatus(); 

  // 🚨 FIXED: Added '/reset' to the list of pages that shouldn't show the Header/Sidebar
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/reset' || 
    pathname.startsWith('/reports/print');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 font-sans">
      {/* 1. HEADER: Spans full width of the top screen */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      
      {/* 2. LOWER SECTION: Contains Sidebar and Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        
        <main className="flex-1 overflow-auto p-2 md:p-4 bg-[#f8fafc] relative">
          {children}
        </main>
      </div>
    </div>
  );
}
// --- BLOCK app/components/layout/ClientLayout.tsx CLOSE ---