"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { usePathname } from 'next/navigation';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'; 

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const pathname = usePathname();
  
  // State to hold our dynamic scaling factor
  const [scale, setScale] = useState(1);

  // Activate the Global Sync Listener
  useNetworkStatus(); 

  // --- PROPORTIONAL SCALING LOGIC ---
  useEffect(() => {
    const handleResize = () => {
      // 1024px is a standard breakpoint. Only scale on desktop/laptop monitors.
      if (window.innerWidth >= 1024) {
        // Assuming 1920px is your target/perfect design width
        const newScale = window.innerWidth / 1920;
        
        // Shrink for smaller screens, but cap at 1 to prevent UI from becoming massive on ultrawides
        setScale(Math.min(newScale, 1)); 
      } else {
        // Reset to standard responsive behavior for mobile and tablets
        setScale(1); 
      }
    };

    // Run on initial mount
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🚨 THE FIX: We must tell the layout to treat /verify as a public auth page
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/reset' || 
    pathname.startsWith('/verify') ||  // <-- This stops the Sidebar from loading and kicking you out!
    pathname.startsWith('/reports/print');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 font-sans">
      {/* THE SCALING WRAPPER: 
        This physically scales the UI down, while mathematically expanding the 
        width/height containers so you don't get empty white space around the edges.
      */}
      <div 
        className="origin-top-left flex flex-col transition-transform duration-75"
        style={{
          transform: `scale(${scale})`,
          width: scale < 1 ? `${(1 / scale) * 100}%` : '100%',
          height: scale < 1 ? `${(1 / scale) * 100}%` : '100%',
        }}
      >
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
    </div>
  );
}