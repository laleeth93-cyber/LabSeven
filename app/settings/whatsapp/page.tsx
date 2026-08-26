import React from 'react';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { Activity, CheckCircle, XCircle, Clock, Send, ShieldAlert, Settings, RefreshCw } from 'lucide-react';

export default async function WhatsAppSettingsPage() {
  const { orgId } = await requireAuth();

  const account = await prisma.whatsAppAccount.findFirst({
    where: { organizationId: orgId }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await prisma.whatsAppLog.findMany({
    where: { 
      organizationId: orgId,
      createdAt: { gte: today }
    }
  });

  const sentCount = logs.filter((l: any) => l.status === 'SENT').length;
  const deliveredCount = logs.filter((l: any) => l.status === 'DELIVERED').length;
  const readCount = logs.filter((l: any) => l.status === 'READ').length;
  const failedCount = logs.filter((l: any) => l.status === 'FAILED').length;
  const pendingCount = logs.filter((l: any) => l.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            WhatsApp Dispatch <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs uppercase rounded-full">Pro</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Manage Meta API connection, templates, and delivery metrics.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-700">
          <Settings size={16} /> Configure Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Health Check Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm col-span-1 md:col-span-1">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-slate-400" />
            Connection Health
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Status</span>
              {account?.status === 'ACTIVE' ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={14}/> Active</span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-1"><ShieldAlert size={14}/> {account?.status || 'Not Configured'}</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Auto-Disable</span>
              <span className="text-slate-800 font-bold">{account?.failureCount || 0} / 10 Fails</span>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100">
              <button className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition">
                <RefreshCw size={14} /> Test Connection
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm col-span-1 md:col-span-2">
           <h2 className="text-sm font-bold text-slate-800 mb-4">Today's Delivery Summary</h2>
           <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                 <p className="text-xs text-slate-500 font-bold uppercase mb-1">Sent</p>
                 <p className="text-2xl font-black text-slate-800">{sentCount}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                 <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Delivered</p>
                 <p className="text-2xl font-black text-emerald-700">{deliveredCount}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                 <p className="text-xs text-blue-600 font-bold uppercase mb-1">Read</p>
                 <p className="text-2xl font-black text-blue-700">{readCount}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                 <p className="text-xs text-amber-600 font-bold uppercase mb-1">Pending</p>
                 <p className="text-2xl font-black text-amber-700">{pendingCount}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                 <p className="text-xs text-red-600 font-bold uppercase mb-1">Failed</p>
                 <p className="text-2xl font-black text-red-700">{failedCount}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">Recent Dispatches (Today)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Transport</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 font-medium">No messages sent today.</td>
                </tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-600">{log.createdAt.toLocaleTimeString()}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{log.phone}</td>
                  <td className="px-5 py-3 text-slate-600">{log.category}</td>
                  <td className="px-5 py-3 text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">{log.transport}</span>
                  </td>
                  <td className="px-5 py-3">
                    {log.status === 'SENT' && <span className="text-slate-600 font-bold">SENT</span>}
                    {log.status === 'DELIVERED' && <span className="text-emerald-600 font-bold">DELIVERED</span>}
                    {log.status === 'READ' && <span className="text-blue-600 font-bold">READ</span>}
                    {log.status === 'FAILED' && <span className="text-red-600 font-bold" title={log.metaErrorMessage || ''}>FAILED</span>}
                    {log.status === 'PENDING' && <span className="text-amber-600 font-bold">PENDING</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
