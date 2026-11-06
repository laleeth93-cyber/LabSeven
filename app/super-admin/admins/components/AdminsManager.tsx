"use client";

import React, { useState } from "react";
import { createSuperAdminUser, toggleAdminStatus } from "@/app/actions/super-admin-users";
import toast from "react-hot-toast";
import { Shield, Plus, UserX, UserCheck, Loader2, X, Mail, Search, CheckCircle2 } from "lucide-react";

export default function AdminsManager({ initialAdmins }: { initialAdmins: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DISABLED">("ALL");

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

  const filteredAdmins = initialAdmins.filter(admin => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      admin.name?.toLowerCase().includes(q) ||
      admin.username?.toLowerCase().includes(q) ||
      admin.email?.toLowerCase().includes(q);
    
    if (!matchesSearch) return false;
    if (statusFilter === "ACTIVE") return admin.isActive;
    if (statusFilter === "DISABLED") return !admin.isActive;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 space-y-2">
      {/* FILTER & ACTIONS BAR AS SEPARATE CARD BLOCK */}
      <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-2 xl:p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="h-[22px] xl:h-[24px] flex items-center bg-slate-100 rounded p-0.5 gap-0.5 border border-slate-200 shrink-0 text-[10px] xl:text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${statusFilter === "ALL" ? "bg-white shadow-2xs text-[#9575cd] font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              All Admins ({initialAdmins.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${statusFilter === "ACTIVE" ? "bg-white shadow-2xs text-emerald-700 font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              Active ({initialAdmins.filter(a => a.isActive).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DISABLED")}
              className={`px-2 py-0.5 rounded transition-all whitespace-nowrap ${statusFilter === "DISABLED" ? "bg-white shadow-2xs text-rose-700 font-semibold" : "text-slate-600 hover:text-slate-900 font-medium"}`}
            >
              Disabled ({initialAdmins.filter(a => !a.isActive).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          <div className="relative w-44 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input 
              type="text" 
              placeholder="Search admins..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-[24px] xl:h-[26px] pl-7 pr-2.5 text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] bg-white focus:outline-none focus:border-[#9575cd]"
            />
          </div>

          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all shrink-0"
            style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
          >
            <Plus size={13} strokeWidth={2.5} /> New Admin
          </button>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW AS SEPARATE BLOCK */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse border-spacing-0 whitespace-nowrap">
            <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
              <tr>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-10" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>#</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Administrator Name</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Username</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Email Address</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Status</th>
                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-28" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin, idx) => {
                const isPrimary = admin.email === "admin@labseven.in";

                return (
                  <tr key={admin.id} className="hover:bg-slate-50/80 transition-colors border-b border-[#d9d9d9]">
                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center font-medium text-slate-500 text-[11px]">
                      {idx + 1}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 text-[11px] xl:text-[12px]">{admin.name}</span>
                        {isPrimary && (
                          <span className="text-[9px] bg-purple-100 text-[#5e35b1] px-1 py-0.2 rounded border border-purple-200 font-bold">
                            Root Architect
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="font-mono text-slate-700 text-[11px] font-medium">
                      @{admin.username}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-slate-600 text-[11px]">
                      {admin.email}
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border inline-flex items-center gap-1 ${
                        admin.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {admin.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center">
                      {isPrimary ? (
                        <span className="text-[10px] font-semibold text-slate-400 italic">
                          Protected
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleToggle(admin.id, admin.isActive)}
                          className={`h-[22px] px-2 rounded text-[10px] font-semibold inline-flex items-center justify-center gap-1 transition-colors shadow-2xs ${
                            admin.isActive
                              ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={admin.isActive ? "Disable Account" : "Activate Account"}
                        >
                          {admin.isActive ? <UserX size={11} /> : <UserCheck size={11} />}
                          <span>{admin.isActive ? 'Disable' : 'Enable'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">
                    No administrators found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PINNED TABLE FOOTER */}
        <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>Showing: <strong className="text-slate-700">{filteredAdmins.length} of {initialAdmins.length} Administrators</strong></span>
          </div>
          <div className="text-[10px] text-slate-400">
            Administrators have full administrative authority over Master HQ
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-2 pb-6">
        {filteredAdmins.map((admin) => {
          const isPrimary = admin.email === "admin@labseven.in";

          return (
            <article key={admin.id} className="rounded-[6px] border border-slate-200 bg-white p-2.5 shadow-2xs flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    {admin.name}
                  </h4>
                  <p className="font-mono text-[10px] text-slate-500">@{admin.username}</p>
                </div>
                <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded border ${
                  admin.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {admin.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="text-[10.5px] text-slate-600 flex items-center gap-1 border-t border-slate-100 pt-1">
                <Mail size={11} className="text-slate-400 shrink-0" />
                <span className="truncate">{admin.email}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                <span className="text-[9px] font-mono text-slate-400">UID #{admin.id.toString().padStart(3, '0')}</span>
                {isPrimary ? (
                  <span className="text-[8.5px] font-semibold text-slate-400 uppercase">Protected</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle(admin.id, admin.isActive)}
                    className={`h-5.5 px-2 rounded border text-[9px] font-semibold flex items-center gap-1 ${
                      admin.isActive
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {admin.isActive ? <UserX size={10} /> : <UserCheck size={10} />}
                    <span>{admin.isActive ? 'Disable' : 'Enable'}</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-[10px] w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
              <h3 className="font-semibold text-[15px] xl:text-[16px] text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                <Plus size={15} className="text-[#9575cd]" /> Add New Administrator
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                  placeholder="e.g. John Doe" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Email Address</label>
                <input 
                  required 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                  placeholder="john@labseven.in" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Login Username</label>
                <input 
                  required 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white font-mono focus:outline-none focus:border-[#9575cd]" 
                  placeholder="johndoe" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Temporary Password</label>
                <input 
                  required 
                  type="password" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd]" 
                  placeholder="Password123!" 
                />
              </div>

              <div className="pt-2 flex gap-2 justify-end border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-normal text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                >
                  {loading && <Loader2 size={12} className="animate-spin"/>} Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
