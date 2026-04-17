// FILE: app/components/CustomizeRegistrationModal.tsx
"use client";

import React, { useState } from 'react';
import { SlidersHorizontal, X, Search, Settings } from 'lucide-react';
import ConfigureFieldModal from '@/app/components/ConfigureFieldModal';
import type { FieldData } from './NewRegistration';

const categories = [
  "Basic Info", "Vitals", "Contact Info", "Identification", 
  "Patient Info", "Medical Info", "Billing", "Referral", "Collection"
];

interface CustomizeRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldData[];
  setFields: (fields: FieldData[]) => void;
}

export default function CustomizeRegistrationModal({ isOpen, onClose, fields, setFields }: CustomizeRegistrationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // New state for handling the configuration modal
  const [activeField, setActiveField] = useState<FieldData | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  if (!isOpen) return null;

  const toggleField = (id: number) => {
    // We now update the parent state directly using the prop
    const newFields = [...fields];
    const targetIndex = newFields.findIndex(f => f.id === id);
    if (targetIndex === -1) return;
    
    const targetField = newFields[targetIndex];

    if (targetField.isVisible) {
       // Hide it
       const removedOrder = targetField.order;
       targetField.isVisible = false;
       targetField.order = null;
       
       // Reorder remaining fields
       newFields.forEach(f => {
         if (f.isVisible && f.order !== null && removedOrder !== null && f.order > removedOrder) {
           f.order = f.order - 1;
         }
       });
    } else {
       // Show it
       const currentMaxOrder = newFields.reduce((max, f) => (f.order && f.order > max ? f.order : max), 0);
       targetField.isVisible = true;
       targetField.order = currentMaxOrder + 1;
    }
    
    setFields(newFields);
  };

  const handleSelectAll = () => {
    const allVisible = fields.every(f => f.isVisible);
    const newFields = fields.map(f => {
       if (allVisible) {
         return { ...f, isVisible: false, order: null };
       } else {
         return { ...f, isVisible: true, order: f.id }; // Simple ordering for select all
       }
    });
    setFields(newFields);
  };

  // Handler to open the configure modal
  const handleConfigureClick = (e: React.MouseEvent, field: FieldData) => {
    e.stopPropagation(); 
    setActiveField(field);
    setIsConfigModalOpen(true);
  };

  // Handler to save changes from the configure modal
  const handleSaveField = (updatedField: FieldData) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
  };

  const filteredCategories = categories.filter(cat => {
    const catMatches = cat.toLowerCase().includes(searchQuery.toLowerCase());
    const hasFieldMatches = fields.some(f => 
      f.category === cat && f.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return catMatches || hasFieldMatches;
  });

  const getFieldsNc = (category: string) => {
    return fields.filter(f => 
      f.category === category && 
      f.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between border-b border-purple-100 shrink-0"
          style={{ background: 'linear-gradient(to right, #b3e5fc, #e1bee7)' }}
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={18} className="text-[#9575cd]" />
            <h3 className="font-bold text-slate-700">Customize Registration Fields</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/40 text-slate-600 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 pb-2 space-y-4 shrink-0 bg-white">
          <p className="text-xs text-slate-500">Select which fields to display in the registration form. Unchecked fields will be hidden.</p>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search fields..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9575cd]/20 text-sm"
            />
            <Search size={16} className="absolute left-3.5 top-2.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 px-1">
            <input 
              type="checkbox" 
              checked={fields.every(f => f.isVisible)}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-[#4dd0e1] focus:ring-[#4dd0e1]" 
            />
            <span className="text-sm font-medium text-slate-600">Select All Fields</span>
          </div>
        </div>

        {/* Field Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 min-h-[200px]">
           {filteredCategories.map((category) => {
             const categoryFields = getFieldsNc(category);
             if (categoryFields.length === 0) return null;

             return (
               <div key={category} className="mb-6">
                 <h4 className="text-xs font-bold text-[#9575cd] mb-2 uppercase tracking-wider">{category}</h4>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                   {categoryFields.map((field) => (
                     <div 
                       key={field.id} 
                       onClick={() => toggleField(field.id)}
                       className={`
                         bg-white border rounded-lg p-2.5 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer
                         ${field.isVisible ? 'border-cyan-200' : 'border-slate-200'}
                       `}
                     >
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox" 
                            checked={field.isVisible}
                            readOnly
                            className="w-4 h-4 rounded border-slate-300 text-[#4dd0e1] focus:ring-[#4dd0e1] pointer-events-none" 
                          />
                          
                          {/* Number Badge */}
                          {field.isVisible && (
                            <div className="w-5 h-5 rounded-full bg-[#4dd0e1] text-white flex items-center justify-center text-[10px] font-bold shrink-0 animate-in zoom-in-50 duration-200">
                              {field.order}
                            </div>
                          )}
                          
                          <span className={`text-[11px] font-medium transition-colors ${field.isVisible ? 'text-slate-700' : 'text-slate-500'}`}>
                            {field.label}
                          </span>
                        </div>

                        {/* Settings Icon */}
                        <button 
                          onClick={(e) => handleConfigureClick(e, field)}
                          className="p-1 rounded-full bg-cyan-50 text-slate-500 hover:bg-cyan-100 hover:text-slate-600 transition-colors flex items-center justify-center"
                        >
                          <Settings size={12} />
                        </button>
                     </div>
                   ))}
                 </div>
               </div>
             );
           })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-white font-medium text-sm shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to right, #ab47bc, #f06292)' }}
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-white font-medium text-sm shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to right, #4dd0e1, #29b6f6)' }}
          >
            Apply Changes
          </button>
        </div>

        {/* Configure Field Modal */}
        <ConfigureFieldModal 
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          field={activeField}
          onSave={handleSaveField}
        />

      </div>
    </div>
  );
}
