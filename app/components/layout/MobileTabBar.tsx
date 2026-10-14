"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ClipboardList, 
  UserPlus, 
  FileEdit, 
  User, 
  Power, 
  Building2, 
  KeyRound, 
  ShieldCheck, 
  X, 
  ChevronRight, 
  Loader2 
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { usePermissions } from '@/app/context/PermissionContext';

export default function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { orgId, userRole } = usePermissions();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [labProfile, setLabProfile] = useState<any>(null);

  // Close profile popup whenever the route changes
  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  // Load lab profile cache for quick display
  useEffect(() => {
    try {
      const cached = localStorage.getItem('labseven_profile_cache');
      if (cached) {
        setLabProfile(JSON.parse(cached));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login', redirect: true });
  };

  const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || "User";
  const displayEmail = session?.user?.email || "";
  const displayRole = userRole || (session?.user as any)?.role || "Staff Member";
  const displayLabId = labProfile?.organizationId || labProfile?.id || orgId || '001';
  const initialLetters = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('') || 'U';

  const isHomeActive = pathname === '/' || pathname === '/dashboard';
  const isListActive = pathname.startsWith('/list');
  const isRegActive = pathname.startsWith('/registration');
  const isEntryActive = pathname.startsWith('/results');
  const isProfileActive = isProfileOpen || pathname.startsWith('/lab-profile') || pathname.startsWith('/settings') || pathname.startsWith('/profile');

  const canSeeAuth = orgId === 1 || displayRole.toLowerCase().includes('admin');

  return (
    <>
      {/* --- LIGHT COMPACT MOBILE FOOTER --- */}
      <nav 
        aria-label="Mobile Navigation Footer"
        className="shrink-0 md:hidden w-full bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] z-40 select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="grid grid-cols-5 items-center h-[46px] px-1 max-w-md mx-auto">
          
          {/* 1. HOME BUTTON */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center w-full h-full active:scale-90 transition-all group outline-none focus:outline-none focus-visible:outline-none select-none"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            title="Home"
          >
            <div 
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              className={`w-[27px] h-[27px] flex items-center justify-center transition-all duration-200 outline-none ${
              isHomeActive 
                ? 'rounded-lg bg-indigo-100 text-indigo-600 border border-indigo-200/80 shadow-[0_2px_6px_rgba(99,102,241,0.18)]' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              <Home size={16} strokeWidth={1.5} />
            </div>
            <span className={`text-[8.5px] mt-0.5 tracking-tight leading-none transition-colors ${
              isHomeActive ? 'text-indigo-600 font-bold' : 'text-slate-600 group-hover:text-slate-900 font-medium'
            }`}>
              Home
            </span>
          </Link>

          {/* 2. PATIENT LIST BUTTON */}
          <Link
            href="/list"
            className="flex flex-col items-center justify-center w-full h-full active:scale-90 transition-all group outline-none focus:outline-none focus-visible:outline-none select-none"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            title="Patient List"
          >
            <div 
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              className={`w-[27px] h-[27px] flex items-center justify-center transition-all duration-200 outline-none ${
              isListActive 
                ? 'rounded-lg bg-sky-100 text-sky-600 border border-sky-200/80 shadow-[0_2px_6px_rgba(14,165,233,0.18)]' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              <ClipboardList size={16} strokeWidth={1.5} />
            </div>
            <span className={`text-[8.5px] mt-0.5 tracking-tight leading-none transition-colors ${
              isListActive ? 'text-sky-600 font-bold' : 'text-slate-600 group-hover:text-slate-900 font-medium'
            }`}>
              List
            </span>
          </Link>

          {/* 3. REGISTRATION BUTTON */}
          <Link
            href="/registration"
            className="flex flex-col items-center justify-center w-full h-full active:scale-90 transition-all group outline-none focus:outline-none focus-visible:outline-none select-none"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            title="New Registration"
          >
            <div 
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              className={`w-[27px] h-[27px] flex items-center justify-center transition-all duration-200 outline-none ${
              isRegActive 
                ? 'rounded-lg bg-emerald-100 text-emerald-600 border border-emerald-200/80 shadow-[0_2px_6px_rgba(16,185,129,0.18)]' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              <UserPlus size={16} strokeWidth={1.5} />
            </div>
            <span className={`text-[8.5px] mt-0.5 tracking-tight leading-none transition-colors ${
              isRegActive ? 'text-emerald-600 font-bold' : 'text-slate-600 group-hover:text-slate-900 font-medium'
            }`}>
              Register
            </span>
          </Link>

          {/* 4. RESULT ENTRY BUTTON */}
          <Link
            href="/results/entry"
            className="flex flex-col items-center justify-center w-full h-full active:scale-90 transition-all group outline-none focus:outline-none focus-visible:outline-none select-none"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            title="Result Entry"
          >
            <div 
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              className={`w-[27px] h-[27px] flex items-center justify-center transition-all duration-200 outline-none ${
              isEntryActive 
                ? 'rounded-lg bg-amber-100 text-amber-600 border border-amber-200/80 shadow-[0_2px_6px_rgba(217,119,6,0.18)]' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              <FileEdit size={16} strokeWidth={1.5} />
            </div>
            <span className={`text-[8.5px] mt-0.5 tracking-tight leading-none transition-colors ${
              isEntryActive ? 'text-amber-600 font-bold' : 'text-slate-600 group-hover:text-slate-900 font-medium'
            }`}>
              Entry
            </span>
          </Link>

          {/* 5. PROFILE BUTTON */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(prev => !prev)}
            className="flex flex-col items-center justify-center w-full h-full active:scale-90 transition-all group outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 select-none border-none"
            style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            title="User Profile & Settings"
          >
            <div 
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              className={`w-[27px] h-[27px] flex items-center justify-center transition-all duration-200 outline-none ${
              isProfileActive 
                ? 'rounded-lg bg-purple-100 text-[#7e57c2] border border-purple-200/80 shadow-[0_2px_6px_rgba(126,87,194,0.18)]' 
                : 'text-slate-700 group-hover:text-slate-900'
            }`}>
              <User size={16} strokeWidth={1.5} />
            </div>
            <span className={`text-[8.5px] mt-0.5 tracking-tight leading-none transition-colors ${
              isProfileActive ? 'text-[#7e57c2] font-bold' : 'text-slate-600 group-hover:text-slate-900 font-medium'
            }`}>
              Profile
            </span>
          </button>

        </div>
      </nav>

      {/* --- PROFILE DRAWER / BOTTOM SHEET --- */}
      {isProfileOpen && (
        <div className="md:hidden fixed inset-0 z-[300] flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsProfileOpen(false)}
          />

          {/* Bottom Sheet Card */}
          <div 
            className="relative bg-white rounded-t-2xl shadow-2xl border-t border-slate-100 z-10 w-full max-w-lg mx-auto p-4 pb-5 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)' }}
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

            {/* Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200/60 text-[#7e57c2] font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {initialLetters}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800 truncate leading-tight">
                    {displayName}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {displayEmail || displayRole}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[8.5px] font-bold text-[#7e57c2] bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      LAB ID: {displayLabId}
                    </span>
                    <span className="text-[8.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded capitalize">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <X size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* Menu Links */}
            <div className="py-2.5 flex flex-col gap-1">
              
              {/* 1. USER & LAB PROFILE */}
              <Link
                href="/lab-profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/50 active:scale-98 transition-all group border border-transparent hover:border-purple-100 outline-none focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7e57c2] border border-purple-100/60 flex items-center justify-center shrink-0 group-hover:bg-[#7e57c2] group-hover:text-white transition-colors">
                    <Building2 size={15} strokeWidth={1.6} />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#5e35b1] transition-colors leading-tight">
                      Lab & User Profile
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">
                      Edit lab details, header & letterhead
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-[#7e57c2] transition-colors" />
              </Link>

              {/* 2. ACCOUNT SETTINGS */}
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-sky-50/50 active:scale-98 transition-all group border border-transparent hover:border-sky-100 outline-none focus:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100/60 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <KeyRound size={15} strokeWidth={1.6} />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-slate-800 group-hover:text-sky-600 transition-colors leading-tight">
                      Account Settings
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">
                      Change password & credentials
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-600 transition-colors" />
              </Link>

              {/* 3. AUTHORIZATIONS (Admins) */}
              {canSeeAuth && (
                <Link
                  href="/authorizations"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/50 active:scale-98 transition-all group border border-transparent hover:border-emerald-100 outline-none focus:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ShieldCheck size={15} strokeWidth={1.6} />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-600 transition-colors leading-tight">
                        Authorizations
                      </div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">
                        Roles, staff permissions & doctor signatures
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                </Link>
              )}

            </div>

            {/* Logout Action Button */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-50/80 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-200/70 font-bold text-[11px] shadow-xs transition-all disabled:opacity-50 active:scale-98 outline-none focus:outline-none focus-visible:outline-none"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-rose-600" />
                    <span>Signing Out...</span>
                  </>
                ) : (
                  <>
                    <Power size={14} strokeWidth={1.8} />
                    <span>Log Out</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
