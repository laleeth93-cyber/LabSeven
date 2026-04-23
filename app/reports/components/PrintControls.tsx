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

    // 🚨 UPDATED: Direct R2 Upload Logic
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
                // Set the R2 URL to the specific custom header slot
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
        <div className="flex flex-col gap-4">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">Paper & Orientation</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select the physical dimensions of the printed report.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Paper Size</label>
                        <select name="paperSize" value={formData.paperSize || 'A4'} onChange={handleChange} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                            <option value="A4">A4 (Standard)</option>
                            <option value="A5">A5 (Half Size)</option>
                            <option value="LETTER">US Letter</option>
                            <option value="LEGAL">US Legal</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Orientation</label>
                        <select name="printOrientation" value={formData.printOrientation || 'portrait'} onChange={handleChange} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd]">
                            <option value="portrait">Portrait (Vertical)</option>
                            <option value="landscape">Landscape (Horizontal)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col">
                <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-bold text-slate-800 text-sm">Letterhead Source</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Choose how the background letterhead is applied to the PDF.</p>
                </div>

                <div className="flex flex-col gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${formData.letterheadStyle === 'none' ? 'bg-purple-50 border-[#9575cd]' : 'border-slate-200 hover:border-[#9575cd]/50'}`}>
                        <input type="radio" name="letterheadStyle" value="none" checked={formData.letterheadStyle === 'none'} onChange={handleChange} className="accent-[#9575cd] w-4 h-4" />
                        <div>
                            <span className="text-xs font-bold text-slate-800 block">No Letterhead (Pre-Printed Paper)</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">Use this if you feed your own branded paper into the printer. Only margins are applied.</span>
                        </div>
                    </label>

                    {['custom1', 'custom2', 'custom3', 'custom4'].map((styleOpt, i) => (
                        <label key={styleOpt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${formData.letterheadStyle === styleOpt ? 'bg-purple-50 border-[#9575cd]' : 'border-slate-200 hover:border-[#9575cd]/50'}`}>
                            <input type="radio" name="letterheadStyle" value={styleOpt} checked={formData.letterheadStyle === styleOpt} onChange={handleChange} className="accent-[#9575cd] w-4 h-4" />
                            <div>
                                <span className="text-xs font-bold text-slate-800 block">Custom Letterhead {i + 1} (Digital Overlay)</span>
                                <span className="text-[10px] text-slate-500 mt-0.5 block">A full-page background image is stamped onto every page of the PDF.</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col">
                <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Margins & Background Image</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {formData.letterheadStyle === 'none' ? 'Set physical margins for pre-printed paper.' : `Configure margins and upload the image for ${activeStyle}.`}
                        </p>
                    </div>
                </div>

                {formData.letterheadStyle !== 'none' && (
                    <div className="mb-6">
                        <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 relative group overflow-hidden transition-colors hover:border-[#9575cd] hover:bg-purple-50/30">
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin text-[#9575cd]" size={24} />
                                    <span className="text-[10px] font-bold text-slate-500">Uploading to R2...</span>
                                </div>
                            ) : activeImage ? (
                                <img src={activeImage} alt="Letterhead Preview" className="w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-slate-400 flex flex-col items-center pointer-events-none">
                                    <FileUp size={24} className="mb-2 group-hover:text-[#9575cd] transition-colors" />
                                    <span className="text-xs font-bold text-slate-600">Upload A4 Background Image</span>
                                    <span className="text-[9px] text-slate-400 mt-1">Recommended: 2480 x 3508 pixels (PNG/JPG)</span>
                                </div>
                            )}

                            {!isUploading && (
                                <label className={`absolute inset-0 cursor-pointer flex flex-col items-center justify-center transition-all ${activeImage ? 'bg-slate-900/60 opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                    {activeImage && <span className="text-xs font-bold text-white bg-[#9575cd] px-3 py-1.5 rounded-lg shadow-sm">Replace Image</span>}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>

                        {activeImage && !isUploading && (
                            <div className="flex justify-end mt-2">
                                <button onClick={handleRemoveImage} className="text-[10px] text-red-500 font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                    <Trash2 size={12} /> Remove
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1.5"><Maximize size={12}/> Print Safe Area (Margins)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-600">Top Margin (px)</label>
                            <input type="number" value={t} onChange={(e) => handleMarginChange('top', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-600">Bottom Margin (px)</label>
                            <input type="number" value={b} onChange={(e) => handleMarginChange('bottom', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-600">Left Margin (px)</label>
                            <input type="number" value={l} onChange={(e) => handleMarginChange('left', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-600">Right Margin (px)</label>
                            <input type="number" value={r} onChange={(e) => handleMarginChange('right', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic mt-3 text-center">Adjust margins to ensure the text does not overlap with your printed headers/footers.</p>
                </div>
            </div>
        </div>
    );
}