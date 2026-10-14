// --- BLOCK app/authorizations/page.tsx OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, PenTool, Key, Loader2, Lock, Plus } from 'lucide-react';
import { getRoles, getUsers, getUserPermissions } from '@/app/actions/authorizations';
import { useSession } from "next-auth/react"; 
import MusicBarLoader from '@/app/components/MusicBarLoader'; // 🚨 NEW IMPORT

import UsersTab from './components/UsersTab';
import RolesTab from './components/RolesTab';
import PermissionsTab from './components/PermissionsTab';
import SignaturesTab from './components/SignaturesTab';

export default function AuthorizationsPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId; 
    
    const [permissions, setPermissions] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>(''); 
    const [permsLoaded, setPermsLoaded] = useState(false);

    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'signatures'>('users');
    const [isLoading, setIsLoading] = useState(true);
    const [newUserTrigger, setNewUserTrigger] = useState(0);
    const [newRoleTrigger, setNewRoleTrigger] = useState(0);

    const [roles, setRoles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

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

    // 🚨 ACTION-LEVEL GATEKEEPER
    const canPerform = (action: string) => {
        if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
        if (permissions.length === 0) return false; // Unmapped users have no access to Authorizations anyway
        const activeScreen = tabs.find(t => t.id === safeActiveTab)?.screen;
        return permissions.some(p => p.module === activeScreen && p.action === action);
    };

    const tabs = [
        { id: 'users', label: 'User Setup', icon: <Users size={18} className="w-3 h-3 md:w-[18px] md:h-[18px] shrink-0" />, screen: 'User Setup' },
        { id: 'roles', label: 'Roles', icon: <Shield size={18} className="w-3 h-3 md:w-[18px] md:h-[18px] shrink-0" />, screen: 'Roles' },
        { id: 'permissions', label: 'Permissions', icon: <Key size={18} className="w-3 h-3 md:w-[18px] md:h-[18px] shrink-0" />, screen: 'Permissions' },
        { id: 'signatures', label: 'Signatures', icon: <PenTool size={18} className="w-3 h-3 md:w-[18px] md:h-[18px] shrink-0" />, screen: 'Doctor Signatures' }
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

    // 🚨 REPLACED AUTH SPINNER WITH MUSIC BAR
    if (!permsLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                <MusicBarLoader text="Authenticating..." />
            </div>
        );
    }

    if (visibleTabs.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <Lock className="text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any settings within the Authorizations module. Please contact your Lab Administrator.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50">
            {/* 1. Header with no bottom margin on mobile to connect with body card */}
            <div className="mx-2.5 mt-2.5 mb-0 md:m-0 bg-white rounded-none border border-slate-200/80 border-b-0 md:border-b md:border-slate-200 shadow-xs md:shadow-none px-3 py-1.5 md:px-6 md:py-4 shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                    <Shield className="text-[#9575cd] shrink-0 w-3.5 h-3.5 md:w-6 md:h-6" size={24} /> 
                    <h1 className="text-xs md:text-xl font-bold text-slate-800 truncate">
                        Authorizations & Security
                    </h1>
                </div>

                {/* 2. Reduced size New button beside page title on mobile */}
                {safeActiveTab === 'users' && canPerform('Add') && (
                    <button 
                        onClick={() => setNewUserTrigger(prev => prev + 1)}
                        className="md:hidden bg-[#9575cd] hover:bg-[#7e57c2] active:scale-95 text-white h-5.5 px-2 rounded text-[10px] font-bold flex items-center gap-1 transition-all shrink-0 shadow-2xs"
                    >
                        <Plus size={11} strokeWidth={2.5} /> New User
                    </button>
                )}
                {safeActiveTab === 'roles' && (
                    <button 
                        onClick={() => setNewRoleTrigger(prev => prev + 1)}
                        className="md:hidden bg-[#9575cd] hover:bg-[#7e57c2] active:scale-95 text-white h-5.5 px-2 rounded text-[10px] font-bold flex items-center gap-1 transition-all shrink-0 shadow-2xs"
                    >
                        <Plus size={11} strokeWidth={2.5} /> New Role
                    </button>
                )}
            </div>
            
            {/* 3. White Card for the Body touching the header with mt-0 */}
            <div className="mx-2.5 mb-2.5 mt-0 md:m-0 flex-1 bg-white md:bg-transparent rounded-none border border-slate-200/80 md:border-0 shadow-xs md:shadow-none flex flex-col min-h-0 overflow-hidden md:p-6 md:overflow-y-auto">
                {/* Top Navigation Buttons with further reduced size */}
                <div className="px-2 py-1.5 md:p-0 border-b border-slate-100 md:border-b md:border-slate-200 md:mb-6 md:pb-2 shrink-0 overflow-x-auto no-scrollbar flex items-center gap-1 md:gap-4 bg-white md:bg-transparent">
                    {visibleTabs.map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex items-center gap-1 md:gap-2 h-5.5 md:h-auto px-2 py-0.5 md:px-4 md:py-2 text-[9.5px] md:text-sm font-semibold md:font-bold transition-all whitespace-nowrap rounded-full md:rounded-none shrink-0 border md:border-0 ${
                                safeActiveTab === tab.id 
                                    ? 'bg-purple-100 text-[#5e35b1] border-purple-200/90 shadow-2xs md:bg-transparent md:text-[#9575cd] md:shadow-none md:border-b-2 md:border-b-[#9575cd]' 
                                    : 'bg-slate-50 md:bg-transparent text-slate-600 md:text-slate-500 hover:text-slate-800 border-slate-200/80 md:border-transparent hover:bg-slate-100/70'
                            }`}
                        >
                            {tab.icon} <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 md:p-0 min-h-0 md:overflow-visible">
                    {/* 🚨 REPLACED DATA SPINNER WITH MUSIC BAR */}
                    {isLoading ? (
                        <div className="flex justify-center p-12">
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
// --- BLOCK app/authorizations/page.tsx CLOSE ---