// FILE: app/components/ConfigureFieldModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Settings, X, Type, ToggleLeft } from 'lucide-react';
import type { FieldData } from '@/app/registration/NewRegistration';

interface ConfigureFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: FieldData | null;
  onSave: (updatedField: FieldData) => void;
}

export default function ConfigureFieldModal({ isOpen, onClose, field, onSave }: ConfigureFieldModalProps) {
  const [formData, setFormData] = useState<FieldData | null>(null);

  useEffect(() => {
    if (field) {
      setFormData({ ...field });
    }
  }, [field]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[80%] max-w-[400px] rounded-xl shadow-2xl overflow-hidden flex flex-col m-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-purple-100 shrink-0 bg-[#f3e5f5]">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-[#9575cd]" />
            <h3 className="font-bold text-slate-700 text-[13px]">Configure Field</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/40 text-slate-600 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4">
          
          {/* Section 1: Field Properties */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Type size={14} className="text-[#9575cd]" />
              <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Field Properties</h4>
            </div>
            
            <div className="space-y-3">
              {/* Field Label */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600">Field Label</label>
                <input 
                  type="text" 
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4dd0e1] focus:border-transparent transition-all"
                />
              </div>

              {/* Placeholder Text */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600">Placeholder Text</label>
                <input 
                  type="text" 
                  value={formData.placeholder || ''}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  placeholder="Auto-generated"
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4dd0e1] focus:border-transparent transition-all"
                />
              </div>

              {/* Field Width */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600">Field Width (Fixed)</label>
                <div className="relative">
                  <select 
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full pl-3 pr-8 py-1.5 rounded-md border border-slate-300 text-[11px] focus:outline-none focus:ring-1 focus:ring-[#4dd0e1] focus:border-transparent bg-white appearance-none cursor-pointer"
                  >
                    <option value="80px">80px (X-Small)</option>
                    <option value="120px">120px (Small)</option>
                    <option value="180px">180px (Medium)</option>
                    <option value="230px">230px (Large)</option>
                    <option value="300px">300px (Extra Large)</option>
                    <option value="100%">Full Width</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          {/* Section 2: Field Options */}
          <div>
             <div className="flex items-center gap-1.5 mb-2.5">
              <ToggleLeft size={14} className="text-[#9575cd]" />
              <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Field Options</h4>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#4dd0e1] focus:ring-[#4dd0e1]"
                />
                <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Required Field</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#4dd0e1] focus:ring-[#4dd0e1]"
                />
                <span className="text-[11px] font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Visible in Form</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex justify-end gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-white font-medium text-[11px] shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to right, #ba68c8, #f06292)' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-white font-medium text-[11px] shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to right, #4dd0e1, #64b5f6)' }}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
