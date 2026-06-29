"use client";

import React, { useState } from "react";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Overlay from "./components/Overlay";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);

  const toggleToRegister = () => setIsLogin(false);
  const toggleToLogin = () => setIsLogin(true);

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans antialiased"
      style={{ WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' }}
    >
      {/* 🚨 FIXED: Stepped responsive heights!
        - Default (Mobile): h-[520px] 
        - md (768px to 1023px): h-[400px] (Tightens up empty space on tablets/small laptops)
        - lg (1024px to 1279px): h-[420px] (Perfect snug fit for 1024px laptops)
        - xl (1280px+): h-[440px] (Comfortable size for large monitors)
      */}
      <div className="relative w-full max-w-2xl h-[520px] md:h-[400px] lg:h-[420px] xl:h-[440px] bg-white rounded-2xl shadow-2xl shadow-slate-300 overflow-hidden flex flex-col md:flex-row">
        
        {/* ==================== MOBILE TOGGLE ==================== */}
        <div className="md:hidden flex justify-center pt-4 px-5 bg-white z-10 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-sm">
            <button 
              onClick={toggleToLogin} 
              className={`flex-1 h-8 text-xs font-bold rounded-md transition-all outline-none focus:outline-none ${isLogin ? "bg-[#a07be1] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sign In
            </button>
            <button 
              onClick={toggleToRegister} 
              className={`flex-1 h-8 text-xs font-bold rounded-md transition-all outline-none focus:outline-none ${!isLogin ? "bg-[#a07be1] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Register
            </button>
          </div>
        </div>

        {/* ==================== PANES ==================== */}
        
        <LoginForm isActive={isLogin} />
        
        <RegisterForm isActive={!isLogin} onSuccessfulRegister={toggleToLogin} />
        
        <Overlay isLogin={isLogin} onToggleLogin={toggleToLogin} onToggleRegister={toggleToRegister} />

      </div>
    </div>
  );
}