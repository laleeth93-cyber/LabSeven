// --- BLOCK app/login/components/RegisterForm.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { registerNewSaaSLab } from "@/app/actions/saas-onboarding";
import { requestOtp, verifyOtpCode } from "@/app/actions/otp"; 
import { Loader2, Mail, Lock, KeyRound, Building2, ArrowLeft, ShieldCheck, CheckCircle2, Phone } from "lucide-react";
import toast from "react-hot-toast";

const inputBaseClass = "w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#a07be1] focus:ring-2 focus:ring-[#a07be1]/20 outline-none focus:outline-none transition-all text-[13px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal";
const buttonBaseClass = "w-full h-9 mt-1 rounded-lg text-white font-bold text-[13px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#a07be1] hover:bg-[#8e62d9] outline-none focus:outline-none disabled:opacity-70";

export default function RegisterForm({ isActive, onSuccessfulRegister }: { isActive: boolean, onSuccessfulRegister: () => void }) {
  const [registerView, setRegisterView] = useState<"details" | "verify" | "password">("details");

  const [regLabName, setRegLabName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Sending verification code...");
    const res = await requestOtp(regEmail, 'REGISTER');
    if (res.success) {
      setMessage("");
      setRegisterView("verify");
    } else {
      setError(res.message || "Failed to send verification email.");
      setMessage("");
    }
    setIsLoading(false);
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Verifying email...");
    const res = await verifyOtpCode(regEmail, regOtp, 'REGISTER');
    if (res.success) {
      setMessage("Email verified!");
      setRegisterView("password");
    } else {
      setError(res.message || "Invalid verification code.");
      setMessage("");
    }
    setIsLoading(false);
  };

  const handleSetRegisterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match!"); return;
    }

    setIsLoading(true); setMessage("Generating Laboratory Environment...");

    try {
      const fallbackAdminName = regEmail.split('@')[0]; 
      const res = await registerNewSaaSLab({
        labName: regLabName,
        email: regEmail,
        phone: regPhone,
        address: "Online Registration", 
        adminName: fallbackAdminName,   
        adminUsername: regEmail,        
        adminPassword: regPassword
      });

      if (res.success) {
        toast.success(`Laboratory created! Your Lab ID is: ${res.organizationId}`, { duration: 6000 });
        setMessage("Redirecting to login...");
        setTimeout(() => {
          setIsLoading(false); setMessage("");
          setRegisterView("details"); 
          onSuccessfulRegister();
        }, 3500);
      } else {
        setError(res.message || "Registration failed."); 
        setMessage(""); setIsLoading(false);
      }
    } catch (err) {
      setError("A network error occurred."); setMessage(""); setIsLoading(false);
    }
  };

  return (
    <div className={`w-full md:w-1/2 h-full flex flex-col p-6 md:p-8 transition-all duration-500 overflow-y-auto custom-scrollbar ${isActive ? 'block' : 'hidden md:flex'}`}>
      
      {registerView === "details" && (
        <div className="animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm mx-auto my-auto pb-8 md:pb-0">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 md:hidden">
              <Building2 className="text-[#a07be1] pointer-events-none" size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create Account</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Register your laboratory environment</p>
          </div>

          {error && <div className="p-2 mb-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg border border-red-100 text-center leading-tight flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>{error}</div>}
          {message && <div className="p-2 mb-4 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-100 text-center leading-tight">{message}</div>}

          <form onSubmit={handleRegisterDetails} className="space-y-4">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="text" required value={regLabName} onChange={(e) => setRegLabName(e.target.value)} className={inputBaseClass} placeholder="Laboratory Name *" />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className={inputBaseClass} placeholder="Contact Phone *" />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputBaseClass} placeholder="Official Email ID *" />
            </div>
            
            <button disabled={isLoading} type="submit" className={`${buttonBaseClass} mt-4`}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Continue"}
            </button>
          </form>
        </div>
      )}

      {registerView === "verify" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full max-w-sm mx-auto my-auto">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Verify Email</h1>
            <p className="text-[11px] text-slate-500 mt-1">Sent to <span className="font-bold text-[#a07be1]">{regEmail}</span></p>
          </div>

          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="text" required value={regOtp} onChange={(e) => setRegOtp(e.target.value)} className={`${inputBaseClass} font-mono tracking-[0.2em] text-center text-[15px]`} placeholder="000000" />
            </div>
            
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Verify Account"}
            </button>

            <button type="button" onClick={() => { setRegisterView("details"); setError(""); setMessage(""); }} className="w-full h-9 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors mt-2 outline-none focus:outline-none bg-slate-100 rounded-lg">
              <ArrowLeft size={13} /> Back
            </button>
          </form>
        </div>
      )}

      {registerView === "password" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full max-w-sm mx-auto my-auto">
          <div className="text-center mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="text-green-600 pointer-events-none" size={16} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Secure Account</h1>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Create your permanent password.</p>
          </div>

          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleSetRegisterPassword} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputBaseClass} placeholder="New Password" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="password" required minLength={6} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} className={inputBaseClass} placeholder="Confirm Password" />
            </div>
            
            <button disabled={isLoading} type="submit" className={`${buttonBaseClass} mt-2`}>
              {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Complete Registration"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
// --- BLOCK app/login/components/RegisterForm.tsx CLOSE ---