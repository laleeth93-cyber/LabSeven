"use client";

import React, { useState, useEffect, Suspense } from 'react'; 
import { usePathname, useRouter } from 'next/navigation';
import { 
  Lock, LayoutDashboard, UserPlus, FileEdit, ClipboardList, 
  Microscope, Bug, Database, HeartPulse, Building2, 
  MessageSquare, LayoutTemplate, ShieldCheck, Crown, UserCog, IndianRupee,
  X, Network, FlaskConical, CheckCircle2, Settings, Archive,
  Droplet, Box, Scale, Calculator, List, Stethoscope
} from 'lucide-react';
import Link from 'next/link';
import DashboardOverview from '@/app/components/DashboardOverview';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 
import { usePermissions } from '@/app/context/PermissionContext';

function DashboardContent({ initialData }: { initialData: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { orgId, permissions, userRole, permsLoaded } = usePermissions();
  const [activeView, setActiveView] = useState('loading');
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [showMastersModal, setShowMastersModal] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);

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

  const testSubModules = [
    { 
      label: 'Departments', 
      icon: <Network size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-teal-50 to-teal-100 text-teal-600 border border-teal-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(13,148,136,0.08)]', 
      href: '/tests?tab=Departments', 
      screen: 'Departments' 
    },
    { 
      label: 'Library', 
      icon: <FlaskConical size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 border border-blue-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(37,99,235,0.08)]', 
      href: '/tests?tab=Test Library', 
      screen: 'Test Library' 
    },
    { 
      label: 'Formats', 
      icon: <CheckCircle2 size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(5,150,105,0.08)]', 
      href: '/tests?tab=Formats', 
      screen: 'Formats' 
    },
    { 
      label: 'Parameters', 
      icon: <Settings size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-purple-50 to-purple-100 text-purple-600 border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(147,51,234,0.08)]', 
      href: '/tests?tab=Parameters', 
      screen: 'Parameters' 
    },
    { 
      label: 'Packages', 
      icon: <Archive size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 border border-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(217,119,6,0.08)]', 
      href: '/tests?tab=Packages', 
      screen: 'Packages' 
    },
  ].filter(item => canSee([item.screen]));

  const masterSubModules = [
    { 
      label: 'Specimen', 
      icon: <Droplet size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-rose-50 to-rose-100 text-rose-600 border border-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(225,29,72,0.08)]', 
      href: '/masters?tab=specimen', 
      screens: ['Specimen', 'Specimens'] 
    },
    { 
      label: 'Vacutainer', 
      icon: <Box size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-violet-50 to-violet-100 text-violet-600 border border-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(124,58,237,0.08)]', 
      href: '/masters?tab=vacutainer', 
      screens: ['Vacutainers', 'Vacutainer'] 
    },
    { 
      label: 'Method', 
      icon: <FlaskConical size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-cyan-50 to-cyan-100 text-cyan-600 border border-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(8,145,178,0.08)]', 
      href: '/masters?tab=method', 
      screens: ['Method', 'Methods'] 
    },
    { 
      label: 'UOM', 
      icon: <Scale size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 border border-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(217,119,6,0.08)]', 
      href: '/masters?tab=uom', 
      screens: ['UOM'] 
    },
    { 
      label: 'Operator', 
      icon: <Calculator size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-600 border border-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(5,150,105,0.08)]', 
      href: '/masters?tab=operator', 
      screens: ['Operator', 'Operators'] 
    },
    { 
      label: 'Multivalues', 
      icon: <List size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 border border-blue-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(37,99,235,0.08)]', 
      href: '/masters?tab=multivalue', 
      screens: ['Multivalues', 'Lab Lists'] 
    },
  ].filter(item => canSee(item.screens));

  const referralSubModules = [
    { 
      label: 'Doctors', 
      icon: <Stethoscope size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 border border-blue-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(37,99,235,0.08)]', 
      href: '/referrals?tab=Doctor', 
      screen: 'Doctors' 
    },
    { 
      label: 'Partner Labs', 
      icon: <FlaskConical size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-teal-50 to-teal-100 text-teal-600 border border-teal-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(13,148,136,0.08)]', 
      href: '/referrals?tab=Lab', 
      screen: 'Partner Labs' 
    },
    { 
      label: 'Hospitals', 
      icon: <Building2 size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-purple-50 to-purple-100 text-purple-600 border border-purple-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(147,51,234,0.08)]', 
      href: '/referrals?tab=Hospital', 
      screen: 'Hospitals' 
    },
    { 
      label: 'Outsource', 
      icon: <Microscope size={16} strokeWidth={2.2} />, 
      color: 'bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 border border-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_6px_rgba(217,119,6,0.08)]', 
      href: '/referrals?tab=Outsource', 
      screen: 'Outsourced Labs' 
    },
  ].filter(item => canSee([item.screen, 'Referrals']));

  useEffect(() => {
    if (!permsLoaded) return;

    if (canSee(['Dashboard'])) {
        setActiveView('dashboard');
    } else {
        if (canSee(['Registration'])) router.replace('/registration');
        else if (canSee(['Result Entry'])) router.replace('/results/entry');
        else if (canSee(['Patient List'])) router.replace('/list');
        else if (canSee(['Departments', 'Test Library', 'Formats', 'Parameters', 'Packages'])) router.replace('/tests');
        else if (canSee(['Specimen', 'Vacutainers', 'Method', 'UOM', 'Operator', 'Multivalues'])) router.replace('/masters');
        else if (canSee(['Doctors', 'Partner Labs', 'Hospitals', 'Outsourced Labs'])) router.replace('/referrals');
        else if (canSee(['General Settings'])) router.replace('/lab-profile');
        else if (canSee(['Header Setup', 'Body Settings', 'Footer Layout', 'Page Formatting'])) router.replace('/reports');
        else setActiveView('restricted'); 
    }
  }, [permsLoaded, permissions, userRole, router]);

  if (!permsLoaded || activeView === 'loading') {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <MusicBarLoader text="Authenticating..." />
          </div>
      );
  }

  if (activeView === 'restricted') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
            <Lock className="text-slate-300 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any modules.</p>
        </div>
      );
  }

  if (pathname === '/dashboard') {
    return (
      <div className="h-full w-full overflow-hidden bg-white p-3 md:bg-transparent md:p-6">
        <DashboardOverview initialData={initialData} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-0 md:p-6 overflow-hidden bg-white md:bg-transparent">
      {/* Mobile App Grid View */}
      <div 
        className="block md:hidden h-full w-full overflow-y-auto pb-8 select-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="px-4 py-7">
          <div className="grid grid-cols-4 gap-y-6 gap-x-2 w-full max-w-md mx-auto">
            {canSee(['Dashboard']) && (
              <Link href="/dashboard" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-indigo-100 active:scale-95 transition-all duration-200">
                  <LayoutDashboard size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Dashboard</span>
              </Link>
            )}
            {canSee(['Registration']) && (
              <Link href="/registration" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-blue-50 to-blue-100 text-blue-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-blue-100 active:scale-95 transition-all duration-200">
                  <UserPlus size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Register</span>
              </Link>
            )}
            {canSee(['Result Entry']) && (
              <Link href="/results/entry" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-teal-50 to-teal-100 text-teal-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-teal-100 active:scale-95 transition-all duration-200">
                  <FileEdit size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Entry</span>
              </Link>
            )}
            {canSee(['Patient List']) && (
              <Link href="/list" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-sky-50 to-sky-100 text-sky-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-sky-100 active:scale-95 transition-all duration-200">
                  <ClipboardList size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">List</span>
              </Link>
            )}
            {canSee(['Tests', 'Parameters', 'Test Formats', 'Packages']) && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowTestsModal(!showTestsModal);
                      setShowMastersModal(false);
                      setShowReferralsModal(false);
                    }} 
                    className="flex flex-col items-center group focus:outline-none"
                  >
                    <div className={`w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-violet-50 to-violet-100 text-violet-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border transition-all duration-200 active:scale-95 ${showTestsModal ? 'ring-2 ring-violet-400 border-violet-300' : 'border-violet-100'}`}>
                      <Microscope size={20} strokeWidth={2} />
                    </div>
                  </button>

                  {showTestsModal && (
                    <>
                      {/* Backdrop to dismiss on outside tap */}
                      <div 
                        className="fixed inset-0 z-40 bg-black/10" 
                        onClick={() => setShowTestsModal(false)}
                      />

                      {/* iPhone UI Popover Menu - Grid Style */}
                      <div className="absolute top-full left-0 mt-3 w-[204px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left">
                        {/* Little pointer arrow dead center to icon */}
                        <div className="absolute -top-1.5 left-[15px] w-3 h-3 bg-white border-t border-l border-slate-200/80 transform rotate-45"></div>

                        <div className="grid grid-cols-3 gap-y-2.5 gap-x-1">
                          {testSubModules.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setShowTestsModal(false)}
                              className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-50/80 active:scale-95 transition-all group text-center"
                            >
                              <div className={`w-[34px] h-[34px] rounded-xl ${item.color} flex items-center justify-center transition-all duration-200 group-hover:scale-105 shrink-0`}>
                                {item.icon}
                              </div>
                              <span className="text-[9px] font-medium text-slate-600 group-hover:text-slate-900 tracking-tight leading-tight truncate w-full text-center">
                                {item.label}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight mt-1.5">Tests</span>
              </div>
            )}
            {canSee(['Tests', 'Parameters']) && (
              <Link href="/sensitivity" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-rose-50 to-rose-100 text-rose-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-rose-100 active:scale-95 transition-all duration-200">
                  <Bug size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Sensitivity</span>
              </Link>
            )}
            {canSee(['Departments', 'Specimens', 'Specimen', 'Vacutainers', 'Vacutainer', 'Methods', 'Method', 'UOM', 'Operators', 'Operator', 'Lab Lists', 'Multivalues']) && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowMastersModal(!showMastersModal);
                      setShowTestsModal(false);
                      setShowReferralsModal(false);
                    }} 
                    className="flex flex-col items-center group focus:outline-none"
                  >
                    <div className={`w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-cyan-50 to-cyan-100 text-cyan-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border transition-all duration-200 active:scale-95 ${showMastersModal ? 'ring-2 ring-cyan-400 border-cyan-300' : 'border-cyan-100'}`}>
                      <Database size={20} strokeWidth={2} />
                    </div>
                  </button>

                  {showMastersModal && (
                    <>
                      {/* Backdrop to dismiss on outside tap */}
                      <div 
                        className="fixed inset-0 z-40 bg-black/10" 
                        onClick={() => setShowMastersModal(false)}
                      />

                      {/* iPhone UI Popover Menu - Grid Style */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[204px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top">
                        {/* Little pointer arrow dead center to icon */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-slate-200/80 transform rotate-45"></div>

                        <div className="grid grid-cols-3 gap-y-2.5 gap-x-1">
                          {masterSubModules.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setShowMastersModal(false)}
                              className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-50/80 active:scale-95 transition-all group text-center"
                            >
                              <div className={`w-[34px] h-[34px] rounded-xl ${item.color} flex items-center justify-center transition-all duration-200 group-hover:scale-105 shrink-0`}>
                                {item.icon}
                              </div>
                              <span className="text-[9px] font-medium text-slate-600 group-hover:text-slate-900 tracking-tight leading-tight truncate w-full text-center">
                                {item.label}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight mt-1.5">Masters</span>
              </div>
            )}
            {canSee(['Referrals', 'Doctors', 'Partner Labs', 'Hospitals', 'Outsourced Labs']) && (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowReferralsModal(!showReferralsModal);
                      setShowTestsModal(false);
                      setShowMastersModal(false);
                    }} 
                    className="flex flex-col items-center group focus:outline-none"
                  >
                    <div className={`w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-pink-50 to-pink-100 text-pink-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border transition-all duration-200 active:scale-95 ${showReferralsModal ? 'ring-2 ring-pink-400 border-pink-300' : 'border-pink-100'}`}>
                      <HeartPulse size={20} strokeWidth={2} />
                    </div>
                  </button>

                  {showReferralsModal && (
                    <>
                      {/* Backdrop to dismiss on outside tap */}
                      <div 
                        className="fixed inset-0 z-40 bg-black/10" 
                        onClick={() => setShowReferralsModal(false)}
                      />

                      {/* iPhone UI Popover Menu - Grid Style (Anchored to right edge for 4th column) */}
                      <div className="absolute top-full right-0 mt-3 w-[184px] bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                        {/* Little pointer arrow dead center to icon */}
                        <div className="absolute -top-1.5 right-[15px] w-3 h-3 bg-white border-t border-l border-slate-200/80 transform rotate-45"></div>

                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-1.5">
                          {referralSubModules.map((item) => (
                            <Link
                              key={item.label}
                              href={item.href}
                              onClick={() => setShowReferralsModal(false)}
                              className="flex flex-col items-center gap-1 p-1 rounded-xl hover:bg-slate-50/80 active:scale-95 transition-all group text-center"
                            >
                              <div className={`w-[34px] h-[34px] rounded-xl ${item.color} flex items-center justify-center transition-all duration-200 group-hover:scale-105 shrink-0`}>
                                {item.icon}
                              </div>
                              <span className="text-[9px] font-medium text-slate-600 group-hover:text-slate-900 tracking-tight leading-tight truncate w-full text-center">
                                {item.label}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight mt-1.5">Referrals</span>
              </div>
            )}
            {canSee(['General Settings']) && (
              <Link href="/lab-profile" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-orange-50 to-orange-100 text-orange-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-orange-100 active:scale-95 transition-all duration-200">
                  <Building2 size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Profile</span>
              </Link>
            )}
            {orgId === 1 && (
              <Link href="/message-station" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-amber-100 active:scale-95 transition-all duration-200">
                  <MessageSquare size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Messages</span>
              </Link>
            )}
            {canSee(['Header Setup', 'Body Settings', 'Footer Layout', 'Page Formatting']) && (
              <Link href="/reports" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-emerald-100 active:scale-95 transition-all duration-200">
                  <LayoutTemplate size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Formats</span>
              </Link>
            )}
            {canSee(['User Setup', 'Roles', 'Permissions', 'Doctor Signatures']) && (
              <Link href="/authorizations" className="flex flex-col items-center gap-1.5 group">
                <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 text-slate-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100 active:scale-95 transition-all duration-200">
                  <ShieldCheck size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Auth</span>
              </Link>
            )}
            {orgId === 1 && (
              <>
                <Link href="/super-admin" className="flex flex-col items-center gap-1.5 group">
                  <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-purple-50 to-purple-100 text-purple-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-purple-100 active:scale-95 transition-all duration-200">
                    <Crown size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Master</span>
                </Link>
                <Link href="/super-admin/admins" className="flex flex-col items-center gap-1.5 group">
                  <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-indigo-100 active:scale-95 transition-all duration-200">
                    <UserCog size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Admins</span>
                </Link>
                <Link href="/super-admin/recharge" className="flex flex-col items-center gap-1.5 group">
                  <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-b from-teal-50 to-teal-100 text-teal-600 flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-teal-100 active:scale-95 transition-all duration-200">
                    <IndianRupee size={20} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] text-center font-medium text-slate-600 tracking-tight leading-tight">Recharge</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Desktop Dashboard View */}
      <div className="hidden md:flex w-full h-full flex-col mx-auto overflow-hidden">
        <DashboardOverview initialData={initialData} />
      </div>
    </div>
  );
}

export default function DashboardClient({ initialData }: { initialData: any }) {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <MusicBarLoader text="Loading Lab Seven..." />
            </div>
        }>
            <DashboardContent initialData={initialData} />
        </Suspense>
    );
}