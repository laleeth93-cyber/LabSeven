// --- BLOCK app/super-admin/page.tsx OPEN ---
"use client";

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Building2, Users, Receipt, Activity, CheckCircle2, XCircle, Search, Power } from 'lucide-react';
import { getAllLaboratories, toggleLaboratoryStatus } from '@/app/actions/super-admin';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [labs, setLabs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    setIsLoading(true);
    const res = await getAllLaboratories();
    if (res.success) {
      setLabs(res.data);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  const handleToggleStatus = async (labId: number, currentStatus: boolean, labName: string) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'SUSPEND' : 'ACTIVATE'} ${labName}?`)) return;

    const toastId = toast.loading("Updating status...");
    const res = await toggleLaboratoryStatus(labId, currentStatus);
    
    if (res.success) {
      toast.success(res.message, { id: toastId });
      fetchLabs(); // Refresh the list
    } else {
      toast.error(res.message, { id: toastId });
    }
  };

  const filteredLabs = labs.filter(lab => 
    lab.name.toLowerCase().includes(search.toLowerCase()) || 
    lab.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-[#a07be1] rounded-lg">
              <ShieldAlert size={24} />
            </div>
            Super Admin Command Center
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage your SaaS tenants, monitor usage, and control access.</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search laboratories..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#a07be1]/20 focus:border-[#a07be1] transition-all font-medium"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Building2 size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Labs</p>
            <h3 className="text-2xl font-black text-slate-800">{labs.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><Activity size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Labs</p>
            <h3 className="text-2xl font-black text-slate-800">{labs.filter(l => l.isActive).length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500"><Users size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Staff Users</p>
            <h3 className="text-2xl font-black text-slate-800">{labs.reduce((acc, curr) => acc + curr._count.users, 0)}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><Receipt size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bills Processed</p>
            <h3 className="text-2xl font-black text-slate-800">{labs.reduce((acc, curr) => acc + curr._count.bills, 0)}</h3>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Workspace / Lab Details</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-center">Usage Metrics</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    Loading tenants...
                  </td>
                </tr>
              ) : filteredLabs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No laboratories found.
                  </td>
                </tr>
              ) : (
                filteredLabs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${lab.isActive ? 'bg-gradient-to-br from-[#a07be1] to-[#7c52c7]' : 'bg-slate-300'}`}>
                          {lab.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-[13px]">{lab.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
                              Workspace ID: {lab.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Joined: {new Date(lab.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[12px] font-bold text-slate-700">{lab.email}</p>
                      <p className="text-[11px] font-medium text-slate-500">{lab.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-center" title="Staff Users">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Users</p>
                          <p className="font-bold text-slate-700">{lab._count.users}</p>
                        </div>
                        <div className="text-center" title="Bills Created">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Bills</p>
                          <p className="font-bold text-slate-700">{lab._count.bills}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${lab.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                        {lab.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {lab.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleToggleStatus(lab.id, lab.isActive, lab.name)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 border ${lab.isActive ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'}`}
                      >
                        <Power size={14} />
                        {lab.isActive ? 'Suspend Lab' : 'Activate Lab'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
// --- BLOCK app/super-admin/page.tsx CLOSE ---