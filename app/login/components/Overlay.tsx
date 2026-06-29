"use client";

import React from "react";

export default function Overlay({ isLogin, onToggleLogin, onToggleRegister }: { isLogin: boolean, onToggleLogin: () => void, onToggleRegister: () => void }) {
  return (
    <div className={`hidden md:block absolute top-0 left-0 w-1/2 h-full z-50 transition-transform duration-700 ease-in-out shadow-2xl ${isLogin ? 'translate-x-full' : 'translate-x-0'}`}>
      <div className="absolute inset-0 bg-[#a07be1]"></div>
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* Overlay Text for LOGIN State (Prompts to Register) */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-700 ${isLogin ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none -z-10'}`}>
          
          {/* 🚨 FIXED: Added min-[1440px]:h-[74px] to increase size by 15% on 1440px+ screens */}
          <img 
            src="/loginlogo.png" 
            alt="LabSeven Logo" 
            className="h-16 min-[1440px]:h-[74px] w-auto mb-6 min-[1440px]:mb-8 object-contain pointer-events-none drop-shadow-lg transition-all duration-300" 
          />
          
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">New Here?</h2>
          <p className="text-purple-50 text-sm mb-8 font-medium leading-relaxed max-w-[220px]">Register your laboratory today and step into the future of automated diagnostics.</p>
          <button onClick={onToggleRegister} className="px-8 py-2.5 rounded-lg border-2 border-white text-white text-sm font-bold hover:bg-white hover:text-[#a07be1] transition-colors active:scale-95 outline-none focus:outline-none">
            Create Account
          </button>
        </div>

        {/* Overlay Text for SIGN UP State (Prompts to Login) */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-opacity duration-700 ${!isLogin ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 pointer-events-none -z-10'}`}>
          
          {/* 🚨 FIXED: Added min-[1440px]:h-[74px] to increase size by 15% on 1440px+ screens */}
          <img 
            src="/loginlogo.png" 
            alt="LabSeven Logo" 
            className="h-16 min-[1440px]:h-[74px] w-auto mb-6 min-[1440px]:mb-8 object-contain pointer-events-none drop-shadow-lg transition-all duration-300" 
          />

          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Welcome Back!</h2>
          <p className="text-purple-50 text-sm mb-8 font-medium leading-relaxed max-w-[220px]">To keep connected with your dashboard, please log in with your personal info.</p>
          <button onClick={onToggleLogin} className="px-8 py-2.5 rounded-lg border-2 border-white text-white text-sm font-bold hover:bg-white hover:text-[#a07be1] transition-colors active:scale-95 outline-none focus:outline-none">
            Sign In
          </button>
        </div>

      </div>
    </div>
  );
}