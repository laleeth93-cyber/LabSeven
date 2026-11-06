// --- BLOCK app/authorizations/components/SignaturesTab.tsx OPEN ---
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
        <div className="space-y-2.5 flex-1 flex flex-col h-full min-h-0">
            {/* DESKTOP TABLE VIEW AS SEPARATE BLOCK */}
            <div className="hidden md:flex flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
                    <table className="w-full text-left border-collapse border-spacing-0">
                        <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                            <tr>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-24" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Primary</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Signatory Name</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Designation</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Qualification</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Reg. Number</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-36" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Signature</th>
                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-20" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user: any) => (
                                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                        {user.isDefaultSignature ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-[#9575cd] border border-purple-200">
                                                <CheckCircle2 size={10} /> Default
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-[11px]">-</span>
                                        )}
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-medium text-slate-800 text-[11px] xl:text-[12px]">{user.signName || user.name}</span>
                                            {user.username && <span className="text-[10px] text-slate-400 font-mono">(@{user.username})</span>}
                                        </div>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <span className="text-[11px] xl:text-[12px] text-slate-700 font-normal">
                                            {user.designation || <span className="text-slate-400 italic">Not specified</span>}
                                        </span>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <span className="text-[11px] xl:text-[12px] text-slate-700 font-normal">
                                            {user.degree || <span className="text-slate-400 italic">-</span>}
                                        </span>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9]">
                                        <span className="font-mono text-[11px] xl:text-[12px] text-slate-700 font-medium">
                                            {user.regNumber || <span className="text-slate-400 italic">-</span>}
                                        </span>
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                        {user.signatureUrl ? (
                                            <div className="flex items-center justify-center">
                                                <img 
                                                    src={user.signatureUrl} 
                                                    alt="Signature" 
                                                    className="h-6 max-w-[120px] object-contain bg-white rounded border border-slate-200 px-1 py-0.5 shadow-2xs" 
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">No image</span>
                                        )}
                                    </td>

                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-b border-[#d9d9d9] text-center">
                                        <button 
                                            onClick={() => openEditModal(user)} 
                                            className="h-[22px] w-[22px] rounded border border-slate-200 hover:border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors flex items-center justify-center shadow-2xs mx-auto"
                                            title="Edit Signature"
                                        >
                                            <Edit size={13} strokeWidth={2}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs italic">
                                        No staff accounts found. Create users in the User Setup tab first.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PINNED TABLE FOOTER */}
                <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-3">
                        <span>Total Signatories: <strong className="text-slate-700">{users.length}</strong></span>
                        <span>•</span>
                        <span>Configured Signatures: <strong className="text-purple-700">{users.filter((u: any) => u.signatureUrl).length}</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                        Primary signature automatically attaches to test reports by default
                    </div>
                </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-2.5">
                {users.map((user: any) => (
                    <div key={user.id} className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-3 relative flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-semibold text-slate-800 text-[13px] leading-tight" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                    {user.signName || user.name}
                                </h4>
                                <p className="text-[11px] text-[#9575cd] font-medium mt-0.5">{user.designation || 'No Designation'}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                    {user.degree || 'No Degree'} {user.regNumber && `| Reg: ${user.regNumber}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {user.isDefaultSignature && (
                                    <span className="bg-[#9575cd] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-2xs">
                                        <CheckCircle2 size={9}/> Default
                                    </span>
                                )}
                                <button 
                                    onClick={() => openEditModal(user)} 
                                    className="h-[22px] w-[22px] rounded border border-slate-200 text-teal-600 hover:bg-teal-50 flex items-center justify-center shadow-2xs"
                                    title="Edit Signature"
                                >
                                    <Edit size={13} />
                                </button>
                            </div>
                        </div>

                        <div className="h-14 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center p-1.5">
                            {user.signatureUrl ? (
                                <img src={user.signatureUrl} alt="Signature" className="max-h-12 object-contain" />
                            ) : (
                                <span className="text-[10px] text-slate-400 italic flex items-center gap-1">
                                    <PenTool size={12} className="opacity-50" /> No signature uploaded
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* SIGNATURE EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in">
                    <div className="bg-white rounded-[10px] shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
                        {/* Modal Header */}
                        <div className="px-4 py-2.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] shrink-0">
                            <h3 className="font-semibold text-[15px] xl:text-[16px] text-slate-800 flex items-center gap-1.5 leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                                <PenTool size={15} className="text-[#9575cd] shrink-0"/> Edit Signature Profile
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50">
                                <X size={16}/>
                            </button>
                        </div>
                        
                        <div className="p-3.5 md:p-5 grid grid-cols-1 lg:grid-cols-2 gap-3.5 md:gap-5 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Left Side: Form Fields */}
                            <div className="space-y-2.5">
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Printed Name (for reports)</label>
                                    <input 
                                        type="text" 
                                        value={form.signName} 
                                        onChange={e => setForm({...form, signName: e.target.value})} 
                                        disabled={isSaving} 
                                        className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd] disabled:bg-slate-100"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Designation</label>
                                    <input 
                                        type="text" 
                                        value={form.designation} 
                                        onChange={e => setForm({...form, designation: e.target.value})} 
                                        disabled={isSaving} 
                                        placeholder="e.g. Chief Pathologist" 
                                        className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd] disabled:bg-slate-100"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Qualification</label>
                                        <input 
                                            type="text" 
                                            value={form.degree} 
                                            onChange={e => setForm({...form, degree: e.target.value})} 
                                            disabled={isSaving} 
                                            placeholder="e.g. MD Path" 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white focus:outline-none focus:border-[#9575cd] disabled:bg-slate-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center h-4">Reg. Number</label>
                                        <input 
                                            type="text" 
                                            value={form.regNumber} 
                                            onChange={e => setForm({...form, regNumber: e.target.value})} 
                                            disabled={isSaving} 
                                            placeholder="e.g. KMC-1234" 
                                            className="w-full h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white font-mono focus:outline-none focus:border-[#9575cd] disabled:bg-slate-100"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    <input 
                                        type="checkbox" 
                                        id="isDefault" 
                                        checked={form.isDefaultSignature} 
                                        onChange={e => setForm({...form, isDefaultSignature: e.target.checked})} 
                                        disabled={isSaving} 
                                        className="w-3.5 h-3.5 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer disabled:opacity-50"
                                    />
                                    <label htmlFor="isDefault" className="text-[11px] xl:text-[12px] font-medium text-slate-700 cursor-pointer select-none">
                                        Set as Primary / Default Signatory
                                    </label>
                                </div>
                            </div>

                            {/* Right Side: Image Upload & Crop Manager */}
                            <div className="flex flex-col h-full bg-slate-50/50 rounded-[6px] border border-slate-200 p-3">
                                <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                                    <span>Signature Image</span>
                                    {form.signatureUrl && <span className="text-emerald-600 font-semibold normal-case">Uploaded</span>}
                                </label>
                                
                                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-[6px] flex flex-col items-center justify-center p-3 bg-white relative group min-h-[120px]">
                                    {form.signatureUrl ? (
                                        <>
                                            <img src={form.signatureUrl} alt="Signature Preview" className="max-h-24 max-w-full object-contain border border-dashed border-[#9575cd]/40 bg-white p-1" />
                                            
                                            {!isSaving && (
                                                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[6px] gap-1.5">
                                                    <label className="cursor-pointer text-[#9575cd] bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 shadow-2xs">
                                                        <Upload size={12}/> Change Image
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                    </label>
                                                    <button onClick={() => { setForm({...form, signatureUrl: null}); setOriginalUpload(null); setCrop({top:0, bottom:0, left:0, right:0}); }} className="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 shadow-2xs">
                                                        <Trash2 size={12}/> Remove
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <PenTool size={20} className="mx-auto text-slate-300 mb-1" />
                                            <p className="text-[11px] text-slate-400 mb-2">No signature image uploaded</p>
                                            <label className="cursor-pointer bg-white border border-slate-300 hover:border-[#9575cd] text-slate-700 hover:text-[#9575cd] px-3 py-1 rounded-[5px] text-[11px] font-medium flex items-center gap-1.5 shadow-2xs transition-colors inline-flex">
                                                <Upload size={12}/> Browse Image
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isSaving} />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {originalUpload && !isSaving && (
                                    <div className="mt-2.5 bg-purple-50/60 border border-[#9575cd]/30 rounded-[5px] p-2">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <h4 className="text-[10px] font-semibold text-[#5e35b1] uppercase tracking-wider flex items-center gap-1">
                                                <Crop size={11}/> Trim Margins
                                            </h4>
                                            {(crop.top > 0 || crop.bottom > 0 || crop.left > 0 || crop.right > 0) && (
                                                <button onClick={handleBakeCrop} className="text-[9px] bg-white text-[#9575cd] font-semibold px-1.5 py-0.5 rounded shadow-2xs border border-[#9575cd]/30 hover:bg-[#9575cd] hover:text-white transition-colors">
                                                    Apply & Reset
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-medium text-slate-600 flex justify-between"><span>Cut Top</span> <span className="text-[#9575cd] font-bold">{crop.top}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.top} onChange={(e) => setCrop({...crop, top: parseInt(e.target.value)})} className="accent-[#9575cd] h-1" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-medium text-slate-600 flex justify-between"><span>Cut Bottom</span> <span className="text-[#9575cd] font-bold">{crop.bottom}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.bottom} onChange={(e) => setCrop({...crop, bottom: parseInt(e.target.value)})} className="accent-[#9575cd] h-1" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-medium text-slate-600 flex justify-between"><span>Cut Left</span> <span className="text-[#9575cd] font-bold">{crop.left}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.left} onChange={(e) => setCrop({...crop, left: parseInt(e.target.value)})} className="accent-[#9575cd] h-1" />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-medium text-slate-600 flex justify-between"><span>Cut Right</span> <span className="text-[#9575cd] font-bold">{crop.right}%</span></label>
                                                <input type="range" min="0" max="45" value={crop.right} onChange={(e) => setCrop({...crop, right: parseInt(e.target.value)})} className="accent-[#9575cd] h-1" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-4 py-2 border-t border-slate-200 flex justify-end gap-1.5 bg-slate-50 shrink-0">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                disabled={isSaving} 
                                className="h-[24px] xl:h-[26px] px-3 text-[11px] xl:text-[12px] font-normal text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-[5px] transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving} 
                                className="h-[24px] xl:h-[26px] px-4 rounded-[5px] text-[11px] xl:text-[12px] font-medium text-white flex items-center gap-1 shadow-2xs hover:opacity-95 transition-all disabled:opacity-70"
                                style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12}/>} 
                                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/authorizations/components/SignaturesTab.tsx CLOSE ---
