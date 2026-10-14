import React, { useState } from 'react';
import { FileUp, Trash2, Maximize, Loader2 } from 'lucide-react';

export default function PrintControls({ formData, handleChange, handleCustomChange, activeStyle, t, b, l, r }: any) {
    const [isUploading, setIsUploading] = useState(false);

    const handleMarginChange = (side: string, val: string) => {
        const num = parseInt(val) || 0;
        const newMargins = { ...formData.marginSettings };
        if (!newMargins[activeStyle]) {
            newMargins[activeStyle] = { top: 120, bottom: 80, left: 40, right: 40 };
        }
        newMargins[activeStyle][side] = num;
        handleCustomChange('marginSettings', newMargins);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("folder", "letterheads");

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData,
            });

            const result = await res.json();
            if (result.success) {
                const targetKey = activeStyle.replace('custom', 'customHeader');
                handleCustomChange(targetKey, result.url);
            } else {
                alert("Upload failed: " + result.error);
            }
        } catch (error) {
            console.error("R2 Upload Error:", error);
            alert("An error occurred while uploading the letterhead.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        const targetKey = activeStyle.replace('custom', 'customHeader');
        handleCustomChange(targetKey, '');
    };

    const activeImage = formData[activeStyle.replace('custom', 'customHeader')];

    return (
        <div className="flex flex-col gap-2.5 md:gap-5 w-full pb-2">
            
            {/* Paper & Orientation Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <Maximize size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Paper & Orientation</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Select the physical dimensions of the printed report.</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Paper Size</label>
                        <select 
                            name="paperSize" 
                            value={formData.paperSize || 'A4'} 
                            onChange={handleChange} 
                            className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700"
                        >
                            <option value="A4">A4 (Standard)</option>
                            <option value="A5">A5 (Half Size)</option>
                            <option value="LETTER">US Letter</option>
                            <option value="LEGAL">US Legal</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Orientation</label>
                        <select 
                            name="printOrientation" 
                            value={formData.printOrientation || 'portrait'} 
                            onChange={handleChange} 
                            className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700"
                        >
                            <option value="portrait">Portrait (Vertical)</option>
                            <option value="landscape">Landscape (Horizontal)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Letterhead Source Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <FileUp size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Letterhead Source</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Choose how background letterhead is applied to the PDF.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 md:gap-2.5">
                    <label className={`flex items-center gap-2 p-1.5 md:p-3 rounded-md md:rounded-xl border cursor-pointer transition-colors ${formData.letterheadStyle === 'none' ? 'bg-purple-50/40 border-[#9575cd]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <input type="radio" name="letterheadStyle" value="none" checked={formData.letterheadStyle === 'none'} onChange={handleChange} className="accent-[#9575cd] w-3 h-3 shrink-0" />
                        <div>
                            <span className="text-[9.5px] md:text-xs font-bold text-slate-800 block leading-tight">No Letterhead (Pre-Printed Paper)</span>
                            <span className="text-[8px] md:text-[10px] text-slate-400 mt-0.5 block leading-tight">Use this if you feed branded paper into the printer. Only margins are applied.</span>
                        </div>
                    </label>

                    {['custom1', 'custom2', 'custom3', 'custom4'].map((styleOpt, i) => (
                        <label key={styleOpt} className={`flex items-center gap-2 p-1.5 md:p-3 rounded-md md:rounded-xl border cursor-pointer transition-colors ${formData.letterheadStyle === styleOpt ? 'bg-purple-50/40 border-[#9575cd]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <input type="radio" name="letterheadStyle" value={styleOpt} checked={formData.letterheadStyle === styleOpt} onChange={handleChange} className="accent-[#9575cd] w-3 h-3 shrink-0" />
                            <div>
                                <span className="text-[9.5px] md:text-xs font-bold text-slate-800 block leading-tight">Custom Letterhead {i + 1} (Digital Overlay)</span>
                                <span className="text-[8px] md:text-[10px] text-slate-400 mt-0.5 block leading-tight">Full-page background image stamped onto every page.</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Margins & Background Image Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="border-b border-slate-100 pb-2 mb-2.5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Margins & Background Image</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">
                            {formData.letterheadStyle === 'none' ? 'Set physical margins for pre-printed paper.' : `Configure margins and upload image for ${activeStyle}.`}
                        </p>
                    </div>
                </div>

                {formData.letterheadStyle !== 'none' && (
                    <div className="mb-2.5 md:mb-4">
                        <div className="w-full h-20 md:h-32 border-2 border-dashed border-slate-300 rounded-lg md:rounded-xl flex flex-col items-center justify-center bg-slate-50 relative group overflow-hidden transition-colors hover:border-[#9575cd] hover:bg-purple-50/20">
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-1">
                                    <Loader2 className="animate-spin text-[#9575cd]" size={16} />
                                    <span className="text-[8.5px] font-bold text-slate-500">Uploading to R2...</span>
                                </div>
                            ) : activeImage ? (
                                <img src={activeImage} alt="Letterhead Preview" className="w-full h-full object-contain p-1.5" />
                            ) : (
                                <div className="text-center text-slate-400 flex flex-col items-center pointer-events-none px-2">
                                    <FileUp size={16} className="mb-0.5 text-[#9575cd]" />
                                    <span className="text-[9.5px] md:text-[11px] font-bold text-slate-700">Upload A4 Background Image</span>
                                    <span className="text-[8px] text-slate-400 mt-0.5">Recommended: 2480 x 3508 pixels (PNG/JPG)</span>
                                </div>
                            )}

                            {!isUploading && (
                                <label className={`absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-all ${activeImage ? 'bg-slate-900/60 opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                    {activeImage && <span className="text-[9px] md:text-[11px] font-bold text-white bg-[#9575cd] px-2 py-0.5 rounded shadow-sm">Replace Image</span>}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>

                        {activeImage && !isUploading && (
                            <div className="flex justify-end mt-1">
                                <button onClick={handleRemoveImage} className="text-[8.5px] text-red-500 font-bold hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1">
                                    <Trash2 size={10} /> Remove
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className={formData.letterheadStyle !== 'none' ? 'pt-2 border-t border-slate-100' : ''}>
                    <h4 className="text-[8.5px] md:text-[9.5px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                        <Maximize size={11}/> Print Safe Area (Margins)
                    </h4>
                    <div className="grid grid-cols-4 gap-1.5 md:gap-3">
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Top (px)</label>
                            <input type="number" value={t} onChange={(e) => handleMarginChange('top', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs text-center px-1 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white font-semibold text-slate-700" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Bottom (px)</label>
                            <input type="number" value={b} onChange={(e) => handleMarginChange('bottom', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs text-center px-1 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white font-semibold text-slate-700" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Left (px)</label>
                            <input type="number" value={l} onChange={(e) => handleMarginChange('left', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs text-center px-1 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white font-semibold text-slate-700" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-tight text-center">Right (px)</label>
                            <input type="number" value={r} onChange={(e) => handleMarginChange('right', e.target.value)} className="w-full h-6 md:h-8 text-[10px] md:text-xs text-center px-1 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white font-semibold text-slate-700" />
                        </div>
                    </div>
                    <p className="text-[8px] md:text-[9.5px] text-slate-400 italic mt-1.5 text-center">Adjust margins to ensure text does not overlap with printed headers/footers.</p>
                </div>
            </div>
        </div>
    );
}