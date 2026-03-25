// FILE: app/components/ConfigureFieldModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Settings, X, Type, ToggleLeft } from 'lucide-react';
import { FieldData } from '../DashboardClient'; // 🚨 FIXED IMPORT PATH

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
      <div className="bg-white w-full max-w-[500px] rounded-xl shadow-2xl overflow-hidden flex flex-col m-4 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-purple-100 shrink-0 bg-[#f3e5f5]">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-[#9575cd]" />
            <h3 className="font-bold text-slate-700 text-lg">Configure Field</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/40 text-slate-600 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          
          {/* Section 1: Field Properties */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Type size={18} className="text-[#9575cd]" />
              <h4 className="font-bold text-slate-700 text-base">Field Properties</h4>
            </div>
            
            <div className="space-y-4">
              {/* Field Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Field Label</label>
                <input 
                  type="text" 
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4dd0e1] focus:border-transparent transition-all"
                />
              </div>

              {/* Placeholder Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Placeholder Text</label>
                <input 
                  type="text" 
                  value={formData.placeholder || ''}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  placeholder="Auto-generated"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4dd0e1] focus:border-transparent transition-all"
                />
              </div>

              {/* Field Width */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Field Width (Fixed)</label>
                <div className="relative">
                  <select 
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4dd0e1] focus:border-transparent bg-white appearance-none cursor-pointer"
                  >
                    <option value="80px">80px (X-Small)</option>
                    <option value="120px">120px (Small)</option>
                    <option value="180px">180px (Medium)</option>
                    <option value="230px">230px (Large)</option>
                    <option value="300px">300px (Extra Large)</option>
                    <option value="100%">Full Width</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
             <div className="flex items-center gap-2 mb-4">
              <ToggleLeft size={18} className="text-[#9575cd]" />
              <h4 className="font-bold text-slate-700 text-base">Field Options</h4>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Required</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Visible in Form</span>
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-[5px] text-white font-bold text-sm shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to right, #ba68c8, #f06292)' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 rounded-[5px] text-white font-bold text-sm shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(to right, #4dd0e1, #64b5f6)' }}
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}