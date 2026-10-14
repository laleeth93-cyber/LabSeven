import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, CheckCircle2, UserCog, Key, Power, Percent, FileSignature, Mail, Lock } from 'lucide-react';
import { saveUser, toggleUserStatus, deleteUser, resetUserPassword } from '@/app/actions/authorizations';

// 🚨 ACCEPTING canPerform and openCreateTrigger from parent
export default function UsersTab({ users, roles, loadData, canPerform = () => true, openCreateTrigger = 0 }: any) {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({ 
        id: 0, name: '', username: '', password: '', email: '', phone: '', degree: '', roleId: '', isActive: true,
        allowConcession: false, concessionLimit: '', isBillingOnly: false
    });

    useEffect(() => {
        if (openCreateTrigger > 0) {
            setUserForm({ id: 0, name: '', username: '', password: '', email: '', phone: '', degree: '', roleId: '', isActive: true, allowConcession: false, concessionLimit: '', isBillingOnly: false });
            setIsUserModalOpen(true);
        }
    }, [openCreateTrigger]);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ id: 0, newPassword: '', confirmPassword: '' });

    const handleSaveUser = async () => {
        if (!userForm.name || !userForm.username || (!userForm.id && !userForm.password)) {
            return alert("Name, Username, and Password are required");
        }
        const res = await saveUser(userForm);
        if (res.success) {
            setIsUserModalOpen(false);
            loadData();
        } else alert(res.message);
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this user account?`)) {
            const res = await toggleUserStatus(id, !currentStatus);
            if (res.success) loadData();
            else alert(res.message);
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (confirm("Are you sure you want to completely delete this user? This action cannot be undone.")) {
            const res = await deleteUser(id);
            if (res.success) loadData();
            else alert(res.message);
        }
    };

    const handleResetPassword = async () => {
        if (!passwordForm.newPassword) return alert("Password cannot be empty");
        if (passwordForm.newPassword !== passwordForm.confirmPassword) return alert("Passwords do not match!");
        
        const res = await resetUserPassword(passwordForm.id, passwordForm.newPassword);
        if (res.success) {
            setIsPasswordModalOpen(false);
            alert("Password reset successfully!");
            loadData();
        } else alert(res.message);
    };

    return (
        <div className="space-y-4">
            {/* Desktop only banner - hidden on mobile per user request */}
            <div className="hidden md:flex justify-between items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="pr-2">
                    <h2 className="font-bold text-sm md:text-base text-slate-800 leading-tight">User Setup</h2>
                    <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">Manage staff logins, qualifications, roles & privileges.</p>
                </div>
                {/* 🚨 SECURED: ADD NEW USER */}
                {canPerform('Add') && (
                    <button onClick={() => { setUserForm({ id: 0, name: '', username: '', password: '', email: '', phone: '', degree: '', roleId: '', isActive: true, allowConcession: false, concessionLimit: '', isBillingOnly: false }); setIsUserModalOpen(true); }} className="bg-[#9575cd] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-[#7e57c2] flex items-center gap-1.5 transition-all shrink-0">
                        <Plus size={15} /> New User
                    </button>
                )}
            </div>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                            <th className="py-3 px-4 font-bold">Name & Qualification</th>
                            <th className="py-3 px-4 font-bold">Account Info</th>
                            <th className="py-3 px-4 font-bold">Role</th>
                            <th className="py-3 px-4 font-bold text-center">Concession Auth</th>
                            <th className="py-3 px-4 font-bold text-center">Settings</th>
                            <th className="py-3 px-4 font-bold text-center border-l border-slate-200">Access</th>
                            <th className="py-3 px-4 font-bold text-center">Password</th>
                            <th className="py-3 px-4 font-bold text-center">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((u: any) => (
                            <tr key={u.id} className={`hover:bg-slate-50 ${!u.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                <td className="py-3 px-4 font-bold text-slate-800 flex flex-col">
                                    <div className="flex items-center gap-2"><UserCog size={16} className="text-[#9575cd]"/> {u.name}</div>
                                    {u.degree && <span className="text-[10px] text-slate-500 font-medium ml-6">{u.degree}</span>}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="font-bold text-slate-700">{u.username}</div>
                                    {u.email && <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} /> {u.email}</div>}
                                </td>
                                <td className="py-3 px-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{u.role?.name || 'No Role'}</span></td>
                                <td className="py-3 px-4 text-center">
                                    {u.allowConcession ? (
                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto border border-amber-200">
                                            <Percent size={12}/> Max {u.concessionLimit}%
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-xs">None</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 flex flex-col gap-1 items-center justify-center">
                                    {u.isActive ? <span className="text-green-600 text-[10px] font-bold flex items-center gap-1"><CheckCircle2 size={10}/> Active</span> : <span className="text-red-500 text-[10px] font-bold flex items-center gap-1"><Power size={10}/> Disabled</span>}
                                    {u.isBillingOnly && <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-purple-100"><FileSignature size={10}/> Billing Only</span>}
                                </td>
                                
                                {/* 🚨 SECURED: TOGGLE STATUS */}
                                <td className="py-3 px-4 text-center border-l border-slate-100">
                                    {canPerform('Edit') ? (
                                        <button onClick={() => handleToggleStatus(u.id, u.isActive)} title={u.isActive ? "Disable User" : "Enable User"} className={`p-1.5 rounded-md transition-colors ${u.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}>
                                            <Power size={18} className="mx-auto"/>
                                        </button>
                                    ) : <Lock size={14} className="text-slate-200 mx-auto" />}
                                </td>
                                
                                {/* 🚨 SECURED: RESET PASSWORD */}
                                <td className="py-3 px-4 text-center">
                                    {canPerform('Edit') ? (
                                        <button onClick={() => { setPasswordForm({ id: u.id, newPassword: '', confirmPassword: '' }); setIsPasswordModalOpen(true); }} title="Reset Password" className="text-slate-400 hover:text-[#9575cd] hover:bg-purple-50 p-1.5 rounded-md transition-colors">
                                            <Key size={18} className="mx-auto"/>
                                        </button>
                                    ) : <Lock size={14} className="text-slate-200 mx-auto" />}
                                </td>
                                
                                {/* 🚨 SECURED: EDIT DETAILS */}
                                <td className="py-3 px-4 text-center">
                                    {canPerform('Edit') ? (
                                        <button onClick={() => { setUserForm({ ...u, password: '', email: u.email || '', roleId: u.roleId || '', degree: u.degree || '', concessionLimit: u.concessionLimit || '', isBillingOnly: u.isBillingOnly || false }); setIsUserModalOpen(true); }} title="Edit Details" className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-md transition-colors">
                                            <Edit size={18} className="mx-auto"/>
                                        </button>
                                    ) : <Lock size={14} className="text-slate-200 mx-auto" />}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">No users configured.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="md:hidden space-y-2.5">
                {users.map((u: any) => (
                    <div key={u.id} className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5 ${!u.isActive ? 'opacity-70 bg-slate-50/60' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7e57c2] border border-purple-100 flex items-center justify-center shrink-0">
                                    <UserCog size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-xs text-slate-800 truncate leading-tight">{u.name}</h3>
                                    {u.degree && <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">{u.degree}</p>}
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                                {u.isActive ? (
                                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle2 size={10} /> Active
                                    </span>
                                ) : (
                                    <span className="bg-rose-50 text-rose-500 border border-rose-100 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Power size={10} /> Disabled
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1.5 border-t border-slate-100">
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">@{u.username}</span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-100">{u.role?.name || 'No Role'}</span>
                            {u.email && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate max-w-[150px]">
                                    <Mail size={10} /> {u.email}
                                </span>
                            )}
                            {u.isBillingOnly && (
                                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[10px] font-bold border border-purple-100 flex items-center gap-1">
                                    <FileSignature size={10} /> Billing Only
                                </span>
                            )}
                            {u.allowConcession && (
                                <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                                    <Percent size={10} /> Max {u.concessionLimit}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                            {canPerform('Edit') ? (
                                <>
                                    <button 
                                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                                            u.isActive 
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                    >
                                        <Power size={12} /> {u.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                    <button 
                                        onClick={() => { setPasswordForm({ id: u.id, newPassword: '', confirmPassword: '' }); setIsPasswordModalOpen(true); }}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                                    >
                                        <Key size={12} /> Password
                                    </button>
                                    <button 
                                        onClick={() => { setUserForm({ ...u, password: '', email: u.email || '', roleId: u.roleId || '', degree: u.degree || '', concessionLimit: u.concessionLimit || '', isBillingOnly: u.isBillingOnly || false }); setIsUserModalOpen(true); }}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center gap-1 transition-colors"
                                    >
                                        <Edit size={12} /> Edit
                                    </button>
                                </>
                            ) : (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1"><Lock size={12}/> View Only</span>
                            )}
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                        No users configured.
                    </div>
                )}
            </div>

            {/* USER MODAL */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-xl md:max-w-2xl max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center px-3.5 py-2.5 md:p-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h3 className="font-bold text-xs md:text-base text-slate-800 flex items-center gap-1.5 md:gap-2">
                                <UserCog size={15} className="text-[#9575cd] md:w-5 md:h-5 shrink-0"/> {userForm.id ? 'Edit User' : 'New User'}
                            </h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                                <X size={16} className="md:w-5 md:h-5"/>
                            </button>
                        </div>
                        <div className="p-3 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Full Name *</label>
                                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Email ID</label>
                                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="staff@laboratory.com" className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>

                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Username *</label>
                                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            
                            {!userForm.id && (
                                <div>
                                    <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Password *</label>
                                    <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Degree / Qualification</label>
                                <input type="text" value={userForm.degree} onChange={e => setUserForm({...userForm, degree: e.target.value})} placeholder="e.g., MBBS, MD Path" className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>

                            <div className={userForm.id ? "md:col-span-2" : ""}>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Role</label>
                                <select value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none bg-white">
                                    <option value="">Select Role...</option>
                                    {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="md:col-span-2 border-t border-slate-100 pt-2.5 md:pt-4 mt-1 md:mt-2">
                                <h4 className="text-[9px] md:text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Billing Privileges</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="allowConcession" checked={userForm.allowConcession} onChange={e => setUserForm({...userForm, allowConcession: e.target.checked})} className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"/>
                                        <label htmlFor="allowConcession" className="text-xs md:text-sm font-semibold md:font-bold text-slate-700 cursor-pointer">Allow Billing Concession</label>
                                    </div>
                                    {userForm.allowConcession && (
                                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
                                            <label className="text-[10px] md:text-xs font-bold text-slate-600">Max Limit (%)</label>
                                            <input type="number" min="0" max="100" value={userForm.concessionLimit} onChange={e => setUserForm({...userForm, concessionLimit: e.target.value})} placeholder="50" className="w-16 md:w-20 border border-slate-300 rounded-md md:rounded-lg h-6 md:h-8 px-1.5 text-xs focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 md:gap-3 mt-1 md:mt-2 md:col-span-2 border-t border-slate-100 pt-2.5 md:pt-4">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isActive" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})} className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"/>
                                    <label htmlFor="isActive" className="text-xs md:text-sm font-semibold md:font-bold text-slate-700 cursor-pointer">Account is Active</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isBillingOnly" checked={userForm.isBillingOnly} onChange={e => setUserForm({...userForm, isBillingOnly: e.target.checked})} className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-600 cursor-pointer"/>
                                    <label htmlFor="isBillingOnly" className="text-xs md:text-sm font-semibold md:font-bold text-slate-700 cursor-pointer">Billing Only <span className="text-slate-400 font-normal text-[10px] md:text-xs">(Hide from Signatures)</span></label>
                                </div>
                            </div>
                        </div>
                        <div className="px-3 py-2 md:p-4 border-t border-slate-100 flex justify-end gap-1.5 md:gap-2 bg-slate-50 shrink-0">
                            <button onClick={() => setIsUserModalOpen(false)} className="h-7 md:h-9 px-3 md:px-4 text-slate-600 font-bold text-xs md:text-sm hover:bg-slate-200 rounded-md md:rounded-lg">Cancel</button>
                            <button onClick={handleSaveUser} className="h-7 md:h-9 px-3 md:px-4 bg-[#9575cd] text-white font-bold text-xs md:text-sm rounded-md md:rounded-lg shadow-sm hover:bg-[#7e57c2] active:scale-95 flex items-center gap-1.5">
                                <Save size={13} className="md:w-4 md:h-4"/> Save User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center px-3.5 py-2.5 md:p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-xs md:text-base text-slate-800 flex items-center gap-1.5 md:gap-2">
                                <Key size={15} className="text-[#9575cd] md:w-5 md:h-5 shrink-0"/> Reset Password
                            </h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                                <X size={16} className="md:w-5 md:h-5"/>
                            </button>
                        </div>
                        <div className="p-3 md:p-6 space-y-2.5 md:space-y-4">
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">New Password</label>
                                <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Confirm Password</label>
                                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                        </div>
                        <div className="px-3 py-2 md:p-4 border-t border-slate-100 flex justify-end gap-1.5 md:gap-2 bg-slate-50">
                            <button onClick={() => setIsPasswordModalOpen(false)} className="h-7 md:h-9 px-3 md:px-4 text-slate-600 font-bold text-xs md:text-sm hover:bg-slate-200 rounded-md md:rounded-lg">Cancel</button>
                            <button onClick={handleResetPassword} className="h-7 md:h-9 px-3 md:px-4 bg-[#9575cd] text-white font-bold text-xs md:text-sm rounded-md md:rounded-lg shadow-sm hover:bg-[#7e57c2] active:scale-95 flex items-center gap-1.5">
                                <Save size={13} className="md:w-4 md:h-4"/> Save Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/authorizations/components/UsersTab.tsx CLOSE ---