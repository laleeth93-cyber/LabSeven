"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Plus, Loader2, ChevronLeft } from 'lucide-react';
import { getClientThreads, createThread, replyToThread } from '@/app/actions/support';
import toast from 'react-hot-toast';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Issue");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        loadThreads();
    } else {
        setActiveThread(null);
        setNewTitle(""); setNewMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeThread) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const loadThreads = async () => {
    setLoading(true);
    const data = await getClientThreads();
    setThreads(data);
    if (activeThread) {
      const updated = data.find((t: any) => t.id === activeThread.id);
      if (updated) setActiveThread(updated);
    }
    setLoading(false);
  };

  const handleCreateTicket = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return toast.error("Please fill all fields");
    
    setIsSubmitting(true);
    const res = await createThread(newTitle, newType, newMessage);
    setIsSubmitting(false);

    if (res.success) {
        toast.success("Ticket raised successfully!");
        setNewTitle(""); setNewMessage(""); setNewType("Issue");
        loadThreads();
    } else {
        toast.error("Failed to raise ticket.");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    const text = replyText;
    setReplyText("");
    
    const tempMsg = { id: Date.now(), content: text, isFromSuperAdmin: false, senderName: "You", createdAt: new Date() };
    setActiveThread({ ...activeThread, messages: [...activeThread.messages, tempMsg] });

    await replyToThread(activeThread.id, text);
    loadThreads();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-slate-50 w-full max-w-5xl h-[85vh] min-h-[500px] rounded-2xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200 relative border border-slate-300/50">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full transition-colors text-slate-500">
            <X size={20} />
        </button>

        <div className="flex-1 flex flex-col relative bg-slate-50/50">
            {activeThread ? (
                <div className="flex flex-col h-full bg-white animate-in fade-in duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
                        <button onClick={() => setActiveThread(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"><ChevronLeft size={20} /></button>
                        <div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${activeThread.type === 'Issue' ? 'bg-rose-500' : activeThread.type === 'Requirement' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                <h2 className="font-bold text-sm text-slate-800">{activeThread.title}</h2>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">Ticket #{activeThread.id} • {activeThread.status}</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/80 custom-scrollbar">
                        {activeThread.messages.map((msg: any) => (
                            <div key={msg.id} className={`flex flex-col ${msg.isFromSuperAdmin ? 'items-start' : 'items-end'}`}>
                                <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{msg.isFromSuperAdmin ? 'Master HQ' : 'You'}</span>
                                <div className={`px-4 py-2.5 max-w-[85%] text-sm rounded-2xl ${msg.isFromSuperAdmin ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm' : 'bg-[#9575cd] text-white rounded-tr-none shadow-md'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0">
                        <input 
                            value={replyText} 
                            onChange={e => setReplyText(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSendReply()} 
                            placeholder="Type your reply..." 
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#9575cd] focus:bg-white transition-all" 
                        />
                        <button onClick={handleSendReply} className="w-10 h-10 bg-[#9575cd] text-white rounded-full flex items-center justify-center hover:bg-[#7e57c2] transition-colors shadow-md"><Send size={16} className="ml-1" /></button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-white shrink-0">
                        <div>
                            <h2 className="font-black text-lg text-slate-800">Support Inbox</h2>
                            <p className="text-[11px] text-slate-500 mt-0.5">View your previous requests and replies.</p>
                        </div>
                        <button onClick={loadThreads} className="p-2 text-slate-400 hover:text-[#9575cd] transition-colors"><Loader2 size={16} className={loading ? "animate-spin" : ""} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        {loading && threads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400"><Loader2 className="animate-spin mb-2" size={24}/></div>
                        ) : threads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
                                <MessageSquare size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-bold">No tickets yet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-slate-100">
                                {threads.map(t => (
                                    <div key={t.id} onClick={() => setActiveThread(t)} className="px-4 py-2.5 hover:bg-purple-50/50 cursor-pointer transition-colors group flex flex-col gap-0.5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.type === 'Issue' ? 'bg-rose-500' : t.type === 'Requirement' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                                                <h3 className="font-bold text-xs text-slate-800 group-hover:text-[#5e35b1] truncate leading-tight">{t.title}</h3>
                                            </div>
                                            <span className="text-[9px] text-slate-400 whitespace-nowrap ml-2">{new Date(t.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pl-3.5 mt-0.5">
                                            <p className="text-[10px] text-slate-500 truncate flex-1 leading-tight">{t.messages[t.messages.length - 1]?.content}</p>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider ${t.status === 'Open' ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>{t.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="w-[320px] bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10 shrink-0">
            <div className="p-4 border-b border-slate-100 bg-purple-50/30">
                <h2 className="font-black text-base text-[#5e35b1] flex items-center gap-2"><Plus size={16} /> Raise a Ticket</h2>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Ticket Type</label>
                    <select 
                        value={newType} 
                        onChange={e => setNewType(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none focus:border-[#9575cd] transition-all cursor-pointer"
                    >
                        <option value="Issue">Report an Issue / Bug</option>
                        <option value="Requirement">Request a Requirement</option>
                        <option value="Suggestion">Leave a Suggestion</option>
                    </select>
                </div>

                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Subject</label>
                    <input 
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)} 
                        placeholder="E.g., Cannot print report" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-[#9575cd] transition-all" 
                    />
                </div>

                <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Description</label>
                    <textarea 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        placeholder="Describe the details here..." 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs flex-1 resize-none focus:outline-none focus:border-[#9575cd] transition-all custom-scrollbar" 
                    />
                </div>

                <button 
                    onClick={handleCreateTicket} 
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded font-bold text-sm text-white shadow hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: 'linear-gradient(to right, #9575cd, #7e57c2)' }}
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {isSubmitting ? 'Sending...' : 'Submit'}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}