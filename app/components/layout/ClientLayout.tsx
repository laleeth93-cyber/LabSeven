"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileTabBar from './MobileTabBar';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'; 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const pathname = usePathname();
  const { data: session } = useSession();
  const isSupportMode = (session?.user as any)?.isSupportMode;

  // Activate the Global Sync Listener
  useNetworkStatus(); 

  // 🚨 VIEWPORT RESET LISTENER:
  // When navigating between pages (especially after login where the mobile keyboard was active),
  // blur any active elements, reset window scroll to 0, and trigger a resize event so
  // mobile browsers recalculate their viewport height properly without requiring a phone lock/unlock.
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (document.activeElement instanceof HTMLElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
      }
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      window.dispatchEvent(new Event('resize'));

      const timer = setTimeout(() => {
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('resize'));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // 🚨 THE FIX: We must tell the layout to treat /verify as a public auth page
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/reset' || 
    pathname?.startsWith('/verify') || 
    pathname?.startsWith('/reports/print');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-slate-50 font-sans">
      {isSupportMode && (
        <div className="bg-red-500 text-white text-center text-sm font-bold py-1.5 shadow-sm shrink-0 flex items-center justify-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           Support Mode (Global Admin Access)
        </div>
      )}
      {/* 1. HEADER: Spans full width of the top screen */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      
      {/* 2. LOWER SECTION: Contains Sidebar and Main content */}
      <div className="flex flex-1 overflow-hidden min-h-0 mb-[calc(46px+env(safe-area-inset-bottom,0px))] md:mb-0">
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        
        <main className="flex-1 min-h-0 h-full flex flex-col overflow-hidden md:overflow-auto p-0 md:p-4 bg-white md:bg-[#f8fafc] relative md:pb-4">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}