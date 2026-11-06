// --- BLOCK app/authorizations/components/RolesTab.tsx OPEN ---
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
        <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 xl:gap-3">
                {roles.map((r: any) => (
                    <div key={r.id} className="bg-white p-3.5 xl:p-4 rounded-[6px] border border-slate-200 shadow-sm relative group hover:border-[#9575cd] transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="p-1.5 rounded bg-purple-50 text-[#9575cd] border border-purple-100">
                                    <Shield size={18} />
                                </div>
                                <button 
                                    onClick={() => { setRoleForm(r); setIsRoleModalOpen(true); }} 
                                    className="h-[22px] w-[22px] rounded border border-slate-200 hover:border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center shadow-2xs"
                                    title="Edit Role"
                                >
                                    <Edit size={13} strokeWidth={2}/>
                                </button>
                            </div>
                            <h3 className="font-semibold text-slate-800 text-[14px] xl:text-[15px] leading-tight" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                {r.name}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-normal mt-1 leading-relaxed min-h-[2.5rem]">
                                {r.description || 'Standard access privileges configured for this role.'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
                    <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
                        <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-200 bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
                            <h3 className="font-semibold text-[15px] xl:text-[16px] text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                <Shield size={15} className="text-[#9575cd] shrink-0"/> {roleForm.id ? 'Edit Role Details' : 'Create New Role'}
                            </h3>
                            <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={16}/>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Role Name <span className="text-rose-500 ml-0.5">*</span></label>
                                <input 
                                    type="text" 
                                    value={roleForm.name} 
                                    onChange={e => setRoleForm({...roleForm, name: e.target.value})} 
                                    className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                                    placeholder="e.g. Pathologist, Phlebotomist, Cashier"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Description</label>
                                <textarea 
                                    value={roleForm.description} 
                                    onChange={e => setRoleForm({...roleForm, description: e.target.value})} 
                                    className="w-full text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] p-2 bg-white focus:outline-none focus:border-[#9575cd] h-20 resize-none" 
                                    placeholder="Briefly describe the purpose of this role..."
                                />
                            </div>
                        </div>
                        <div className="px-4 py-2.5 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setIsRoleModalOpen(false)} className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSaveRole} className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
                                <Save size={12}/> Save Role
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/authorizations/components/RolesTab.tsx CLOSE ---
