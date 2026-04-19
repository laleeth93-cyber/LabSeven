"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, Bell, Settings, Building2, Loader2, User, Hash, X, Power, Cloud, CloudOff, CloudUpload, Zap, MessageSquare } from 'lucide-react';
import { getLabProfile } from '@/app/actions/lab-profile';
import { searchPatients } from '@/app/actions/patient';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import toast from 'react-hot-toast'; 
import Link from 'next/link'; // 🚨 IMPORT LINK FOR PRE-FETCHING

import { useLiveQuery } from 'dexie-react-hooks';
import { localDB } from '@/lib/local-db/db'; 
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus'; 
import SupportModal from '@/app/components/SupportModal';

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  const { data: session } = useSession();
  const orgId = (session?.user as any)?.orgId; 
  
  const [labProfile, setLabProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false); 
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isOnline = useNetworkStatus();
  
  const pendingCount = useLiveQuery(
    () => localDB.registrations.where('sync_status').equals('pending').count(),
    [] 
  ) || 0;

  useEffect(() => {
    const loadProfile = async () => {
      const cachedProfile = localStorage.getItem('labseven_profile_cache');
      if (cachedProfile) {
        setLabProfile(JSON.parse(cachedProfile));
        setIsProfileLoading(false);
      }

      try {
        const res = await getLabProfile();
        if (res.success && res.data) {
          setLabProfile(res.data);
          localStorage.setItem('labseven_profile_cache', JSON.stringify(res.data));
        }
      } catch (error) {
        console.error("Failed to fetch profile in background");
      } finally {
        setIsProfileLoading(false);
      }
    };
    
    loadProfile();
    const handleProfileUpdate = () => loadProfile();
    window.addEventListener('labProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('labProfileUpdated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      searchTimeout.current = setTimeout(async () => {
        const results = await searchPatients(searchQuery);
        setSearchResults(results || []);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (patientId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/list?search=${patientId}`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await signOut({ callbackUrl: '/login', redirect: true });
  };

  const handleSpeedBoost = async () => {
    if (isPreloading) return;
    setIsPreloading(true);
    toast.loading("Warming up system engines...", { id: "speed-boost" });
    const coreRoutes = ['/list', '/results/entry', '/tests', '/masters', '/referrals', '/lab-profile', '/reports', '/authorizations', '/super-admin'];
    coreRoutes.forEach(route => router.prefetch(route));
    setIsPreloading(false);
    toast.success("System Optimized! Pages are compiled and ready.", { id: "speed-boost" });
  };

  const displayLabId = labProfile?.organizationId || labProfile?.id || '001';
  const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || "User";

  return (
    <header className="h-16 flex items-center justify-between px-6 shadow-sm border-b shrink-0 z-[100] relative select-none" style={{ background: 'linear-gradient(to right, #b3e5fc, #e1bee7)' }}>
      <div className="flex items-center gap-4 min-w-fit">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg bg-white/20 transition hover:bg-white/40" style={{ color: '#9575cd' }}>
          <Menu size={20} />
        </button>
        <div className="flex items-center">
          <img src="/logo.png.png" alt="Software Logo" className="h-14 w-auto object-contain drop-shadow-sm scale-[1.35] origin-left ml-3" />
        </div>
      </div>

      <div className="flex-1 max-w-xs relative flex justify-center w-full mx-auto" ref={searchContainerRef}>
        <div className="relative flex items-center w-full">
            <input 
              type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true); }}
              className="w-full py-1.5 px-4 pr-16 rounded-full border bg-white/80 text-sm font-medium focus:outline-none focus:ring-2 transition placeholder:text-slate-400"
              style={{ borderColor: 'rgba(77,208,225,0.4)', color: '#455a64' }} 
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && <button onClick={() => {setSearchQuery(''); setShowDropdown(false);}} className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"><X size={13}/></button>}
                <span className="text-purple-400 flex items-center justify-center w-4 h-4">
                  {isSearching ? <Loader2 size={14} className="animate-spin text-[#9575cd]" /> : <Search size={16} style={{ color: '#9575cd' }} />}
                </span>
            </div>
        </div>
        {showDropdown && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[200] animate-in slide-in-from-top-2 duration-200">
                {isSearching ? (
                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-slate-400 gap-3"><Loader2 size={28} className="animate-spin text-[#9575cd]" /><span className="text-xs font-bold uppercase tracking-wider">Searching Database...</span></div>
                ) : searchResults.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm bg-slate-50/90">
                            <span>Patients Found</span><span className="text-[#9575cd] bg-purple-50 px-2 py-0.5 rounded-full">{searchResults.length}</span>
                        </div>
                        {searchResults.map((p) => (
                            <div key={p.id} onClick={() => handleSelectResult(p.patientId)} className="px-4 py-3 border-b border-slate-50 hover:bg-purple-50 cursor-pointer flex items-center justify-between group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 group-hover:bg-[#9575cd] group-hover:text-white flex items-center justify-center font-black text-sm transition-colors border border-slate-200 shadow-sm shrink-0">
                                        {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-700 group-hover:text-[#5e35b1] transition-colors leading-tight">{p.firstName} {p.lastName}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1 border border-slate-200/50"><Hash size={10}/> {p.patientId}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">• {p.phone || 'No Phone'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[11px] font-bold text-slate-500 block">{p.gender}</span><span className="text-[10px] text-slate-400 block mt-0.5">{p.ageY}Y {p.ageM}M</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-slate-400 gap-2"><User size={36} className="opacity-20 mb-2" /><span className="text-sm font-bold text-slate-600">No patients found</span></div>
                )}
            </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-5 min-w-fit">
        <div className="hidden lg:flex items-center gap-3 transition-all duration-300 cursor-default group">
           {isProfileLoading && !labProfile ? (
             <div className="flex items-center gap-3 animate-pulse"><div className="h-9 w-9 rounded-full bg-white/50"></div><div className="h-8 w-32 bg-white/50 rounded flex flex-col gap-1"></div></div>
           ) : (
             <>
               {labProfile?.logoUrl ? (
                 <div className="h-9 w-9 rounded-full bg-white shadow-sm border border-white/60 flex items-center justify-center overflow-hidden p-1 shrink-0"><img src={labProfile.logoUrl} alt="Lab Logo" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" /></div>
               ) : (
                 <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#9575cd] to-[#7e57c2] shadow-sm flex items-center justify-center text-white shrink-0 transition-transform duration-500 group-hover:scale-110"><Building2 size={16} /></div>
               )}
               <div className="flex flex-col justify-center">
                   <span className="font-extrabold text-[15px] text-[#5e35b1] truncate max-w-[200px] tracking-tight leading-tight">{labProfile?.name || 'Lab Seven'}</span>
                   <div className="flex items-center mt-0.5">
                       <div className="flex items-center gap-1.5 px-2 py-[2px] rounded-md bg-purple-50 border border-purple-100/80 shadow-[0_1px_2px_rgba(149,117,205,0.05)] transition-colors group-hover:bg-white">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981] animate-pulse"></div>
                           <span className="text-[9px] font-bold text-[#7e57c2] uppercase tracking-widest">LAB ID: <span className="font-black text-[#5e35b1] ml-0.5">{displayLabId}</span></span>
                       </div>
                   </div>
               </div>
             </>
           )}
        </div>
        
        <div className="h-8 w-[1px] bg-slate-400/30 hidden lg:block mx-1"></div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center">
            {!isOnline ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-1.5 rounded-md text-[11px] font-bold shadow-sm" title="You are offline"><CloudOff size={14} className="animate-pulse" /> Offline</div>
            ) : pendingCount > 0 ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-600 px-2.5 py-1.5 rounded-md text-[11px] font-bold shadow-sm" title="Syncing data to server..."><CloudUpload size={14} className="animate-bounce" /> Syncing ({pendingCount})</div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-1.5 rounded-md text-[11px] font-bold shadow-sm" title="All data is synced"><Cloud size={14} /> Synced</div>
            )}
          </div>

          <button onClick={handleSpeedBoost} disabled={isPreloading} className="p-2 rounded-lg bg-amber-100/50 hover:bg-amber-200 transition-colors cursor-pointer disabled:opacity-50 hidden sm:block" style={{ color: '#d97706' }}>
            {isPreloading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
          </button>

          {/* 🚨 REPLACED ROUTER.PUSH WITH NEXT.JS LINK FOR BACKGROUND LOADING */}
          <Link href="/settings" className="p-2 rounded-lg bg-purple-200/30 hover:bg-purple-200/50 transition-colors cursor-pointer hidden sm:block flex items-center justify-center" style={{ color: '#9575cd' }} title="Account Settings">
            <Settings size={20} />
          </Link>

          <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
          <button onClick={() => { if (orgId === 1) router.push('/super-admin/messages'); else setIsSupportModalOpen(true); }} className="relative p-2 rounded-lg bg-purple-200/30 hover:bg-purple-200/50 transition-colors cursor-pointer hidden sm:block" style={{ color: '#9575cd' }} title="Message Station">
            <MessageSquare size={20} />
          </button>

          <div className="relative p-2 rounded-lg bg-purple-200/30 hover:bg-purple-200/50 transition-colors cursor-pointer hidden sm:block" style={{ color: '#9575cd' }}>
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white font-bold shadow-sm" style={{ background: '#f06292' }}>3</span>
          </div>

          <button onClick={handleLogout} disabled={isLoggingOut} className="group bg-white/90 rounded-full p-1 flex items-center shadow-sm border border-slate-200 transition-all duration-300 hover:border-red-200 hover:bg-red-50/50 ml-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs z-20 shadow-sm transition-transform group-hover:scale-105 shrink-0" style={{ background: isLoggingOut ? '#ef4444' : 'linear-gradient(to bottom right, #9575cd, #f062a4)' }}>
              {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
            </div>
            <span className="mx-3 text-xs font-bold text-slate-700 transition-all duration-300 group-hover:text-red-500 hidden sm:block truncate max-w-[120px]">{isLoggingOut ? "Wait..." : displayName}</span>
          </button>
        </div>
      </div>
    </header>
  );
}