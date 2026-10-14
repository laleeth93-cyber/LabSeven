// --- BLOCK app/packages/components/PackageCartModal.tsx OPEN ---
"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { X, Search, Plus, Minus, Save, ShoppingCart, Loader2, PackageOpen, LayoutList, CheckCircle, ArrowRight } from 'lucide-react';
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
    const [mobileTab, setMobileTab] = useState<'available' | 'cart'>('available');

    // --- SUCCESS POPUP STATE ---
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    useEffect(() => {
        if (isOpen && pkg) {
            setIsLoading(true);
            setShowSuccessPopup(false); // reset just in case
            setMobileTab('available');
            
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2 md:p-6 animate-in fade-in duration-200">
            
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl md:max-w-4xl h-[78vh] md:h-[72vh] max-h-[640px] flex flex-col overflow-hidden relative border border-slate-100">
                
                {/* SUCCESS OVERLAY INSIDE MODAL */}
                {showSuccessPopup && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white rounded-xl p-5 md:p-6 flex flex-col items-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 max-w-[260px] md:max-w-xs w-full mx-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-2.5 md:mb-3 border-[3px] border-emerald-100">
                        <CheckCircle className="text-emerald-500" size={22} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-tight text-center">Package Configured!</h2>
                      <p className="text-slate-500 text-[11px] md:text-xs mt-0.5 text-center font-medium truncate max-w-full">{pkg.name}</p>
                    </div>
                  </div>
                )}

                {/* Header */}
                <header className="px-3 py-2 md:px-4 md:py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 flex items-center justify-center shrink-0">
                            <PackageOpen size={16} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xs md:text-sm font-bold text-slate-800 leading-tight truncate">Configure Package</h2>
                            <p className="text-[9px] md:text-[10.5px] text-slate-500 font-medium truncate">
                                {pkg.code} • {pkg.department?.name ? <span className="text-purple-600 font-semibold">{pkg.department.name}</span> : 'No Dept'} • <span className="font-medium text-slate-700">{pkg.name}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isPending} className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors disabled:opacity-50 shrink-0">
                        <X size={16} />
                    </button>
                </header>

                {/* Mobile Segmented Tab Switcher (Available Tests vs Cart) */}
                <div className="flex md:hidden bg-slate-50 p-1 border-b border-slate-200 shrink-0">
                    <button 
                        onClick={() => setMobileTab('available')}
                        className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                            mobileTab === 'available' ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60' : 'text-slate-500'
                        }`}
                    >
                        <Search size={11} />
                        Available ({filteredTests.length})
                    </button>
                    <button 
                        onClick={() => setMobileTab('cart')}
                        className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                            mobileTab === 'cart' ? 'bg-white text-purple-700 shadow-xs border border-slate-200/60' : 'text-slate-500'
                        }`}
                    >
                        <ShoppingCart size={11} />
                        Cart ({cart.length})
                        {cart.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                        )}
                    </button>
                </div>

                {/* Main Split Layout */}
                <div className="flex-1 flex min-h-0 bg-slate-50/50 flex-col md:flex-row">
                    
                    {/* LEFT PANE: Search & Available Tests */}
                    <div className={`w-full md:w-1/2 flex-col border-r border-slate-200 bg-white ${mobileTab === 'available' ? 'flex flex-1 min-h-0' : 'hidden md:flex'}`}>
                        <div className="p-2 md:p-3 border-b border-slate-100 bg-white shrink-0">
                            <h3 className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Search size={11} className="text-slate-400"/> Search Tests
                            </h3>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search by name, code or dept..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-7 md:h-8 pl-7 md:pl-8 pr-2.5 border border-slate-200 rounded-md text-[11px] md:text-xs placeholder:text-slate-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                                <Search size={12} className="absolute left-2 md:left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-1.5 md:p-2 space-y-1 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-1.5 text-xs"><Loader2 className="animate-spin" size={16}/> Loading tests...</div>
                            ) : filteredTests.length === 0 ? (
                                <div className="text-center p-6 text-xs text-slate-400">No tests found.</div>
                            ) : (
                                filteredTests.map(test => {
                                    const inCart = cart.some(item => item.id === test.id);
                                    return (
                                        <div key={test.id} className={`flex items-center justify-between p-1.5 md:p-2 rounded-md border transition-colors ${inCart ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-2xs'}`}>
                                            <div className="min-w-0 pr-1.5">
                                                <h4 className="text-[11px] md:text-xs font-semibold text-slate-700 truncate leading-tight">{test.name}</h4>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[8px] md:text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.2 rounded">{test.code}</span>
                                                    <span className="text-[8.5px] md:text-[9.5px] text-slate-400 font-normal truncate">{test.department?.name || 'Lab'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                                <span className="text-[10px] md:text-[11px] font-bold text-slate-600">₹{test.price}</span>
                                                <button 
                                                    onClick={() => addToCart(test)} 
                                                    disabled={inCart || isPending}
                                                    className={`w-5 h-5 md:w-5.5 md:h-5.5 rounded flex items-center justify-center transition-colors active:scale-95 ${inCart ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-600 hover:text-white'}`}
                                                    title={inCart ? 'Already added' : 'Add to package'}
                                                >
                                                    <Plus size={12}/>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Mobile Quick Bottom Bar to switch to Cart */}
                        <div className="flex md:hidden p-1.5 bg-slate-50 border-t border-slate-200 items-center justify-between shrink-0">
                            <span className="text-[9px] font-semibold text-slate-600">
                                {cart.length} {cart.length === 1 ? 'test' : 'tests'} selected
                            </span>
                            <button 
                                onClick={() => setMobileTab('cart')}
                                className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[9px] font-bold rounded flex items-center gap-1 transition-colors"
                            >
                                Review Cart <ArrowRight size={10} />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANE: Cart */}
                    <div className={`w-full md:w-1/2 flex-col bg-slate-50 ${mobileTab === 'cart' ? 'flex flex-1 min-h-0' : 'hidden md:flex'}`}>
                        <div className="p-2 md:p-3 border-b border-slate-200 bg-white shrink-0 flex justify-between items-center">
                            <h3 className="text-[9px] md:text-[10px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <ShoppingCart size={12} className="text-purple-600"/> Package Cart
                            </h3>
                            <span className="text-[9px] md:text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-1.5 py-0.5 rounded">{cart.length} Tests</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-1.5 md:p-2 space-y-1 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1.5 p-4">
                                    <LayoutList size={26} className="opacity-20"/>
                                    <p className="text-xs text-center">Cart is empty. Search and add tests from the available tests list.</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between p-1.5 md:p-2 bg-white rounded-md border border-slate-200 shadow-2xs">
                                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0 pr-1.5">
                                            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 w-3.5 shrink-0">{idx + 1}.</span>
                                            <div className="min-w-0">
                                                <h4 className="text-[11px] md:text-xs font-semibold text-slate-700 truncate leading-tight">{item.name}</h4>
                                                <span className="text-[8px] md:text-[9px] font-mono text-slate-500">{item.code}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                            <span className="text-[10px] md:text-[11px] font-bold text-slate-600">₹{item.price}</span>
                                            <button 
                                                onClick={() => removeFromCart(item.id)} 
                                                disabled={isPending} 
                                                className="w-5 h-5 md:w-5.5 md:h-5.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded flex items-center justify-center transition-colors disabled:opacity-50 active:scale-95"
                                                title="Remove from package"
                                            >
                                                <Minus size={12}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Summary & Save */}
                        <div className="p-2.5 md:p-3 bg-white border-t border-slate-200 shrink-0">
                            <div className="space-y-1 mb-2 md:mb-2.5">
                                <div className="flex justify-between text-[10px] md:text-[11px] text-slate-500">
                                    <span>Total Individual Price:</span>
                                    <span className="font-semibold text-slate-700">₹{totalIndividualPrice}</span>
                                </div>
                                <div className="flex justify-between text-[10px] md:text-[11px] text-emerald-600 font-medium">
                                    <span>Calculated Discount:</span>
                                    <span>- ₹{discount}</span>
                                </div>
                                <div className="flex justify-between text-[11px] md:text-xs text-slate-800 font-bold border-t border-slate-100 pt-1 mt-0.5">
                                    <span>Final Package Price:</span>
                                    <span className="text-purple-700 font-extrabold">₹{packagePrice}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleSave} 
                                disabled={isPending}
                                className="w-full py-1.5 md:py-2 bg-[#9575cd] hover:bg-[#7e57c2] text-white text-[11px] md:text-xs font-bold rounded-md shadow-2xs transition-all flex justify-center items-center gap-1.5 disabled:opacity-70 active:scale-95"
                            >
                                {isPending ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>} 
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