"use client";

import React, { useState, useEffect, useRef } from 'react';
// 🚨 ADDED: Mail and Phone icons
import { MessageSquare, Send, Loader2, Building2, Mail, Phone } from 'lucide-react';
import { getSuperAdminThreads, replyToThread } from '@/app/actions/support';

export default function SuperAdminMessagesPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (activeThread) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const loadThreads = async () => {
    const data = await getSuperAdminThreads();
    setThreads(data);
    if (activeThread) {
       const updated = data.find((t: any) => t.id === activeThread.id);
       if (updated) setActiveThread(updated);
    }
    setLoading(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    const text = replyText;
    setReplyText("");
    
    const tempMsg = { id: Date.now(), content: text, isFromSuperAdmin: true, senderName: "Master HQ", createdAt: new Date() };
    setActiveThread({ ...activeThread, messages: [...activeThread.messages, tempMsg] });

    await replyToThread(activeThread.id, text);
    loadThreads();
  };

  const filteredThreads = threads.filter(t => activeFilter === "All" || t.type === activeFilter);

  const getTypeColor = (type: string) => {
      if (type === 'Issue') return 'bg-rose-100 text-rose-700 border-rose-200';
      if (type === 'Requirement') return 'bg-blue-100 text-blue-700 border-blue-200';
      return 'bg-purple-100 text-purple-700 border-purple-200'; 
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#d946ef]" size={32} /></div>;

  return (
    <div className="flex h-[calc(100vh-100px)] bg-slate-50 p-6 gap-6">
      
      <div className="w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-fuchsia-50/50 flex flex-col gap-3 shrink-0">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Building2 size={16} className="text-[#d946ef]" /> Global Inbox</h2>
          
          <div className="flex bg-white rounded border border-slate-200 p-0.5">
             {['All', 'Issue', 'Requirement', 'Suggestion'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setActiveFilter(f)}
                  className={`flex-1 text-[10px] font-bold py-1 px-1 rounded-sm transition-colors ${activeFilter === f ? 'bg-fuchsia-100 text-fuchsia-700' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {f}
                </button>
             ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {filteredThreads.length === 0 && <p className="text-center text-xs text-slate-400 mt-10">No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} tickets found.</p>}
          
          <div className="flex flex-col">
            {filteredThreads.map(t => (
                <div 
                    key={t.id} 
                    onClick={() => setActiveThread(t)} 
                    className={`px-4 py-2.5 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${activeThread?.id === t.id ? 'bg-fuchsia-50/80' : 'hover:bg-slate-50'}`}
                >
                    <div className="flex justify-between items-baseline mb-0.5">
                        {/* 🚨 ADDED: Showing Lab ID next to the name */}
                        <span className="text-[11px] font-bold text-slate-800 truncate pr-2">
                            {t.organization?.name} <span className="text-slate-400 font-normal ml-0.5">#{t.organization?.id}</span>
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                            {t.status === 'Open' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Needs Reply" />}
                            <span className="text-[9px] text-slate-400 whitespace-nowrap">{new Date(t.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === 'Issue' ? 'bg-rose-500' : t.type === 'Requirement' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        <span className={`text-[10px] font-bold truncate shrink-0 ${activeThread?.id === t.id ? 'text-fuchsia-700' : 'text-slate-700'}`}>{t.title}</span>
                        <span className="text-[10px] text-slate-300 shrink-0">-</span>
                        <span className="text-[10px] text-slate-500 truncate flex-1">{t.messages[t.messages.length - 1]?.content}</span>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative">
        {activeThread ? (
          <div className="flex flex-col h-full animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-100 bg-white z-10 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${activeThread.type === 'Issue' ? 'bg-rose-500' : activeThread.type === 'Requirement' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                      <h2 className="font-bold text-base text-slate-800 leading-none">{activeThread.title}</h2>
                  </div>
                  <button onClick={() => setActiveThread(null)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded transition-colors border border-slate-200">Close</button>
              </div>
              
              {/* 🚨 ADDED: Sleek Client Details Bar */}
              <div className="flex items-center gap-4 text-[10px] bg-slate-50 rounded p-2 mt-1 border border-slate-100 flex-wrap">
                  <span className="font-bold text-fuchsia-600 flex items-center gap-1.5">
                      <Building2 size={12} /> {activeThread.organization?.name} 
                      <span className="bg-fuchsia-100 text-fuchsia-700 px-1 rounded ml-1">ID: {activeThread.organization?.id}</span>
                  </span>
                  {activeThread.organization?.email && (
                      <span className="text-slate-500 flex items-center gap-1.5"><Mail size={12} /> {activeThread.organization.email}</span>
                  )}
                  {activeThread.organization?.phone && (
                      <span className="text-slate-500 flex items-center gap-1.5"><Phone size={12} /> {activeThread.organization.phone}</span>
                  )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
              {activeThread.messages.map((msg: any) => (
                <div key={msg.id} className={`flex flex-col ${msg.isFromSuperAdmin ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] font-bold text-slate-400 mb-1 px-1">{msg.isFromSuperAdmin ? 'You' : activeThread.organization?.name}</span>
                  <div className={`px-4 py-2.5 max-w-[80%] text-sm rounded-2xl ${msg.isFromSuperAdmin ? 'bg-[#d946ef] text-white rounded-tr-none shadow-md' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0">
              <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendReply()} placeholder="Type your admin reply..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#d946ef] focus:bg-white transition-all" />
              <button onClick={handleSendReply} className="w-10 h-10 bg-[#d946ef] text-white rounded-full flex items-center justify-center hover:bg-[#c026d3] transition-colors shadow-md"><Send size={16} className="ml-1" /></button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-sm text-slate-500">Select a ticket to reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}