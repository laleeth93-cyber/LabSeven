// --- app/authorizations/components/RolesTab.tsx Block Open ---
import React, { useState } from 'react';
import { Shield, Plus, Edit, Save, X } from 'lucide-react';
import { saveRole } from '@/app/actions/authorizations';

export default function RolesTab({ roles, loadData }: any) {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: 0, name: '', description: '' });

    const handleSaveRole = async () => {
        if (!roleForm.name) return alert("Role Name is required");
        const res = await saveRole(roleForm);
        if (res.success) {
            setIsRoleModalOpen(false);
            loadData();
        } else alert(res.message);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="font-bold text-slate-800">Roles</h2>
                    <p className="text-xs text-slate-500">Create access levels like Admin, Pathologist, or Data Entry.</p>
                </div>
                <button onClick={() => { setRoleForm({ id: 0, name: '', description: '' }); setIsRoleModalOpen(true); }} className="bg-[#9575cd] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#7e57c2] flex items-center gap-2 transition-all">
                    <Plus size={16} /> New Role
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((r: any) => (
                    <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => { setRoleForm(r); setIsRoleModalOpen(true); }} className="text-slate-400 hover:text-blue-500"><Edit size={16}/></button>
                        </div>
                        <Shield className="text-[#9575cd] mb-3" size={32} />
                        <h3 className="font-bold text-slate-800 text-lg">{r.name}</h3>
                        <p className="text-sm text-slate-500 mt-1 h-10">{r.description || 'No description provided.'}</p>
                    </div>
                ))}
            </div>

            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Shield size={18} className="text-[#9575cd]"/> {roleForm.id ? 'Edit Role' : 'New Role'}</h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Role Name</label>
                                <input type="text" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 focus:border-[#9575cd] outline-none" placeholder="e.g. Pathologist"/>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                                <textarea value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 focus:border-[#9575cd] outline-none h-24" placeholder="Briefly describe access level"/>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg">Cancel</button>
                            <button onClick={handleSaveRole} className="px-4 py-2 bg-[#9575cd] text-white font-bold text-sm rounded-lg shadow-sm hover:bg-[#7e57c2] flex items-center gap-2"><Save size={16}/> Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- app/authorizations/components/RolesTab.tsx Block Close ---