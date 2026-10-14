"use client";

import React, { useState } from "react";
import { createSuperAdminUser, toggleAdminStatus } from "@/app/actions/super-admin-users";
import toast from "react-hot-toast";
import { Shield, Plus, UserX, UserCheck, Loader2, X, Mail, Search } from "lucide-react";

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
    <div className="w-full">
      
      {/* ========================================================================= */}
      {/* DESKTOP RATIO VIEW (100% PRESERVED, UNCHANGED)                            */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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
      </div>

      {/* ========================================================================= */}
      {/* MOBILE RATIO VIEW (TAILORED FOR MOBILE VIEWPORT)                           */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col gap-2.5 w-full">
        {/* Mobile Header: Title & New Admin button */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div>
            <h1 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              Admin Accounts
            </h1>
            <p className="text-[10px] font-medium text-slate-500">Master System access credentials</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#a07be1] hover:bg-[#8e62d9] text-white text-[11px] font-bold rounded-lg transition-all shadow-xs active:scale-95 shrink-0"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Plus size={13} strokeWidth={2.2} /> New Admin
          </button>
        </div>

        {/* Cute Metrics Row (3 compact cards) */}
        <div className="grid grid-cols-3 gap-1.5 w-full shrink-0">
          <div className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-xs flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Total Admins</span>
            <span className="text-sm font-black text-slate-800 leading-tight mt-0.5">{initialAdmins.length}</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-xs flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Active</span>
            <span className="text-sm font-black text-emerald-600 leading-tight mt-0.5">
              {initialAdmins.filter(a => a.isActive).length}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-lg px-2.5 py-1.5 shadow-xs flex flex-col justify-center">
            <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider truncate">Disabled</span>
            <span className="text-sm font-black text-slate-600 leading-tight mt-0.5">
              {initialAdmins.filter(a => !a.isActive).length}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search admins..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-6 pr-6 border border-slate-200 rounded-md text-[10.5px] focus:border-[#a07be1] outline-none bg-white text-slate-700 placeholder:text-slate-400 shadow-2xs"
            />
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery("")} 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={10} />
              </button>
            )}
          </div>
          <div className="flex bg-slate-200/70 p-0.5 rounded-md gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-2 py-0.5 text-[9.5px] font-bold rounded transition-colors whitespace-nowrap select-none ${statusFilter === "ALL" ? "bg-white shadow-2xs text-[#a07be1]" : "text-slate-500 hover:text-slate-700"}`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-2 py-0.5 text-[9.5px] font-bold rounded transition-colors whitespace-nowrap select-none ${statusFilter === "ACTIVE" ? "bg-white shadow-2xs text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DISABLED")}
              className={`px-2 py-0.5 text-[9.5px] font-bold rounded transition-colors whitespace-nowrap select-none ${statusFilter === "DISABLED" ? "bg-white shadow-2xs text-red-600" : "text-slate-500 hover:text-slate-700"}`}
            >
              Disabled
            </button>
          </div>
        </div>

        {/* Mobile Admin Cards List */}
        <div className="space-y-2 pb-6">
          {filteredAdmins.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
              No admin accounts match your search.
            </div>
          ) : (
            filteredAdmins.map((admin) => {
              const isPrimary = admin.email === "admin@labseven.in";
              const initials = (admin.name || admin.username || "A")
                .split(" ")
                .filter(Boolean)
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <article key={admin.id} className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs">
                  {/* Top: Avatar, Name, Username & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-100 to-indigo-100 border border-purple-200/80 text-[#7e57c2] flex items-center justify-center font-black text-[11px] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-xs font-bold text-slate-800 truncate">{admin.name}</h2>
                          {isPrimary && (
                            <span className="shrink-0 rounded bg-fuchsia-100 text-fuchsia-700 px-1 py-0.2 text-[7.5px] font-bold uppercase tracking-wider">
                              Architect
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[9.5px] text-slate-500 mt-0.5">@{admin.username}</p>
                      </div>
                    </div>

                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-bold ${
                      admin.isActive 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                        : 'bg-red-50 text-red-700 border border-red-200/60'
                    }`}>
                      {admin.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Middle Info: Email */}
                  <div className="mt-2 border-t border-slate-100 pt-1.5 text-[9.5px]">
                    <p className="text-[8px] font-bold uppercase text-slate-400">Email Address</p>
                    <p className="text-slate-700 truncate font-medium flex items-center gap-1 mt-0.5">
                      <Mail size={10} className="text-slate-400 shrink-0" />
                      <span className="truncate">{admin.email}</span>
                    </p>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <span className="text-[9px] font-mono text-slate-400">
                      UID #{admin.id.toString().padStart(3, '0')}
                    </span>

                    {isPrimary ? (
                      <span className="text-[8px] font-bold text-slate-400 uppercase px-2 py-0.5 bg-slate-100 rounded flex items-center gap-1">
                        <Shield size={10} className="text-fuchsia-600" /> Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggle(admin.id, admin.isActive)}
                        className={`h-6 px-2.5 rounded border text-[8.5px] font-semibold flex items-center gap-1 active:scale-95 transition-all select-none ${
                          admin.isActive
                            ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {admin.isActive ? (
                          <>
                            <UserX size={10} />
                            <span>Disable Account</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={10} />
                            <span>Activate Account</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATE MODAL                                                              */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-3.5"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-1.5">
                <Plus size={18} className="text-[#a07be1]" /> Add New Administrator
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-9 sm:h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-9 sm:h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="john@labseven.in" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Login Username</label>
                <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full h-9 sm:h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="johndoe" />
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Temporary Password</label>
                <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full h-9 sm:h-10 px-3 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#a07be1] outline-none" placeholder="Password123!" />
              </div>

              <div className="pt-2 sm:pt-4 flex gap-2 sm:gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-bold text-white bg-[#a07be1] hover:bg-[#8e62d9] transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                  {loading && <Loader2 size={15} className="animate-spin"/>} Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}