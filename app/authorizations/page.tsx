// --- BLOCK app/authorizations/page.tsx OPEN ---
"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, PenTool, Key, Loader2, Lock } from 'lucide-react';
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
        { id: 'users', label: 'User Setup', icon: <Users size={18} />, screen: 'User Setup' },
        { id: 'roles', label: 'Roles', icon: <Shield size={18} />, screen: 'Roles' },
        { id: 'permissions', label: 'Permissions', icon: <Key size={18} />, screen: 'Permissions' },
        { id: 'signatures', label: 'Signatures', icon: <PenTool size={18} />, screen: 'Doctor Signatures' }
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
            <div className="bg-white px-6 py-4 border-b border-slate-200 shrink-0">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-[#9575cd]" size={24} /> 
                    Authorizations & Security
                </h1>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex gap-4 border-b border-slate-200 mb-6 pb-2 shrink-0 overflow-x-auto">
                    {visibleTabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 font-bold transition-all whitespace-nowrap ${safeActiveTab === tab.id ? 'text-[#9575cd] border-b-2 border-[#9575cd]' : 'text-slate-500 hover:text-slate-700'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* 🚨 REPLACED DATA SPINNER WITH MUSIC BAR */}
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <MusicBarLoader text="Loading Data..." />
                    </div>
                ) : (
                    <>
                        {safeActiveTab === 'users' && <UsersTab users={users} roles={roles} loadData={loadData} canPerform={canPerform} />}
                        {safeActiveTab === 'roles' && <RolesTab roles={roles} loadData={loadData} />}
                        {safeActiveTab === 'permissions' && <PermissionsTab users={users} />}
                        {safeActiveTab === 'signatures' && <SignaturesTab users={users} loadData={loadData} />}
                    </>
                )}
            </div>
        </div>
    );
}
// --- BLOCK app/authorizations/page.tsx CLOSE ---