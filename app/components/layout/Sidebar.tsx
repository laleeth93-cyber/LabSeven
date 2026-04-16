"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'; // 🚨 NEW: Imported the Next.js Link component
import { createClient } from "@/utils/supabase/client";
import { useSession } from "next-auth/react"; 
import { LayoutDashboard, Home, UserPlus, Users, FileEdit, FileText, List, ClipboardList, TestTube, TestTubes, Server, Database, Layout, LayoutTemplate, Shield, ShieldCheck, Stethoscope, HeartPulse, Building2, Hospital, Microscope, Bug, Pill, FlaskConical, Crown, UserCog } from 'lucide-react';
import { getTenantFeatures } from '@/app/actions/tenant';
import { getUserPermissions } from '@/app/actions/authorizations';

interface SidebarProps {
  isSidebarOpen: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
}

export default function Sidebar({ isSidebarOpen, activeView, setActiveView }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  
  const { data: session } = useSession();
  const orgId = (session?.user as any)?.orgId; 

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasSensitivity, setHasSensitivity] = useState(false);

  const [permissions, setPermissions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>(''); 
  const [permsLoaded, setPermsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && pathname === '/') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || 'dashboard';
      setActiveView(view);
    }
  }, [pathname, setActiveView]);

  useEffect(() => {
    const fetchFeatures = async () => {
        if (orgId) {
            const res = await getTenantFeatures();
            if (res.success) setHasSensitivity(res.hasSensitivity ?? false);
        }
    };
    fetchFeatures();
  }, [orgId]);

  useEffect(() => {
    const fetchPerms = async () => {
        if (session?.user) {
            const userId = (session.user as any).id;
            if (userId) {
                const res = await getUserPermissions(parseInt(userId));
                if (res.success) {
                    setPermissions(res.data || []);
                    setUserRole(res.roleName || '');
                }
            }
        }
        setPermsLoaded(true);
    };
    fetchPerms();
  }, [session]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserEmail(session?.user?.email ?? null);
    };
    
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const currentView = 
    pathname.includes('/super-admin/admins') ? 'super-admin-admins' :
    pathname.includes('/super-admin') ? 'super-admin' :
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

  // 🚨 NEW Helper to generate the correct href for the Link component
  const getHref = (viewId: string) => {
    const routes: Record<string, string> = {
        'super-admin': '/super-admin',
        'super-admin-admins': '/super-admin/admins',
        'entry': '/results/entry',
        'tests': '/tests',
        'masters': '/masters',
        'list': '/list',
        'referrals': '/referrals',
        'reports': '/reports',
        'authorizations': '/authorizations',
        'lab-profile': '/lab-profile',
        'sensitivity': '/sensitivity'
    };
    return routes[viewId] || `/?view=${viewId}`;
  };

  const getLiClass = (isActive: boolean) => `
    relative group flex items-center transition-all duration-300 cursor-pointer rounded-none w-full
    ${isSidebarOpen ? 'px-5 py-2.5 gap-2.5' : 'flex-col justify-center pl-1 pr-1.5 py-3 gap-1'}
    ${isActive 
      ? 'bg-[#9575cd] text-white shadow-sm shadow-[#9575cd]/20 border-l-4 border-l-[#5e35b1]' 
      : 'text-[#7e57c2] hover:bg-[#9575cd]/15 hover:text-[#5e35b1] border-l-4 border-l-transparent'
    }
  `;

  const getResponsiveLiClass = (isActive: boolean, showOnMobile: boolean) => {
      const baseClass = getLiClass(isActive);
      if (showOnMobile) return baseClass;
      return `${baseClass} hidden md:flex`;
  };

  const canSee = (screenNames: string[]) => {
      if (orgId === 1) return true; 
      if (!permsLoaded) return false; 
      
      if (permissions.length === 0) {
          const authScreens = ['User Setup', 'Roles', 'Permissions', 'Doctor Signatures'];
          const isAuthModule = screenNames.every(name => authScreens.includes(name));
          if (userRole.toLowerCase().includes('admin')) return true;
          return !isAuthModule; 
      }

      return permissions.some(p => screenNames.includes(p.module) && p.action === 'Access');
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .sleek-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .sleek-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sleek-scrollbar::-webkit-scrollbar-thumb { background: #d1c4e9; border-radius: 10px; }
        .sleek-scrollbar::-webkit-scrollbar-thumb:hover { background: #9575cd; }
      `}} />

      <aside className={`sleek-scrollbar ${isSidebarOpen ? 'w-52' : 'w-[80px]'} transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(149,117,205,0.1)] border-r border-[#d1c4e9] h-full overflow-y-auto overflow-x-hidden shrink-0 z-40`} style={{ background: 'linear-gradient(to bottom, #e8eaf6, #f3e5f5)' }}>
        <nav className="flex-1 py-4 flex flex-col justify-between h-full w-full">
          {/* 🚨 CHANGED ul to div since we are using Link tags which act as anchors */}
          <div className="space-y-1 w-full flex flex-col"> 
            
            {canSee(['Dashboard']) && (
                <Link href={getHref('dashboard')} onClick={() => setActiveView('dashboard')} className={getResponsiveLiClass(currentView === 'dashboard', false)}>
                {currentView === 'dashboard' ? <Home size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <LayoutDashboard size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'dashboard' ? 'font-bold' : 'font-medium'}`}>Dashboard</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'dashboard' ? 'font-bold' : 'font-medium'}`}>Dashboard</span>}
                </Link>
            )}

            {canSee(['Registration']) && (
                <Link href={getHref('registration')} onClick={() => setActiveView('registration')} className={getResponsiveLiClass(currentView === 'registration', true)}>
                {currentView === 'registration' ? <Users size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <UserPlus size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'registration' ? 'font-bold' : 'font-medium'}`}>New Registration</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'registration' ? 'font-bold' : 'font-medium'}`}>Registration</span>}
                </Link>
            )}

            {canSee(['Result Entry']) && (
                <Link href={getHref('entry')} onClick={() => setActiveView('entry')} className={getResponsiveLiClass(currentView === 'entry', true)}>
                {currentView === 'entry' ? <FileText size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <FileEdit size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'entry' ? 'font-bold' : 'font-medium'}`}>Result Entry</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'entry' ? 'font-bold' : 'font-medium'}`}>Result Entry</span>}
                </Link>
            )}

            {canSee(['Patient List']) && (
                <Link href={getHref('list')} onClick={() => setActiveView('list')} className={getResponsiveLiClass(currentView === 'list', true)}>
                {currentView === 'list' ? <ClipboardList size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <List size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'list' ? 'font-bold' : 'font-medium'}`}>Patient List</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'list' ? 'font-bold' : 'font-medium'}`}>Patient List</span>}
                </Link>
            )}

            {canSee(['Tests', 'Parameters', 'Test Formats', 'Packages']) && (
                <Link href={getHref('tests')} onClick={() => setActiveView('tests')} className={getResponsiveLiClass(currentView === 'tests', false)}>
                {currentView === 'tests' ? <FlaskConical size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Microscope size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'tests' ? 'font-bold' : 'font-medium'}`}>Test Config</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'tests' ? 'font-bold' : 'font-medium'}`}>Test Config</span>}
                </Link>
            )}

            {hasSensitivity && canSee(['Tests', 'Parameters']) && (
                <Link href={getHref('sensitivity')} onClick={() => setActiveView('sensitivity')} className={getResponsiveLiClass(currentView === 'sensitivity', false)}>
                  {currentView === 'sensitivity' ? <Pill size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Bug size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                  {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'sensitivity' ? 'font-bold' : 'font-medium'}`}>Sensitivity</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'sensitivity' ? 'font-bold' : 'font-medium'}`}>Sensitivity</span>}
                </Link>
            )}

            {canSee(['Departments', 'Specimens', 'Vacutainers', 'Methods', 'UOM', 'Operators', 'Lab Lists']) && (
                <Link href={getHref('masters')} onClick={() => setActiveView('masters')} className={getResponsiveLiClass(currentView === 'masters', false)}>
                {currentView === 'masters' ? <Database size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Server size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'masters' ? 'font-bold' : 'font-medium'}`}>Masters</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'masters' ? 'font-bold' : 'font-medium'}`}>Masters</span>}
                </Link>
            )}

            {canSee(['Referrals']) && (
                <Link href={getHref('referrals')} onClick={() => setActiveView('referrals')} className={getResponsiveLiClass(currentView === 'referrals', false)}>
                {currentView === 'referrals' ? <HeartPulse size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Stethoscope size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'referrals' ? 'font-bold' : 'font-medium'}`}>Referrals</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'referrals' ? 'font-bold' : 'font-medium'}`}>Referrals</span>}
                </Link>
            )}

            {canSee(['General Settings']) && (
                <Link href={getHref('lab-profile')} onClick={() => setActiveView('lab-profile')} className={getResponsiveLiClass(currentView === 'lab-profile', false)}>
                {currentView === 'lab-profile' ? <Hospital size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Building2 size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'lab-profile' ? 'font-bold' : 'font-medium'}`}>Lab Profile</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'lab-profile' ? 'font-bold' : 'font-medium'}`}>Lab Profile</span>}
                </Link>
            )}

            {canSee(['Header Setup', 'Body Settings', 'Footer Layout', 'Page Formatting']) && (
                <Link href={getHref('reports')} onClick={() => setActiveView('reports')} className={getResponsiveLiClass(currentView === 'reports', false)}>
                {currentView === 'reports' ? <LayoutTemplate size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Layout size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'reports' ? 'font-bold' : 'font-medium'}`}>Reports Formating</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'reports' ? 'font-bold' : 'font-medium'}`}>Reports Formating</span>}
                </Link>
            )}

            {canSee(['User Setup', 'Roles', 'Permissions', 'Doctor Signatures']) && (
                <Link href={getHref('authorizations')} onClick={() => setActiveView('authorizations')} className={getResponsiveLiClass(currentView === 'authorizations', false)}>
                {currentView === 'authorizations' ? <ShieldCheck size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" /> : <Shield size={isSidebarOpen ? 18 : 20} color="#7e57c2" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />}
                {isSidebarOpen ? <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'authorizations' ? 'font-bold' : 'font-medium'}`}>Authorizations</span> : <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'authorizations' ? 'font-bold' : 'font-medium'}`}>Authorizations</span>}
                </Link>
            )}

          </div>

          {orgId === 1 && (
            <div className="mt-auto pt-4 pb-2 border-t border-[#d1c4e9]/50 w-full space-y-1 flex flex-col">
              <Link href={getHref('super-admin')} onClick={() => setActiveView('super-admin')} className={getResponsiveLiClass(currentView === 'super-admin', false)}>
                {currentView === 'super-admin' ? (
                    <Crown size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
                ) : (
                    <Crown size={isSidebarOpen ? 18 : 20} color="#d946ef" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
                )}
                {isSidebarOpen ? (
                  <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'super-admin' ? 'font-bold' : 'font-bold text-fuchsia-600'}`}>Master HQ</span>
                ) : (
                  <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'super-admin' ? 'font-bold' : 'font-bold text-fuchsia-600'}`}>Master</span>
                )}
              </Link>

              <Link href={getHref('super-admin-admins')} onClick={() => setActiveView('super-admin-admins')} className={getResponsiveLiClass(currentView === 'super-admin-admins', false)}>
                {currentView === 'super-admin-admins' ? (
                    <UserCog size={isSidebarOpen ? 18 : 20} color="#ffffff" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
                ) : (
                    <UserCog size={isSidebarOpen ? 18 : 20} color="#d946ef" strokeWidth={2} className="flex-shrink-0 transition-transform group-hover:scale-110 duration-300" />
                )}
                {isSidebarOpen ? (
                  <span className={`text-[12px] tracking-wide whitespace-normal leading-snug ${currentView === 'super-admin-admins' ? 'font-bold' : 'font-bold text-fuchsia-600'}`}>System Admins</span>
                ) : (
                  <span className={`text-[9px] tracking-tight text-center leading-[1.15] whitespace-normal w-full ${currentView === 'super-admin-admins' ? 'font-bold' : 'font-bold text-fuchsia-600'}`}>Admins</span>
                )}
              </Link>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}