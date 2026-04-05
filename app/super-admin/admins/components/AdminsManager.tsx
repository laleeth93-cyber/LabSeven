// --- BLOCK app/super-admin/admins/components/AdminsManager.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { createSuperAdminUser, toggleAdminStatus } from "@/app/actions/super-admin-users";
import toast from "react-hot-toast";
import { Shield, Plus, UserX, UserCheck, Loader2 } from "lucide-react";

export default function AdminsManager({ initialAdmins }: { initialAdmins: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await createSuperAdminUser(formData);
    
    if (res.success) {
      toast.success(res.message);
      setIsModalOpen(false);
      setFormData({ name: "", username: "", email: "", password: "" });
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  const handleToggle = async (id: number, currentStatus: boolean) => {
    const res = await toggleAdminStatus(id, currentStatus);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Shield className="text-fuchsia-600" size={20} /> System Administrators
          </h2>
          <p className="text-xs text-slate-500 mt-1">Users with full access to Master HQ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#a07be1] hover:bg-[#8e62d9] text-white text-sm font-bold rounded-lg transition-colors"
        >
          <Plus size={16} /> New Admin
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Username</th>
              <th className="p-4 font-bold">Email</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialAdmins.map((admin) => (
              <tr key={admin.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-sm font-bold text-slate-800">{admin.name}</td>
                <td className="p-4 text-sm font-medium text-slate-600">{admin.username}</td>
                <td className="p-4 text-sm text-slate-500">{admin.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${admin.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {admin.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleToggle(admin.id, admin.isActive)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    title={admin.isActive ? "Disable Account" : "Activate Account"}
                  >
                    {admin.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Add New Administrator</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="john@labseven.in" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Login Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="johndoe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Temporary Password</label>
                <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="Password123!" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 h-10 rounded-lg font-bold text-white bg-[#a07be1] hover:bg-[#8e62d9] transition-colors flex justify-center items-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin"/>} Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// --- BLOCK app/super-admin/admins/components/AdminsManager.tsx CLOSE ---