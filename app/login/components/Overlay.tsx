"use client";

import React from "react";
import { Building2, Lock } from "lucide-react";

export default function Overlay({ isLogin, onToggleLogin, onToggleRegister }: { isLogin: boolean, onToggleLogin: () => void, onToggleRegister: () => void }) {
  return (
    <div className={`hidden md:block absolute top-0 w-1/2 h-full z-50 transition-transform duration-700 ease-in-out shadow-2xl ${isLogin ? 'translate-x-full' : 'translate-x-0'}`}>
      <div className="absolute inset-0 bg-[#a07be1]"></div>
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* Overlay Text for LOGIN State */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-all duration-700 ${isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'}`}>
          <Building2 className="text-white/80 mb-3 pointer-events-none" size={28} />
          <h2 className="text-xl font-black text-white mb-2 tracking-tight">New Here?</h2>
          <p className="text-purple-50 text-[11px] mb-6 font-medium leading-relaxed max-w-[180px]">Register your laboratory today and step into the future of automated diagnostics.</p>
          <button onClick={onToggleRegister} className="px-8 h-8 rounded-md border-2 border-white text-white text-[11px] font-bold hover:bg-white hover:text-[#a07be1] transition-colors active:scale-95 outline-none focus:outline-none">
            Create Account
          </button>
        </div>

        {/* Overlay Text for SIGN UP State */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 text-center transition-all duration-700 ${!isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20 pointer-events-none'}`}>
          <Lock className="text-white/80 mb-3 pointer-events-none" size={28} />
          <h2 className="text-xl font-black text-white mb-2 tracking-tight">Welcome Back!</h2>
          <p className="text-purple-50 text-[11px] mb-6 font-medium leading-relaxed max-w-[180px]">To keep connected with your dashboard, please log in with your personal info.</p>
          <button onClick={onToggleLogin} className="px-8 h-8 rounded-md border-2 border-white text-white text-[11px] font-bold hover:bg-white hover:text-[#a07be1] transition-colors active:scale-95 outline-none focus:outline-none">
            Sign In
          </button>
        </div>

      </div>
    </div>
  );
}