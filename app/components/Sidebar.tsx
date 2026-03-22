// --- BLOCK app/components/Sidebar.tsx OPEN ---
"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Home, UserPlus, Users, FileEdit, FileText, List, ClipboardList, TestTube, TestTubes, Server, Database, Layout, LayoutTemplate, Shield, ShieldCheck, Stethoscope, HeartPulse, Building2, Hospital, Microscope, Bug, Pill, FlaskConical } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ isSidebarOpen, activeView, setActiveView }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentView = 
    pathname.includes('/results') ? 'entry' : 
    pathname.includes('/tests') || pathname.includes('/department') ? 'tests' : 
    pathname.includes('/parameters') ? 'parameters' : 
    pathname.includes('/masters') ? 'masters' : 
    pathname.includes('/list') ? 'list' : 
    pathname.includes('/referrals') ? 'referrals' : 
    pathname.includes('/reports') ? 'reports' : 
    pathname.includes('/authorizations') ? 'authorizations' : 
    pathname.includes('/lab-profile') ? 'lab-profile' :
    pathname.includes('/sensitivity') ? 'sensitivity' :
    activeView;

  const handleNavigation = (viewId: string) => {
    // --- MODULE ROUTING ---
    if (viewId === 'entry') { router.push('/results/entry'); return; } 
    if (viewId === 'tests') { router.push('/tests'); return; } 
    if (viewId === 'masters') { router.push('/masters'); return; } 
    if (viewId === 'list') { router.push('/list'); return; } 
    if (viewId === 'referrals') { router.push('/referrals'); return; } 
    if (viewId === 'reports') { router.push('/reports'); return; } 
    if (viewId === 'authorizations') { router.push('/authorizations'); return; }
    if (viewId === 'lab-profile') { router.push('/lab-profile'); return; } 
    if (viewId === 'sensitivity') { router.push('/sensitivity'); return; } 
    
    if (pathname !== '/') {
      router.push(`/?view=${viewId}`); 
    } else {
      setActiveView(viewId);
    }
  };

  // Base class for all items
  const getLiClass = (isActive: boolean) => `
    relative group flex items-center transition-all duration-300 cursor-pointer rounded-none
    ${isSidebarOpen ? 'px-6 py-3 gap-3' : 'flex-col justify-center px-1 py-3 gap-1'}
    ${isActive 
      ? 'bg-[#9575cd] text-white shadow-sm shadow-[#9575cd]/20 border-l-4 border-l-[#5e35b1]' 
      : 'text-[#7e57c2] hover:bg-[#9575cd]/15 hover:text-[#5e35b1] border-l-4 border-l-transparent'
    }
  `;

  // Helper function to handle mobile visibility
  // If showOnMobile is true, it always shows. If false, it's hidden on small screens and displayed on md+
  const getResponsiveLiClass = (isActive: boolean, showOnMobile: boolean) => {
      const baseClass = getLiClass(isActive);
      if (showOnMobile) return baseClass;
      return `${baseClass} hidden md:flex`;
  };

  return (
    <aside 
      className={`${isSidebarOpen ? 'w-64' : 'w-[80px]'} transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(149,117,205,0.1)] border-r border-[#d1c4e9] h-full overflow-y-auto shrink-0 z-40`}
      style={{ background: 'linear-gradient(to bottom, #e8eaf6, #f3e5f5)' }}
    >
      <nav className="flex-1 py-4">
        <ul className="space-y-1"> 
          
          <li onClick={() => handleNavigation('dashboard')} className={getResponsiveLiClass(currentView === 'dashboard', false)}>
            {currentView === 'dashboard' ? (
                <Home size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <LayoutDashboard size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'dashboard' ? 'font-bold' : 'font-medium'}`}>Dashboard</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'dashboard' ? 'font-bold' : 'font-medium'}`}>Dashboard</span>}
          </li>

          {/* ALWAYS VISIBLE ON MOBILE */}
          <li onClick={() => handleNavigation('registration')} className={getResponsiveLiClass(currentView === 'registration', true)}>
            {currentView === 'registration' ? (
                <Users size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <UserPlus size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'registration' ? 'font-bold' : 'font-medium'}`}>New Registration</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'registration' ? 'font-bold' : 'font-medium'}`}>Registration</span>}
          </li>

          {/* ALWAYS VISIBLE ON MOBILE */}
          <li onClick={() => handleNavigation('entry')} className={getResponsiveLiClass(currentView === 'entry', true)}>
            {currentView === 'entry' ? (
                <FileText size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <FileEdit size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'entry' ? 'font-bold' : 'font-medium'}`}>Result Entry</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'entry' ? 'font-bold' : 'font-medium'}`}>Result Entry</span>}
          </li>

          {/* ALWAYS VISIBLE ON MOBILE */}
          <li onClick={() => handleNavigation('list')} className={getResponsiveLiClass(currentView === 'list', true)}>
            {currentView === 'list' ? (
                <ClipboardList size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <List size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'list' ? 'font-bold' : 'font-medium'}`}>Patient List</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'list' ? 'font-bold' : 'font-medium'}`}>Patient List</span>}
          </li>

          <li onClick={() => handleNavigation('tests')} className={getResponsiveLiClass(currentView === 'tests', false)}>
            {currentView === 'tests' ? (
                <FlaskConical size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Microscope size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'tests' ? 'font-bold' : 'font-medium'}`}>Test Config</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'tests' ? 'font-bold' : 'font-medium'}`}>Test Config</span>}
          </li>

          <li onClick={() => handleNavigation('sensitivity')} className={getResponsiveLiClass(currentView === 'sensitivity', false)}>
            {currentView === 'sensitivity' ? (
                <Pill size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Bug size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'sensitivity' ? 'font-bold' : 'font-medium'}`}>Sensitivity</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'sensitivity' ? 'font-bold' : 'font-medium'}`}>Sensitivity</span>}
          </li>

          <li onClick={() => handleNavigation('masters')} className={getResponsiveLiClass(currentView === 'masters', false)}>
            {currentView === 'masters' ? (
                <Database size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Server size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'masters' ? 'font-bold' : 'font-medium'}`}>Masters</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'masters' ? 'font-bold' : 'font-medium'}`}>Masters</span>}
          </li>

          <li onClick={() => handleNavigation('referrals')} className={getResponsiveLiClass(currentView === 'referrals', false)}>
            {currentView === 'referrals' ? (
                <HeartPulse size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Stethoscope size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'referrals' ? 'font-bold' : 'font-medium'}`}>Referrals</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'referrals' ? 'font-bold' : 'font-medium'}`}>Referrals</span>}
          </li>

          <li onClick={() => handleNavigation('lab-profile')} className={getResponsiveLiClass(currentView === 'lab-profile', false)}>
            {currentView === 'lab-profile' ? (
                <Hospital size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Building2 size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'lab-profile' ? 'font-bold' : 'font-medium'}`}>Lab Profile</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'lab-profile' ? 'font-bold' : 'font-medium'}`}>Lab Profile</span>}
          </li>

          <li onClick={() => handleNavigation('reports')} className={getResponsiveLiClass(currentView === 'reports', false)}>
            {currentView === 'reports' ? (
                <LayoutTemplate size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Layout size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'reports' ? 'font-bold' : 'font-medium'}`}>Reports Formating</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'reports' ? 'font-bold' : 'font-medium'}`}>Reports Formating</span>}
          </li>

          <li onClick={() => handleNavigation('authorizations')} className={getResponsiveLiClass(currentView === 'authorizations', false)}>
            {currentView === 'authorizations' ? (
                <ShieldCheck size={isSidebarOpen ? 20 : 22} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            ) : (
                <Shield size={isSidebarOpen ? 20 : 22} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
            )}
            {isSidebarOpen ? <span className={`text-[13px] tracking-wide ${currentView === 'authorizations' ? 'font-bold' : 'font-medium'}`}>Authorizations</span> : <span className={`text-[10px] tracking-tight text-center leading-tight ${currentView === 'authorizations' ? 'font-bold' : 'font-medium'}`}>Authorizations</span>}
          </li>

        </ul>
      </nav>
    </aside>
  );
}
// --- BLOCK app/components/Sidebar.tsx CLOSE ---