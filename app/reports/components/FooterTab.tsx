import React from 'react';
import { LayoutTemplate, QrCode, PenTool } from 'lucide-react';

interface FooterTabProps {
    footerSettings: any;
    handleToggleFooter: (field: string) => void;
    handleFooterSettingChange: (field: string, value: any) => void;
}

export default function FooterTab({ footerSettings, handleToggleFooter, handleFooterSettingChange }: FooterTabProps) {
    
    return (
        <div className="flex flex-col gap-2.5 md:gap-5 w-full md:h-full md:overflow-y-auto custom-scrollbar md:pr-2 pb-2">
            
            {/* QR & Barcode Settings Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <QrCode size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">QR & Barcode Settings</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Toggle digital verification codes on your footer.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 md:gap-2.5 mb-2.5">
                    {[
                        { key: 'showQrCode', label: 'Show QR Code' },
                        { key: 'showBarcode', label: 'Show Barcode' },
                    ].map((item) => (
                        <div 
                            key={item.key} 
                            onClick={() => handleToggleFooter(item.key)} 
                            className={`px-2 py-1 md:px-4 md:py-3 rounded-md md:rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-1 ${
                                footerSettings[item.key as keyof typeof footerSettings] 
                                    ? 'border-[#9575cd] bg-purple-50/20' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <span className={`font-bold text-[9px] md:text-[12px] truncate ${
                                footerSettings[item.key as keyof typeof footerSettings] ? 'text-[#5e35b1]' : 'text-slate-700'
                            }`}>
                                {item.label}
                            </span>
                            <span className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                footerSettings[item.key as keyof typeof footerSettings] 
                                    ? 'bg-[#9575cd] text-white' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                                {footerSettings[item.key as keyof typeof footerSettings] ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">QR Placement</label>
                        <select 
                            value={footerSettings.qrPlacement || 'footer'} 
                            onChange={(e) => handleFooterSettingChange('qrPlacement', e.target.value)} 
                            className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700"
                        >
                            <option value="footer">Footer</option>
                            <option value="header">Header</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">QR Text Above</label>
                        <select 
                            value={footerSettings.qrText || 'Scan to validate'} 
                            onChange={(e) => handleFooterSettingChange('qrText', e.target.value)} 
                            className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700"
                        >
                            <option value="None">None</option>
                            <option value="Scan to validate">Scan to validate</option>
                            <option value="Scan for Digital copy">Scan for Digital copy</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-0.5 col-span-2 mt-0.5">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Barcode Style</label>
                        <select 
                            value={footerSettings.barcodeText || 'none'} 
                            onChange={(e) => handleFooterSettingChange('barcodeText', e.target.value)} 
                            className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700"
                        >
                            <option value="none">Normal Barcode (No Text)</option>
                            <option value="show_number">Barcode with No. above</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Signature Fine Tuning Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <PenTool size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Signature Size & Alignment</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Control the exact pixel sizes of the doctor signatures.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2.5 gap-y-2">
                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Image Size</span>
                            <span className="text-[#9575cd] font-bold text-[8.5px] bg-purple-50 px-1 py-0.2 rounded border border-purple-200">{footerSettings.sigSize || 40}px</span>
                        </div>
                        <input type="range" min="20" max="100" value={footerSettings.sigSize || 40} onChange={(e) => handleFooterSettingChange('sigSize', parseInt(e.target.value))} className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-0.5" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Sig Gap</span>
                            <span className="text-[#9575cd] font-bold text-[8.5px] bg-purple-50 px-1 py-0.2 rounded border border-purple-200">{footerSettings.sigSpacing ?? 4}px</span>
                        </div>
                        <input type="range" min="0" max="20" value={footerSettings.sigSpacing ?? 4} onChange={(e) => handleFooterSettingChange('sigSpacing', parseInt(e.target.value))} className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-0.5" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Doc Name Size</span>
                            <span className="text-[#9575cd] font-bold text-[8.5px] bg-purple-50 px-1 py-0.2 rounded border border-purple-200">{footerSettings.docNameSize || 10}pt</span>
                        </div>
                        <input type="range" min="6" max="16" value={footerSettings.docNameSize || 10} onChange={(e) => handleFooterSettingChange('docNameSize', parseInt(e.target.value))} className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-0.5" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Degree Size</span>
                            <span className="text-[#9575cd] font-bold text-[8.5px] bg-purple-50 px-1 py-0.2 rounded border border-purple-200">{footerSettings.docDesigSize || 8}pt</span>
                        </div>
                        <input type="range" min="5" max="14" value={footerSettings.docDesigSize || 8} onChange={(e) => handleFooterSettingChange('docDesigSize', parseInt(e.target.value))} className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-0.5" />
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Name Spacing</span>
                            <span className="text-[#9575cd] font-bold text-[8.5px] bg-purple-50 px-1 py-0.2 rounded border border-purple-200">{footerSettings.docNameSpacing ?? 2}px</span>
                        </div>
                        <input type="range" min="0" max="10" value={footerSettings.docNameSpacing ?? 2} onChange={(e) => handleFooterSettingChange('docNameSpacing', parseInt(e.target.value))} className="w-full h-1.5 accent-[#9575cd] cursor-pointer mt-0.5" />
                    </div>

                    <div className="flex flex-col gap-0.5 col-span-2 md:col-span-1">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase tracking-tight">Text Alignment</label>
                        <select 
                            value={footerSettings.sigAlignment || 'center'} 
                            onChange={(e) => handleFooterSettingChange('sigAlignment', e.target.value)} 
                            className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white text-slate-700"
                        >
                            <option value="flex-start">Left</option>
                            <option value="center">Center</option>
                            <option value="flex-end">Right</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Footer Layout Elements Card */}
            <div className="bg-white border border-slate-200 shadow-2xs rounded-xl p-2.5 md:p-4 flex flex-col shrink-0">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
                    <LayoutTemplate size={14} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight">Footer Layout Elements</h3>
                        <p className="text-[8.5px] text-slate-400 mt-0.5 leading-none">Configure page numbering and overall alignment.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 md:gap-2.5 mb-2.5">
                    {[
                        { key: 'showPageNumbers', label: 'Show Page Nos' },
                    ].map((item) => (
                        <div 
                            key={item.key} 
                            onClick={() => handleToggleFooter(item.key)} 
                            className={`px-2 py-1 md:px-4 md:py-3 rounded-md md:rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-1 ${
                                footerSettings[item.key as keyof typeof footerSettings] 
                                    ? 'border-[#9575cd] bg-purple-50/20' 
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                        >
                            <span className={`font-bold text-[9px] md:text-[12px] truncate ${
                                footerSettings[item.key as keyof typeof footerSettings] ? 'text-[#5e35b1]' : 'text-slate-700'
                            }`}>
                                {item.label}
                            </span>
                            <span className={`shrink-0 h-3.5 px-1.5 rounded flex items-center justify-center text-[7.5px] font-extrabold uppercase tracking-tight transition-all shadow-2xs min-w-[24px] ${
                                footerSettings[item.key as keyof typeof footerSettings] 
                                    ? 'bg-[#9575cd] text-white' 
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                                {footerSettings[item.key as keyof typeof footerSettings] ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 pt-2">
                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-tight mb-1">Align Layout Style</label>
                    <select 
                        value={footerSettings.footerStyle || 'style1'} 
                        onChange={(e) => handleFooterSettingChange('footerStyle', e.target.value)} 
                        className="w-full h-6 md:h-8 text-[10px] md:text-xs px-1.5 md:px-2 py-0 border border-slate-200 rounded md:rounded-lg outline-none focus:border-[#9575cd] bg-white font-medium text-slate-700 cursor-pointer"
                    >
                        <option value="style1">Style 1: QR | Barcode | Sign 1 | Sign 2 | Page No</option>
                        <option value="style2">Style 2: Sign 1 | Sign 2 | Barcode | QR | Page No</option>
                        <option value="style3">Style 3: Sign 1 | QR | Barcode | Sign 2 | Page No</option>
                    </select>
                </div>

            </div>
        </div>
    );
}