// --- BLOCK app/authorizations/page.tsx OPEN ---
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Users, PenTool, Key, Loader2, Lock, Plus } from 'lucide-react';
import { getRoles, getUsers, getUserPermissions } from '@/app/actions/authorizations';
import { useSession } from "next-auth/react"; 
import MusicBarLoader from '@/app/components/MusicBarLoader';

import UsersTab from './components/UsersTab';
import RolesTab from './components/RolesTab';
import PermissionsTab from './components/PermissionsTab';
import SignaturesTab from './components/SignaturesTab';

type AuthTab = 'users' | 'roles' | 'permissions' | 'signatures';

function AuthorizationsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId; 
    
    const [permissions, setPermissions] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>(''); 
    const [permsLoaded, setPermsLoaded] = useState(false);

    const [activeTab, setActiveTab] = useState<AuthTab>('users');
    const [isLoading, setIsLoading] = useState(true);
    const [newUserTrigger, setNewUserTrigger] = useState(0);
    const [newRoleTrigger, setNewRoleTrigger] = useState(0);

    const [roles, setRoles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        if (!tabParam) return;
        const normalized = tabParam.toLowerCase();
        if (normalized === 'users' || normalized === 'user' || normalized === 'user-setup') {
            setActiveTab('users');
        } else if (normalized === 'roles' || normalized === 'role') {
            setActiveTab('roles');
        } else if (normalized === 'permissions' || normalized === 'permission') {
            setActiveTab('permissions');
        } else if (normalized === 'signatures' || normalized === 'signature') {
            setActiveTab('signatures');
        }
    }, [tabParam]);

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

    const canSee = (screenName: string) => {
        if (orgId === 1) return true;
        if (!permsLoaded) return false;
        if (permissions.length === 0) {
            if (userRole.toLowerCase().includes('admin')) return true;
            return false; 
        }
        return permissions.some(p => p.module === screenName && p.action === 'Access');
    };

    // ACTION-LEVEL GATEKEEPER
    const canPerform = (action: string) => {
        if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
        if (permissions.length === 0) return false;
        const activeScreen = tabs.find(t => t.id === safeActiveTab)?.screen;
        return permissions.some(p => p.module === activeScreen && p.action === action);
    };

    const tabs: { id: AuthTab; label: string; icon: React.ReactNode; screen: string }[] = [
        { id: 'users', label: 'User Setup', icon: <Users size={14} />, screen: 'User Setup' },
        { id: 'roles', label: 'Roles', icon: <Shield size={14} />, screen: 'Roles' },
        { id: 'permissions', label: 'Permissions', icon: <Key size={14} />, screen: 'Permissions' },
        { id: 'signatures', label: 'Signatures', icon: <PenTool size={14} />, screen: 'Doctor Signatures' }
    ];

    const visibleTabs = tabs.filter(t => canSee(t.screen));
    const safeActiveTab = visibleTabs.find(t => t.id === activeTab) ? activeTab : (visibleTabs[0]?.id || null);

    useEffect(() => {
        if (permsLoaded && safeActiveTab && safeActiveTab !== activeTab) {
            setActiveTab(safeActiveTab as any);
        }
    }, [permsLoaded, safeActiveTab, activeTab]);

    useEffect(() => {
        if (permsLoaded && visibleTabs.length > 0) loadData();
    }, [permsLoaded]);

    const loadData = async () => {
        setIsLoading(true);
        const [rolesRes, usersRes] = await Promise.all([ getRoles(), getUsers() ]);
        if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        setIsLoading(false);
    };

    if (!permsLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-white font-sans">
                <MusicBarLoader text="Authenticating..." />
            </div>
        );
    }

    if (visibleTabs.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6 text-center font-sans">
                <Lock className="text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any settings within the Authorizations module. Please contact your Lab Administrator.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
            <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
                
                {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
                <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                    {/* Left: 20px Title in Calibri */}
                    <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                            <Shield size={16} />
                        </div>
                        <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            Authorizations & Security
                        </h2>
                    </div>

                    {/* Right: Desktop Module Tabs (User Setup, Roles, Permissions, Signatures) */}
                    <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                        {visibleTabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    router.replace(`/authorizations?tab=${tab.id}`, { scroll: false });
                                }}
                                className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                                    safeActiveTab === tab.id ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mobile Tabs Header */}
                <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
                    {visibleTabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                router.replace(`/authorizations?tab=${tab.id}`, { scroll: false });
                            }}
                            className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                                safeActiveTab === tab.id ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sub-header Toolbar flush under header (matching Result Entry & Patient List) */}
                <div className="min-h-[34px] h-[34px] xl:min-h-[38px] xl:h-[38px] px-2.5 xl:px-3 bg-white md:bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <div className="p-1 rounded bg-purple-50 text-[#9575cd] shrink-0">
                            {safeActiveTab === 'users' && <Users size={14} />}
                            {safeActiveTab === 'roles' && <Shield size={14} />}
                            {safeActiveTab === 'permissions' && <Key size={14} />}
                            {safeActiveTab === 'signatures' && <PenTool size={14} />}
                        </div>
                        <h3 className="text-[13px] xl:text-[14px] font-semibold text-slate-800 shrink-0" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                            {safeActiveTab === 'users' && 'Staff & User Setup'}
                            {safeActiveTab === 'roles' && 'Role Management'}
                            {safeActiveTab === 'permissions' && 'User Permissions Matrix'}
                            {safeActiveTab === 'signatures' && 'Doctor & Approver Signatures'}
                        </h3>
                        
                        {/* Count badge */}
                        {(safeActiveTab === 'users' || safeActiveTab === 'signatures') && (
                            <span className="text-[10px] xl:text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 shrink-0">
                                Total Users ({users.length})
                            </span>
                        )}
                        {safeActiveTab === 'roles' && (
                            <span className="text-[10px] xl:text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200 shrink-0">
                                Total Roles ({roles.length})
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {safeActiveTab === 'users' && canPerform('Add') && (
                            <button 
                                onClick={() => setNewUserTrigger(prev => prev + 1)}
                                className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                <Plus size={13} strokeWidth={2.5}/> New User
                            </button>
                        )}
                        {safeActiveTab === 'roles' && canPerform('Add') && (
                            <button 
                                onClick={() => setNewRoleTrigger(prev => prev + 1)}
                                className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                <Plus size={13} strokeWidth={2.5}/> New Role
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-2 md:p-2.5 xl:p-3 min-h-0 custom-scrollbar flex flex-col">
                    {isLoading ? (
                        <div className="flex justify-center items-center flex-1 p-12">
                            <MusicBarLoader text="Loading Data..." />
                        </div>
                    ) : (
                        <>
                            {safeActiveTab === 'users' && <UsersTab users={users} roles={roles} loadData={loadData} canPerform={canPerform} openCreateTrigger={newUserTrigger} />}
                            {safeActiveTab === 'roles' && <RolesTab roles={roles} loadData={loadData} openCreateTrigger={newRoleTrigger} />}
                            {safeActiveTab === 'permissions' && <PermissionsTab users={users} />}
                            {safeActiveTab === 'signatures' && <SignaturesTab users={users} loadData={loadData} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AuthorizationsPage() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-white font-sans">
                <MusicBarLoader text="Loading Authorizations..." />
            </div>
        }>
            <AuthorizationsContent />
        </Suspense>
    );
}
// --- BLOCK app/authorizations/page.tsx CLOSE ---
