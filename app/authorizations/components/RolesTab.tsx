import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Save, X } from 'lucide-react';
import { saveRole } from '@/app/actions/authorizations';

export default function RolesTab({ roles, loadData, openCreateTrigger = 0 }: any) {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleForm, setRoleForm] = useState({ id: 0, name: '', description: '' });

    useEffect(() => {
        if (openCreateTrigger > 0) {
            setRoleForm({ id: 0, name: '', description: '' });
            setIsRoleModalOpen(true);
        }
    }, [openCreateTrigger]);

    const handleSaveRole = async () => {
        if (!roleForm.name) return alert("Role Name is required");
        const res = await saveRole(roleForm);
        if (res.success) {
            setIsRoleModalOpen(false);
            loadData();
        } else alert(res.message);
    };

    return (
        <div className="space-y-3 md:space-y-4">
            {/* Desktop only banner - hidden on mobile per user request */}
            <div className="hidden md:flex justify-between items-center bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="pr-2">
                    <h2 className="font-bold text-sm md:text-base text-slate-800 leading-tight">Roles</h2>
                    <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">Create access levels like Admin, Pathologist, or Data Entry.</p>
                </div>
                <button onClick={() => { setRoleForm({ id: 0, name: '', description: '' }); setIsRoleModalOpen(true); }} className="bg-[#9575cd] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold hover:bg-[#7e57c2] flex items-center gap-1.5 transition-all shrink-0">
                    <Plus size={15} /> New Role
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {roles.map((r: any) => (
                    <div key={r.id} className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm relative group">
                        <div className="absolute top-3.5 right-3.5 md:top-4 md:right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => { setRoleForm(r); setIsRoleModalOpen(true); }} className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"><Edit size={16}/></button>
                        </div>
                        <Shield className="text-[#9575cd] mb-2 md:mb-3" size={28} />
                        <h3 className="font-bold text-slate-800 text-base md:text-lg">{r.name}</h3>
                        <p className="text-xs md:text-sm text-slate-500 mt-1 min-h-[2.5rem]">{r.description || 'No description provided.'}</p>
                    </div>
                ))}
            </div>

            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
                        <div className="flex justify-between items-center px-3.5 py-2.5 md:p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-xs md:text-base text-slate-800 flex items-center gap-1.5 md:gap-2">
                                <Shield size={15} className="text-[#9575cd] md:w-5 md:h-5 shrink-0"/> {roleForm.id ? 'Edit Role' : 'New Role'}
                            </h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
                                <X size={16} className="md:w-5 md:h-5"/>
                            </button>
                        </div>
                        <div className="p-3 md:p-4 space-y-2.5 md:space-y-4">
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Role Name</label>
                                <input type="text" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg h-7 md:h-9 px-2 md:px-3 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 focus:border-[#9575cd] outline-none" placeholder="e.g. Pathologist"/>
                            </div>
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-600 mb-0.5 md:mb-1">Description</label>
                                <textarea value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} className="w-full border border-slate-300 rounded-md md:rounded-lg p-2 text-xs md:text-sm focus:ring-1 md:focus:ring-2 focus:ring-[#9575cd]/50 focus:border-[#9575cd] outline-none h-18 md:h-24" placeholder="Briefly describe access level"/>
                            </div>
                        </div>
                        <div className="px-3 py-2 md:p-4 border-t border-slate-100 flex justify-end gap-1.5 md:gap-2 bg-slate-50">
                            <button onClick={() => setIsRoleModalOpen(false)} className="h-7 md:h-9 px-3 md:px-4 text-slate-600 font-bold text-xs md:text-sm hover:bg-slate-200 rounded-md md:rounded-lg">Cancel</button>
                            <button onClick={handleSaveRole} className="h-7 md:h-9 px-3 md:px-4 bg-[#9575cd] text-white font-bold text-xs md:text-sm rounded-md md:rounded-lg shadow-sm hover:bg-[#7e57c2] active:scale-95 flex items-center gap-1.5">
                                <Save size={13} className="md:w-4 md:h-4"/> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- app/authorizations/components/RolesTab.tsx Block Close ---