// --- app/reports/components/PrintControls.tsx Block Open ---
import React from 'react';
import { UploadCloud, Trash2, FileText, Move, Printer } from 'lucide-react';

interface PrintControlsProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleCustomChange: (field: string, value: any) => void;
    activeStyle: string;
    t: number;
    b: number;
    l: number;
    r: number;
}

export default function PrintControls({ formData, handleChange, handleCustomChange, activeStyle, t, b, l, r }: PrintControlsProps) {

    const handleMarginUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newSettings = { ...(formData.marginSettings || {}) };
        if (!newSettings[activeStyle]) newSettings[activeStyle] = { top: 120, bottom: 80, left: 40, right: 40 };
        newSettings[activeStyle][name] = parseInt(value) || 0;
        handleCustomChange('marginSettings', newSettings);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, num: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                handleCustomChange(`customHeader${num}`, base64String); 
                handleCustomChange('letterheadStyle', `custom${num}`);  
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e: React.MouseEvent, num: number) => {
        e.stopPropagation();
        handleCustomChange(`customHeader${num}`, '');
    };

    return (
        <div className="w-full flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar pb-4 h-full">
            
            {/* 1. Letterhead Formats */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col shrink-0">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <UploadCloud size={16} className="text-[#9575cd]" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Letterhead Formats</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Select a box below to set it as Default. Margins save per format.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((num) => {
                        const isBoxActive = activeStyle === `custom${num}`;
                        const imageBase64 = formData[`customHeader${num}`];
                        const hasImage = !!imageBase64;

                        return (
                            <div 
                                key={num} 
                                className={`relative border-2 rounded-xl h-[120px] flex flex-col overflow-hidden transition-all group ${isBoxActive ? 'border-[#9575cd] ring-4 ring-purple-50 shadow-md' : 'border-dashed border-slate-300 hover:border-[#9575cd] bg-slate-50/50 cursor-pointer'}`}
                                onClick={() => handleCustomChange('letterheadStyle', `custom${num}`)}
                            >
                                <div className="absolute top-2 left-2 z-20">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white shadow-sm ${isBoxActive ? 'border-[#9575cd]' : 'border-slate-300'}`}>
                                        {isBoxActive && <div className="w-2 h-2 rounded-full bg-[#9575cd]"></div>}
                                    </div>
                                </div>

                                <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
                                    <label className="bg-white/90 backdrop-blur border border-slate-200 text-slate-500 p-1.5 rounded-lg shadow-sm hover:text-white hover:bg-[#9575cd] hover:border-[#9575cd] cursor-pointer transition-colors" title="Upload Image" onClick={(e) => e.stopPropagation()}>
                                        <UploadCloud size={14} />
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, num)} />
                                    </label>
                                    {hasImage && (
                                        <button className="bg-white/90 backdrop-blur border border-slate-200 text-slate-500 p-1.5 rounded-lg shadow-sm hover:text-white hover:bg-red-500 hover:border-red-500 cursor-pointer transition-colors" title="Delete Image" onClick={(e) => handleRemoveImage(e, num)}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className="w-full h-full flex flex-col items-center justify-center pt-2">
                                    {hasImage ? (
                                        <img src={imageBase64} alt={`Fmt ${num}`} className={`w-full h-full object-contain p-1.5 ${isBoxActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`} />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 opacity-60">
                                            <FileText size={24} className="mb-1" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Format {num}</span>
                                            <span className="text-[9px]">Blank Canvas</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Margin Controls */}
            <div className="bg-white border border-[#9575cd]/40 shadow-sm rounded-2xl p-5 flex flex-col shrink-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#9575cd]"></div>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4 pl-3">
                    <Move size={16} className="text-[#9575cd]" />
                    <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">Margin Configuration</h3>
                        <span className="text-[10px] text-[#9575cd] font-bold uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md border border-[#9575cd]/10">Format {activeStyle.replace('custom', '')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 pl-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Top (px)</label>
                        <input type="number" name="top" value={t} onChange={handleMarginUpdate} className="w-full text-sm font-bold p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] focus:ring-2 focus:ring-[#9575cd]/20 bg-slate-50 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bottom (px)</label>
                        <input type="number" name="bottom" value={b} onChange={handleMarginUpdate} className="w-full text-sm font-bold p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] focus:ring-2 focus:ring-[#9575cd]/20 bg-slate-50 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Left (px)</label>
                        <input type="number" name="left" value={l} onChange={handleMarginUpdate} className="w-full text-sm font-bold p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] focus:ring-2 focus:ring-[#9575cd]/20 bg-slate-50 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Right (px)</label>
                        <input type="number" name="right" value={r} onChange={handleMarginUpdate} className="w-full text-sm font-bold p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] focus:ring-2 focus:ring-[#9575cd]/20 bg-slate-50 transition-all" />
                    </div>
                </div>
            </div>

            {/* 3. Paper Setup */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <Printer size={16} className="text-[#9575cd]" />
                    <h3 className="font-bold text-slate-800 text-sm">Printer Setup</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paper Size</label>
                        <select name="paperSize" value={formData.paperSize} onChange={handleChange} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50 font-medium cursor-pointer transition-all">
                            <option value="A4">A4 (Standard)</option>
                            <option value="A5">A5 (Half Size)</option>
                            <option value="Letter">US Letter</option>
                            <option value="Legal">US Legal</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Orientation</label>
                        <select name="printOrientation" value={formData.printOrientation} onChange={handleChange} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50 font-medium cursor-pointer transition-all">
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                        </select>
                    </div>
                </div>
            </div>

        </div>
    );
}
// --- app/reports/components/PrintControls.tsx Block Close ---