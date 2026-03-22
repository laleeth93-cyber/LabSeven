// --- app/authorizations/page.tsx Block Open ---
"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Users, PenTool, Key, Loader2 } from 'lucide-react';
import { getRoles, getUsers } from '@/app/actions/authorizations';

import UsersTab from './components/UsersTab';
import RolesTab from './components/RolesTab';
import PermissionsTab from './components/PermissionsTab';
import SignaturesTab from './components/SignaturesTab';

export default function AuthorizationsPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'signatures'>('users');
    const [isLoading, setIsLoading] = useState(true);

    const [roles, setRoles] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [rolesRes, usersRes] = await Promise.all([
            getRoles(),
            getUsers()
        ]);
        
        if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
        if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        
        setIsLoading(false);
    };

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
                    <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'text-[#9575cd] border-b-2 border-[#9575cd]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Users size={18} /> User Setup
                    </button>
                    <button onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 px-4 py-2 font-bold transition-all whitespace-nowrap ${activeTab === 'roles' ? 'text-[#9575cd] border-b-2 border-[#9575cd]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Shield size={18} /> Roles
                    </button>
                    <button onClick={() => setActiveTab('permissions')} className={`flex items-center gap-2 px-4 py-2 font-bold transition-all whitespace-nowrap ${activeTab === 'permissions' ? 'text-[#9575cd] border-b-2 border-[#9575cd]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Key size={18} /> Permissions
                    </button>
                    <button onClick={() => setActiveTab('signatures')} className={`flex items-center gap-2 px-4 py-2 font-bold transition-all whitespace-nowrap ${activeTab === 'signatures' ? 'text-[#9575cd] border-b-2 border-[#9575cd]' : 'text-slate-500 hover:text-slate-700'}`}>
                        <PenTool size={18} /> Signatures
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#9575cd]" size={32} /></div>
                ) : (
                    <>
                        {activeTab === 'users' && <UsersTab users={users} roles={roles} loadData={loadData} />}
                        {activeTab === 'roles' && <RolesTab roles={roles} loadData={loadData} />}
                        {activeTab === 'permissions' && <PermissionsTab users={users} />}
                        {activeTab === 'signatures' && <SignaturesTab users={users} loadData={loadData} />}
                    </>
                )}
            </div>
        </div>
    );
}
// --- app/authorizations/page.tsx Block Close ---