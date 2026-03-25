"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User, AlertCircle, Building2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false); 
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [labName, setLabName] = useState(""); 
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Clears all text fields when sliding the panel
  const handleToggle = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError("");
    setUsername("");
    setPassword("");
    setLabName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (isLogin) {
      try {
        const res = await signIn("credentials", { username, password, redirect: false });
        if (res?.error) {
          setError("Invalid username or password.");
          setIsLoading(false);
        } else {
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        setError("Secure connection failed.");
        setIsLoading(false);
      }
    } else {
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, labName })
        });
        
        if (res.ok) {
          await signIn("credentials", { username, password, redirect: false });
          router.push("/");
          router.refresh();
        } else {
          const data = await res.json();
          setError(data.message || "Registration failed.");
          setIsLoading(false);
        }
      } catch (err) {
        setError("Registration failed. Check connection.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#eceff1] p-4 font-sans overflow-hidden">
      
      {/* COMPACT SLIDING SPLIT-PANE CONTAINER */}
      <div className="relative w-full max-w-[760px] min-h-[460px] bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden flex">
        
        {/* ========================================= */}
        {/* LEFT PANEL: SIGN UP FORM                  */}
        {/* ========================================= */}
        <div 
          className={`absolute top-0 left-0 w-full md:w-1/2 h-full p-6 sm:p-8 flex flex-col justify-center transition-all duration-700 ease-in-out bg-white ${
            isLogin ? 'opacity-0 -translate-x-[20%] pointer-events-none z-0' : 'opacity-100 translate-x-0 z-10'
          }`}
        >
          <div className="mb-5 text-center">
            <img src="/logo.png.png" alt="Lab Seven Logo" className="h-8 w-auto object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create Workspace</h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Register your laboratory cloud account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9575cd] transition-colors"><Building2 size={16} /></div>
                <input type="text" placeholder="Laboratory Name" value={labName} onChange={(e) => setLabName(e.target.value)} required={!isLogin} className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] transition-all" />
              </div>
            </div>
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9575cd] transition-colors"><User size={16} /></div>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] transition-all" />
              </div>
            </div>
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9575cd] transition-colors"><Lock size={16} /></div>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] transition-all" />
              </div>
            </div>

            {error && !isLogin && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span className="text-[11px] font-semibold">{error}</span></div>
            )}

            {/* Reduced Gradient Button */}
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all mt-3" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Sign Up"}
            </button>
          </form>
          
          <div className="mt-5 text-center md:hidden">
            <p className="text-xs text-slate-500">Already have an account? <button type="button" onClick={() => handleToggle(true)} className="font-bold text-[#9575cd]">Sign In</button></p>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT PANEL: LOGIN FORM                   */}
        {/* ========================================= */}
        <div 
          className={`absolute top-0 right-0 w-full md:w-1/2 h-full p-6 sm:p-8 flex flex-col justify-center transition-all duration-700 ease-in-out bg-white ${
            !isLogin ? 'opacity-0 translate-x-[20%] pointer-events-none z-0' : 'opacity-100 translate-x-0 z-10'
          }`}
        >
          <div className="mb-5 text-center">
            <img src="/logo.png.png" alt="Lab Seven Logo" className="h-8 w-auto object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">Sign in to your lab workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9575cd] transition-colors"><User size={16} /></div>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] transition-all" />
              </div>
            </div>
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#9575cd] transition-colors"><Lock size={16} /></div>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9575cd]/20 focus:border-[#9575cd] transition-all" />
              </div>
              <div className="text-right mt-1.5"><button type="button" className="text-[11px] font-bold text-[#9575cd] hover:text-[#7e57c2] transition-colors">Forgot password?</button></div>
            </div>

            {error && isLogin && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100"><AlertCircle size={14} className="shrink-0 mt-0.5" /><span className="text-[11px] font-semibold">{error}</span></div>
            )}

            {/* Reduced Gradient Button */}
            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all mt-3" style={{ background: 'linear-gradient(to right, #9575cd, #b39ddb)' }}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Sign In"}
            </button>
          </form>

          <div className="mt-5 text-center md:hidden">
            <p className="text-xs text-slate-500">New to Lab Seven? <button type="button" onClick={() => handleToggle(false)} className="font-bold text-[#9575cd]">Register</button></p>
          </div>
        </div>

        {/* ========================================= */}
        {/* THE SLIDING COLORED OVERLAY PANEL         */}
        {/* ========================================= */}
        <div 
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full z-50 transition-transform duration-700 ease-in-out shadow-lg ${
            isLogin ? 'translate-x-0 rounded-r-2xl' : 'translate-x-full rounded-l-2xl'
          }`}
          /* 🚨 Reduced Gradient: Much closer to a solid #9575cd */
          style={{ background: 'linear-gradient(135deg, #9575cd, #b39ddb)' }}
        >
          {/* Registration Mode Overlay Content */}
          <div 
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-500 delay-100 ${
              !isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[20%] pointer-events-none'
            }`}
          >
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight drop-shadow-sm">Welcome Back!</h2>
            <p className="text-white/90 font-medium text-xs mb-6 leading-relaxed max-w-[240px]">
              Already have a workspace set up? Sign in with your credentials to securely access your data.
            </p>
            <button
              type="button"
              onClick={() => handleToggle(true)}
              className="px-8 py-2.5 rounded-full border border-white/60 bg-white/10 text-white font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-[#9575cd] transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-1.5 group backdrop-blur-sm"
            >
              Sign In <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Login Mode Overlay Content */}
          <div 
            className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-500 delay-100 ${
              isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-[20%] pointer-events-none'
            }`}
          >
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight drop-shadow-sm">New Here?</h2>
            <p className="text-white/90 font-medium text-xs mb-6 leading-relaxed max-w-[240px]">
              Discover a powerful new way to manage your laboratory. Set up your workspace in seconds.
            </p>
            <button
              type="button"
              onClick={() => handleToggle(false)}
              className="px-8 py-2.5 rounded-full border border-white/60 bg-white/10 text-white font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-[#9575cd] transition-all duration-300 shadow-sm active:scale-95 flex items-center gap-1.5 group backdrop-blur-sm"
            >
              Register Lab <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}