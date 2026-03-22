// FILE: app/components/RichTextEditorModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react'; // Added FileText icon
import RichTextEditor from './RichTextEditor';

interface RichTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent?: string;
  title?: string;
}

export default function RichTextEditorModal({ isOpen, onClose, onSave, initialContent = '', title = 'Edit Details' }: RichTextEditorModalProps) {
  const [content, setContent] = useState(initialContent);

  // Reset content when modal opens
  useEffect(() => {
    if (isOpen) setContent(initialContent);
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl h-[600px] rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header - Styled like Billing Modal */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ background: 'linear-gradient(to right, #b3e5fc, #e1bee7)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/40 rounded text-[#9575cd]">
              <FileText size={18} />
            </div>
            <h3 className="font-bold text-slate-700 text-lg">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/40 text-slate-600 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 bg-white relative flex flex-col min-h-0">
           <RichTextEditor 
             value={content} 
             onChange={setContent} 
             placeholder="Start typing details here..." 
           />
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
           <button 
             onClick={onClose}
             className="px-6 py-2 rounded-[5px] text-white font-bold text-sm shadow-md transition-transform active:scale-95"
             style={{ background: 'linear-gradient(to right, #ba68c8, #f06292)' }}
           >
             Cancel
           </button>
           <button 
             onClick={() => onSave(content)}
             className="px-6 py-2 rounded-[5px] text-white font-bold text-sm shadow-md transition-transform active:scale-95"
             style={{ background: 'linear-gradient(to right, #4dd0e1, #64b5f6)' }}
           >
             Save Changes
           </button>
        </div>

      </div>
    </div>
  );
}