// --- BLOCK app/authorizations/components/UsersTab.tsx OPEN ---
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, CheckCircle2, UserCog, Key, Power, Percent, FileSignature, Mail, Lock } from 'lucide-react';
import { saveUser, toggleUserStatus, deleteUser, resetUserPassword } from '@/app/actions/authorizations';

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
        <div className="space-y-2.5 flex-1 flex flex-col h-full min-h-0">
            {/* DESKTOP TABLE VIEW AS SEPARATE BLOCK */}
            <div className="hidden md:flex flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
                    <table className="w-full text-left border-collapse border-spacing-0">
                        <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                            <tr>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Name & Qualification</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Account Info</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Role</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Concession Auth</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status & Settings</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u: any) => (
                                <tr key={u.id} className={`hover:bg-slate-50/80 transition-colors group ${!u.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-slate-800 text-[11px] xl:text-[12px]">{u.name}</span>
                                            {u.degree && (
                                                <span className="text-[9px] font-medium text-[#9575cd] bg-purple-50 px-1 py-0.2 rounded border border-purple-200 uppercase tracking-tight">
                                                    {u.degree}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-mono text-slate-700 text-[11px] font-medium">@{u.username}</span>
                                            {u.email && <span className="text-[10px] text-slate-400 font-normal">{u.email}</span>}
                                        </div>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                                            {u.role?.name || 'No Role'}
                                        </span>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                        {u.allowConcession ? (
                                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-200 inline-flex items-center gap-0.5">
                                                <Percent size={10}/> Max {u.concessionLimit}%
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-[11px]">-</span>
                                        )}
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {u.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Disabled
                                                </span>
                                            )}
                                            {u.isBillingOnly && (
                                                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded text-[9.5px] font-medium border border-purple-100">
                                                    Billing Only
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {canPerform('Edit') ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleToggleStatus(u.id, u.isActive)} 
                                                        title={u.isActive ? "Disable User" : "Enable User"} 
                                                        className={`h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 shadow-2xs flex items-center justify-center transition-colors ${
                                                            u.isActive ? 'text-amber-600 hover:bg-amber-50 hover:border-amber-300' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                                                        }`}
                                                    >
                                                        <Power size={13} strokeWidth={2}/>
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => { setPasswordForm({ id: u.id, newPassword: '', confirmPassword: '' }); setIsPasswordModalOpen(true); }} 
                                                        title="Reset Password" 
                                                        className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-purple-300 shadow-2xs text-[#9575cd] hover:bg-purple-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <Key size={13} strokeWidth={2}/>
                                                    </button>

                                                    <button 
                                                        onClick={() => { setUserForm({ ...u, password: '', email: u.email || '', roleId: u.roleId || '', degree: u.degree || '', concessionLimit: u.concessionLimit || '', isBillingOnly: u.isBillingOnly || false }); setIsUserModalOpen(true); }} 
                                                        title="Edit Details" 
                                                        className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-teal-300 shadow-2xs text-teal-600 hover:bg-teal-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <Edit size={13} strokeWidth={2}/>
                                                    </button>

                                                    <button 
                                                        onClick={() => handleDeleteUser(u.id)} 
                                                        title="Delete User" 
                                                        className="h-[20px] md:h-[22px] px-1 md:px-1.5 rounded border border-slate-200 hover:border-rose-300 shadow-2xs text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <Trash2 size={13} strokeWidth={2}/>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-400 text-[11px] font-normal">
                                        No users configured.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pinned Table Footer */}
                <div className="bg-[#f8fafc] border-t border-slate-200 px-2.5 xl:px-3 min-h-[30px] h-[30px] xl:min-h-[34px] xl:h-[34px] flex items-center justify-between shrink-0 text-[11px] text-slate-500 font-normal">
                    <span>
                        Showing <strong className="font-medium text-slate-700">{users.length}</strong> registered staff user{users.length === 1 ? '' : 's'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                        Active: {users.filter((u: any) => u.isActive).length} • Disabled: {users.filter((u: any) => !u.isActive).length}
                    </span>
                </div>
            </div>

            {/* MOBILE CARDS VIEW */}
            <div className="md:hidden space-y-2">
                {users.map((u: any) => (
                    <div key={u.id} className={`bg-white p-2.5 rounded-[6px] border border-slate-200 shadow-2xs space-y-2 ${!u.isActive ? 'opacity-70 bg-slate-50/60' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded bg-purple-50 text-[#7e57c2] border border-purple-100 flex items-center justify-center shrink-0">
                                    <UserCog size={14} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-[11px] text-slate-800 truncate leading-tight">{u.name}</h3>
                                    {u.degree && <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">{u.degree}</p>}
                                </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                                {u.isActive ? (
                                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                        <CheckCircle2 size={9} /> Active
                                    </span>
                                ) : (
                                    <span className="bg-rose-50 text-rose-500 border border-rose-100 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                        <Power size={9} /> Disabled
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 text-[10px] pt-1.5 border-t border-slate-100">
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[9.5px]">@{u.username}</span>
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded text-[9.5px] font-bold border border-blue-100">{u.role?.name || 'No Role'}</span>
                            {u.email && (
                                <span className="text-[9.5px] text-slate-500 flex items-center gap-1 truncate max-w-[140px]">
                                    <Mail size={9} /> {u.email}
                                </span>
                            )}
                            {u.isBillingOnly && (
                                <span className="text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded text-[9px] font-bold border border-purple-100 flex items-center gap-0.5">
                                    <FileSignature size={9} /> Billing Only
                                </span>
                            )}
                            {u.allowConcession && (
                                <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded text-[9px] font-bold border border-amber-200 flex items-center gap-0.5">
                                    <Percent size={9} /> Max {u.concessionLimit}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-100">
                            {canPerform('Edit') ? (
                                <>
                                    <button 
                                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                                        className={`h-5 px-2 rounded text-[9px] font-bold flex items-center gap-0.5 border transition-colors ${
                                            u.isActive 
                                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}
                                    >
                                        <Power size={10} /> {u.isActive ? 'Disable' : 'Enable'}
                                    </button>
                                    <button 
                                        onClick={() => { setPasswordForm({ id: u.id, newPassword: '', confirmPassword: '' }); setIsPasswordModalOpen(true); }}
                                        className="h-5 px-2 rounded text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 flex items-center gap-0.5 transition-colors"
                                    >
                                        <Key size={10} /> Password
                                    </button>
                                    <button 
                                        onClick={() => { setUserForm({ ...u, password: '', email: u.email || '', roleId: u.roleId || '', degree: u.degree || '', concessionLimit: u.concessionLimit || '', isBillingOnly: u.isBillingOnly || false }); setIsUserModalOpen(true); }}
                                        className="h-5 px-2 rounded text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 flex items-center gap-0.5 transition-colors"
                                    >
                                        <Edit size={10} /> Edit
                                    </button>
                                </>
                            ) : (
                                <span className="text-[9.5px] text-slate-400 flex items-center gap-1"><Lock size={10}/> View Only</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* USER MODAL */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
                    <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
                        <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] shrink-0">
                            <h3 className="text-[15px] xl:text-[16px] font-semibold text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                <UserCog size={15} className="text-[#9575cd]"/> {userForm.id ? 'Edit User Account' : 'Add New Staff User'}
                            </h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                <X size={16}/>
                            </button>
                        </div>
                        
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto flex-1 custom-scrollbar">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Full Name <span className="text-rose-500 ml-0.5">*</span></label>
                                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" placeholder="e.g. Dr. John Doe" autoFocus />
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Email Address</label>
                                <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="staff@laboratory.com" className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"/>
                            </div>

                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Username <span className="text-rose-500 ml-0.5">*</span></label>
                                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white font-mono focus:outline-none focus:border-[#9575cd]" placeholder="login_username"/>
                            </div>
                            
                            {!userForm.id && (
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Password <span className="text-rose-500 ml-0.5">*</span></label>
                                    <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"/>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Degree / Qualification</label>
                                <input type="text" value={userForm.degree} onChange={e => setUserForm({...userForm, degree: e.target.value})} placeholder="e.g. MBBS, MD Path" className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"/>
                            </div>

                            <div className={userForm.id ? "md:col-span-2" : ""}>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Assigned Role</label>
                                <select value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2 bg-white focus:outline-none focus:border-[#9575cd]">
                                    <option value="">Select Role...</option>
                                    {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="md:col-span-2 border-t border-slate-100 pt-2.5">
                                <h4 className="text-[9.5px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Billing Privileges</h4>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                                        <input type="checkbox" id="allowConcession" checked={userForm.allowConcession} onChange={e => setUserForm({...userForm, allowConcession: e.target.checked})} className="w-3.5 h-3.5 accent-[#9575cd] rounded cursor-pointer"/>
                                        <span>Allow Billing Concession / Discount</span>
                                    </label>
                                    {userForm.allowConcession && (
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-[10px] font-semibold text-slate-600">Max Limit (%):</label>
                                            <input type="number" min="0" max="100" value={userForm.concessionLimit} onChange={e => setUserForm({...userForm, concessionLimit: e.target.value})} placeholder="50" className="w-16 h-[24px] px-1.5 text-[11px] font-bold border border-purple-300 bg-purple-50/30 rounded focus:border-[#9575cd] outline-none"/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2 border-t border-slate-100 pt-2.5">
                                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                                    <input type="checkbox" id="isActive" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})} className="w-3.5 h-3.5 accent-[#9575cd] rounded cursor-pointer"/>
                                    <span>Account is Active</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                                    <input type="checkbox" id="isBillingOnly" checked={userForm.isBillingOnly} onChange={e => setUserForm({...userForm, isBillingOnly: e.target.checked})} className="w-3.5 h-3.5 accent-[#9575cd] rounded cursor-pointer"/>
                                    <span>Billing Only <span className="text-slate-400 font-normal text-[10px]">(Hide from Doctor Signatures list)</span></span>
                                </label>
                            </div>
                        </div>

                        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
                            <button onClick={() => setIsUserModalOpen(false)} className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveUser} className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
                                <Save size={12}/> Save User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
                    <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
                        <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                            <h3 className="text-[15px] xl:text-[16px] font-semibold text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                <Key size={14} className="text-[#9575cd]"/> Reset User Password
                            </h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                                <X size={16}/>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">New Password</label>
                                <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" autoFocus />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Confirm New Password</label>
                                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]"/>
                            </div>
                        </div>
                        <div className="p-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setIsPasswordModalOpen(false)} className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleResetPassword} className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
                                <Save size={12}/> Update Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/authorizations/components/UsersTab.tsx CLOSE ---
