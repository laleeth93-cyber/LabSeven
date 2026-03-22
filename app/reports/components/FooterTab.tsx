// --- app/reports/components/FooterTab.tsx Block Open ---
import React from 'react';
import { LayoutTemplate, QrCode, PenTool } from 'lucide-react';

interface FooterTabProps {
    footerSettings: any;
    handleToggleFooter: (field: string) => void;
    handleFooterSettingChange: (field: string, value: any) => void;
}

export default function FooterTab({ footerSettings, handleToggleFooter, handleFooterSettingChange }: FooterTabProps) {
    
    return (
        <div className="flex flex-col gap-5 h-full w-full overflow-y-auto custom-scrollbar pr-2 pb-4">
            
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <QrCode size={16} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">QR & Barcode Settings</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Toggle digital verification codes on your footer.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                        { key: 'showQrCode', label: 'Show QR Code' },
                        { key: 'showBarcode', label: 'Show Barcode' },
                    ].map((item) => (
                        <div key={item.key} onClick={() => handleToggleFooter(item.key)} className={`px-4 py-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${footerSettings[item.key as keyof typeof footerSettings] ? 'border-[#9575cd] bg-purple-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <span className={`font-bold text-[12px] ${footerSettings[item.key as keyof typeof footerSettings] ? 'text-[#5e35b1]' : 'text-slate-700'}`}>{item.label}</span>
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${footerSettings[item.key as keyof typeof footerSettings] ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all ${footerSettings[item.key as keyof typeof footerSettings] ? 'right-[2px]' : 'left-[2px]'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">QR Placement</label>
                        <select value={footerSettings.qrPlacement || 'footer'} onChange={(e) => handleFooterSettingChange('qrPlacement', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="footer">Footer</option>
                            <option value="header">Header</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">QR Text Above</label>
                        <select value={footerSettings.qrText || 'Scan to validate'} onChange={(e) => handleFooterSettingChange('qrText', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="None">None</option>
                            <option value="Scan to validate">Scan to validate</option>
                            <option value="Scan for Digital copy">Scan for Digital copy</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 mt-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Barcode Style</label>
                        <select value={footerSettings.barcodeText || 'none'} onChange={(e) => handleFooterSettingChange('barcodeText', e.target.value)} className="w-full text-xs p-2 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="none">Normal Barcode (No Text)</option>
                            <option value="show_number">Barcode with No. above</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* NEW: SIGNATURE FINE TUNING */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <PenTool size={16} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Signature Size & Alignment</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Control the exact pixel sizes of the doctor signatures.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex flex-col">
                        <label className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Image Size (Height)</span> <span className="text-[#9575cd]">{footerSettings.sigSize || 40}px</span>
                        </label>
                        <input type="range" min="20" max="100" value={footerSettings.sigSize || 40} onChange={(e) => handleFooterSettingChange('sigSize', parseInt(e.target.value))} className="w-full accent-[#9575cd]" />
                    </div>

                    <div className="flex flex-col">
                        <label className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Signature Gap (Line to Name)</span> <span className="text-[#9575cd]">{footerSettings.sigSpacing || 4}px</span>
                        </label>
                        <input type="range" min="0" max="20" value={footerSettings.sigSpacing ?? 4} onChange={(e) => handleFooterSettingChange('sigSpacing', parseInt(e.target.value))} className="w-full accent-[#9575cd]" />
                    </div>

                    <div className="flex flex-col">
                        <label className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Doctor Name Font Size</span> <span className="text-[#9575cd]">{footerSettings.docNameSize || 10}pt</span>
                        </label>
                        <input type="range" min="6" max="16" value={footerSettings.docNameSize || 10} onChange={(e) => handleFooterSettingChange('docNameSize', parseInt(e.target.value))} className="w-full accent-[#9575cd]" />
                    </div>

                    <div className="flex flex-col">
                        <label className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Degree Font Size</span> <span className="text-[#9575cd]">{footerSettings.docDesigSize || 8}pt</span>
                        </label>
                        <input type="range" min="5" max="14" value={footerSettings.docDesigSize || 8} onChange={(e) => handleFooterSettingChange('docDesigSize', parseInt(e.target.value))} className="w-full accent-[#9575cd]" />
                    </div>

                    <div className="flex flex-col">
                        <label className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                            <span>Spacing (Name to Degree)</span> <span className="text-[#9575cd]">{footerSettings.docNameSpacing || 2}px</span>
                        </label>
                        <input type="range" min="0" max="10" value={footerSettings.docNameSpacing ?? 2} onChange={(e) => handleFooterSettingChange('docNameSpacing', parseInt(e.target.value))} className="w-full accent-[#9575cd]" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-600">Text Alignment</label>
                        <select value={footerSettings.sigAlignment || 'center'} onChange={(e) => handleFooterSettingChange('sigAlignment', e.target.value)} className="w-full text-xs p-1.5 border border-slate-300 rounded outline-none focus:border-[#9575cd]">
                            <option value="flex-start">Left</option>
                            <option value="center">Center</option>
                            <option value="flex-end">Right</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <LayoutTemplate size={16} className="text-[#9575cd]" />
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Footer Layout Elements</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Configure page numbering and overall alignment.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                        { key: 'showPageNumbers', label: 'Show Page Nos' },
                    ].map((item) => (
                        <div key={item.key} onClick={() => handleToggleFooter(item.key)} className={`px-4 py-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${footerSettings[item.key as keyof typeof footerSettings] ? 'border-[#9575cd] bg-purple-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                            <span className={`font-bold text-[12px] ${footerSettings[item.key as keyof typeof footerSettings] ? 'text-[#5e35b1]' : 'text-slate-700'}`}>{item.label}</span>
                            <div className={`w-8 h-4 rounded-full transition-colors relative ${footerSettings[item.key as keyof typeof footerSettings] ? 'bg-[#9575cd]' : 'bg-slate-300'}`}>
                                <div className={`absolute top-[2px] w-3 h-3 rounded-full bg-white transition-all ${footerSettings[item.key as keyof typeof footerSettings] ? 'right-[2px]' : 'left-[2px]'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Align Layout Style</label>
                    <select 
                        value={footerSettings.footerStyle || 'style1'} 
                        onChange={(e) => handleFooterSettingChange('footerStyle', e.target.value)} 
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:border-[#9575cd] bg-slate-50 font-medium text-slate-700 cursor-pointer"
                    >
                        <option value="style1">Style 1: QR &nbsp;|&nbsp; Barcode &nbsp;|&nbsp; Sign 1 &nbsp;|&nbsp; Sign 2 &nbsp;|&nbsp; Page No</option>
                        <option value="style2">Style 2: Sign 1 &nbsp;|&nbsp; Sign 2 &nbsp;|&nbsp; Barcode &nbsp;|&nbsp; QR &nbsp;|&nbsp; Page No</option>
                        <option value="style3">Style 3: Sign 1 &nbsp;|&nbsp; QR &nbsp;|&nbsp; Barcode &nbsp;|&nbsp; Sign 2 &nbsp;|&nbsp; Page No</option>
                    </select>
                </div>

            </div>
        </div>
    );
}
// --- app/reports/components/FooterTab.tsx Block Close ---