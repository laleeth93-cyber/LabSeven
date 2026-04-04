// --- BLOCK app/super-admin/plans/page.tsx OPEN ---
import React from "react";
import { Database, ShieldCheck, Zap, Server } from "lucide-react";

export default function PlanMasterPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 md:p-6 font-sans">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Database className="text-[#a07be1]" size={24} />
          SaaS Plan Master
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage global subscription tiers and feature limits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        
        {/* STARTER */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4"><ShieldCheck size={24} className="text-blue-600"/></div>
          <h2 className="text-xl font-black text-slate-800">Starter</h2>
          <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">Perfect for small clinics</p>
          <div className="text-3xl font-black text-slate-800 mb-6">$49<span className="text-sm font-medium text-slate-500">/mo</span></div>
          <ul className="space-y-3 text-sm text-slate-600 font-medium mb-8">
            <li className="flex items-center gap-2">✓ Up to 500 Bills/month</li>
            <li className="flex items-center gap-2">✓ 2 Staff Accounts</li>
            <li className="flex items-center gap-2">✓ Basic Reporting</li>
          </ul>
        </div>

        {/* PROFESSIONAL (Highlighted) */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-[#a07be1] p-6 relative overflow-hidden transform scale-105 z-10">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-[#a07be1]"></div>
          <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Most Popular</div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4"><Zap size={24} className="text-[#a07be1]"/></div>
          <h2 className="text-xl font-black text-slate-800">Professional</h2>
          <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">Standard pathology workflows</p>
          <div className="text-3xl font-black text-slate-800 mb-6">$99<span className="text-sm font-medium text-slate-500">/mo</span></div>
          <ul className="space-y-3 text-sm text-slate-600 font-medium mb-8">
            <li className="flex items-center gap-2">✓ Unlimited Bills</li>
            <li className="flex items-center gap-2">✓ 10 Staff Accounts</li>
            <li className="flex items-center gap-2">✓ WhatsApp Integration</li>
            <li className="flex items-center gap-2">✓ Barcode Generation</li>
          </ul>
        </div>

        {/* ENTERPRISE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4"><Server size={24} className="text-slate-700"/></div>
          <h2 className="text-xl font-black text-slate-800">Enterprise</h2>
          <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">For multi-center chains</p>
          <div className="text-3xl font-black text-slate-800 mb-6">Custom</div>
          <ul className="space-y-3 text-sm text-slate-600 font-medium mb-8">
            <li className="flex items-center gap-2">✓ Multiple Branches</li>
            <li className="flex items-center gap-2">✓ Unlimited Staff</li>
            <li className="flex items-center gap-2">✓ API Access</li>
            <li className="flex items-center gap-2">✓ Custom Domain</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
// --- BLOCK app/super-admin/plans/page.tsx CLOSE ---