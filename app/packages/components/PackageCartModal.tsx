// --- BLOCK app/packages/components/PackageCartModal.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { X, Search, Plus, Minus, Save, ShoppingCart, Loader2, PackageOpen, LayoutList, CheckCircle } from 'lucide-react';
import { getAvailableTestsForPackage, savePackageTests } from '@/app/actions/packages';

interface PackageCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pkg: any; 
}

export default function PackageCartModal({ isOpen, onClose, onSuccess, pkg }: PackageCartModalProps) {
    const [isPending, startTransition] = useTransition();
    const [availableTests, setAvailableTests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const [cart, setCart] = useState<any[]>([]);

    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        if (isOpen && pkg) {
            setIsLoading(true);
            setShowSuccessPopup(false); // reset just in case
            
            getAvailableTestsForPackage().then(res => {
                if (res.success && res.data) {
                    setAvailableTests(res.data);
                } else {
                    setAvailableTests([]);
                }
                setIsLoading(false);
            });

            if (pkg.packageTests) {
                const existingTests = pkg.packageTests.map((pt: any) => pt.test);
                setCart(existingTests);
            } else {
                setCart([]);
            }
        }
    }, [isOpen, pkg]);

    const filteredTests = useMemo(() => {
        if (!searchQuery) return availableTests;
        const q = searchQuery.toLowerCase();
        return availableTests.filter(t => 
            t.name.toLowerCase().includes(q) || 
            t.code.toLowerCase().includes(q) ||
            (t.department?.name && t.department.name.toLowerCase().includes(q))
        );
    }, [searchQuery, availableTests]);

    const addToCart = (test: any) => {
        if (!cart.some(item => item.id === test.id)) {
            setCart(prev => [...prev, test]);
        }
    };

    const removeFromCart = (testId: number) => {
        setCart(prev => prev.filter(item => item.id !== testId));
    };

    const handleSave = () => {
        if (!pkg?.id) return;
        startTransition(async () => {
            const testIds = cart.map(item => item.id);
            const res = await savePackageTests(pkg.id, testIds);
            if (res.success) {
                // SHOW SUCCESS POPUP
                setShowSuccessPopup(true);
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    onSuccess(); 
                    onClose();
                }, 1500);
            } else {
                alert("Error: " + res.message);
            }
        });
    };

    if (!isOpen || !pkg) return null;

    const totalIndividualPrice = cart.reduce((sum, item) => sum + (item.price || 0), 0);
    const packagePrice = pkg.price || 0;
    const discount = totalIndividualPrice > packagePrice ? totalIndividualPrice - packagePrice : 0;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
            
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative">
                
                {/* SUCCESS OVERLAY INSIDE MODAL */}
                {showSuccessPopup && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 max-w-sm w-full mx-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-[4px] border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={32} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight text-center">Package Configured!</h2>
                      <p className="text-slate-500 text-sm mt-1 text-center font-medium">{pkg.name}</p>
                    </div>
                  </div>
                )}

                {/* Header */}
                <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                            <PackageOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Configure Package</h2>
                            <p className="text-xs text-slate-500 font-medium">
                                {pkg.code} • {pkg.department?.name ? <span className="text-purple-600 font-bold">{pkg.department.name}</span> : 'No Dept'} • {pkg.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isPending} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"><X size={20}/></button>
                </header>

                {/* Main Split Layout */}
                <div className="flex-1 flex min-h-0 bg-slate-50/50">
                    
                    {/* LEFT PANE: Search & Available Tests */}
                    <div className="w-1/2 flex flex-col border-r border-slate-200 bg-white">
                        <div className="p-4 border-b border-slate-100 bg-white shrink-0">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Search size={14}/> Search Tests
                            </h3>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search by name, code or dept..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                                />
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2"><Loader2 className="animate-spin" size={24}/> Loading tests...</div>
                            ) : filteredTests.length === 0 ? (
                                <div className="text-center p-8 text-sm text-slate-400">No tests found.</div>
                            ) : (
                                filteredTests.map(test => {
                                    const inCart = cart.some(item => item.id === test.id);
                                    return (
                                        <div key={test.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${inCart ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'}`}>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700">{test.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{test.code}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{test.department?.name || 'Lab'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-600">₹{test.price}</span>
                                                <button 
                                                    onClick={() => addToCart(test)} 
                                                    disabled={inCart || isPending}
                                                    className={`p-1.5 rounded-full ${inCart ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors'}`}
                                                >
                                                    <Plus size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Cart */}
                    <div className="w-1/2 flex flex-col bg-slate-50">
                        <div className="p-4 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingCart size={16} className="text-purple-600"/> Package Cart
                            </h3>
                            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{cart.length} Tests</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                    <LayoutList size={40} className="opacity-20"/>
                                    <p className="text-sm">Cart is empty. Search and add tests from the left.</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm animate-in slide-in-from-right-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700">{item.name}</h4>
                                                <span className="text-[10px] font-mono text-slate-500">{item.code}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-slate-600">₹{item.price}</span>
                                            <button onClick={() => removeFromCart(item.id)} disabled={isPending} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors disabled:opacity-50">
                                                <Minus size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Summary & Save */}
                        <div className="p-5 bg-white border-t border-slate-200 shrink-0">
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Total Value of Individual Tests:</span>
                                    <span className="font-bold">₹{totalIndividualPrice}</span>
                                </div>
                                <div className="flex justify-between text-xs text-green-600 font-medium">
                                    <span>Calculated Discount:</span>
                                    <span>- ₹{discount}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-800 font-bold border-t border-slate-100 pt-2 mt-2">
                                    <span>Final Package Price:</span>
                                    <span className="text-purple-700">₹{packagePrice}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleSave} 
                                disabled={isPending}
                                className="w-full py-3 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-sm font-bold rounded-lg shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:scale-100 active:scale-95"
                            >
                                {isPending ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
                                {isPending ? 'Saving Package...' : 'Save Package Contents'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
// --- BLOCK app/packages/components/PackageCartModal.tsx CLOSE ---