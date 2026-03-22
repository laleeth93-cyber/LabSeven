// FILE: app/specimen/page.tsx
"use client";

import React, { useState } from 'react';
import { TestTube, Box, Plus, Search, Trash2, Edit, X, Droplet, FlaskConical, Clock, Thermometer } from 'lucide-react';

// Define Data Types
interface SpecimenType {
  id: number;
  code: string;
  name: string;
  shortName: string;
  volume: string;
  unit: string; // ml, drops, etc.
  container: string; // Link to Format
  transport: string;
  minStability: string;
  maxStability: string;
  color: string;
}

interface FormatType {
  id: number;
  code: string;
  name: string;
  color: string;
  type: string;
}

export default function SpecimenPage() {
  const [activeTab, setActiveTab] = useState<'specimens' | 'formats'>('specimens');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- MOCK DATA ---
  const [formats, setFormats] = useState<FormatType[]>([
    { id: 1, code: 'FM001', name: 'Lavender Top (EDTA)', color: '#8B5CF6', type: 'Tube' },
    { id: 2, code: 'FM002', name: 'Red Top (Plain)', color: '#EF4444', type: 'Tube' },
    { id: 3, code: 'FM003', name: 'Sterile Container', color: '#10B981', type: 'Container' },
  ]);

  const [specimens, setSpecimens] = useState<SpecimenType[]>([
    { 
      id: 1, code: 'SP001', name: 'Whole Blood EDTA', shortName: 'WB-EDTA', 
      volume: '2', unit: 'ml', container: 'Lavender Top (EDTA)',
      transport: 'Refrigerated', minStability: '1', maxStability: '4', color: '#8B5CF6'
    },
    { 
      id: 2, code: 'SP002', name: 'Serum', shortName: 'SER', 
      volume: '3', unit: 'ml', container: 'Red Top (Plain)',
      transport: 'Room Temp', minStability: '2', maxStability: '24', color: '#EF4444'
    },
  ]);

  // --- FORM STATE ---
  const [formData, setFormData] = useState<any>({});

  const handleOpenAdd = () => {
    // Reset form based on tab
    if (activeTab === 'specimens') {
      setFormData({ 
        name: '', code: '', shortName: '', volume: '2', unit: 'ml', 
        container: '', transport: 'Ambient', minStability: '0', maxStability: '0', color: '#9575cd' 
      });
    } else {
      setFormData({ name: '', code: '', color: '#9575cd', type: 'Tube' });
    }
    setIsModalOpen(true);
  };

  const dataList = activeTab === 'specimens' ? specimens : formats;
  const filteredData = dataList.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 p-6 font-sans">
      
      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                {activeTab === 'specimens' ? <Droplet size={16} className="text-[#9575cd]"/> : <Box size={16} className="text-[#9575cd]"/>}
                Add New {activeTab === 'specimens' ? 'Specimen Definition' : 'Tube Format'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
               {/* --- FORM FIELDS --- */}
               
               {/* Common Fields */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full text-xs border border-slate-300 rounded px-3 h-9 outline-none focus:border-[#9575cd]"
                        placeholder={activeTab === 'specimens' ? "e.g. Whole Blood EDTA" : "e.g. Lavender Top"}
                      />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Code</label>
                      <input 
                        type="text" 
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full text-xs border border-slate-300 rounded px-3 h-9 outline-none focus:border-[#9575cd]"
                        placeholder="Auto-generated"
                      />
                  </div>
               </div>

               {/* SPECIMEN SPECIFIC FIELDS (From Screenshot) */}
               {activeTab === 'specimens' && (
                 <>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Short Name</label>
                           <input 
                             type="text" 
                             value={formData.shortName}
                             onChange={(e) => setFormData({...formData, shortName: e.target.value})}
                             className="w-full text-xs border border-slate-300 rounded px-3 h-9"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Container / Format</label>
                           <select 
                             value={formData.container}
                             onChange={(e) => setFormData({...formData, container: e.target.value})}
                             className="w-full text-xs border border-slate-300 rounded px-3 h-9 bg-white"
                           >
                             <option value="">-- Select Container --</option>
                             {formats.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                           </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Color Code</label>
                            <div className="flex items-center gap-2 h-9 border border-slate-300 rounded px-2">
                                <input 
                                  type="color" 
                                  value={formData.color}
                                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                                  className="w-6 h-6 cursor-pointer border-none bg-transparent p-0"
                                />
                                <span className="text-xs text-slate-500">{formData.color}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Volume</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={formData.volume}
                              onChange={(e) => setFormData({...formData, volume: e.target.value})}
                              className="w-full text-xs border border-slate-300 rounded px-3 h-9"
                            />
                            <select 
                              value={formData.unit} 
                              onChange={(e) => setFormData({...formData, unit: e.target.value})}
                              className="w-16 text-xs border border-slate-300 rounded px-1 h-9 bg-white"
                            >
                              <option>ml</option>
                              <option>µl</option>
                            </select>
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Transport Condition</label>
                          <select 
                             value={formData.transport}
                             onChange={(e) => setFormData({...formData, transport: e.target.value})}
                             className="w-full text-xs border border-slate-300 rounded px-3 h-9 bg-white"
                           >
                             <option>Ambient</option>
                             <option>Refrigerated (2-8°C)</option>
                             <option>Frozen (-20°C)</option>
                           </select>
                       </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                          <Clock size={12}/> Stability (Hours)
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <span className="text-[10px] text-slate-400 block mb-1">Min Hours</span>
                                <input 
                                  type="number" 
                                  value={formData.minStability}
                                  onChange={(e) => setFormData({...formData, minStability: e.target.value})}
                                  className="w-full text-xs border border-slate-300 rounded px-3 h-9"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] text-slate-400 block mb-1">Max Hours</span>
                                <input 
                                  type="number" 
                                  value={formData.maxStability}
                                  onChange={(e) => setFormData({...formData, maxStability: e.target.value})}
                                  className="w-full text-xs border border-slate-300 rounded px-3 h-9"
                                />
                            </div>
                        </div>
                    </div>
                 </>
               )}

               {/* FORMAT SPECIFIC FIELDS */}
               {activeTab === 'formats' && (
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label>
                        <select 
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                          className="w-full text-xs border border-slate-300 rounded px-3 h-9 bg-white"
                        >
                          <option>Tube</option>
                          <option>Container</option>
                          <option>Swab</option>
                          <option>Slide</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cap Color</label>
                        <div className="flex items-center gap-2 h-9 border border-slate-300 rounded px-2">
                            <input 
                              type="color" 
                              value={formData.color}
                              onChange={(e) => setFormData({...formData, color: e.target.value})}
                              className="w-full h-6 cursor-pointer border-none bg-transparent p-0"
                            />
                        </div>
                    </div>
                 </div>
               )}

               <div className="pt-2 flex gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors">CANCEL</button>
                  <button onClick={() => { alert("Saved!"); setIsModalOpen(false); }} className="flex-1 py-2.5 text-xs font-bold text-white bg-[#9575cd] hover:bg-[#7e57c2] rounded shadow-sm transition-colors">
                    SAVE {activeTab === 'specimens' ? 'SPECIMEN' : 'FORMAT'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="h-16 bg-white border border-slate-200 rounded-t-xl flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-slate-800">
             <FlaskConical className="text-[#9575cd]" size={20}/>
             <h1 className="text-lg font-bold tracking-tight">Specimen Master</h1>
          </div>
          <button onClick={handleOpenAdd} className="bg-[#9575cd] hover:bg-[#7e57c2] text-white px-4 py-2 rounded-md text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95">
             <Plus size={16} /> ADD NEW
          </button>
      </div>

      {/* TABS & TOOLBAR */}
      <div className="bg-white border-x border-b border-slate-200 px-6 py-4 flex flex-col gap-4">
          <div className="flex gap-6 border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('specimens')}
                className={`pb-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'specimens' ? 'text-[#9575cd] border-[#9575cd]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                  <Droplet size={16}/> Specimen Definitions
              </button>
              <button 
                onClick={() => setActiveTab('formats')}
                className={`pb-2 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${activeTab === 'formats' ? 'text-[#9575cd] border-[#9575cd]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                  <Box size={16}/> Tube Formats
              </button>
          </div>
          <div className="relative max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder={`Search ${activeTab}...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none transition-all"
             />
          </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="flex-1 bg-white border-x border-b border-slate-200 rounded-b-xl overflow-hidden flex flex-col">
          {/* Header Row */}
          <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
             <div className="w-20 text-[10px] font-bold text-slate-500 uppercase">Code</div>
             {activeTab === 'specimens' && <div className="w-8 text-[10px] font-bold text-slate-500 uppercase">Cap</div>}
             <div className="flex-1 text-[10px] font-bold text-slate-500 uppercase">Name</div>
             {activeTab === 'specimens' ? (
                 <>
                    <div className="w-32 text-[10px] font-bold text-slate-500 uppercase">Container</div>
                    <div className="w-20 text-[10px] font-bold text-slate-500 uppercase">Volume</div>
                    <div className="w-24 text-[10px] font-bold text-slate-500 uppercase">Stability (Hr)</div>
                 </>
             ) : (
                <div className="w-32 text-[10px] font-bold text-slate-500 uppercase">Type</div>
             )}
             <div className="w-16 text-center text-[10px] font-bold text-slate-500 uppercase">Action</div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
             {filteredData.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                     <p className="text-xs">No records found.</p>
                 </div>
             ) : (
                 filteredData.map((item: any) => (
                    <div key={item.id} className="h-12 border-b border-slate-50 flex items-center px-6 hover:bg-slate-50 transition-colors group gap-4">
                        <div className="w-20 text-xs font-mono font-semibold text-slate-600">{item.code}</div>
                        
                        {activeTab === 'specimens' && (
                             <div className="w-8">
                                <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: item.color }}></div>
                             </div>
                        )}

                        <div className="flex-1">
                            <div className="text-sm font-medium text-slate-700">{item.name}</div>
                            {item.shortName && <div className="text-[10px] text-slate-400">{item.shortName}</div>}
                        </div>

                        {activeTab === 'specimens' ? (
                            <>
                                <div className="w-32 text-xs text-slate-600">{item.container || '-'}</div>
                                <div className="w-20 text-xs text-slate-600 font-bold">{item.volume} {item.unit}</div>
                                <div className="w-24 text-xs text-slate-600">{item.minStability}-{item.maxStability} hr</div>
                            </>
                        ) : (
                            <div className="w-32">
                                <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-500 uppercase">{item.type}</span>
                            </div>
                        )}
                        
                        <div className="w-16 flex justify-center gap-2">
                             <button className="text-slate-400 hover:text-[#9575cd] transition-colors"><Edit size={14}/></button>
                             <button className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                 ))
             )}
          </div>
      </div>
    </div>
  );
}