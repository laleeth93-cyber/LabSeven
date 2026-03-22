// --- app/authorizations/components/UsersTab.tsx Block Open ---
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, CheckCircle2, UserCog, Key, Power, Percent, FileSignature } from 'lucide-react';
import { saveUser, toggleUserStatus, deleteUser, resetUserPassword } from '@/app/actions/authorizations';

export default function UsersTab({ users, roles, loadData }: any) {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForm, setUserForm] = useState({ 
        id: 0, name: '', username: '', password: '', email: '', phone: '', degree: '', roleId: '', isActive: true,
        allowConcession: false, concessionLimit: '', isBillingOnly: false
    });

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
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="font-bold text-slate-800">User Setup</h2>
                    <p className="text-xs text-slate-500">Manage internal staff logins, qualifications, roles, and billing privileges.</p>
                </div>
                <button onClick={() => { setUserForm({ id: 0, name: '', username: '', password: '', email: '', phone: '', degree: '', roleId: '', isActive: true, allowConcession: false, concessionLimit: '', isBillingOnly: false }); setIsUserModalOpen(true); }} className="bg-[#9575cd] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#7e57c2] flex items-center gap-2 transition-all">
                    <Plus size={16} /> New User
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                            <th className="py-3 px-4 font-bold">Name & Qualification</th>
                            <th className="py-3 px-4 font-bold">Username</th>
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
                                <td className="py-3 px-4 text-slate-600">{u.username}</td>
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
                                <td className="py-3 px-4 text-center border-l border-slate-100">
                                    <button onClick={() => handleToggleStatus(u.id, u.isActive)} title={u.isActive ? "Disable User" : "Enable User"} className={`p-1.5 rounded-md transition-colors ${u.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}>
                                        <Power size={18} className="mx-auto"/>
                                    </button>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button onClick={() => { setPasswordForm({ id: u.id, newPassword: '', confirmPassword: '' }); setIsPasswordModalOpen(true); }} title="Reset Password" className="text-slate-400 hover:text-[#9575cd] hover:bg-purple-50 p-1.5 rounded-md transition-colors">
                                        <Key size={18} className="mx-auto"/>
                                    </button>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <button onClick={() => { setUserForm({ ...u, password: '', roleId: u.roleId || '', degree: u.degree || '', concessionLimit: u.concessionLimit || '', isBillingOnly: u.isBillingOnly || false }); setIsUserModalOpen(true); }} title="Edit Details" className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-md transition-colors">
                                        <Edit size={18} className="mx-auto"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-slate-400">No users configured.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* USER MODAL */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserCog size={18} className="text-[#9575cd]"/> {userForm.id ? 'Edit User' : 'New User'}</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name *</label>
                                <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Degree / Qualification</label>
                                <input type="text" value={userForm.degree} onChange={e => setUserForm({...userForm, degree: e.target.value})} placeholder="e.g., MBBS, MD Path" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Username *</label>
                                <input type="text" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            {!userForm.id && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Password *</label>
                                    <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                                </div>
                            )}
                            <div className={userForm.id ? "col-span-2" : ""}>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
                                <select value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none bg-white">
                                    <option value="">Select Role...</option>
                                    {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                                <h4 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-wider">Billing Privileges</h4>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="allowConcession" checked={userForm.allowConcession} onChange={e => setUserForm({...userForm, allowConcession: e.target.checked})} className="w-4 h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"/>
                                        <label htmlFor="allowConcession" className="text-sm font-bold text-slate-700 cursor-pointer">Allow Billing Concession</label>
                                    </div>
                                    {userForm.allowConcession && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                            <label className="text-xs font-bold text-slate-600">Max Limit (%)</label>
                                            <input type="number" min="0" max="100" value={userForm.concessionLimit} onChange={e => setUserForm({...userForm, concessionLimit: e.target.value})} placeholder="e.g. 50" className="w-20 border border-slate-300 rounded-lg p-1.5 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-2 col-span-2 border-t border-slate-100 pt-4">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isActive" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})} className="w-4 h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"/>
                                    <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">Account is Active</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="isBillingOnly" checked={userForm.isBillingOnly} onChange={e => setUserForm({...userForm, isBillingOnly: e.target.checked})} className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-600 cursor-pointer"/>
                                    <label htmlFor="isBillingOnly" className="text-sm font-bold text-slate-700 cursor-pointer">Billing Only <span className="text-slate-400 font-normal">(Hide this user from Doctor Signature Dropdowns)</span></label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg">Cancel</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 bg-[#9575cd] text-white font-bold text-sm rounded-lg shadow-sm hover:bg-[#7e57c2] flex items-center gap-2"><Save size={16}/> Save User</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET PASSWORD MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Key size={18} className="text-[#9575cd]"/> Reset Password</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
                                <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Confirm Password</label>
                                <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none"/>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg">Cancel</button>
                            <button onClick={handleResetPassword} className="px-4 py-2 bg-[#9575cd] text-white font-bold text-sm rounded-lg shadow-sm hover:bg-[#7e57c2]">Save Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- app/authorizations/components/UsersTab.tsx Block Close ---