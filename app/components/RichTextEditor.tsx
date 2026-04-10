// --- app/components/RichTextEditor.tsx Block Open ---
"use client";

// BLOCK IMPORTS OPEN
import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
// BLOCK IMPORTS CLOSE

// BLOCK INTERFACES OPEN
interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}
// BLOCK INTERFACES CLOSE

// BLOCK MAIN COMPONENT OPEN
export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);

  // Helper function to calculate new font size
  const getNewFontSize = (currentSizeStr: string, direction: 'up' | 'down') => {
    let currentSize = 14; // Default to 14px
    let unit = 'px';      // Default to px

    // Parse current value (e.g., "14px" -> 14)
    if (currentSizeStr && currentSizeStr !== 'medium') {
      const match = currentSizeStr.match(/^(\d+(\.\d+)?)(pt|px|rem|em)?$/);
      if (match) {
        // We use Math.round to ensure we are working with integers for 1px steps
        currentSize = Math.round(parseFloat(match[1]));
        unit = match[3] || 'px';
      }
    }

    // Calculate new size: Strict +/- 1 step
    let newSize = direction === 'up' ? currentSize + 1 : currentSize - 1;
    
    // Boundary check: Minimum 1px
    if (newSize < 1) newSize = 1;

    return newSize + unit;
  };

  return (
    <div className="w-full border border-slate-300 rounded-md overflow-hidden shadow-sm">
       <Editor
         tinymceScriptSrc="/tinymce/tinymce.min.js"
         
         // 🚨 FIXED: The license key is now passed as a direct prop!
         licenseKey="gpl" 
         
         onInit={(_evt: any, editor: any) => editorRef.current = editor}
         value={value}
         onEditorChange={(newValue: string) => onChange(newValue)}
         init={{
           height: 500,
           menubar: 'file edit view insert format tools table help',
           plugins: [
             'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
             'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
             'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
           ],
           
           // We define a broad range of formats to ensure TinyMCE recognizes them valid
           font_size_formats: '1px 2px 3px 4px 5px 6px 7px 8px 9px 10px 11px 12px 14px 16px 18px 24px 36px 48px',
           
           line_height_formats: '0 0.5 0.8 1 1.1 1.2 1.3 1.4 1.5 2',

           setup: (editor: any) => {
             // REGISTER CUSTOM SMALL ICONS
             
             // Small Minus: 10px wide, centered
             editor.ui.registry.addIcon('small_minus', 
               '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M7 11h10v2H7z" fill="currentColor"/></svg>'
             );
             
             // Small Plus: 10px wide/high cross, centered
             editor.ui.registry.addIcon('small_plus', 
               '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7z" fill="currentColor"/></svg>'
             );

             // 1. Minus Button using 'small_minus'
             editor.ui.registry.addButton('decrease_fontsize', {
               icon: 'small_minus',
               tooltip: 'Decrease font size',
               onAction: () => {
                 const current = editor.queryCommandValue('FontSize') || '14px';
                 const newSize = getNewFontSize(current, 'down');
                 editor.execCommand('FontSize', false, newSize);
               }
             });
             
             // 2. Display Button (Acts as a label)
             editor.ui.registry.addMenuButton('fontsize_display', {
               text: '14px',
               tooltip: 'Current Font Size',
               fetch: (callback: any) => {
                 callback([]);
               },
               onSetup: (api: any) => {
                 const nodeChangeHandler = () => {
                   const current = editor.queryCommandValue('FontSize') || '14px';
                   api.setText(current);
                 };
                 editor.on('NodeChange', nodeChangeHandler);
                 nodeChangeHandler();
                 return () => editor.off('NodeChange', nodeChangeHandler);
               }
             });

             // 3. Plus Button using 'small_plus'
             editor.ui.registry.addButton('increase_fontsize', {
               icon: 'small_plus',
               tooltip: 'Increase font size',
               onAction: () => {
                 const current = editor.queryCommandValue('FontSize') || '14px';
                 const newSize = getNewFontSize(current, 'up');
                 editor.execCommand('FontSize', false, newSize);
               }
             });
           },

           toolbar: 'undo redo | blocks fontfamily | decrease_fontsize fontsize_display increase_fontsize | ' +
             'bold italic underline strikethrough forecolor backcolor | alignleft aligncenter ' +
             'alignright alignjustify lineheight | bullist numlist outdent indent | ' +
             'image table | removeformat | help',
           
           content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px; line-height:1.5 }',
           
           // Table configuration
           table_sizing_mode: 'fixed',
           table_grid: true,
           table_resize_bars: true,
           table_default_attributes: { border: '1' },
           table_default_styles: { 'border-collapse': 'collapse', 'width': '100%' },
           table_advtab: true, 
           table_cell_advtab: true, 
           table_row_advtab: true,

           // Image upload handler
           file_picker_callback: (callback: any, value: any, meta: any) => {
             if (meta.filetype === 'image') {
               const input = document.createElement('input');
               input.setAttribute('type', 'file');
               input.setAttribute('accept', 'image/*');
               input.onchange = function () {
                 const file = (this as HTMLInputElement).files?.[0];
                 if (file) {
                   const reader = new FileReader();
                   reader.onload = function () {
                     const id = 'blobid' + (new Date()).getTime();
                     const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
                     const base64 = (reader.result as string).split(',')[1];
                     const blobInfo = blobCache.create(id, file, base64);
                     blobCache.add(blobInfo);
                     callback(blobInfo.blobUri(), { title: file.name });
                   };
                   reader.readAsDataURL(file);
                 }
               };
               input.click();
             }
           },
         }}
       />
    </div>
  );
}
// BLOCK MAIN COMPONENT CLOSE
// --- app/components/RichTextEditor.tsx Block Close ---