// --- BLOCK app/results/entry/components/HistoryModal.tsx OPEN ---
"use client";

import React from 'react';
import { X, History, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HistoryModal({ show, onClose, paramName, isLoading, data }: any) {
    if (!show) return null;

    return (
        <div className="absolute inset-0 z-[300] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90%] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><History size={18} className="text-[#9575cd]" /> History: {paramName}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full"><X size={18}/></button>
                </div>
                <div className="p-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#9575cd]"/></div>
                    ) : data?.tableData?.length > 0 ? (
                        <div className="space-y-6">
                            <div className="h-64 w-full bg-slate-50 rounded-lg p-2 border border-slate-100">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.graphData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="date" tick={{fontSize: 10}} />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold">
                                    <tr>
                                        <th className="p-2 border">Date</th>
                                        <th className="p-2 border">Bill No</th>
                                        <th className="p-2 border">Result</th>
                                        <th className="p-2 border">Flag</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.tableData.map((h: any, i: number) => (
                                        <tr key={i}>
                                            <td className="p-2 border">{h.date}</td>
                                            <td className="p-2 border">{h.billNumber}</td>
                                            <td className="p-2 border font-bold">{h.value}</td>
                                            <td className="p-2 border">{h.flag !== 'Normal' ? <span className="text-red-500 font-bold">{h.flag}</span> : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-8 text-slate-400">No previous history found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/results/entry/components/HistoryModal.tsx CLOSE ---