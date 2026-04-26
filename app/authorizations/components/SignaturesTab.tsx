import React, { useState, useEffect } from 'react';
import { PenTool, Trash2, Upload, Edit, Save, X, User, CheckCircle2, Crop, Loader2 } from 'lucide-react';
import { saveUserSignatureDetails } from '@/app/actions/authorizations';

export default function SignaturesTab({ users, loadData }: any) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false); 
    
    const [originalUpload, setOriginalUpload] = useState<string | null>(null);
    const [crop, setCrop] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

    const [form, setForm] = useState({
        id: 0,
        signName: '',
        degree: '',
        designation: '',
        regNumber: '',
        signText1: '',
        signText2: '',
        isDefaultSignature: false,
        signatureUrl: '' as string | null
    });

    const openEditModal = (user: any) => {
        setForm({
            id: user.id,
            signName: user.signName || user.name,
            degree: user.degree || '',
            designation: user.designation || '',
            regNumber: user.regNumber || '',
            signText1: user.signText1 || '',
            signText2: user.signText2 || '',
            isDefaultSignature: user.isDefaultSignature || false,
            signatureUrl: user.signatureUrl || null
        });
        setOriginalUpload(user.signatureUrl || null);
        setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setOriginalUpload(base64);
            setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
            setForm({ ...form, signatureUrl: base64 });
        };
        reader.readAsDataURL(file);
    };

    // Live Canvas Cropper Effect
    useEffect(() => {
        if (!originalUpload) return;
        
        if (crop.top === 0 && crop.bottom === 0 && crop.left === 0 && crop.right === 0) {
            setForm(prev => prev.signatureUrl !== originalUpload ? { ...prev, signatureUrl: originalUpload } : prev);
            return;
        }

        const img = new window.Image();
        // 🚨 FIX: Add crossOrigin attribute to prevent "Tainted canvases" CORS error!
        img.crossOrigin = "anonymous"; 
        img.src = originalUpload;
        
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const sX = img.width * (crop.left / 100);
                const sY = img.height * (crop.top / 100);
                const sW = img.width * (1 - (crop.left + crop.right) / 100);
                const sH = img.height * (1 - (crop.top + crop.bottom) / 100);

                if (sW <= 0 || sH <= 0) return; 

                canvas.width = sW;
                canvas.height = sH;

                ctx.drawImage(img, sX, sY, sW, sH, 0, 0, sW, sH);
                
                setForm(prev => ({ ...prev, signatureUrl: canvas.toDataURL('image/png') }));
            } catch (err) {
                console.error("Canvas Cropping Error:", err);
            }
        };
    }, [crop, originalUpload]);

    const handleBakeCrop = () => {
        setOriginalUpload(form.signatureUrl);
        setCrop({ top: 0, bottom: 0, left: 0, right: 0 });
    };

    const handleSave = async () => {
        setIsSaving(true);
        let finalSignatureUrl = form.signatureUrl;

        if (finalSignatureUrl && finalSignatureUrl.startsWith('data:image')) {
            try {
                const res = await fetch(finalSignatureUrl);
                const blob = await res.blob();
                const file = new File([blob], `signature-${form.id || Date.now()}.png`, { type: 'image/png' });

                const formData = new FormData();
                formData.append("file", file);
                formData.append("folder", "signatures");

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const uploadResult = await uploadRes.json();

                if (uploadResult.success) {
                    finalSignatureUrl = uploadResult.url; 
                } else {
                    alert("Failed to upload signature image to R2: " + uploadResult.error);
                    setIsSaving(false);
                    return;
                }
            } catch (error) {
                console.error("R2 Upload Error:", error);
                alert("An error occurred while uploading the signature.");
                setIsSaving(false);
                return;
            }
        }

        const res = await saveUserSignatureDetails({ ...form, signatureUrl: finalSignatureUrl });
        if (res.success) {
            setIsModalOpen(false);
            loadData();
        } else {
            alert(res.message);
        }
        
        setIsSaving(false);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 flex justify-between items-center">
                <div>
                    <h2 className="font-bold text-slate-800">Internal Approver Signatures</h2>
                    <p className="text-xs text-slate-500">Configure printed names, medical registration numbers, and signature images.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users.map((user: any) => (
                    <div key={user.id} className={`bg-white rounded-xl border ${user.isDefaultSignature ? 'border-[#9575cd] ring-1 ring-[#9575cd]/50 shadow-md' : 'border-slate-200 shadow-sm hover:border-[#9575cd]'} overflow-hidden flex flex-col transition-all relative`}>
                        {user.isDefaultSignature && (
                            <div className="absolute top-2 right-2 bg-[#9575cd] text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm z-10">
                                <CheckCircle2 size={10}/> Default
                            </div>
                        )}
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                            <div className="pr-12">
                                <h3 className="font-bold text-sm text-slate-800 truncate">{user.signName || user.name}</h3>
                                <p className="text-xs text-[#9575cd] font-semibold mt-0.5">{user.designation || 'No Designation'}</p>
                                <p className="text-[11px] text-slate-500 mt-1">{user.degree || 'No Degree'} {user.regNumber && `| ${user.regNumber}`}</p>
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[120px] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50 group relative">
                            {user.signatureUrl ? (
                                <img src={user.signatureUrl} alt="Signature" className="max-h-16 object-contain" />
                            ) : (
                                <div className="text-center text-slate-400 flex flex-col items-center">
                                    <PenTool size={20} className="mb-2 opacity-50" />
                                    <p className="text-xs italic">No signature uploaded</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => openEditModal(user)} className="bg-white text-[#9575cd] border border-[#9575cd] hover:bg-[#9575cd] hover:text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                                    <Edit size={16} /> Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {users.length === 0 && (
                    <div className="col-span-full p-8 text-center text-slate-500">
                        No internal users created yet. Go to User Setup to create staff accounts.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <User size={18} className="text-[#9575cd]"/> Edit Signature Profile
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-slate-400 hover:text-slate-600 disabled:opacity-50"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Printed Name (for reports)</label>
                                    <input type="text" value={form.signName} onChange={e => setForm({...form, signName: e.target.value})} disabled={isSaving} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none disabled:bg-slate-100"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Designation</label>
                                    <input type="text" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} disabled={isSaving} placeholder="e.g., Chief Pathologist" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none disabled:bg-slate-100"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Qualification</label>
                                        <input type="text" value={form.degree} onChange={e => setForm({...form, degree: e.target.value})} disabled={isSaving} placeholder="e.g., MD Path" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none disabled:bg-slate-100"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1">Reg. Number</label>
                                        <input type="text" value={form.regNumber} onChange={e => setForm({...form, regNumber: e.target.value})} disabled={isSaving} placeholder="e.g., KMC-1234" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#9575cd]/50 outline-none disabled:bg-slate-100"/>
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    <input type="checkbox" id="isDefault" checked={form.isDefaultSignature} onChange={e => setForm({...form, isDefaultSignature: e.target.checked})} disabled={isSaving} className="w-4 h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer disabled:opacity-50"/>
                                    <label htmlFor="isDefault" className="text-sm font-bold text-slate-700 cursor-pointer">Set as Primary/Default Signature</label>
                                </div>
                            </div>

                            <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <label className="block text-xs font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Signature Image Manager</label>
                                
                                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-4 bg-slate-50 relative group min-h-[160px]">
                                    {form.signatureUrl ? (
                                        <>
                                            <img src={form.signatureUrl} alt="Signature Preview" className="max-h-32 max-w-full object-contain border border-dashed border-[#9575cd]/40 bg-white shadow-sm" />
                                            
                                            {!isSaving && (
                                                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                    <button onClick={() => { setForm({...form, signatureUrl: null}); setOriginalUpload(null); setCrop({top:0, bottom:0, left:0, right:0}); }} className="text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 mb-2 hover:bg-red-100">
                                                        <Trash2 size={14}/> Remove Image
                                                    </button>
                                                    <label className="cursor-pointer text-[#9575cd] bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-purple-100">
                                                        <Upload size={14}/> Change Image
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                    </label>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <PenTool size={32} className="mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm text-slate-500 mb-4">No signature uploaded</p>
                                            <label className="cursor-pointer bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:border-[#9575cd] hover:text-[#9575cd] transition-colors shadow-sm">
                                                <Upload size={16}/> Browse Files
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isSaving} />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {originalUpload && !isSaving && (
                                    <div className="mt-4 bg-purple-50/50 border border-[#9575cd]/20 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-[11px] font-bold text-[#5e35b1] uppercase tracking-wider flex items-center gap-1.5"><Crop size={12}/> Trim Empty Margins</h4>
                                            {(crop.top > 0 || crop.bottom > 0 || crop.left > 0 || crop.right > 0) && (
                                                <button onClick={handleBakeCrop} className="text-[9px] bg-white text-[#9575cd] font-bold px-2 py-1 rounded shadow-sm border border-[#9575cd]/30 hover:bg-[#9575cd] hover:text-white transition-colors">
                                                    Apply & Reset Sliders
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-slate-600 flex justify-between"><span>Cut Top</span> <span className="text-[#9575cd]">{crop.top}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.top} onChange={(e) => setCrop({...crop, top: parseInt(e.target.value)})} className="accent-[#9575cd]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-slate-600 flex justify-between"><span>Cut Bottom</span> <span className="text-[#9575cd]">{crop.bottom}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.bottom} onChange={(e) => setCrop({...crop, bottom: parseInt(e.target.value)})} className="accent-[#9575cd]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-slate-600 flex justify-between"><span>Cut Left</span> <span className="text-[#9575cd]">{crop.left}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.left} onChange={(e) => setCrop({...crop, left: parseInt(e.target.value)})} className="accent-[#9575cd]" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-bold text-slate-600 flex justify-between"><span>Cut Right</span> <span className="text-[#9575cd]">{crop.right}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.right} onChange={(e) => setCrop({...crop, right: parseInt(e.target.value)})} className="accent-[#9575cd]" />
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-2 italic text-center">Use the sliders to cut away empty white space so the signature perfectly aligns with the line on the printed report.</p>
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 mt-4">
                            <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg disabled:opacity-50">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-[#9575cd] text-white font-bold text-sm rounded-lg shadow-sm hover:bg-[#7e57c2] flex items-center gap-2 disabled:opacity-70">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>} 
                                {isSaving ? 'Saving & Uploading...' : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}